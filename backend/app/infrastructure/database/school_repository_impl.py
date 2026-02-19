"""
SQLAlchemy implementation of SchoolRepository.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.school import School
from app.domain.repositories.school_repository import SchoolRepository
from app.infrastructure.database.models import SchoolModel


class SQLAlchemySchoolRepository(SchoolRepository):
    """Concrete implementation of SchoolRepository."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: SchoolModel) -> School:
        return School(
            id=model.id,
            name=model.name,
            city=model.city,
            district=model.district,
            is_active=model.is_active,
            created_at=model.created_at,
        )

    async def create(self, school: School) -> School:
        model = SchoolModel(
            id=school.id,
            name=school.name,
            city=school.city,
            district=school.district,
            is_active=school.is_active,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, school_id: UUID) -> Optional[School]:
        stmt = select(SchoolModel).where(
            SchoolModel.id == school_id, SchoolModel.is_active == True
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[School]:
        stmt = (
            select(SchoolModel)
            .where(SchoolModel.is_active == True)
            .offset(skip)
            .limit(limit)
            .order_by(SchoolModel.name)
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]
