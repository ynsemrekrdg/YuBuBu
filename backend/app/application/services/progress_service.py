"""
Progress service.
Handles chapter completion, attempt tracking, and analytics.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from loguru import logger

from app.domain.entities.progress import Progress
from app.domain.repositories.chapter_repository import ChapterRepository
from app.domain.repositories.progress_repository import ProgressRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository
from app.infrastructure.cache.redis_cache import RedisCache


class ProgressService:
    """Service for progress tracking and analytics operations."""

    def __init__(
        self,
        progress_repo: ProgressRepository,
        profile_repo: StudentProfileRepository,
        chapter_repo: ChapterRepository,
        cache: RedisCache,
    ):
        self._progress_repo = progress_repo
        self._profile_repo = profile_repo
        self._chapter_repo = chapter_repo
        self._cache = cache

    async def complete_chapter(
        self,
        student_id: UUID,
        chapter_id: UUID,
        score: int,
        time_spent_seconds: int,
    ) -> Dict[str, Any]:
        """
        Record a chapter completion attempt.
        Returns score details and any rewards earned.
        """
        # Verify chapter exists
        chapter = await self._chapter_repo.get_by_id(chapter_id)
        if not chapter:
            raise ValueError(f"Bölüm bulunamadı: {chapter_id}")

        # Verify student exists
        profile = await self._profile_repo.get_by_id(student_id)
        if not profile:
            raise ValueError(f"Öğrenci profili bulunamadı: {student_id}")

        # Get or create progress record
        progress = await self._progress_repo.get_by_student_and_chapter(
            student_id, chapter_id
        )

        is_new_completion = False
        if progress:
            # Update existing progress
            was_completed = progress.completed
            if score >= chapter.min_score_to_pass:
                progress.mark_completed(score, time_spent_seconds)
                if not was_completed:
                    is_new_completion = True
            else:
                progress.add_attempt(score, time_spent_seconds)
            progress = await self._progress_repo.update(progress)
        else:
            # Create new progress
            progress = Progress(
                student_id=student_id,
                chapter_id=chapter_id,
                score=score,
                attempts=1,
                time_spent_seconds=time_spent_seconds,
            )
            if score >= chapter.min_score_to_pass:
                progress.completed = True
                progress.completed_at = datetime.utcnow()
                is_new_completion = True
            progress = await self._progress_repo.create(progress)

        # Calculate points
        score_earned = self._calculate_score(score, chapter.min_score_to_pass)
        speed_bonus = self._calculate_speed_bonus(
            time_spent_seconds, chapter.expected_duration_minutes * 60
        )
        total_points = score_earned + speed_bonus

        # Update student score if new completion
        if is_new_completion and total_points > 0:
            profile = await self._profile_repo.update_score(student_id, total_points)

        # Update streak
        streak_days = await self._update_streak(student_id)

        # Invalidate cache
        await self._cache.delete_pattern(f"student_profile:{student_id}*")
        await self._cache.delete_pattern(f"progress:{student_id}*")

        logger.info(
            f"Chapter completed: student={student_id}, chapter={chapter_id}, "
            f"score={score}, points={total_points}"
        )

        return {
            "progress_id": str(progress.id),
            "completed": progress.completed,
            "score": progress.score,
            "attempts": progress.attempts,
            "score_earned": score_earned,
            "speed_bonus": speed_bonus,
            "total_points": total_points,
            "is_new_completion": is_new_completion,
            "streak_days": streak_days,
            "current_level": profile.current_level if profile else 1,
            "total_score": profile.total_score if profile else 0,
        }

    def _calculate_score(self, score: int, min_score: int) -> int:
        """Calculate points earned based on score."""
        if score < min_score:
            return max(10, score // 4)  # Partial credit
        # Full credit + bonus for higher scores
        base = 50
        bonus = max(0, (score - min_score)) * 2
        return base + bonus

    def _calculate_speed_bonus(
        self, time_spent: int, expected_time: int
    ) -> int:
        """Calculate speed bonus for completing under expected time."""
        if time_spent <= 0 or expected_time <= 0:
            return 0
        if time_spent < expected_time * 0.5:
            return 30  # Exceptional speed
        elif time_spent < expected_time * 0.75:
            return 20  # Fast
        elif time_spent < expected_time:
            return 10  # Under time
        return 0  # No speed bonus

    async def _update_streak(self, student_id: UUID) -> int:
        """Update student's daily streak."""
        profile = await self._profile_repo.get_by_id(student_id)
        if not profile:
            return 0

        today = datetime.utcnow().date()

        if profile.last_activity_date:
            last_date = profile.last_activity_date.date()
            if last_date == today:
                return profile.streak_days  # Already active today
            elif (today - last_date).days == 1:
                new_streak = profile.streak_days + 1
            else:
                new_streak = 1  # Streak broken
        else:
            new_streak = 1

        await self._profile_repo.update_streak(student_id, new_streak)
        return new_streak

    async def get_student_progress(
        self, student_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Progress]:
        """Get all progress records for a student."""
        return await self._progress_repo.list_by_student(student_id, skip, limit)

    async def get_analytics(self, student_id: UUID) -> Dict[str, Any]:
        """Get comprehensive analytics for a student."""
        analytics = await self._progress_repo.get_analytics(student_id)
        profile = await self._profile_repo.get_by_id(student_id)

        if profile:
            analytics["level"] = profile.current_level
            analytics["total_score"] = profile.total_score
            analytics["streak_days"] = profile.streak_days
            analytics["learning_difficulty"] = profile.learning_difficulty.value

        return analytics
