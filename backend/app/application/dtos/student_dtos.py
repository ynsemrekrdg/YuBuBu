"""
Pydantic DTOs for student profile operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.enums import LearningDifficulty


# ─── Request DTOs ────────────────────────────────────────────

class CreateStudentProfileRequest(BaseModel):
    """Request body for creating a student profile."""
    age: int = Field(..., ge=3, le=18, description="Student's age (3-18)")
    learning_difficulty: LearningDifficulty
    preferences: Optional[Dict[str, Any]] = None

    model_config = {"json_schema_extra": {
        "example": {
            "age": 8,
            "learning_difficulty": "dyslexia",
            "preferences": {"font_size": 20, "audio_feedback": True}
        }
    }}


class UpdateStudentProfileRequest(BaseModel):
    """Request body for updating a student profile."""
    age: Optional[int] = Field(None, ge=3, le=18)
    learning_difficulty: Optional[LearningDifficulty] = None
    preferences: Optional[Dict[str, Any]] = None

    model_config = {"json_schema_extra": {
        "example": {
            "age": 9,
            "preferences": {"font_size": 22}
        }
    }}


# ─── Response DTOs ───────────────────────────────────────────

class StudentProfileResponse(BaseModel):
    """Student profile response."""
    id: UUID
    user_id: UUID
    age: int
    learning_difficulty: LearningDifficulty
    current_level: int
    total_score: int
    preferences: Dict[str, Any]
    streak_days: int
    last_activity_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StudentProgressSummary(BaseModel):
    """Summary of student's progress across all chapters."""
    student_id: UUID
    total_chapters_attempted: int
    total_chapters_completed: int
    completion_rate: float
    average_score: float
    best_score: int
    total_time_spent_minutes: float
    total_attempts: int
    current_level: int
    total_score: int
    streak_days: int
    badges: List[Dict[str, Any]] = []
