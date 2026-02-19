"""
Aktivite-içi AI API endpoint'leri.

KATMAN 1:
  POST /api/ai/activity/hint         — Aktivite sırasında anlık ipucu
  POST /api/ai/activity/evaluate      — Öğrenci çalışmasını değerlendir
  POST /api/ai/activity/difficulty    — Uyarlanabilir zorluk önerisi

KATMAN 2:
  POST /api/ai/activity/session-analysis  — Oturum sonrası analiz
  POST /api/ai/activity/next-steps        — Sonraki adım önerisi

ÖZEL:
  POST /api/ai/activity/practice          — Kişiselleştirilmiş pratik oluştur
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.api.dependencies import get_current_active_user
from app.application.dtos.ai_activity_dtos import (
    ActivityHintRequest,
    ActivityHintResponse,
    AdaptiveDifficultyRequest,
    AdaptiveDifficultyResponse,
    EvaluateWorkRequest,
    EvaluateWorkResponse,
    NextStepsRequest,
    NextStepsResponse,
    PersonalizedPracticeRequest,
    PersonalizedPracticeResponse,
    PracticeItem,
    SessionAnalysisRequest,
    SessionAnalysisResponse,
)
from app.domain.entities.user import User
from app.infrastructure.ai.activity_ai_service import ActivityAIService
from app.infrastructure.cache.redis_cache import redis_cache
from app.infrastructure.database.ai_conversation_repository_impl import (
    SQLAlchemyAIConversationRepository,
)
from app.infrastructure.database.progress_repository_impl import (
    SQLAlchemyProgressRepository,
)
from app.infrastructure.database.session import get_db
from app.infrastructure.database.student_profile_repository_impl import (
    SQLAlchemyStudentProfileRepository,
)

router = APIRouter(prefix="/api/ai/activity", tags=["AI Activity Support"])


# ─── Dependency ─────────────────────────────────────────────

def get_activity_ai_service(session=Depends(get_db)) -> ActivityAIService:
    """ActivityAIService bağımlılık enjeksiyonu."""
    return ActivityAIService(
        conversation_repo=SQLAlchemyAIConversationRepository(session),
        profile_repo=SQLAlchemyStudentProfileRepository(session),
        progress_repo=SQLAlchemyProgressRepository(session),
        cache=redis_cache,
    )


# ═════════════════════════════════════════════════════════════
# KATMAN 1: AKTİVİTE İÇİ GERÇEK ZAMANLI DESTEK
# ═════════════════════════════════════════════════════════════

@router.post(
    "/hint",
    response_model=ActivityHintResponse,
    summary="Aktivite İpucu",
    description="Aktivite sırasında öğrenciye anlık AI ipucu verir. Deneme sayısına göre ipucu seviyesi artar.",
)
async def get_activity_hint(
    request: ActivityHintRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: ActivityAIService = Depends(get_activity_ai_service),
):
    """Aktivite sırasında ipucu iste."""
    try:
        result = await ai_service.provide_activity_hint(
            student_id=current_user.id,
            chapter_id=request.chapter_id,
            activity_type=request.activity_type,
            problem=request.problem,
            student_attempt=request.student_attempt,
            context=request.context,
        )
        return ActivityHintResponse(**result)
    except Exception as e:
        logger.error(f"Activity hint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İpucu oluşturulurken bir hata oluştu",
        )


@router.post(
    "/evaluate",
    response_model=EvaluateWorkResponse,
    summary="Çalışma Değerlendirme",
    description="Öğrencinin el yazısı, okuma veya matematik çalışmasını AI ile değerlendirir.",
)
async def evaluate_work(
    request: EvaluateWorkRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: ActivityAIService = Depends(get_activity_ai_service),
):
    """Öğrenci çalışmasını değerlendir."""
    try:
        result = await ai_service.evaluate_student_work(
            student_id=current_user.id,
            activity_type=request.activity_type,
            work_type=request.work_type,
            work_data=request.work_data,
        )
        return EvaluateWorkResponse(**result)
    except Exception as e:
        logger.error(f"Evaluate work error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Değerlendirme yapılırken bir hata oluştu",
        )


@router.post(
    "/difficulty",
    response_model=AdaptiveDifficultyResponse,
    summary="Zorluk Önerisi",
    description="Son performansa göre zorluk seviyesi artırma/azaltma önerisi.",
)
async def suggest_difficulty(
    request: AdaptiveDifficultyRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: ActivityAIService = Depends(get_activity_ai_service),
):
    """Uyarlanabilir zorluk önerisi."""
    try:
        result = await ai_service.adaptive_difficulty_suggestion(
            student_id=current_user.id,
            recent_performance=request.recent_performance,
        )
        return AdaptiveDifficultyResponse(**result)
    except Exception as e:
        logger.error(f"Difficulty suggestion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Zorluk önerisi oluşturulurken hata oluştu",
        )


# ═════════════════════════════════════════════════════════════
# KATMAN 2: BÖLÜM SONRASI ANALİZ
# ═════════════════════════════════════════════════════════════

@router.post(
    "/session-analysis",
    response_model=SessionAnalysisResponse,
    summary="Oturum Analizi",
    description="Oturum sonunda otomatik detaylı performans analizi ve müdahale önerisi.",
)
async def analyze_session(
    request: SessionAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: ActivityAIService = Depends(get_activity_ai_service),
):
    """Oturum sonunda analiz yap."""
    try:
        result = await ai_service.analyze_session_performance(
            student_id=current_user.id,
            session_data=request.session_data,
        )
        return SessionAnalysisResponse(**result)
    except Exception as e:
        logger.error(f"Session analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Oturum analizi oluşturulurken hata oluştu",
        )


@router.post(
    "/next-steps",
    response_model=NextStepsResponse,
    summary="Sonraki Adım",
    description="Performansa göre sonraki bölüm/aktivite önerisi.",
)
async def get_next_steps(
    request: NextStepsRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: ActivityAIService = Depends(get_activity_ai_service),
):
    """Sonraki adım önerisi al."""
    try:
        result = await ai_service.generate_next_steps(
            student_id=current_user.id,
            current_chapter_id=request.current_chapter_id,
            performance_summary=request.performance_summary,
        )
        return NextStepsResponse(**result)
    except Exception as e:
        logger.error(f"Next steps error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sonraki adım önerisi oluşturulurken hata oluştu",
        )


# ═════════════════════════════════════════════════════════════
# ÖZEL: KİŞİSELLEŞTİRİLMİŞ PRATİK
# ═════════════════════════════════════════════════════════════

@router.post(
    "/practice",
    response_model=PersonalizedPracticeResponse,
    summary="Kişisel Pratik",
    description="Zayıf alana özel kişiselleştirilmiş pratik problemleri oluşturur.",
)
async def generate_practice(
    request: PersonalizedPracticeRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: ActivityAIService = Depends(get_activity_ai_service),
):
    """Kişiselleştirilmiş pratik oluştur."""
    try:
        problems = await ai_service.generate_personalized_practice(
            student_id=current_user.id,
            weak_skill=request.weak_skill,
            count=request.count,
        )

        # PracticeItem modeline dönüştür
        items = []
        for i, p in enumerate(problems):
            items.append(PracticeItem(
                id=p.get("id", i + 1),
                question=p.get("question", ""),
                correct_answer=p.get("correct_answer", ""),
                options=p.get("options", []),
                hint=p.get("hint", ""),
                difficulty=p.get("difficulty", "easy"),
                skill_focus=p.get("skill_focus", request.weak_skill),
            ))

        return PersonalizedPracticeResponse(
            problems=items,
            skill=request.weak_skill,
            total=len(items),
        )
    except Exception as e:
        logger.error(f"Practice generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Pratik problemleri oluşturulurken hata oluştu",
        )
