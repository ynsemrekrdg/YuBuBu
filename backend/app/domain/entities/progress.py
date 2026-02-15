"""
Domain entity: Progress
Tracks a student's progress through chapters.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class Progress:
    """Tracks student progress for a specific chapter."""

    id: UUID = field(default_factory=uuid4)
    student_id: UUID = field(default_factory=uuid4)
    chapter_id: UUID = field(default_factory=uuid4)
    completed: bool = False
    score: int = 0
    attempts: int = 0
    time_spent_seconds: int = 0
    completed_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def mark_completed(self, score: int, time_spent: int) -> None:
        """Mark this progress as completed with a score."""
        self.completed = True
        self.score = max(self.score, score)  # Keep best score
        self.attempts += 1
        self.time_spent_seconds += time_spent
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def add_attempt(self, score: int, time_spent: int) -> None:
        """Record a new attempt without marking as complete."""
        self.score = max(self.score, score)
        self.attempts += 1
        self.time_spent_seconds += time_spent
        self.updated_at = datetime.utcnow()

    @property
    def average_time_per_attempt(self) -> float:
        """Average time spent per attempt in seconds."""
        if self.attempts == 0:
            return 0.0
        return self.time_spent_seconds / self.attempts
