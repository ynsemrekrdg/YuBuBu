"""
Pydantic DTOs for authentication operations.
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.domain.entities.enums import UserRole


# ─── Request DTOs ────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Request body for user registration."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.STUDENT

    model_config = {"json_schema_extra": {
        "example": {
            "email": "student@example.com",
            "name": "Ali Yılmaz",
            "password": "güçlüşifre123",
            "role": "student"
        }
    }}


class LoginRequest(BaseModel):
    """Request body for login."""
    email: EmailStr
    password: str = Field(..., min_length=1)

    model_config = {"json_schema_extra": {
        "example": {
            "email": "student@example.com",
            "password": "güçlüşifre123"
        }
    }}


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
    email: str
    name: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}
