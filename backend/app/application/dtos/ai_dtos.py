"""
Pydantic DTOs for AI chat operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.enums import LearningDifficulty


# ─── Request DTOs ────────────────────────────────────────────

class AIChatRequest(BaseModel):
    """Request body for AI chat."""
    message: str = Field(..., min_length=1, max_length=2000)
    role_context: str = Field(
        default="student",
        description="Role context: student, parent, or teacher"
    )
    chapter_id: Optional[UUID] = Field(
        default=None,
        description="Current chapter ID for context-aware responses"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "message": "Bu kelimeyi okuyamıyorum, bana yardım eder misin?",
            "role_context": "student",
            "chapter_id": None
        }
    }}


class AIHintRequest(BaseModel):
    """Request body for getting a hint for a specific chapter."""
    student_id: Optional[UUID] = None
    difficulty_level: int = Field(default=1, ge=1, le=3, description="Hint detail level")

    model_config = {"json_schema_extra": {
        "example": {
            "difficulty_level": 1
        }
    }}


# ─── Response DTOs ───────────────────────────────────────────

class AIChatResponse(BaseModel):
    """AI chat response."""
    id: UUID
    message: str
    response: str
    role_context: str
    tokens_used: int
    timestamp: datetime

    model_config = {"from_attributes": True}


class AIHintResponse(BaseModel):
    """AI hint response for a chapter."""
    chapter_id: UUID
    hint: str
    hint_level: int
    encouragement: str


class AIAnalysisResponse(BaseModel):
    """AI analysis of student performance."""
    student_id: UUID
    learning_difficulty: LearningDifficulty
    analysis: str
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendations: List[str]
    encouragement_message: str
