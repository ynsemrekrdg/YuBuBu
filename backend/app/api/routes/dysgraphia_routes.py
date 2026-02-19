"""
Dysgraphia-specific API routes.
POST /api/dysgraphia/sentence/check
POST /api/dysgraphia/spelling/help
POST /api/dysgraphia/ai/story-ideas
POST /api/dysgraphia/composition/feedback
POST /api/dysgraphia/ai/writing-coach
"""

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.api.dependencies import (
    get_current_active_user,
)
from app.application.dtos.dysgraphia_dtos import (
    CompositionFeedbackRequest,
    CompositionFeedbackResponse,
    CompositionImprovement,
    CompositionScores,
    SentenceCheckRequest,
    SentenceCheckResponse,
    SentenceError,
    SpellingHelpRequest,
    SpellingHelpResponse,
    StoryIdea,
    StoryIdeasRequest,
    StoryIdeasResponse,
    WritingCoachRequest,
    WritingCoachResponse,
)
from app.domain.entities.user import User
from app.infrastructure.ai.dysgraphia_service import DysgraphiaAIService
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
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

router = APIRouter(prefix="/api/dysgraphia", tags=["Dysgraphia"])


def get_dysgraphia_ai_service(session: AsyncSession = Depends(get_db)):
    """Inject DysgraphiaAIService."""
    conversation_repo = SQLAlchemyAIConversationRepository(session)
    profile_repo = SQLAlchemyStudentProfileRepository(session)
    progress_repo = SQLAlchemyProgressRepository(session)
    return DysgraphiaAIService(conversation_repo, profile_repo, progress_repo, redis_cache)


@router.post(
    "/sentence/check",
    response_model=SentenceCheckResponse,
    summary="Cümle Kontrolü",
    description="Disgrafi öğrencisinin cümlesini kontrol eder. İçerik öncelikli geri bildirim.",
)
async def check_sentence(
    request: SentenceCheckRequest,
    current_user: User = Depends(get_current_active_user),
    service: DysgraphiaAIService = Depends(get_dysgraphia_ai_service),
):
    """Check a sentence with dysgraphia-sensitive feedback."""
    try:
        result = await service.check_sentence(
            user_id=current_user.id,
            sentence=request.sentence,
            focus_area=request.focus_area,
        )
        # Map to response DTO
        errors = [
            SentenceError(**e) if isinstance(e, dict) else SentenceError()
            for e in result.get("errors", [])
        ]
        return SentenceCheckResponse(
            praise=result.get("praise", ""),
            errors=errors,
            corrected_sentence=result.get("corrected_sentence", request.sentence),
            tip=result.get("tip", ""),
        )
    except Exception as e:
        logger.error(f"Sentence check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cümle kontrolü sırasında hata oluştu",
        )


@router.post(
    "/spelling/help",
    response_model=SpellingHelpResponse,
    summary="Yazım Yardımı",
    description="Kelime yazımında ipucu verir (cevabı doğrudan vermez).",
)
async def spelling_help(
    request: SpellingHelpRequest,
    current_user: User = Depends(get_current_active_user),
    service: DysgraphiaAIService = Depends(get_dysgraphia_ai_service),
):
    """Get spelling help for a word."""
    try:
        result = await service.spelling_help(
            user_id=current_user.id,
            word=request.word,
            context=request.context,
        )
        return SpellingHelpResponse(
            syllables=result.get("syllables", ""),
            sounds=result.get("sounds", ""),
            strategy=result.get("strategy", ""),
            hint=result.get("hint", ""),
            rule=result.get("rule", ""),
            similar_words=result.get("similar_words", []),
            encouragement=result.get("encouragement", ""),
        )
    except Exception as e:
        logger.error(f"Spelling help error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Yazım yardımı sırasında hata oluştu",
        )


@router.post(
    "/ai/story-ideas",
    response_model=StoryIdeasResponse,
    summary="Hikaye Fikirleri",
    description="Yazma planlaması için AI destekli hikaye fikirleri üretir.",
)
async def generate_story_ideas(
    request: StoryIdeasRequest,
    current_user: User = Depends(get_current_active_user),
    service: DysgraphiaAIService = Depends(get_dysgraphia_ai_service),
):
    """Generate story ideas for writing planning."""
    try:
        ideas_list = await service.generate_story_ideas(
            user_id=current_user.id,
            topic=request.topic,
            student_age=request.student_age,
        )
        ideas = [
            StoryIdea(**idea) if isinstance(idea, dict) else StoryIdea()
            for idea in ideas_list
        ]
        return StoryIdeasResponse(ideas=ideas)
    except Exception as e:
        logger.error(f"Story ideas error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hikaye fikirleri oluşturulurken hata oluştu",
        )


@router.post(
    "/composition/feedback",
    response_model=CompositionFeedbackResponse,
    summary="Kompozisyon Değerlendirme",
    description="Yazma çalışmasını rubrik ile değerlendirir. Fikir/organizasyon ağırlıklı.",
)
async def composition_feedback(
    request: CompositionFeedbackRequest,
    current_user: User = Depends(get_current_active_user),
    service: DysgraphiaAIService = Depends(get_dysgraphia_ai_service),
):
    """Get composition feedback with rubric assessment."""
    try:
        result = await service.composition_feedback(
            user_id=current_user.id,
            text=request.text,
            task_type=request.task_type,
        )
        scores_data = result.get("scores", {})
        improvements_data = result.get("improvements", [])

        scores = CompositionScores(
            ideas=scores_data.get("ideas", 0),
            organization=scores_data.get("organization", 0),
            sentence_structure=scores_data.get("sentence_structure", 0),
            mechanics=scores_data.get("mechanics", 0),
            total=scores_data.get("total", 0),
        )
        improvements = [
            CompositionImprovement(**imp) if isinstance(imp, dict) else CompositionImprovement()
            for imp in improvements_data
        ]
        return CompositionFeedbackResponse(
            scores=scores,
            praise=result.get("praise", ""),
            strengths=result.get("strengths", []),
            improvements=improvements,
            next_step=result.get("next_step", ""),
            encouragement=result.get("encouragement", ""),
            word_count=result.get("word_count", len(request.text.split())),
        )
    except Exception as e:
        logger.error(f"Composition feedback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kompozisyon değerlendirmesi sırasında hata oluştu",
        )


@router.post(
    "/ai/writing-coach",
    response_model=WritingCoachResponse,
    summary="Yazma Koçu",
    description="Anlık yazma desteği sağlar. Planlama, taslak, düzeltme aşamalarında yardım.",
)
async def writing_coach(
    request: WritingCoachRequest,
    current_user: User = Depends(get_current_active_user),
    service: DysgraphiaAIService = Depends(get_dysgraphia_ai_service),
):
    """Get real-time writing coach support."""
    try:
        result = await service.writing_coach(
            user_id=current_user.id,
            message=request.message,
            writing_task=request.writing_task,
        )
        return WritingCoachResponse(
            response=result.get("response", ""),
            tokens_used=result.get("tokens_used", 0),
        )
    except Exception as e:
        logger.error(f"Writing coach error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Yazma koçu yanıt oluştururken hata oluştu",
        )
