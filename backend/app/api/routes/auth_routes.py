"""
Authentication API routes.
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
"""

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.api.dependencies import get_auth_service, get_current_active_user, get_student_service
from app.application.dtos.auth_dtos import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.application.dtos.student_dtos import CreateStudentProfileRequest
from app.application.services.auth_service import AuthService
from app.application.services.student_service import StudentService
from app.config import settings
from app.domain.entities.enums import UserRole
from app.domain.entities.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni kullanıcı kaydı",
    description="Yeni bir kullanıcı oluşturur ve JWT token döner.",
)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
    student_service: StudentService = Depends(get_student_service),
):
    """Register a new user and optionally create a student profile."""
    try:
        user = await auth_service.register(
            email=request.email,
            name=request.name,
            password=request.password,
            role=request.role,
        )

        # Generate token
        token = auth_service.create_access_token(user.id, user.role)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user.id,
            role=user.role,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kayıt sırasında bir hata oluştu",
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Kullanıcı girişi",
    description="E-posta ve şifre ile giriş yapar ve JWT token döner.",
)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate user and return JWT token."""
    user = await auth_service.authenticate(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_service.create_access_token(user.id, user.role)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user.id,
        role=user.role,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Mevcut kullanıcı bilgileri",
    description="JWT token ile kimliği doğrulanmış kullanıcının bilgilerini döner.",
)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user information."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        is_active=current_user.is_active,
    )
