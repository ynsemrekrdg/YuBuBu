"""
Repository interface: BadgeRepository
Abstract base class for badge/achievement data access.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.badge import Badge
from app.domain.entities.enums import BadgeType


class BadgeRepository(ABC):
    """Abstract repository for Badge entity operations."""

    @abstractmethod
    async def create(self, badge: Badge) -> Badge:
        """Create a new badge record."""
        ...

    @abstractmethod
    async def get_by_student(self, student_id: UUID) -> List[Badge]:
        """Get all badges earned by a student."""
        ...

    @abstractmethod
    async def has_badge(self, student_id: UUID, badge_type: BadgeType) -> bool:
        """Check if a student already has a specific badge."""
        ...
