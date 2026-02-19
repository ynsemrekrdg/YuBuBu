"""
Pydantic DTOs for dysgraphia-specific operations.
Sentence checking, spelling help, story ideas, composition feedback, writing coach.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Request DTOs ────────────────────────────────────────────


class SentenceCheckRequest(BaseModel):
    """Request body for checking a sentence."""
    sentence: str = Field(..., min_length=1, max_length=1000, description="Kontrol edilecek cümle")
    focus_area: str = Field(
        default="general",
        description="Odak alanı: capitalization, punctuation, spelling, spacing, grammar, general"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "sentence": "kedi uyuyor",
            "focus_area": "capitalization"
        }
    }}


class SpellingHelpRequest(BaseModel):
    """Request body for spelling assistance."""
    word: str = Field(..., min_length=1, max_length=100, description="Yazılmaya çalışılan kelime")
    context: str = Field(default="", max_length=500, description="Kelime bağlamı (cümle)")

    model_config = {"json_schema_extra": {
        "example": {
            "word": "arkadaş",
            "context": "Benim en iyi ___"
        }
    }}


class StoryIdeasRequest(BaseModel):
    """Request body for generating story ideas."""
    topic: str = Field(default="serbest", max_length=200, description="Hikaye konusu")
    student_age: int = Field(default=8, ge=5, le=15, description="Öğrenci yaşı")

    model_config = {"json_schema_extra": {
        "example": {
            "topic": "hayvanlar",
            "student_age": 8
        }
    }}


class CompositionFeedbackRequest(BaseModel):
    """Request body for composition feedback."""
    text: str = Field(..., min_length=1, max_length=5000, description="Değerlendirilecek metin")
    task_type: str = Field(
        default="serbest yazma",
        max_length=200,
        description="Yazma görevi türü (hikaye, paragraf, mektup vb.)"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "text": "Benim bir kedim var. Adı Boncuk. Boncuk çok sevimli.",
            "task_type": "paragraf yazma"
        }
    }}


class WritingCoachRequest(BaseModel):
    """Request body for writing coach interaction."""
    message: str = Field(..., min_length=1, max_length=2000, description="Öğrenci mesajı")
    writing_task: str = Field(
        default="serbest yazma",
        max_length=200,
        description="Mevcut yazma görevi"
    )

    model_config = {"json_schema_extra": {
        "example": {
            "message": "Hikayeme nasıl başlayayım?",
            "writing_task": "hikaye yazma"
        }
    }}


# ─── Response DTOs ───────────────────────────────────────────


class SentenceError(BaseModel):
    """A single error found in a sentence."""
    type: str = ""
    issue: str = ""
    position: str = ""
    correction: str = ""


class SentenceCheckResponse(BaseModel):
    """Response for sentence check."""
    praise: str = ""
    errors: List[SentenceError] = []
    corrected_sentence: str = ""
    tip: str = ""


class SpellingHelpResponse(BaseModel):
    """Response for spelling help."""
    syllables: str = ""
    sounds: str = ""
    strategy: str = ""
    hint: str = ""
    rule: str = ""
    similar_words: List[str] = []
    encouragement: str = ""


class StoryIdea(BaseModel):
    """A single story idea."""
    title: str = ""
    character: str = ""
    setting: str = ""
    problem: str = ""
    hint: str = ""


class StoryIdeasResponse(BaseModel):
    """Response with story ideas."""
    ideas: List[StoryIdea] = []


class CompositionScores(BaseModel):
    """Rubric scores for composition."""
    ideas: int = 0
    organization: int = 0
    sentence_structure: int = 0
    mechanics: int = 0
    total: int = 0


class CompositionImprovement(BaseModel):
    """Single improvement suggestion."""
    area: str = ""
    suggestion: str = ""


class CompositionFeedbackResponse(BaseModel):
    """Response for composition feedback."""
    scores: CompositionScores = CompositionScores()
    praise: str = ""
    strengths: List[str] = []
    improvements: List[CompositionImprovement] = []
    next_step: str = ""
    encouragement: str = ""
    word_count: int = 0


class WritingCoachResponse(BaseModel):
    """Response from writing coach."""
    response: str = ""
    tokens_used: int = 0
