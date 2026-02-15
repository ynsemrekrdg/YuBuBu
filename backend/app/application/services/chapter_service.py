"""
Chapter service.
Handles chapter listing, creation, and content management.
"""

from typing import List, Optional
from uuid import UUID

from loguru import logger

from app.domain.entities.chapter import Chapter
from app.domain.entities.enums import ActivityType, LearningDifficulty
from app.domain.repositories.chapter_repository import ChapterRepository
from app.infrastructure.cache.redis_cache import RedisCache


class ChapterService:
    """Service for chapter/content management operations."""

    def __init__(self, chapter_repo: ChapterRepository, cache: RedisCache):
        self._chapter_repo = chapter_repo
        self._cache = cache

    async def list_chapters(
        self,
        difficulty_type: Optional[LearningDifficulty] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Chapter]:
        """List chapters, optionally filtered by difficulty type."""
        cache_key = f"chapters:{difficulty_type}:{skip}:{limit}"
        cached = await self._cache.get(cache_key)
        if cached:
            return [Chapter(**c) for c in cached]

        if difficulty_type:
            chapters = await self._chapter_repo.list_by_difficulty(
                difficulty_type, skip, limit
            )
        else:
            chapters = await self._chapter_repo.list_all(skip, limit)

        # Cache the result
        await self._cache.set(
            cache_key,
            [c.__dict__ for c in chapters],
            expire_seconds=600,
        )
        return chapters

    async def get_chapter(self, chapter_id: UUID) -> Optional[Chapter]:
        """Get a specific chapter by ID."""
        cache_key = f"chapter:{chapter_id}"
        cached = await self._cache.get(cache_key)
        if cached:
            return Chapter(**cached)

        chapter = await self._chapter_repo.get_by_id(chapter_id)
        if chapter:
            await self._cache.set(cache_key, chapter.__dict__, expire_seconds=600)
        return chapter

    async def create_chapter(
        self,
        difficulty_type: LearningDifficulty,
        chapter_number: int,
        title: str,
        description: str,
        content_config: dict,
        activity_type: ActivityType,
        difficulty_level: int = 1,
        expected_duration_minutes: int = 15,
        min_score_to_pass: int = 60,
    ) -> Chapter:
        """Create a new chapter (admin only)."""
        chapter = Chapter(
            difficulty_type=difficulty_type,
            chapter_number=chapter_number,
            title=title,
            description=description,
            content_config=content_config,
            activity_type=activity_type,
            difficulty_level=difficulty_level,
            expected_duration_minutes=expected_duration_minutes,
            min_score_to_pass=min_score_to_pass,
        )
        created = await self._chapter_repo.create(chapter)

        # Invalidate chapter list cache
        await self._cache.delete_pattern("chapters:*")

        logger.info(
            f"Chapter created: {created.title} "
            f"({difficulty_type}, #{chapter_number})"
        )
        return created
