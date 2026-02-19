"""
SQLAlchemy implementation of UserRepository.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import User
from app.domain.entities.enums import UserRole
from app.domain.repositories.user_repository import UserRepository
from app.infrastructure.database.models import UserModel


class SQLAlchemyUserRepository(UserRepository):
    """Concrete implementation of UserRepository using SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: UserModel) -> User:
        """Convert SQLAlchemy model to domain entity."""
        return User(
            id=model.id,
            email=model.email,
            username=model.username,
            name=model.name,
            hashed_password=model.hashed_password,
            role=model.role,
            is_active=model.is_active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    def _to_model(self, entity: User) -> UserModel:
        """Convert domain entity to SQLAlchemy model."""
        return UserModel(
            id=entity.id,
            email=entity.email,
            username=entity.username,
            name=entity.name,
            hashed_password=entity.hashed_password,
            role=entity.role,
            is_active=entity.is_active,
        )

    async def create(self, user: User) -> User:
        """Create a new user in the database."""
        model = self._to_model(user)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by their ID."""
        stmt = select(UserModel).where(
            UserModel.id == user_id, UserModel.is_active == True
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get a user by their email address."""
        if not email:
            return None
        stmt = select(UserModel).where(
            UserModel.email == email, UserModel.is_active == True
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def get_by_username(self, username: str) -> Optional[User]:
        """Get a user by their username."""
        if not username:
            return None
        stmt = select(UserModel).where(
            UserModel.username == username, UserModel.is_active == True
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def update(self, user: User) -> User:
        """Update an existing user."""
        stmt = (
            update(UserModel)
            .where(UserModel.id == user.id)
            .values(
                email=user.email,
                name=user.name,
                role=user.role,
                is_active=user.is_active,
            )
            .returning(UserModel)
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one()
        await self._session.flush()
        return self._to_entity(model)

    async def delete(self, user_id: UUID) -> bool:
        """Soft delete a user."""
        stmt = (
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(is_active=False)
        )
        result = await self._session.execute(stmt)
        await self._session.flush()
        return result.rowcount > 0

    async def list_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """List all active users with pagination."""
        stmt = (
            select(UserModel)
            .where(UserModel.is_active == True)
            .offset(skip)
            .limit(limit)
            .order_by(UserModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]
