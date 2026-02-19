"""
AI API routes.
POST /api/ai/chat                (personalized conversation)
POST /api/ai/hint/{chapter_id}   (chapter hint)
GET  /api/ai/analysis/{student_id} (performance analysis)
POST /api/ai/tts/speak           (YuBu TTS - metin → ses)
POST /api/ai/tts/scenario        (YuBu TTS - senaryo → ses)
GET  /api/ai/tts/scenarios       (Mevcut senaryolar listesi)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from loguru import logger

from app.api.dependencies import (
    get_ai_service,
    get_chapter_service,
    get_current_active_user,
    get_tts_service,
)
from app.application.dtos.ai_dtos import (
    AIAnalysisResponse,
    AIChatRequest,
    AIChatResponse,
    AIHintRequest,
    AIHintResponse,
    TTSRequest,
    TTSScenarioRequest,
    YuBuScenariosResponse,
)
from app.application.services.chapter_service import ChapterService
from app.domain.entities.user import User
from app.infrastructure.ai.ai_service import AIService
from app.infrastructure.ai.tts_service import YuBuVoice

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="AI Sohbet",
    description="Kişiselleştirilmiş AI sohbet. Öğrenme güçlüğüne ve bölüm bağlamına göre yanıt verir.",
)
async def ai_chat(
    request: AIChatRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: AIService = Depends(get_ai_service),
    chapter_service: ChapterService = Depends(get_chapter_service),
):
    """Send a message to AI and get a personalized response."""
    try:
        # If chapter_id provided, fetch chapter for context
        chapter_context = None
        if request.chapter_id:
            chapter = await chapter_service.get_chapter(request.chapter_id)
            if chapter:
                chapter_context = {
                    "title": chapter.title,
                    "activity_type": chapter.activity_type.value if hasattr(chapter.activity_type, 'value') else str(chapter.activity_type),
                    "chapter_number": chapter.chapter_number,
                    "difficulty_type": chapter.difficulty_type.value if hasattr(chapter.difficulty_type, 'value') else str(chapter.difficulty_type),
                    "description": chapter.description or "",
                }

        conversation = await ai_service.chat(
            user_id=current_user.id,
            message=request.message,
            role_context=request.role_context,
            chapter_context=chapter_context,
        )
        return AIChatResponse(
            id=conversation.id,
            message=conversation.message,
            response=conversation.response,
            role_context=conversation.role_context,
            tokens_used=conversation.tokens_used,
            timestamp=conversation.timestamp,
        )
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI yanıt oluşturulurken bir hata oluştu",
        )


@router.post(
    "/hint/{chapter_id}",
    response_model=AIHintResponse,
    summary="Bölüm İpucu",
    description="Belirli bir bölüm için AI destekli ipucu üretir.",
)
async def get_hint(
    chapter_id: UUID,
    request: AIHintRequest = None,
    current_user: User = Depends(get_current_active_user),
    ai_service: AIService = Depends(get_ai_service),
    chapter_service: ChapterService = Depends(get_chapter_service),
):
    """Get an AI-generated hint for a specific chapter."""
    # Get chapter details
    chapter = await chapter_service.get_chapter(chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bölüm bulunamadı",
        )

    hint_level = request.difficulty_level if request else 1

    try:
        result = await ai_service.get_hint(
            user_id=current_user.id,
            chapter_id=chapter_id,
            chapter_title=chapter.title,
            activity_type=chapter.activity_type.value,
            hint_level=hint_level,
        )
        return AIHintResponse(
            chapter_id=chapter_id,
            hint=result["hint"],
            hint_level=result["hint_level"],
            encouragement=result["encouragement"],
        )
    except Exception as e:
        logger.error(f"AI hint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="İpucu oluşturulurken bir hata oluştu",
        )


@router.get(
    "/analysis/{student_id}",
    response_model=AIAnalysisResponse,
    summary="AI Performans Analizi",
    description="Öğrencinin performansını AI ile analiz eder.",
)
async def get_analysis(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    ai_service: AIService = Depends(get_ai_service),
):
    """Get AI-powered performance analysis for a student."""
    try:
        result = await ai_service.analyze_student(student_id)
        return AIAnalysisResponse(
            student_id=student_id,
            learning_difficulty=result["learning_difficulty"],
            analysis=result.get("analysis", ""),
            strengths=result.get("strengths", []),
            areas_for_improvement=result.get("areas_for_improvement", []),
            recommendations=result.get("recommendations", []),
            encouragement_message=result.get("encouragement_message", ""),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analiz oluşturulurken bir hata oluştu",
        )


# ═══════════════════════════════════════════════════════════════
# YuBu TTS (Text-to-Speech) Endpoints
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/tts/speak",
    summary="YuBu Sesli Konuşma",
    description="Metni YuBu sesiyle seslendirme. Emosyon desteği ile MP3 döner.",
    responses={200: {"content": {"audio/mpeg": {}}}},
)
async def tts_speak(
    request: TTSRequest,
    current_user: User = Depends(get_current_active_user),
    tts_service: YuBuVoice = Depends(get_tts_service),
):
    """Convert text to YuBu voice (MP3 audio)."""
    try:
        audio_bytes = await tts_service.speak(
            text=request.text,
            emotion=request.emotion,
            speed=request.speed,
        )
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=yubu_speech.mp3",
                "Cache-Control": "public, max-age=3600",
            },
        )
    except Exception as e:
        logger.error(f"TTS speak error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ses oluşturulurken bir hata oluştu",
        )


@router.post(
    "/tts/scenario",
    summary="YuBu Senaryo Sesi",
    description="Önceden tanımlı YuBu senaryolarını seslendirme.",
    responses={200: {"content": {"audio/mpeg": {}}}},
)
async def tts_scenario(
    request: TTSScenarioRequest,
    current_user: User = Depends(get_current_active_user),
    tts_service: YuBuVoice = Depends(get_tts_service),
):
    """Play a predefined YuBu scenario voice (MP3 audio)."""
    try:
        audio_bytes = await tts_service.speak_scenario(request.scenario)
        if audio_bytes is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Senaryo bulunamadı: {request.scenario}",
            )
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=yubu_{request.scenario}.mp3",
                "Cache-Control": "public, max-age=86400",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS scenario error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Senaryo sesi oluşturulurken bir hata oluştu",
        )


@router.get(
    "/tts/scenarios",
    response_model=YuBuScenariosResponse,
    summary="YuBu Senaryoları",
    description="Mevcut tüm YuBu ses senaryolarının listesi.",
)
async def list_tts_scenarios():
    """List all available YuBu TTS scenarios."""
    from app.infrastructure.ai.yubu_prompts import YUBU_SCENARIOS

    scenarios = {
        key: {
            "text": val["text"],
            "emotion": val["emotion"],
            "description": val.get("description", ""),
        }
        for key, val in YUBU_SCENARIOS.items()
    }
    return YuBuScenariosResponse(scenarios=scenarios)
