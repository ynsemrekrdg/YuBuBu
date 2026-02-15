"""
Domain entity: Chapter
Represents a learning chapter/module with content configuration.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict
from uuid import UUID, uuid4

from app.domain.entities.enums import ActivityType, DifficultyLevel, LearningDifficulty


@dataclass
class Chapter:
    """A learning chapter with content specific to a learning difficulty type."""

    id: UUID = field(default_factory=uuid4)
    difficulty_type: LearningDifficulty = LearningDifficulty.DYSLEXIA
    chapter_number: int = 1
    title: str = ""
    description: str = ""
    content_config: Dict[str, Any] = field(default_factory=dict)
    activity_type: ActivityType = ActivityType.WORD_RECOGNITION
    difficulty_level: DifficultyLevel = DifficultyLevel.BEGINNER
    expected_duration_minutes: int = 15
    min_score_to_pass: int = 60
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def success_criteria(self) -> Dict[str, Any]:
        """Dynamic success criteria based on difficulty type."""
        return self.content_config.get("success_criteria", {
            "min_score": self.min_score_to_pass,
            "max_attempts": 3,
            "time_limit_minutes": self.expected_duration_minutes,
        })
