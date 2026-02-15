"""
Domain entity: User
Represents a user in the YuBuBu education platform.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from app.domain.entities.enums import UserRole


@dataclass
class User:
    """Core user entity for the education platform."""

    id: UUID = field(default_factory=uuid4)
    email: str = ""
    name: str = ""
    hashed_password: str = ""
    role: UserRole = UserRole.STUDENT
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def is_student(self) -> bool:
        """Check if user is a student."""
        return self.role == UserRole.STUDENT

    def is_parent(self) -> bool:
        """Check if user is a parent."""
        return self.role == UserRole.PARENT

    def is_teacher(self) -> bool:
        """Check if user is a teacher."""
        return self.role == UserRole.TEACHER

    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
