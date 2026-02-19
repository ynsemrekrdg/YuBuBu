"""
Domain entity: Teacher
Represents a teacher linked to a user and school.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class Teacher:
    """Teacher entity linked to a user and school."""

    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    school_id: UUID = field(default_factory=uuid4)
    branch: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
