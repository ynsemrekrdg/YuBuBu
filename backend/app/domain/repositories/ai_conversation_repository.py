"""
Repository interface: AIConversationRepository
Abstract base class for AI conversation data access.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.ai_conversation import AIConversation


class AIConversationRepository(ABC):
    """Abstract repository for AIConversation entity operations."""

    @abstractmethod
    async def create(self, conversation: AIConversation) -> AIConversation:
        """Create a new conversation record."""
        ...

    @abstractmethod
    async def get_by_id(self, conversation_id: UUID) -> Optional[AIConversation]:
        """Get a conversation by ID."""
        ...

    @abstractmethod
    async def list_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> List[AIConversation]:
        """List conversation history for a user."""
        ...

    @abstractmethod
    async def get_recent_context(
        self, user_id: UUID, limit: int = 10
    ) -> List[AIConversation]:
        """Get recent conversation context for AI continuity."""
        ...
