"""
Repository interface: TeacherRepository
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.teacher import Teacher


class TeacherRepository(ABC):
    """Abstract repository for Teacher entity operations."""

    @abstractmethod
    async def create(self, teacher: Teacher) -> Teacher:
        ...

    @abstractmethod
    async def get_by_id(self, teacher_id: UUID) -> Optional[Teacher]:
        ...

    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> Optional[Teacher]:
        ...

    @abstractmethod
    async def list_by_school(self, school_id: UUID) -> List[Teacher]:
        ...
