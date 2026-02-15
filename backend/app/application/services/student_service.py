"""
Student service.
Handles student profile creation, update, and progress retrieval.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from loguru import logger

from app.domain.entities.enums import LearningDifficulty
from app.domain.entities.student_profile import StudentProfile
from app.domain.repositories.badge_repository import BadgeRepository
from app.domain.repositories.progress_repository import ProgressRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository
from app.infrastructure.cache.redis_cache import RedisCache


class StudentService:
    """Service for student profile management operations."""

    def __init__(
        self,
        profile_repo: StudentProfileRepository,
        progress_repo: ProgressRepository,
        badge_repo: BadgeRepository,
        cache: RedisCache,
    ):
        self._profile_repo = profile_repo
        self._progress_repo = progress_repo
        self._badge_repo = badge_repo
        self._cache = cache

    async def create_profile(
        self,
        user_id: UUID,
        age: int,
        learning_difficulty: LearningDifficulty,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> StudentProfile:
        """Create a student profile with defaults based on learning difficulty."""
        # Check if profile already exists
        existing = await self._profile_repo.get_by_user_id(user_id)
        if existing:
            raise ValueError("Bu kullanıcı için zaten bir öğrenci profili mevcut")

        profile = StudentProfile(
            user_id=user_id,
            age=age,
            learning_difficulty=learning_difficulty,
        )

        # Merge custom preferences with defaults
        default_prefs = profile.get_default_preferences()
        if preferences:
            default_prefs.update(preferences)
        profile.preferences = default_prefs

        created = await self._profile_repo.create(profile)
        logger.info(
            f"Student profile created: {created.id} "
            f"(difficulty={learning_difficulty}, age={age})"
        )
        return created

    async def get_profile(self, profile_id: UUID) -> Optional[StudentProfile]:
        """Get a student profile by ID with caching."""
        cache_key = f"student_profile:{profile_id}"
        cached = await self._cache.get(cache_key)
        if cached:
            return StudentProfile(**cached)

        profile = await self._profile_repo.get_by_id(profile_id)
        if profile:
            await self._cache.set(cache_key, profile.__dict__, expire_seconds=300)
        return profile

    async def get_profile_by_user_id(self, user_id: UUID) -> Optional[StudentProfile]:
        """Get a student profile by user ID."""
        return await self._profile_repo.get_by_user_id(user_id)

    async def update_profile(
        self,
        profile_id: UUID,
        age: Optional[int] = None,
        learning_difficulty: Optional[LearningDifficulty] = None,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> StudentProfile:
        """Update a student profile."""
        profile = await self._profile_repo.get_by_id(profile_id)
        if not profile:
            raise ValueError(f"Öğrenci profili bulunamadı: {profile_id}")

        if age is not None:
            profile.age = age
        if learning_difficulty is not None:
            profile.learning_difficulty = learning_difficulty
            # Reset preferences to new defaults
            profile.preferences = profile.get_default_preferences()
        if preferences:
            profile.preferences.update(preferences)

        updated = await self._profile_repo.update(profile)

        # Invalidate cache
        await self._cache.delete(f"student_profile:{profile_id}")

        logger.info(f"Student profile updated: {profile_id}")
        return updated

    async def get_progress_summary(self, student_id: UUID) -> Dict[str, Any]:
        """Get comprehensive progress summary for a student."""
        profile = await self._profile_repo.get_by_id(student_id)
        if not profile:
            raise ValueError(f"Öğrenci profili bulunamadı: {student_id}")

        analytics = await self._progress_repo.get_analytics(student_id)
        badges = await self._badge_repo.get_by_student(student_id)

        return {
            "student_id": str(student_id),
            **analytics,
            "current_level": profile.current_level,
            "total_score": profile.total_score,
            "streak_days": profile.streak_days,
            "badges": [
                {
                    "type": b.badge_type.value,
                    "title": b.title,
                    "description": b.description,
                    "icon": b.icon,
                    "earned_at": str(b.earned_at),
                }
                for b in badges
            ],
        }
