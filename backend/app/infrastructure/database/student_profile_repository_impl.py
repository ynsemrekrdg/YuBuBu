"""
SQLAlchemy implementation of StudentProfileRepository.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.enums import LearningDifficulty
from app.domain.entities.student_profile import StudentProfile
from app.domain.repositories.student_profile_repository import StudentProfileRepository
from app.infrastructure.database.models import StudentProfileModel


class SQLAlchemyStudentProfileRepository(StudentProfileRepository):
    """Concrete implementation of StudentProfileRepository using SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: StudentProfileModel) -> StudentProfile:
        """Convert SQLAlchemy model to domain entity."""
        return StudentProfile(
            id=model.id,
            user_id=model.user_id,
            age=model.age,
            learning_difficulty=model.learning_difficulty,
            current_level=model.current_level,
            total_score=model.total_score,
            preferences=model.preferences or {},
            streak_days=model.streak_days,
            last_activity_date=model.last_activity_date,
            parent_id=model.parent_id,
            school_id=model.school_id,
            teacher_id=model.teacher_id,
            grade=model.grade,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: StudentProfile) -> StudentProfileModel:
        """Convert domain entity to SQLAlchemy model."""
        return StudentProfileModel(
            id=entity.id,
            user_id=entity.user_id,
            age=entity.age,
            learning_difficulty=entity.learning_difficulty,
            current_level=entity.current_level,
            total_score=entity.total_score,
            preferences=entity.preferences,
            streak_days=entity.streak_days,
            last_activity_date=entity.last_activity_date,
            parent_id=entity.parent_id,
            school_id=entity.school_id,
            teacher_id=entity.teacher_id,
            grade=entity.grade,
        )

    async def create(self, profile: StudentProfile) -> StudentProfile:
        """Create a new student profile."""
        model = self._to_model(profile)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, profile_id: UUID) -> Optional[StudentProfile]:
        """Get a student profile by ID."""
        stmt = select(StudentProfileModel).where(StudentProfileModel.id == profile_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_user_id(self, user_id: UUID) -> Optional[StudentProfile]:
        """Get a student profile by user ID."""
        stmt = select(StudentProfileModel).where(
            StudentProfileModel.user_id == user_id
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update(self, profile: StudentProfile) -> StudentProfile:
        """Update an existing student profile."""
        stmt = (
            update(StudentProfileModel)
            .where(StudentProfileModel.id == profile.id)
            .values(
                age=profile.age,
                learning_difficulty=profile.learning_difficulty,
                current_level=profile.current_level,
                total_score=profile.total_score,
                preferences=profile.preferences,
                streak_days=profile.streak_days,
                last_activity_date=profile.last_activity_date,
            )
            .returning(StudentProfileModel)
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one()
        await self._session.flush()
        return self._to_entity(model)

    async def list_by_difficulty(
        self, difficulty: LearningDifficulty, skip: int = 0, limit: int = 100
    ) -> List[StudentProfile]:
        """List student profiles by learning difficulty type."""
        stmt = (
            select(StudentProfileModel)
            .where(StudentProfileModel.learning_difficulty == difficulty)
            .offset(skip)
            .limit(limit)
            .order_by(StudentProfileModel.total_score.desc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def get_by_parent_id(self, parent_id: UUID) -> List[StudentProfile]:
        """Get all student profiles linked to a parent."""
        stmt = (
            select(StudentProfileModel)
            .where(StudentProfileModel.parent_id == parent_id)
            .order_by(StudentProfileModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def update_score(self, profile_id: UUID, score_delta: int) -> StudentProfile:
        """Update the total score for a student profile."""
        stmt = select(StudentProfileModel).where(
            StudentProfileModel.id == profile_id
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"StudentProfile {profile_id} not found")

        model.total_score += score_delta
        model.current_level = max(1, model.total_score // 500 + 1)
        model.last_activity_date = datetime.utcnow()
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def update_streak(self, profile_id: UUID, streak_days: int) -> StudentProfile:
        """Update the streak days for a student profile."""
        stmt = (
            update(StudentProfileModel)
            .where(StudentProfileModel.id == profile_id)
            .values(streak_days=streak_days, last_activity_date=datetime.utcnow())
            .returning(StudentProfileModel)
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one()
        await self._session.flush()
        return self._to_entity(model)
