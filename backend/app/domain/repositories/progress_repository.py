"""
Repository interface: ProgressRepository
Abstract base class for progress data access.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from uuid import UUID

from app.domain.entities.progress import Progress


class ProgressRepository(ABC):
    """Abstract repository for Progress entity operations."""

    @abstractmethod
    async def create(self, progress: Progress) -> Progress:
        """Create a new progress record."""
        ...

    @abstractmethod
    async def get_by_id(self, progress_id: UUID) -> Optional[Progress]:
        """Get a progress record by ID."""
        ...

    @abstractmethod
    async def get_by_student_and_chapter(
        self, student_id: UUID, chapter_id: UUID
    ) -> Optional[Progress]:
        """Get progress for a specific student and chapter."""
        ...

    @abstractmethod
    async def list_by_student(
        self, student_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Progress]:
        """List all progress records for a student."""
        ...

    @abstractmethod
    async def update(self, progress: Progress) -> Progress:
        """Update an existing progress record."""
        ...

    @abstractmethod
    async def get_completed_count(self, student_id: UUID) -> int:
        """Get total completed chapters for a student."""
        ...

    @abstractmethod
    async def get_analytics(self, student_id: UUID) -> Dict:
        """Get analytics data for a student."""
        ...
