"""
Chapter API routes.
GET /api/chapters (filter by difficulty_type)
GET /api/chapters/{id}
POST /api/chapters (admin)
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import (
    get_chapter_service,
    get_current_active_user,
    require_admin,
)
from app.application.dtos.chapter_dtos import (
    ChapterListResponse,
    ChapterResponse,
    CreateChapterRequest,
)
from app.application.services.chapter_service import ChapterService
from app.domain.entities.enums import LearningDifficulty
from app.domain.entities.user import User

router = APIRouter(prefix="/api/chapters", tags=["Chapters"])


@router.get(
    "",
    response_model=ChapterListResponse,
    summary="Bölümleri listele",
    description="Bölümleri listeler. difficulty_type ile filtrelenebilir.",
)
async def list_chapters(
    difficulty_type: Optional[LearningDifficulty] = Query(
        None, description="Öğrenme güçlüğü tipine göre filtrele"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    chapter_service: ChapterService = Depends(get_chapter_service),
):
    """List chapters with optional filtering by difficulty type."""
    chapters = await chapter_service.list_chapters(difficulty_type, skip, limit)
    return ChapterListResponse(
        chapters=[
            ChapterResponse(
                id=c.id,
                difficulty_type=c.difficulty_type,
                chapter_number=c.chapter_number,
                title=c.title,
                description=c.description,
                content_config=c.content_config,
                activity_type=c.activity_type,
                difficulty_level=c.difficulty_level,
                expected_duration_minutes=c.expected_duration_minutes,
                min_score_to_pass=c.min_score_to_pass,
                is_active=c.is_active,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in chapters
        ],
        total=len(chapters),
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{chapter_id}",
    response_model=ChapterResponse,
    summary="Bölüm detayı",
    description="Belirtilen ID'ye sahip bölümün detaylarını döner.",
)
async def get_chapter(
    chapter_id: UUID,
    current_user: User = Depends(get_current_active_user),
    chapter_service: ChapterService = Depends(get_chapter_service),
):
    """Get a specific chapter by ID."""
    chapter = await chapter_service.get_chapter(chapter_id)
    if not chapter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bölüm bulunamadı",
        )
    return ChapterResponse(
        id=chapter.id,
        difficulty_type=chapter.difficulty_type,
        chapter_number=chapter.chapter_number,
        title=chapter.title,
        description=chapter.description,
        content_config=chapter.content_config,
        activity_type=chapter.activity_type,
        difficulty_level=chapter.difficulty_level,
        expected_duration_minutes=chapter.expected_duration_minutes,
        min_score_to_pass=chapter.min_score_to_pass,
        is_active=chapter.is_active,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
    )


@router.post(
    "",
    response_model=ChapterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni bölüm oluştur (Admin)",
    description="Yeni bir bölüm oluşturur. Yalnızca admin kullanabilir.",
)
async def create_chapter(
    request: CreateChapterRequest,
    current_user: User = Depends(require_admin),
    chapter_service: ChapterService = Depends(get_chapter_service),
):
    """Create a new chapter (admin only)."""
    try:
        chapter = await chapter_service.create_chapter(
            difficulty_type=request.difficulty_type,
            chapter_number=request.chapter_number,
            title=request.title,
            description=request.description,
            content_config=request.content_config,
            activity_type=request.activity_type,
            difficulty_level=request.difficulty_level,
            expected_duration_minutes=request.expected_duration_minutes,
            min_score_to_pass=request.min_score_to_pass,
        )
        return ChapterResponse(
            id=chapter.id,
            difficulty_type=chapter.difficulty_type,
            chapter_number=chapter.chapter_number,
            title=chapter.title,
            description=chapter.description,
            content_config=chapter.content_config,
            activity_type=chapter.activity_type,
            difficulty_level=chapter.difficulty_level,
            expected_duration_minutes=chapter.expected_duration_minutes,
            min_score_to_pass=chapter.min_score_to_pass,
            is_active=chapter.is_active,
            created_at=chapter.created_at,
            updated_at=chapter.updated_at,
        )
    except Exception as e:
        logger.error(f"Error creating chapter: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
