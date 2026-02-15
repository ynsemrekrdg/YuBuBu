"""
SQLAlchemy implementation of BadgeRepository.
"""

from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.badge import Badge
from app.domain.entities.enums import BadgeType
from app.domain.repositories.badge_repository import BadgeRepository
from app.infrastructure.database.models import BadgeModel


class SQLAlchemyBadgeRepository(BadgeRepository):
    """Concrete implementation of BadgeRepository using SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: BadgeModel) -> Badge:
        """Convert SQLAlchemy model to domain entity."""
        return Badge(
            id=model.id,
            student_id=model.student_id,
            badge_type=model.badge_type,
            title=model.title,
            description=model.description,
            icon=model.icon,
            earned_at=model.earned_at,
        )

    def _to_model(self, entity: Badge) -> BadgeModel:
        """Convert domain entity to SQLAlchemy model."""
        return BadgeModel(
            id=entity.id,
            student_id=entity.student_id,
            badge_type=entity.badge_type,
            title=entity.title,
            description=entity.description,
            icon=entity.icon,
        )

    async def create(self, badge: Badge) -> Badge:
        """Create a new badge record."""
        model = self._to_model(badge)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_student(self, student_id: UUID) -> List[Badge]:
        """Get all badges earned by a student."""
        stmt = (
            select(BadgeModel)
            .where(BadgeModel.student_id == student_id)
            .order_by(BadgeModel.earned_at.desc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def has_badge(self, student_id: UUID, badge_type: BadgeType) -> bool:
        """Check if a student already has a specific badge."""
        stmt = select(BadgeModel).where(
            BadgeModel.student_id == student_id,
            BadgeModel.badge_type == badge_type,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None
