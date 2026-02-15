"""
Pydantic DTOs for progress tracking operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Request DTOs ────────────────────────────────────────────

class CompleteChapterRequest(BaseModel):
    """Request body for marking a chapter as completed."""
    student_id: UUID
    chapter_id: UUID
    score: int = Field(..., ge=0, le=100, description="Score achieved (0-100)")
    time_spent_seconds: int = Field(..., ge=0, description="Time spent in seconds")

    model_config = {"json_schema_extra": {
        "example": {
            "student_id": "123e4567-e89b-12d3-a456-426614174000",
            "chapter_id": "123e4567-e89b-12d3-a456-426614174001",
            "score": 85,
            "time_spent_seconds": 420
        }
    }}


# ─── Response DTOs ───────────────────────────────────────────

class ProgressResponse(BaseModel):
    """Progress record response."""
    id: UUID
    student_id: UUID
    chapter_id: UUID
    completed: bool
    score: int
    attempts: int
    time_spent_seconds: int
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProgressListResponse(BaseModel):
    """List of progress records."""
    progress: List[ProgressResponse]
    total: int


class AnalyticsResponse(BaseModel):
    """Analytics data for a student."""
    student_id: UUID
    total_chapters_attempted: int
    total_chapters_completed: int
    completion_rate: float
    average_score: float
    best_score: int
    total_time_spent_seconds: int
    total_time_spent_minutes: float
    total_attempts: int
    score_earned: int = 0
    badges_earned: List[Dict[str, Any]] = []
    level: int = 1
    streak_days: int = 0


class CompletionResult(BaseModel):
    """Result of completing a chapter, including gamification rewards."""
    progress: ProgressResponse
    score_earned: int
    speed_bonus: int
    total_points: int
    new_badges: List[Dict[str, Any]] = []
    level_up: bool = False
    new_level: int = 1
    streak_days: int = 0
