"""
Pydantic DTOs for authentication operations.
Parent-focused registration system.
"""

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.domain.entities.enums import LearningDifficulty, UserRole


# ─── Request DTOs ────────────────────────────────────────────

class ParentRegisterRequest(BaseModel):
    """Request body for parent registration."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    phone: Optional[str] = None

    model_config = {"json_schema_extra": {
        "example": {
            "email": "veli@example.com",
            "name": "Ayşe Yılmaz",
            "password": "sifre123",
            "phone": "05551234567"
        }
    }}


class StudentRegisterRequest(BaseModel):
    """Request body for student registration by parent."""
    name: str = Field(..., min_length=2, max_length=255)
    age: int = Field(..., ge=3, le=18)
    grade: Optional[int] = Field(None, ge=1, le=12)
    learning_difficulty: LearningDifficulty
    school_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None

    model_config = {"json_schema_extra": {
        "example": {
            "name": "Ali Yılmaz",
            "age": 8,
            "grade": 2,
            "learning_difficulty": "dyslexia",
            "school_id": None,
            "teacher_id": None
        }
    }}


class LoginRequest(BaseModel):
    """Request body for login. Accepts username OR email."""
    identifier: str = Field(..., min_length=1, description="Kullanıcı adı veya e-posta")
    password: str = Field(..., min_length=1)

    model_config = {"json_schema_extra": {
        "example": {
            "identifier": "ali_yilmaz_1234",
            "password": "ali1234"
        }
    }}


# Legacy support - keep old RegisterRequest for backward compatibility
class RegisterRequest(BaseModel):
    """Legacy request body for user registration."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.STUDENT
    learning_difficulty: Optional[str] = None
    age: Optional[int] = Field(None, ge=3, le=18)


# ─── Response DTOs ───────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: UUID
    role: UserRole


class UserResponse(BaseModel):
    """Public user information response."""
    id: UUID
    email: Optional[str] = None
    username: Optional[str] = None
    name: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


class StudentLoginInfoResponse(BaseModel):
    """Response with auto-generated student credentials."""
    student_name: str
    username: str
    password: str
    message: str = "Bu bilgileri saklayın! Öğrenci bu bilgilerle giriş yapacak."


class ParentRegisterResponse(BaseModel):
    """Response after parent registration."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: UUID
    role: UserRole
    name: str


class StudentRegisterResponse(BaseModel):
    """Response after student registration by parent."""
    student_id: UUID
    student_name: str
    username: str
    plain_password: str
    learning_difficulty: LearningDifficulty
    message: str = "Öğrenci başarıyla oluşturuldu! Giriş bilgilerini not edin."


class SchoolResponse(BaseModel):
    """School information response."""
    id: UUID
    name: str
    city: str
    district: str

    model_config = {"from_attributes": True}


class TeacherResponse(BaseModel):
    """Teacher information response."""
    id: UUID
    name: str
    branch: str

    model_config = {"from_attributes": True}


class ChildrenListResponse(BaseModel):
    """List of children for a parent."""
    children: List["ChildInfo"]

class ChildInfo(BaseModel):
    """Child information for parent dashboard."""
    id: UUID
    user_id: UUID
    name: str
    username: Optional[str] = None
    age: int
    grade: Optional[int] = None
    learning_difficulty: LearningDifficulty
    current_level: int
    total_score: int
    streak_days: int


class TeacherStudentsListResponse(BaseModel):
    """List of students for a teacher."""
    students: List[ChildInfo]
