"""
Pydantic DTO'lar — Aktivite-içi AI desteği için istek/yanıt modelleri.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════════════════
# KATMAN 1: AKTİVİTE İÇİ İSTEK/YANIT
# ═══════════════════════════════════════════════════════════════

class ActivityHintRequest(BaseModel):
    """Aktivite sırasında ipucu isteme."""
    chapter_id: str = Field(..., description="Bölüm ID")
    activity_type: str = Field(..., description="Aktivite tipi (ör. counting, letter_formation)")
    problem: Dict[str, Any] = Field(
        ...,
        description="Soru bilgisi: {question, correct_answer, ...}",
    )
    student_attempt: Dict[str, Any] = Field(
        ...,
        description="Öğrenci cevabı: {answer, attempt_number}",
    )
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Ek bilgi: {error_type, chapter_title, learning_difficulty}",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "chapter_id": "abc-123",
            "activity_type": "counting",
            "problem": {"question": "5 + 3 = ?", "correct_answer": "8"},
            "student_attempt": {"answer": "7", "attempt_number": 2},
            "context": {"error_type": "arithmetic", "chapter_title": "Toplama", "learning_difficulty": "dyscalculia"},
        }
    }}


class ActivityHintResponse(BaseModel):
    """Aktivite ipucu yanıtı."""
    hint: str = Field(..., description="İpucu metni")
    hint_level: int = Field(..., ge=1, le=3, description="İpucu seviyesi (1=hafif, 3=detaylı)")
    should_show_answer: bool = Field(False, description="Cevabı göster mi?")
    visual_aid: str = Field("none", description="Görsel yardım tipi")
    encouragement: str = Field("", description="Cesaretlendirici mesaj")


class EvaluateWorkRequest(BaseModel):
    """Öğrenci çalışmasını değerlendirme istemi."""
    activity_type: str = Field(..., description="Aktivite tipi")
    work_type: str = Field(
        ...,
        description="Çalışma türü: handwriting|reading|math|writing",
    )
    work_data: Dict[str, Any] = Field(
        ...,
        description="Çalışma verisi: {content, target, activity_description}",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "activity_type": "letter_formation",
            "work_type": "handwriting",
            "work_data": {
                "content": "Öğrenci 'a' harfini yazdı",
                "target": "a",
                "activity_description": "Küçük 'a' harfi yazma pratiği",
            },
        }
    }}


class EvaluateWorkResponse(BaseModel):
    """Çalışma değerlendirme yanıtı."""
    score: int = Field(..., ge=0, le=4, description="Performans puanı (0-4)")
    feedback: str = Field(..., description="Genel geri bildirim")
    strengths: List[str] = Field(default_factory=list, description="Güçlü yönler")
    improvements: List[str] = Field(default_factory=list, description="Gelişim önerileri")
    error_analysis: Dict[str, Any] = Field(
        default_factory=dict,
        description="Hata analizi: {error_type, pattern, severity}",
    )


class AdaptiveDifficultyRequest(BaseModel):
    """Uyarlanabilir zorluk önerisi istemi."""
    recent_performance: List[Dict[str, Any]] = Field(
        ...,
        description="Son 5-10 aktivite performansı: [{score, hints_used, time_seconds, errors}]",
    )


class AdaptiveDifficultyResponse(BaseModel):
    """Zorluk önerisi yanıtı."""
    action: str = Field(..., description="increase|decrease|maintain")
    reason: str = Field(..., description="Karar sebebi")
    confidence: float = Field(..., ge=0, le=1, description="Güven skoru")
    next_difficulty: str = Field(..., description="Önerilen zorluk seviyesi")
    specific_adjustments: List[str] = Field(
        default_factory=list,
        description="Somut ayarlama önerileri",
    )


# ═══════════════════════════════════════════════════════════════
# KATMAN 2: OTURUM SONU ANALİZ
# ═══════════════════════════════════════════════════════════════

class SessionAnalysisRequest(BaseModel):
    """Oturum sonu analiz istemi."""
    session_data: Dict[str, Any] = Field(
        ...,
        description=(
            "Oturum verileri: {chapter_id, chapter_title, activity_type, "
            "activities_completed, time_spent, hints_used, errors: [{type, count}], scores: [int]}"
        ),
    )

    model_config = {"json_schema_extra": {
        "example": {
            "session_data": {
                "chapter_id": "abc-123",
                "chapter_title": "Toplama",
                "activity_type": "addition_cra",
                "activities_completed": 5,
                "time_spent": 600,
                "hints_used": 3,
                "errors": [{"type": "place_value", "count": 2}],
                "scores": [80, 60, 70, 90, 85],
            }
        }
    }}


class SessionAnalysisResponse(BaseModel):
    """Oturum analiz yanıtı."""
    dominant_error: str = Field("none", description="Baskın hata tipi")
    error_frequency: int = Field(0, description="Hata tekrar sayısı")
    severity: str = Field("low", description="Ciddiyet: low|medium|high")
    intervention_needed: bool = Field(False, description="Müdahale gerekli mi")
    intervention_type: Optional[str] = Field(None, description="Müdahale türü")
    teacher_note: str = Field("", description="Öğretmene not")
    parent_note: str = Field("", description="Veliye not")
    positive_observations: List[str] = Field(default_factory=list)
    session_summary: str = Field("", description="Genel özet")


class NextStepsRequest(BaseModel):
    """Sonraki adım öneri istemi."""
    current_chapter_id: str = Field(..., description="Mevcut bölüm ID")
    performance_summary: Dict[str, Any] = Field(
        ...,
        description=(
            "Performans özeti: {chapter_title, average_score, "
            "dominant_error, severity, intervention_needed}"
        ),
    )


class NextStepsResponse(BaseModel):
    """Sonraki adım yanıtı."""
    next_action: str = Field(..., description="continue|review|advance|intervene")
    reason: str = Field(..., description="Karar sebebi")
    next_chapter_id: Optional[str] = Field(None, description="Sonraki bölüm ID")
    review_activities: List[str] = Field(default_factory=list)
    intervention_module: Optional[str] = Field(None)
    encouragement: str = Field("", description="Cesaretlendirici mesaj")


# ═══════════════════════════════════════════════════════════════
# ÖZEL: KİŞİSELLEŞTİRİLMİŞ PRATİK
# ═══════════════════════════════════════════════════════════════

class PersonalizedPracticeRequest(BaseModel):
    """Kişiselleştirilmiş pratik oluşturma istemi."""
    weak_skill: str = Field(
        ...,
        description="Zayıf alan: blending|place_value|handwriting|spelling|counting vb.",
    )
    count: int = Field(5, ge=1, le=10, description="Problem sayısı")


class PracticeItem(BaseModel):
    """Tek bir pratik problemi."""
    id: int
    question: str
    correct_answer: str
    options: List[str] = Field(default_factory=list)
    hint: str = ""
    difficulty: str = "easy"
    skill_focus: str = ""


class PersonalizedPracticeResponse(BaseModel):
    """Kişiselleştirilmiş pratik yanıtı."""
    problems: List[PracticeItem] = Field(default_factory=list)
    skill: str = Field("", description="Hedef beceri")
    total: int = Field(0, description="Problem sayısı")
