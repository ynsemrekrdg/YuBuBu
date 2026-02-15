"""
Domain entity: AIConversation
Represents an AI chat interaction between a user and Claude.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4


@dataclass
class AIConversation:
    """Records AI conversation interactions."""

    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    message: str = ""
    response: str = ""
    context: Dict[str, Any] = field(default_factory=dict)
    role_context: str = "student"  # student, parent, teacher
    tokens_used: int = 0
    timestamp: datetime = field(default_factory=datetime.utcnow)
