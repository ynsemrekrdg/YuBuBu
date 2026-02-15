"""
Repository interface: ChapterRepository
Abstract base class for chapter data access.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.chapter import Chapter
from app.domain.entities.enums import LearningDifficulty


class ChapterRepository(ABC):
    """Abstract repository for Chapter entity operations."""

    @abstractmethod
    async def create(self, chapter: Chapter) -> Chapter:
        """Create a new chapter."""
        ...

    @abstractmethod
    async def get_by_id(self, chapter_id: UUID) -> Optional[Chapter]:
        """Get a chapter by ID."""
        ...

    @abstractmethod
    async def list_by_difficulty(
        self, difficulty: LearningDifficulty, skip: int = 0, limit: int = 100
    ) -> List[Chapter]:
        """List chapters filtered by learning difficulty type."""
        ...

    @abstractmethod
    async def list_all(self, skip: int = 0, limit: int = 100) -> List[Chapter]:
        """List all chapters with pagination."""
        ...

    @abstractmethod
    async def update(self, chapter: Chapter) -> Chapter:
        """Update an existing chapter."""
        ...

    @abstractmethod
    async def delete(self, chapter_id: UUID) -> bool:
        """Delete a chapter."""
        ...
