"""
Authentication service.
Handles JWT token creation, verification, and password hashing.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from loguru import logger
from passlib.context import CryptContext

from app.config import settings
from app.domain.entities.enums import UserRole
from app.domain.entities.user import User
from app.domain.repositories.user_repository import UserRepository


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication and authorization operations."""

    def __init__(self, user_repository: UserRepository):
        self._user_repo = user_repository

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

    async def register(
        self, email: str, name: str, password: str, role: UserRole
    ) -> User:
        """Register a new user."""
        # Check if email already exists
        existing = await self._user_repo.get_by_email(email)
        if existing:
            raise ValueError("Bu e-posta adresi zaten kullanılıyor")

        # Create user
        user = User(
            email=email,
            name=name,
            hashed_password=self.hash_password(password),
            role=role,
        )
        created_user = await self._user_repo.create(user)
        logger.info(f"New user registered: {created_user.email} ({created_user.role})")
        return created_user

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = await self._user_repo.get_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        logger.info(f"User authenticated: {user.email}")
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
