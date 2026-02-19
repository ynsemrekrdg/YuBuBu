"""
Authentication service.
Handles JWT token creation, verification, password hashing,
parent registration, and auto-generated student credentials.
"""

import random
import re
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID

from jose import JWTError, jwt
from loguru import logger
from passlib.context import CryptContext

from app.config import settings
from app.domain.entities.enums import LearningDifficulty, UserRole
from app.domain.entities.student_profile import StudentProfile
from app.domain.entities.user import User
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Turkish character mapping for username generation
TR_MAP = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")


class AuthService:
    """Service for authentication and authorization operations."""

    def __init__(
        self,
        user_repository: UserRepository,
        profile_repository: Optional[StudentProfileRepository] = None,
    ):
        self._user_repo = user_repository
        self._profile_repo = profile_repository

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(
        user_id: UUID, role: UserRole, expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT access token."""
        expire = datetime.utcnow() + (
            expires_delta
            or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        payload = {
            "sub": str(user_id),
            "role": role.value,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access",
        }
        return jwt.encode(
            payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT decode error: {e}")
            return None

    # ─── Username / Password Generation ──────────────────

    @staticmethod
    def _normalize_turkish(text: str) -> str:
        """Remove Turkish chars and normalize for username."""
        return text.translate(TR_MAP).lower().strip()

    @classmethod
    def generate_username(cls, name: str) -> str:
        """
        Generate a child-friendly username from name.
        Format: ad_soyad_1234  (e.g. ali_yilmaz_3821)
        """
        normalized = cls._normalize_turkish(name)
        # Remove non-alphanumeric except spaces
        cleaned = re.sub(r"[^a-z0-9\s]", "", normalized)
        parts = cleaned.split()
        if len(parts) >= 2:
            base = f"{parts[0]}_{parts[-1]}"
        elif parts:
            base = parts[0]
        else:
            base = "ogrenci"
        suffix = str(random.randint(1000, 9999))
        return f"{base}_{suffix}"

    @classmethod
    def generate_simple_password(cls, name: str) -> str:
        """
        Generate a child-friendly password.
        Format: ad + 4 digits  (e.g. ali1234)
        """
        normalized = cls._normalize_turkish(name)
        first_name = re.sub(r"[^a-z]", "", normalized.split()[0]) if normalized.split() else "pass"
        digits = str(random.randint(1000, 9999))
        return f"{first_name}{digits}"

    # ─── Registration ────────────────────────────────────

    async def register_parent(
        self, email: str, name: str, password: str, phone: Optional[str] = None
    ) -> User:
        """Register a new parent user."""
        existing = await self._user_repo.get_by_email(email)
        if existing:
            raise ValueError("Bu e-posta adresi zaten kullanılıyor")

        user = User(
            email=email,
            name=name,
            hashed_password=self.hash_password(password),
            role=UserRole.PARENT,
        )
        created = await self._user_repo.create(user)
        logger.info(f"Parent registered: {created.email}")
        return created

    async def register_student(
        self,
        parent_id: UUID,
        name: str,
        age: int,
        learning_difficulty: LearningDifficulty,
        grade: Optional[int] = None,
        school_id: Optional[UUID] = None,
        teacher_id: Optional[UUID] = None,
    ) -> Tuple[User, StudentProfile, str]:
        """
        Register a student as a child of a parent.
        Auto-generates username and password.
        Returns (user, profile, plain_password).
        """
        if not self._profile_repo:
            raise ValueError("Profile repository not configured")

        # Verify parent exists
        parent = await self._user_repo.get_by_id(parent_id)
        if not parent or parent.role != UserRole.PARENT:
            raise ValueError("Geçersiz veli hesabı")

        # Generate credentials
        username = self.generate_username(name)
        # Ensure username is unique
        for _ in range(10):
            existing = await self._user_repo.get_by_username(username)
            if not existing:
                break
            username = self.generate_username(name)
        else:
            # Fallback: add more random chars
            username = f"{username}_{random.randint(100, 999)}"

        plain_password = self.generate_simple_password(name)

        # Create user (no email for students)
        student_user = User(
            username=username,
            email=None,
            name=name,
            hashed_password=self.hash_password(plain_password),
            role=UserRole.STUDENT,
        )
        created_user = await self._user_repo.create(student_user)

        # Create student profile
        profile = StudentProfile(
            user_id=created_user.id,
            age=age,
            learning_difficulty=learning_difficulty,
            parent_id=parent_id,
            school_id=school_id,
            teacher_id=teacher_id,
            grade=grade,
        )
        created_profile = await self._profile_repo.create(profile)

        logger.info(
            f"Student registered by parent {parent_id}: {created_user.username} "
            f"(difficulty={learning_difficulty.value})"
        )

        return created_user, created_profile, plain_password

    async def register(
        self, email: str, name: str, password: str, role: UserRole
    ) -> User:
        """Legacy register method for backward compatibility."""
        existing = await self._user_repo.get_by_email(email)
        if existing:
            raise ValueError("Bu e-posta adresi zaten kullanılıyor")

        user = User(
            email=email,
            name=name,
            hashed_password=self.hash_password(password),
            role=role,
        )
        created_user = await self._user_repo.create(user)
        logger.info(f"New user registered: {created_user.email} ({created_user.role})")
        return created_user

    # ─── Authentication ──────────────────────────────────

    async def authenticate(self, identifier: str, password: str) -> Optional[User]:
        """
        Authenticate a user with username OR email + password.
        Tries email first, then username.
        """
        user = None
        # If it looks like an email, try email first
        if "@" in identifier:
            user = await self._user_repo.get_by_email(identifier)
        if not user:
            user = await self._user_repo.get_by_username(identifier)
        if not user:
            # Try email as fallback even without @
            user = await self._user_repo.get_by_email(identifier)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        logger.info(f"User authenticated: {user.username or user.email}")
        return user

    async def get_current_user(self, token: str) -> Optional[User]:
        """Get the current user from a JWT token."""
        payload = self.decode_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        try:
            return await self._user_repo.get_by_id(UUID(user_id))
        except (ValueError, Exception) as e:
            logger.warning(f"Error getting current user: {e}")
            return None
