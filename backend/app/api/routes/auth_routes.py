"""
Authentication API routes.
POST /api/auth/register/parent    - Parent registration
POST /api/auth/register/student   - Student registration (by parent)
POST /api/auth/register           - Legacy registration
POST /api/auth/login              - Login (username or email)
GET  /api/auth/me                 - Current user info
GET  /api/auth/my-children        - Parent's children list
GET  /api/auth/my-students        - Teacher's students list
GET  /api/auth/schools            - Schools list
GET  /api/auth/schools/{id}/teachers - Teachers by school
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger

from app.api.dependencies import (
    get_auth_service,
    get_current_active_user,
    get_school_repo,
    get_student_service,
    get_teacher_repo,
    get_student_profile_repo,
)
from app.application.dtos.auth_dtos import (
    ChildInfo,
    ChildrenListResponse,
    LoginRequest,
    ParentRegisterRequest,
    ParentRegisterResponse,
    RegisterRequest,
    SchoolResponse,
    StudentRegisterRequest,
    StudentRegisterResponse,
    TeacherResponse,
    TeacherStudentsListResponse,
    TokenResponse,
    UserResponse,
)
from app.application.services.auth_service import AuthService
from app.application.services.student_service import StudentService
from app.config import settings
from app.domain.entities.enums import UserRole
from app.domain.entities.user import User
from app.domain.repositories.school_repository import SchoolRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository
from app.domain.repositories.teacher_repository import TeacherRepository

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ─── Parent Registration ────────────────────────────────────

@router.post(
    "/register/parent",
    response_model=ParentRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Veli kaydı",
    description="Yeni bir veli hesabı oluşturur ve JWT token döner.",
)
async def register_parent(
    request: ParentRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new parent account."""
    try:
        user = await auth_service.register_parent(
            email=request.email,
            name=request.name,
            password=request.password,
            phone=request.phone,
        )
        token = auth_service.create_access_token(user.id, user.role)
        return ParentRegisterResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user.id,
            role=user.role,
            name=user.name,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Parent registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kayıt sırasında bir hata oluştu",
        )


# ─── Student Registration (by Parent) ───────────────────────

@router.post(
    "/register/student",
    response_model=StudentRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Öğrenci kaydı (veli tarafından)",
    description="Veli, çocuğu için öğrenci hesabı oluşturur. Kullanıcı adı ve şifre otomatik oluşturulur.",
)
async def register_student(
    request: StudentRegisterRequest,
    current_user: User = Depends(get_current_active_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a student as a child of the current parent."""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece veliler öğrenci hesabı oluşturabilir",
        )

    try:
        user, profile, plain_password = await auth_service.register_student(
            parent_id=current_user.id,
            name=request.name,
            age=request.age,
            learning_difficulty=request.learning_difficulty,
            grade=request.grade,
            school_id=request.school_id,
            teacher_id=request.teacher_id,
        )
        return StudentRegisterResponse(
            student_id=profile.id,
            student_name=user.name,
            username=user.username,
            plain_password=plain_password,
            learning_difficulty=profile.learning_difficulty,
            message="Öğrenci başarıyla oluşturuldu! Giriş bilgilerini not edin.",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Student registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Öğrenci kaydı sırasında bir hata oluştu",
        )


# ─── Legacy Registration ────────────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Yeni kullanıcı kaydı (eski)",
    description="Eski kayıt sistemi - geriye uyumluluk için.",
)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
    student_service: StudentService = Depends(get_student_service),
):
    """Legacy register endpoint for backward compatibility."""
    try:
        user = await auth_service.register(
            email=request.email,
            name=request.name,
            password=request.password,
            role=request.role,
        )

        if user.role == "student" and request.learning_difficulty:
            try:
                from app.domain.entities.enums import LearningDifficulty
                difficulty = LearningDifficulty(request.learning_difficulty)
                await student_service.create_profile(
                    user_id=user.id,
                    age=request.age or 7,
                    learning_difficulty=difficulty,
                    preferences={},
                )
            except Exception as profile_err:
                logger.warning(f"Could not create student profile: {profile_err}")

        token = auth_service.create_access_token(user.id, user.role)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user_id=user.id,
            role=user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kayıt sırasında bir hata oluştu",
        )


# ─── Login ───────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Kullanıcı girişi",
    description="Kullanıcı adı veya e-posta + şifre ile giriş yapar.",
)
async def login(
    request: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate user with username or email."""
    user = await auth_service.authenticate(request.identifier, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz kullanıcı adı/e-posta veya şifre",
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


# ─── Current User ───────────────────────────────────────────

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
        username=current_user.username,
        name=current_user.name,
        role=current_user.role,
        is_active=current_user.is_active,
    )


# ─── Parent's Children ──────────────────────────────────────

@router.get(
    "/my-children",
    response_model=ChildrenListResponse,
    summary="Velinin çocukları",
    description="Giriş yapan velinin çocuklarını listeler.",
)
async def get_my_children(
    current_user: User = Depends(get_current_active_user),
    profile_repo: StudentProfileRepository = Depends(get_student_profile_repo),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get children of the current parent."""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece veliler bu bilgiye erişebilir",
        )

    profiles = await profile_repo.get_by_parent_id(current_user.id)
    children = []
    for p in profiles:
        # Get user info for each child
        user = await auth_service._user_repo.get_by_id(p.user_id)
        children.append(ChildInfo(
            id=p.id,
            user_id=p.user_id,
            name=user.name if user else "",
            username=user.username if user else None,
            age=p.age,
            grade=p.grade,
            learning_difficulty=p.learning_difficulty,
            current_level=p.current_level,
            total_score=p.total_score,
            streak_days=p.streak_days,
        ))

    return ChildrenListResponse(children=children)


# ─── Teacher's Students ─────────────────────────────────────

@router.get(
    "/my-students",
    response_model=TeacherStudentsListResponse,
    summary="Öğretmenin öğrencileri",
    description="Giriş yapan öğretmenin kendisine atanmış öğrencilerini listeler.",
)
async def get_my_students(
    current_user: User = Depends(get_current_active_user),
    profile_repo: StudentProfileRepository = Depends(get_student_profile_repo),
    teacher_repo: TeacherRepository = Depends(get_teacher_repo),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get students assigned to the current teacher."""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sadece öğretmenler bu bilgiye erişebilir",
        )

    # Find teacher record by user_id
    teacher = await teacher_repo.get_by_user_id(current_user.id)
    if not teacher:
        return TeacherStudentsListResponse(students=[])

    # Get all student profiles assigned to this teacher
    profiles = await profile_repo.get_by_teacher_id(teacher.id)
    students = []
    for p in profiles:
        user = await auth_service._user_repo.get_by_id(p.user_id)
        students.append(ChildInfo(
            id=p.id,
            user_id=p.user_id,
            name=user.name if user else "",
            username=user.username if user else None,
            age=p.age,
            grade=p.grade,
            learning_difficulty=p.learning_difficulty,
            current_level=p.current_level,
            total_score=p.total_score,
            streak_days=p.streak_days,
        ))

    return TeacherStudentsListResponse(students=students)


# ─── Schools ────────────────────────────────────────────────

@router.get(
    "/schools",
    response_model=List[SchoolResponse],
    summary="Okul listesi",
    description="Tüm aktif okulları listeler.",
)
async def list_schools(
    school_repo: SchoolRepository = Depends(get_school_repo),
):
    """List all active schools."""
    schools = await school_repo.list_all()
    return [
        SchoolResponse(id=s.id, name=s.name, city=s.city, district=s.district)
        for s in schools
    ]


# ─── Teachers by School ─────────────────────────────────────

@router.get(
    "/schools/{school_id}/teachers",
    response_model=List[TeacherResponse],
    summary="Okula göre öğretmen listesi",
    description="Belirtilen okuldaki öğretmenleri listeler.",
)
async def list_teachers_by_school(
    school_id: UUID,
    teacher_repo: TeacherRepository = Depends(get_teacher_repo),
):
    """List teachers for a specific school."""
    from app.infrastructure.database.session import async_session_factory
    from app.infrastructure.database.models import TeacherModel, UserModel
    from sqlalchemy import select as sa_select
    from sqlalchemy.orm import selectinload

    teachers = await teacher_repo.list_by_school(school_id)

    # We need user names for the response, so query with join
    # Use teacher_repo's session (it's a SQLAlchemy impl)
    if hasattr(teacher_repo, '_session'):
        session = teacher_repo._session
        stmt = (
            sa_select(TeacherModel, UserModel.name)
            .join(UserModel, TeacherModel.user_id == UserModel.id)
            .where(TeacherModel.school_id == school_id)
            .order_by(UserModel.name)
        )
        result = await session.execute(stmt)
        rows = result.all()
        return [
            TeacherResponse(id=t.id, name=name, branch=t.branch)
            for t, name in rows
        ]

    # Fallback
    return [
        TeacherResponse(id=t.id, name="", branch=t.branch)
        for t in teachers
    ]
