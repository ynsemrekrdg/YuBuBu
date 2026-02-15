"""
Pydantic DTOs for chapter operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.enums import ActivityType, LearningDifficulty


# ─── Request DTOs ────────────────────────────────────────────

class CreateChapterRequest(BaseModel):
    """Request body for creating a chapter (admin only)."""
    difficulty_type: LearningDifficulty
    chapter_number: int = Field(..., ge=1, le=100)
    title: str = Field(..., min_length=3, max_length=500)
    description: str = Field(default="", max_length=2000)
    content_config: Dict[str, Any] = Field(default_factory=dict)
    activity_type: ActivityType
    difficulty_level: int = Field(default=1, ge=1, le=5)
    expected_duration_minutes: int = Field(default=15, ge=1, le=120)
    min_score_to_pass: int = Field(default=60, ge=0, le=100)

    model_config = {"json_schema_extra": {
        "example": {
            "difficulty_type": "dyslexia",
            "chapter_number": 1,
            "title": "Harf Tanıma Oyunu",
            "description": "Büyük harflerle harf tanıma aktivitesi",
            "content_config": {"font": "OpenDyslexic", "letters": ["A", "B", "C"]},
            "activity_type": "letter_matching",
            "difficulty_level": 1,
            "expected_duration_minutes": 10,
            "min_score_to_pass": 60
        }
    }}


class UpdateChapterRequest(BaseModel):
    """Request body for updating a chapter."""
    title: Optional[str] = Field(None, min_length=3, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)
    content_config: Optional[Dict[str, Any]] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    expected_duration_minutes: Optional[int] = Field(None, ge=1, le=120)
    min_score_to_pass: Optional[int] = Field(None, ge=0, le=100)


# ─── Response DTOs ───────────────────────────────────────────

class ChapterResponse(BaseModel):
    """Chapter response."""
    id: UUID
    difficulty_type: LearningDifficulty
    chapter_number: int
    title: str
    description: str
    content_config: Dict[str, Any]
    activity_type: ActivityType
    difficulty_level: int
    expected_duration_minutes: int
    min_score_to_pass: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChapterListResponse(BaseModel):
    """Paginated list of chapters."""
    chapters: List[ChapterResponse]
    total: int
    skip: int
    limit: int
