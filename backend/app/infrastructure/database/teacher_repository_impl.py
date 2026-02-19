"""
SQLAlchemy implementation of TeacherRepository.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.teacher import Teacher
from app.domain.repositories.teacher_repository import TeacherRepository
from app.infrastructure.database.models import TeacherModel, UserModel


class SQLAlchemyTeacherRepository(TeacherRepository):
    """Concrete implementation of TeacherRepository."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: TeacherModel) -> Teacher:
        return Teacher(
            id=model.id,
            user_id=model.user_id,
            school_id=model.school_id,
            branch=model.branch,
            created_at=model.created_at,
        )

    async def create(self, teacher: Teacher) -> Teacher:
        model = TeacherModel(
            id=teacher.id,
            user_id=teacher.user_id,
            school_id=teacher.school_id,
            branch=teacher.branch,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, teacher_id: UUID) -> Optional[Teacher]:
        stmt = select(TeacherModel).where(TeacherModel.id == teacher_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_user_id(self, user_id: UUID) -> Optional[Teacher]:
        stmt = select(TeacherModel).where(TeacherModel.user_id == user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_school(self, school_id: UUID) -> List[Teacher]:
        stmt = (
            select(TeacherModel)
            .where(TeacherModel.school_id == school_id)
            .options(selectinload(TeacherModel.user))
            .order_by(TeacherModel.created_at)
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]
