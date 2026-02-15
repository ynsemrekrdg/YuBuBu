"""
SQLAlchemy implementation of AIConversationRepository.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.ai_conversation import AIConversation
from app.domain.repositories.ai_conversation_repository import AIConversationRepository
from app.infrastructure.database.models import AIConversationModel


class SQLAlchemyAIConversationRepository(AIConversationRepository):
    """Concrete implementation of AIConversationRepository using SQLAlchemy."""

    def __init__(self, session: AsyncSession):
        self._session = session

    def _to_entity(self, model: AIConversationModel) -> AIConversation:
        """Convert SQLAlchemy model to domain entity."""
        return AIConversation(
            id=model.id,
            user_id=model.user_id,
            message=model.message,
            response=model.response,
            context=model.context or {},
            role_context=model.role_context,
            tokens_used=model.tokens_used,
            timestamp=model.timestamp,
        )

    def _to_model(self, entity: AIConversation) -> AIConversationModel:
        """Convert domain entity to SQLAlchemy model."""
        return AIConversationModel(
            id=entity.id,
            user_id=entity.user_id,
            message=entity.message,
            response=entity.response,
            context=entity.context,
            role_context=entity.role_context,
            tokens_used=entity.tokens_used,
        )

    async def create(self, conversation: AIConversation) -> AIConversation:
        """Create a new conversation record."""
        model = self._to_model(conversation)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return self._to_entity(model)

    async def get_by_id(self, conversation_id: UUID) -> Optional[AIConversation]:
        """Get a conversation by ID."""
        stmt = select(AIConversationModel).where(
            AIConversationModel.id == conversation_id
        )
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> List[AIConversation]:
        """List conversation history for a user."""
        stmt = (
            select(AIConversationModel)
            .where(AIConversationModel.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(AIConversationModel.timestamp.desc())
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        return [self._to_entity(m) for m in models]

    async def get_recent_context(
        self, user_id: UUID, limit: int = 10
    ) -> List[AIConversation]:
        """Get recent conversation context for AI continuity."""
        stmt = (
            select(AIConversationModel)
            .where(AIConversationModel.user_id == user_id)
            .order_by(AIConversationModel.timestamp.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        models = result.scalars().all()
        # Return in chronological order
        return [self._to_entity(m) for m in reversed(list(models))]
