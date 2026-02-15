"""
Student API routes.
GET /api/students/{id}
GET /api/students/by-user/{user_id}
PUT /api/students/{id}
GET /api/students/{id}/progress
POST /api/students/profile (create student profile)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.api.dependencies import get_current_active_user, get_student_service
from app.application.dtos.student_dtos import (
    CreateStudentProfileRequest,
    StudentProfileResponse,
    StudentProgressSummary,
    UpdateStudentProfileRequest,
)
from app.application.services.student_service import StudentService
from app.domain.entities.user import User

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.post(
    "/profile",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Öğrenci profili oluştur",
    description="Mevcut kullanıcı için öğrenci profili oluşturur.",
)
async def create_student_profile(
    request: CreateStudentProfileRequest,
    current_user: User = Depends(get_current_active_user),
    student_service: StudentService = Depends(get_student_service),
):
    """Create a student profile for the current user."""
    try:
        profile = await student_service.create_profile(
            user_id=current_user.id,
            age=request.age,
            learning_difficulty=request.learning_difficulty,
            preferences=request.preferences,
        )
        return StudentProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            age=profile.age,
            learning_difficulty=profile.learning_difficulty,
            current_level=profile.current_level,
            total_score=profile.total_score,
            preferences=profile.preferences,
            streak_days=profile.streak_days,
            last_activity_date=profile.last_activity_date,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/by-user/{user_id}",
    response_model=StudentProfileResponse,
    summary="Kullanıcı ID ile öğrenci profili getir",
    description="Belirtilen kullanıcı ID'sine ait öğrenci profilini döner.",
)
async def get_student_by_user_id(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    student_service: StudentService = Depends(get_student_service),
):
    """Get a student profile by user ID."""
    profile = await student_service.get_profile_by_user_id(user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Öğrenci profili bulunamadı",
        )
    return StudentProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        age=profile.age,
        learning_difficulty=profile.learning_difficulty,
        current_level=profile.current_level,
        total_score=profile.total_score,
        preferences=profile.preferences,
        streak_days=profile.streak_days,
        last_activity_date=profile.last_activity_date,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get(
    "/{student_id}",
    response_model=StudentProfileResponse,
    summary="Öğrenci profili getir",
    description="Belirtilen ID'ye sahip öğrenci profilini döner.",
)
async def get_student(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    student_service: StudentService = Depends(get_student_service),
):
    """Get a student profile by ID."""
    profile = await student_service.get_profile(student_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Öğrenci profili bulunamadı",
        )
    return StudentProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        age=profile.age,
        learning_difficulty=profile.learning_difficulty,
        current_level=profile.current_level,
        total_score=profile.total_score,
        preferences=profile.preferences,
        streak_days=profile.streak_days,
        last_activity_date=profile.last_activity_date,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.put(
    "/{student_id}",
    response_model=StudentProfileResponse,
    summary="Öğrenci profili güncelle",
    description="Öğrenci profilini günceller.",
)
async def update_student(
    student_id: UUID,
    request: UpdateStudentProfileRequest,
    current_user: User = Depends(get_current_active_user),
    student_service: StudentService = Depends(get_student_service),
):
    """Update a student profile."""
    try:
        profile = await student_service.update_profile(
            profile_id=student_id,
            age=request.age,
            learning_difficulty=request.learning_difficulty,
            preferences=request.preferences,
        )
        return StudentProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            age=profile.age,
            learning_difficulty=profile.learning_difficulty,
            current_level=profile.current_level,
            total_score=profile.total_score,
            preferences=profile.preferences,
            streak_days=profile.streak_days,
            last_activity_date=profile.last_activity_date,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{student_id}/progress",
    response_model=StudentProgressSummary,
    summary="Öğrenci ilerleme özeti",
    description="Öğrencinin tüm ilerleme istatistiklerini döner.",
)
async def get_student_progress(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    student_service: StudentService = Depends(get_student_service),
):
    """Get comprehensive progress summary for a student."""
    try:
        summary = await student_service.get_progress_summary(student_id)
        return StudentProgressSummary(**summary)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
