"""
SQLAlchemy implementation of ProgressRepository.
"""

from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.progress import Progress
from app.domain.repositories.progress_repository import ProgressRepository
from app.infrastructure.database.models import ChapterModel, ProgressModel


class SQLAlchemyProgressRepository(ProgressRepository):
    """Concrete implementation of ProgressRepository using SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: ProgressModel) -> Progress:
        """Convert SQLAlchemy model to domain entity."""
        return Progress(
            id=model.id,
            student_id=model.student_id,
            chapter_id=model.chapter_id,
            completed=model.completed,
            score=model.score,
            attempts=model.attempts,
            time_spent_seconds=model.time_spent_seconds,
            completed_at=model.completed_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: Progress) -> ProgressModel:
        """Convert domain entity to SQLAlchemy model."""
        return ProgressModel(
            id=entity.id,
            student_id=entity.student_id,
            chapter_id=entity.chapter_id,
            completed=entity.completed,
            score=entity.score,
            attempts=entity.attempts,
            time_spent_seconds=entity.time_spent_seconds,
            completed_at=entity.completed_at,
        )

    async def create(self, progress: Progress) -> Progress:
        """Create a new progress record."""
        model = self._to_model(progress)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, progress_id: UUID) -> Optional[Progress]:
        """Get a progress record by ID."""
        stmt = select(ProgressModel).where(ProgressModel.id == progress_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_student_and_chapter(
        self, student_id: UUID, chapter_id: UUID
    ) -> Optional[Progress]:
        """Get progress for a specific student and chapter."""
        stmt = select(ProgressModel).where(
            ProgressModel.student_id == student_id,
            ProgressModel.chapter_id == chapter_id,
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_student(
        self, student_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Progress]:
        """List all progress records for a student."""
        stmt = (
            select(ProgressModel)
            .where(ProgressModel.student_id == student_id)
            .offset(skip)
            .limit(limit)
            .order_by(ProgressModel.updated_at.desc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def update(self, progress: Progress) -> Progress:
        """Update an existing progress record."""
        stmt = (
            update(ProgressModel)
            .where(ProgressModel.id == progress.id)
            .values(
                completed=progress.completed,
                score=progress.score,
                attempts=progress.attempts,
                time_spent_seconds=progress.time_spent_seconds,
                completed_at=progress.completed_at,
            )
            .returning(ProgressModel)
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one()
        await self._session.flush()
        return self._to_entity(model)

    async def get_completed_count(self, student_id: UUID) -> int:
        """Get total completed chapters for a student."""
        stmt = select(func.count(ProgressModel.id)).where(
            ProgressModel.student_id == student_id,
            ProgressModel.completed == True,
        )
        result = await self._session.execute(stmt)
        return result.scalar() or 0

    async def get_analytics(self, student_id: UUID) -> Dict:
        """Get analytics data for a student."""
        # Total chapters attempted
        total_stmt = select(func.count(ProgressModel.id)).where(
            ProgressModel.student_id == student_id
        )
        total_result = await self._session.execute(total_stmt)
        total_attempted = total_result.scalar() or 0

        # Completed chapters
        completed_stmt = select(func.count(ProgressModel.id)).where(
            ProgressModel.student_id == student_id,
            ProgressModel.completed == True,
        )
        completed_result = await self._session.execute(completed_stmt)
        total_completed = completed_result.scalar() or 0

        # Average score
        avg_stmt = select(func.avg(ProgressModel.score)).where(
            ProgressModel.student_id == student_id,
            ProgressModel.score > 0,
        )
        avg_result = await self._session.execute(avg_stmt)
        avg_score = avg_result.scalar() or 0

        # Total time spent
        time_stmt = select(func.sum(ProgressModel.time_spent_seconds)).where(
            ProgressModel.student_id == student_id
        )
        time_result = await self._session.execute(time_stmt)
        total_time = time_result.scalar() or 0

        # Total attempts
        attempts_stmt = select(func.sum(ProgressModel.attempts)).where(
            ProgressModel.student_id == student_id
        )
        attempts_result = await self._session.execute(attempts_stmt)
        total_attempts = attempts_result.scalar() or 0

        # Best score
        best_stmt = select(func.max(ProgressModel.score)).where(
            ProgressModel.student_id == student_id
        )
        best_result = await self._session.execute(best_stmt)
        best_score = best_result.scalar() or 0

        return {
            "total_chapters_attempted": total_attempted,
            "total_chapters_completed": total_completed,
            "completion_rate": (
                round(total_completed / total_attempted * 100, 1)
                if total_attempted > 0
                else 0
            ),
            "average_score": round(float(avg_score), 1),
            "best_score": best_score,
            "total_time_spent_seconds": total_time,
            "total_time_spent_minutes": round(total_time / 60, 1),
            "total_attempts": total_attempts,
        }
