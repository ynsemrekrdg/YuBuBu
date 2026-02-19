"""
Dependency Injection setup.
Provides FastAPI dependency functions for injecting services and repositories.
"""

from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.auth_service import AuthService
from app.application.services.chapter_service import ChapterService
from app.application.services.gamification_service import GamificationService
from app.application.services.progress_service import ProgressService
from app.application.services.student_service import StudentService
from app.domain.entities.user import User
from app.infrastructure.ai.ai_service import AIService
from app.infrastructure.ai.tts_service import YuBuVoice
from app.infrastructure.cache.redis_cache import redis_cache
from app.infrastructure.database.ai_conversation_repository_impl import (
    SQLAlchemyAIConversationRepository,
)
from app.infrastructure.database.badge_repository_impl import (
    SQLAlchemyBadgeRepository,
)
from app.infrastructure.database.chapter_repository_impl import (
    SQLAlchemyChapterRepository,
)
from app.infrastructure.database.progress_repository_impl import (
    SQLAlchemyProgressRepository,
)
from app.infrastructure.database.session import get_db
from app.infrastructure.database.student_profile_repository_impl import (
    SQLAlchemyStudentProfileRepository,
)
from app.infrastructure.database.user_repository_impl import (
    SQLAlchemyUserRepository,
)
from app.infrastructure.database.school_repository_impl import (
    SQLAlchemySchoolRepository,
)
from app.infrastructure.database.teacher_repository_impl import (
    SQLAlchemyTeacherRepository,
)

# Security scheme
security = HTTPBearer()


# ─── Repository Dependencies ────────────────────────────────

def get_user_repo(session: AsyncSession = Depends(get_db)):
    """Inject UserRepository."""
    return SQLAlchemyUserRepository(session)


def get_student_profile_repo(session: AsyncSession = Depends(get_db)):
    """Inject StudentProfileRepository."""
    return SQLAlchemyStudentProfileRepository(session)


def get_chapter_repo(session: AsyncSession = Depends(get_db)):
    """Inject ChapterRepository."""
    return SQLAlchemyChapterRepository(session)


def get_progress_repo(session: AsyncSession = Depends(get_db)):
    """Inject ProgressRepository."""
    return SQLAlchemyProgressRepository(session)


def get_ai_conversation_repo(session: AsyncSession = Depends(get_db)):
    """Inject AIConversationRepository."""
    return SQLAlchemyAIConversationRepository(session)


def get_badge_repo(session: AsyncSession = Depends(get_db)):
    """Inject BadgeRepository."""
    return SQLAlchemyBadgeRepository(session)


def get_school_repo(session: AsyncSession = Depends(get_db)):
    """Inject SchoolRepository."""
    return SQLAlchemySchoolRepository(session)


def get_teacher_repo(session: AsyncSession = Depends(get_db)):
    """Inject TeacherRepository."""
    return SQLAlchemyTeacherRepository(session)


# ─── Service Dependencies ───────────────────────────────────

def get_auth_service(
    user_repo=Depends(get_user_repo),
    profile_repo=Depends(get_student_profile_repo),
) -> AuthService:
    """Inject AuthService with user and profile repositories."""
    return AuthService(user_repo, profile_repo)


def get_student_service(
    profile_repo=Depends(get_student_profile_repo),
    progress_repo=Depends(get_progress_repo),
    badge_repo=Depends(get_badge_repo),
) -> StudentService:
    """Inject StudentService."""
    return StudentService(profile_repo, progress_repo, badge_repo, redis_cache)


def get_chapter_service(
    chapter_repo=Depends(get_chapter_repo),
) -> ChapterService:
    """Inject ChapterService."""
    return ChapterService(chapter_repo, redis_cache)


def get_progress_service(
    progress_repo=Depends(get_progress_repo),
    profile_repo=Depends(get_student_profile_repo),
    chapter_repo=Depends(get_chapter_repo),
) -> ProgressService:
    """Inject ProgressService."""
    return ProgressService(progress_repo, profile_repo, chapter_repo, redis_cache)


def get_gamification_service(
    badge_repo=Depends(get_badge_repo),
    profile_repo=Depends(get_student_profile_repo),
    progress_repo=Depends(get_progress_repo),
) -> GamificationService:
    """Inject GamificationService."""
    return GamificationService(badge_repo, profile_repo, progress_repo)


def get_ai_service(
    conversation_repo=Depends(get_ai_conversation_repo),
    profile_repo=Depends(get_student_profile_repo),
    progress_repo=Depends(get_progress_repo),
) -> AIService:
    """Inject AIService."""
    return AIService(conversation_repo, profile_repo, progress_repo, redis_cache)


def get_tts_service() -> YuBuVoice:
    """Inject YuBuVoice TTS service."""
    return YuBuVoice()


# ─── Auth Dependencies ──────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """
    Extract and validate JWT token from request.
    Returns the authenticated User.
    """
    token = credentials.credentials
    user = await auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap devre dışı bırakılmış",
        )
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Require admin role."""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gerekli",
        )
    return current_user


async def require_teacher_or_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Require teacher or admin role."""
    if not (current_user.is_teacher() or current_user.is_admin()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için öğretmen veya yönetici yetkisi gerekli",
        )
    return current_user
