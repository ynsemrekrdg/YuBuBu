"""
Domain entity: ParentStudentRelation
Represents the many-to-many relationship between parents and students.
"""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class ParentStudentRelation:
    """Parent-student relationship entity."""

    id: UUID = field(default_factory=uuid4)
    parent_id: UUID = field(default_factory=uuid4)
    student_id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
