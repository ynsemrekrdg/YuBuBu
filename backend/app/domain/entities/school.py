"""
Domain entity: School
Represents a school in the YuBuBu education platform.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class School:
    """School entity."""

    id: UUID = field(default_factory=uuid4)
    name: str = ""
    city: str = ""
    district: str = ""
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
