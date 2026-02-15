"""
SQLAlchemy implementation of ChapterRepository.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.chapter import Chapter
from app.domain.entities.enums import LearningDifficulty
from app.domain.repositories.chapter_repository import ChapterRepository
from app.infrastructure.database.models import ChapterModel


class SQLAlchemyChapterRepository(ChapterRepository):
    """Concrete implementation of ChapterRepository using SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: ChapterModel) -> Chapter:
        """Convert SQLAlchemy model to domain entity."""
        return Chapter(
            id=model.id,
            difficulty_type=model.difficulty_type,
            chapter_number=model.chapter_number,
            title=model.title,
            description=model.description,
            content_config=model.content_config or {},
            activity_type=model.activity_type,
            difficulty_level=model.difficulty_level,
            expected_duration_minutes=model.expected_duration_minutes,
            min_score_to_pass=model.min_score_to_pass,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: Chapter) -> ChapterModel:
        """Convert domain entity to SQLAlchemy model."""
        return ChapterModel(
            id=entity.id,
            difficulty_type=entity.difficulty_type,
            chapter_number=entity.chapter_number,
            title=entity.title,
            description=entity.description,
            content_config=entity.content_config,
            activity_type=entity.activity_type,
            difficulty_level=entity.difficulty_level,
            expected_duration_minutes=entity.expected_duration_minutes,
            min_score_to_pass=entity.min_score_to_pass,
            is_active=entity.is_active,
        )

    async def create(self, chapter: Chapter) -> Chapter:
        """Create a new chapter."""
        model = self._to_model(chapter)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, chapter_id: UUID) -> Optional[Chapter]:
        """Get a chapter by ID."""
        stmt = select(ChapterModel).where(
            ChapterModel.id == chapter_id, ChapterModel.is_active == True
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_difficulty(
        self, difficulty: LearningDifficulty, skip: int = 0, limit: int = 100
    ) -> List[Chapter]:
        """List chapters filtered by learning difficulty type."""
        stmt = (
            select(ChapterModel)
            .where(
                ChapterModel.difficulty_type == difficulty,
                ChapterModel.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .order_by(ChapterModel.chapter_number.asc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[Chapter]:
        """List all active chapters with pagination."""
        stmt = (
            select(ChapterModel)
            .where(ChapterModel.is_active == True)
            .offset(skip)
            .limit(limit)
            .order_by(ChapterModel.difficulty_type, ChapterModel.chapter_number)
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def update(self, chapter: Chapter) -> Chapter:
        """Update an existing chapter."""
        stmt = (
            update(ChapterModel)
            .where(ChapterModel.id == chapter.id)
            .values(
                title=chapter.title,
                description=chapter.description,
                content_config=chapter.content_config,
                activity_type=chapter.activity_type,
                difficulty_level=chapter.difficulty_level,
                expected_duration_minutes=chapter.expected_duration_minutes,
                min_score_to_pass=chapter.min_score_to_pass,
                is_active=chapter.is_active,
            )
            .returning(ChapterModel)
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one()
        await self._session.flush()
        return self._to_entity(model)

    async def delete(self, chapter_id: UUID) -> bool:
        """Soft delete a chapter."""
        stmt = (
            update(ChapterModel)
            .where(ChapterModel.id == chapter_id)
            .values(is_active=False)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0
