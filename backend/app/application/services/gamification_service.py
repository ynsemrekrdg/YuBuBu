"""
Gamification service.
Handles scoring, badges, streaks, and level progression.
"""

from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID

from loguru import logger

from app.domain.entities.badge import Badge
from app.domain.entities.enums import BadgeType, LearningDifficulty
from app.domain.repositories.badge_repository import BadgeRepository
from app.domain.repositories.progress_repository import ProgressRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository


# Badge definitions
BADGE_DEFINITIONS: Dict[BadgeType, Dict[str, str]] = {
    BadgeType.FIRST_CHAPTER: {
        "title": "İlk Adım! 🎉",
        "description": "İlk bölümünü tamamladın!",
        "icon": "🎉",
    },
    BadgeType.PERFECT_SCORE: {
        "title": "Mükemmel Puan! 💯",
        "description": "Bir bölümde 100 puan aldın!",
        "icon": "💯",
    },
    BadgeType.STREAK_3: {
        "title": "3 Gün Serisi! 🔥",
        "description": "3 gün arka arkaya çalıştın!",
        "icon": "🔥",
    },
    BadgeType.STREAK_7: {
        "title": "Haftalık Kahraman! 🌟",
        "description": "7 gün arka arkaya çalıştın!",
        "icon": "🌟",
    },
    BadgeType.STREAK_30: {
        "title": "Aylık Şampiyon! 👑",
        "description": "30 gün arka arkaya çalıştın!",
        "icon": "👑",
    },
    BadgeType.LEVEL_UP: {
        "title": "Seviye Atladın! ⬆️",
        "description": "Yeni bir seviyeye ulaştın!",
        "icon": "⬆️",
    },
    BadgeType.SPEED_DEMON: {
        "title": "Hız Canavarı! ⚡",
        "description": "Bir bölümü beklenen sürenin yarısında tamamladın!",
        "icon": "⚡",
    },
    BadgeType.PERSISTENT: {
        "title": "Vazgeçmeyen! 💪",
        "description": "Bir bölümü 3'ten fazla denemede tamamladın!",
        "icon": "💪",
    },
    BadgeType.EXPLORER: {
        "title": "Kaşif! 🗺️",
        "description": "5 farklı bölümü tamamladın!",
        "icon": "🗺️",
    },
    BadgeType.MASTER: {
        "title": "Usta! 🏆",
        "description": "Bir güçlük kategorisindeki tüm bölümleri tamamladın!",
        "icon": "🏆",
    },
}


class GamificationService:
    """Service for gamification features: badges, scoring, streaks, levels."""

    def __init__(
        self,
        badge_repo: BadgeRepository,
        profile_repo: StudentProfileRepository,
        progress_repo: ProgressRepository,
    ):
        self._badge_repo = badge_repo
        self._profile_repo = profile_repo
        self._progress_repo = progress_repo

    async def check_and_award_badges(
        self,
        student_id: UUID,
        score: int,
        attempts: int,
        time_spent: int,
        expected_time: int,
        streak_days: int,
    ) -> List[Badge]:
        """
        Check all badge conditions and award any newly earned badges.

        Args:
            student_id: Student profile ID
            score: Score achieved in the completed chapter
            attempts: Number of attempts for this chapter
            time_spent: Time spent in seconds
            expected_time: Expected time in seconds
            streak_days: Current streak days

        Returns:
            List of newly awarded badges
        """
        new_badges: List[Badge] = []

        # Check each badge type
        badge_checks = [
            (BadgeType.FIRST_CHAPTER, self._check_first_chapter(student_id)),
            (BadgeType.PERFECT_SCORE, self._check_perfect_score(score)),
            (BadgeType.STREAK_3, self._check_streak(streak_days, 3)),
            (BadgeType.STREAK_7, self._check_streak(streak_days, 7)),
            (BadgeType.STREAK_30, self._check_streak(streak_days, 30)),
            (BadgeType.SPEED_DEMON, self._check_speed(time_spent, expected_time)),
            (BadgeType.PERSISTENT, self._check_persistent(attempts)),
            (BadgeType.EXPLORER, self._check_explorer(student_id)),
            (BadgeType.MASTER, self._check_master(student_id)),
        ]

        for badge_type, check_coro in badge_checks:
            try:
                # Check if already has this badge
                has_it = await self._badge_repo.has_badge(student_id, badge_type)
                if has_it:
                    continue

                # Evaluate condition
                earned = await check_coro if hasattr(check_coro, '__await__') else check_coro
                if earned:
                    definition = BADGE_DEFINITIONS[badge_type]
                    badge = Badge(
                        student_id=student_id,
                        badge_type=badge_type,
                        title=definition["title"],
                        description=definition["description"],
                        icon=definition["icon"],
                    )
                    saved = await self._badge_repo.create(badge)
                    new_badges.append(saved)
                    logger.info(
                        f"Badge awarded: {badge_type.value} to student {student_id}"
                    )
            except Exception as e:
                logger.error(
                    f"Error checking badge {badge_type.value}: {e}"
                )

        # Check level-up badge
        await self._check_and_award_level_badge(student_id, new_badges)

        return new_badges

    async def _check_first_chapter(self, student_id: UUID) -> bool:
        """Check if student just completed their first chapter."""
        count = await self._progress_repo.get_completed_count(student_id)
        return count >= 1

    def _check_perfect_score(self, score: int) -> bool:
        """Check if student achieved a perfect score."""
        return score >= 100

    def _check_streak(self, streak_days: int, required: int) -> bool:
        """Check if streak days meets the requirement."""
        return streak_days >= required

    def _check_speed(self, time_spent: int, expected_time: int) -> bool:
        """Check if completed in half the expected time."""
        if expected_time <= 0:
            return False
        return time_spent < expected_time * 0.5

    def _check_persistent(self, attempts: int) -> bool:
        """Check if student persisted through 3+ attempts."""
        return attempts >= 3

    async def _check_explorer(self, student_id: UUID) -> bool:
        """Check if student completed 5+ chapters."""
        count = await self._progress_repo.get_completed_count(student_id)
        return count >= 5

    async def _check_master(self, student_id: UUID) -> bool:
        """Check if student completed all 5 chapters in any difficulty."""
        # This would need to check per-difficulty completion
        # Simplified: check if 5 consecutive chapters completed
        count = await self._progress_repo.get_completed_count(student_id)
        return count >= 5

    async def _check_and_award_level_badge(
        self, student_id: UUID, new_badges: List[Badge]
    ) -> None:
        """Check and award level-up badge."""
        profile = await self._profile_repo.get_by_id(student_id)
        if not profile:
            return

        prev_level = max(1, (profile.total_score - 100) // 500 + 1)  # Approximate prev
        current_level = profile.current_level

        if current_level > prev_level:
            has_it = await self._badge_repo.has_badge(student_id, BadgeType.LEVEL_UP)
            if not has_it:
                definition = BADGE_DEFINITIONS[BadgeType.LEVEL_UP]
                badge = Badge(
                    student_id=student_id,
                    badge_type=BadgeType.LEVEL_UP,
                    title=definition["title"],
                    description=f"Seviye {current_level}'e ulaştın!",
                    icon=definition["icon"],
                )
                saved = await self._badge_repo.create(badge)
                new_badges.append(saved)

    async def get_student_badges(self, student_id: UUID) -> List[Dict[str, Any]]:
        """Get all badges for a student."""
        badges = await self._badge_repo.get_by_student(student_id)
        return [
            {
                "id": str(b.id),
                "type": b.badge_type.value,
                "title": b.title,
                "description": b.description,
                "icon": b.icon,
                "earned_at": str(b.earned_at),
            }
            for b in badges
        ]

    def calculate_score_with_bonuses(
        self,
        raw_score: int,
        time_spent: int,
        expected_time: int,
        difficulty_level: int,
    ) -> Dict[str, int]:
        """
        Calculate final score with all bonuses.

        Returns dict with base_score, speed_bonus, difficulty_bonus, total.
        """
        # Base score
        base_score = raw_score

        # Speed bonus
        speed_bonus = 0
        if expected_time > 0 and time_spent < expected_time:
            ratio = time_spent / expected_time
            if ratio < 0.5:
                speed_bonus = 30
            elif ratio < 0.75:
                speed_bonus = 20
            else:
                speed_bonus = 10

        # Difficulty bonus
        difficulty_bonus = difficulty_level * 5

        total = base_score + speed_bonus + difficulty_bonus

        return {
            "base_score": base_score,
            "speed_bonus": speed_bonus,
            "difficulty_bonus": difficulty_bonus,
            "total": total,
        }

    @staticmethod
    def get_leaderboard_position(total_score: int, all_scores: List[int]) -> int:
        """Calculate student's leaderboard position."""
        sorted_scores = sorted(all_scores, reverse=True)
        try:
            return sorted_scores.index(total_score) + 1
        except ValueError:
            return len(sorted_scores) + 1
