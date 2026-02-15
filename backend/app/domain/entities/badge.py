"""
Domain entity: Badge
Represents an achievement/badge earned by a student.
"""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.enums import BadgeType


@dataclass
class Badge:
    """Achievement badge earned by a student."""

    id: UUID = field(default_factory=uuid4)
    student_id: UUID = field(default_factory=uuid4)
    badge_type: BadgeType = BadgeType.FIRST_CHAPTER
    title: str = ""
    description: str = ""
    icon: str = ""
    earned_at: datetime = field(default_factory=datetime.utcnow)
