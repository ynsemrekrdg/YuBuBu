"""
Repository interface: SchoolRepository
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.domain.entities.school import School


class SchoolRepository(ABC):
    """Abstract repository for School entity operations."""

    @abstractmethod
    async def create(self, school: School) -> School:
        ...

    @abstractmethod
    async def get_by_id(self, school_id: UUID) -> Optional[School]:
        ...

    @abstractmethod
    async def list_all(self, skip: int = 0, limit: int = 100) -> List[School]:
        ...
