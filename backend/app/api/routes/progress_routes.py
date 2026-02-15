"""
Progress API routes.
POST /api/progress/complete
GET /api/progress/student/{student_id}
GET /api/progress/analytics/{student_id}
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import (
    get_current_active_user,
    get_gamification_service,
    get_progress_service,
)
from app.application.dtos.progress_dtos import (
    AnalyticsResponse,
    CompletionResult,
    CompleteChapterRequest,
    ProgressListResponse,
    ProgressResponse,
)
from app.application.services.gamification_service import GamificationService
from app.application.services.progress_service import ProgressService
from app.domain.entities.user import User

router = APIRouter(prefix="/api/progress", tags=["Progress"])


@router.post(
    "/complete",
    response_model=CompletionResult,
    status_code=status.HTTP_201_CREATED,
    summary="Bölüm tamamlama",
    description="Bir bölümün tamamlanmasını kaydeder ve puan hesaplar.",
)
async def complete_chapter(
    request: CompleteChapterRequest,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service),
    gamification_service: GamificationService = Depends(get_gamification_service),
):
    """Record chapter completion and calculate rewards."""
    try:
        result = await progress_service.complete_chapter(
            student_id=request.student_id,
            chapter_id=request.chapter_id,
            score=request.score,
            time_spent_seconds=request.time_spent_seconds,
        )

        # Check for new badges
        new_badges = await gamification_service.check_and_award_badges(
            student_id=request.student_id,
            score=request.score,
            attempts=result["attempts"],
            time_spent=request.time_spent_seconds,
            expected_time=900,  # 15 min default
            streak_days=result["streak_days"],
        )

        return CompletionResult(
            progress=ProgressResponse(
                id=result["progress_id"],
                student_id=request.student_id,
                chapter_id=request.chapter_id,
                completed=result["completed"],
                score=result["score"],
                attempts=result["attempts"],
                time_spent_seconds=request.time_spent_seconds,
                completed_at=None,
                created_at=None,
                updated_at=None,
            ),
            score_earned=result["score_earned"],
            speed_bonus=result["speed_bonus"],
            total_points=result["total_points"],
            new_badges=[
                {
                    "type": b.badge_type.value,
                    "title": b.title,
                    "description": b.description,
                    "icon": b.icon,
                }
                for b in new_badges
            ],
            level_up=result.get("is_new_completion", False),
            new_level=result["current_level"],
            streak_days=result["streak_days"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error completing chapter: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bölüm tamamlama sırasında bir hata oluştu",
        )


@router.get(
    "/student/{student_id}",
    response_model=ProgressListResponse,
    summary="Öğrenci ilerleme kayıtları",
    description="Bir öğrencinin tüm ilerleme kayıtlarını döner.",
)
async def get_student_progress(
    student_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service),
):
    """Get all progress records for a student."""
    records = await progress_service.get_student_progress(student_id, skip, limit)
    return ProgressListResponse(
        progress=[
            ProgressResponse(
                id=r.id,
                student_id=r.student_id,
                chapter_id=r.chapter_id,
                completed=r.completed,
                score=r.score,
                attempts=r.attempts,
                time_spent_seconds=r.time_spent_seconds,
                completed_at=r.completed_at,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in records
        ],
        total=len(records),
    )


@router.get(
    "/analytics/{student_id}",
    response_model=AnalyticsResponse,
    summary="Öğrenci analitikleri",
    description="Bir öğrencinin detaylı performans analitiklerini döner.",
)
async def get_analytics(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service),
    gamification_service: GamificationService = Depends(get_gamification_service),
):
    """Get comprehensive analytics for a student."""
    try:
        analytics = await progress_service.get_analytics(student_id)
        badges = await gamification_service.get_student_badges(student_id)

        return AnalyticsResponse(
            student_id=student_id,
            total_chapters_attempted=analytics.get("total_chapters_attempted", 0),
            total_chapters_completed=analytics.get("total_chapters_completed", 0),
            completion_rate=analytics.get("completion_rate", 0),
            average_score=analytics.get("average_score", 0),
            best_score=analytics.get("best_score", 0),
            total_time_spent_seconds=analytics.get("total_time_spent_seconds", 0),
            total_time_spent_minutes=analytics.get("total_time_spent_minutes", 0),
            total_attempts=analytics.get("total_attempts", 0),
            score_earned=analytics.get("total_score", 0),
            badges_earned=badges,
            level=analytics.get("level", 1),
            streak_days=analytics.get("streak_days", 0),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
