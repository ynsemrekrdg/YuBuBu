"""
Repository interface: StudentProfileRepository
Abstract base class for student profile data access.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.enums import LearningDifficulty
from app.domain.entities.student_profile import StudentProfile


class StudentProfileRepository(ABC):
    """Abstract repository for StudentProfile entity operations."""

    @abstractmethod
    async def create(self, profile: StudentProfile) -> StudentProfile:
        """Create a new student profile."""
        ...

    @abstractmethod
    async def get_by_id(self, profile_id: UUID) -> Optional[StudentProfile]:
        """Get a student profile by ID."""
        ...

    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> Optional[StudentProfile]:
        """Get a student profile by user ID."""
        ...

    @abstractmethod
    async def update(self, profile: StudentProfile) -> StudentProfile:
        """Update an existing student profile."""
        ...

    @abstractmethod
    async def list_by_difficulty(
        self, difficulty: LearningDifficulty, skip: int = 0, limit: int = 100
    ) -> List[StudentProfile]:
        """List student profiles by learning difficulty type."""
        ...

    @abstractmethod
    async def get_by_parent_id(self, parent_id: UUID) -> List[StudentProfile]:
        """Get all student profiles linked to a parent."""
        ...

    @abstractmethod
    async def get_by_teacher_id(self, teacher_id: UUID) -> List[StudentProfile]:
        """Get all student profiles assigned to a teacher."""
        ...

    @abstractmethod
    async def update_score(self, profile_id: UUID, score_delta: int) -> StudentProfile:
        """Update the total score for a student profile."""
        ...

    @abstractmethod
    async def update_streak(self, profile_id: UUID, streak_days: int) -> StudentProfile:
        """Update the streak days for a student profile."""
        ...
