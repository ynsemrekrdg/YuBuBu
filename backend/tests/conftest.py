"""
Shared pytest fixtures for YuBuBu backend tests.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.domain.entities.enums import (
    ActivityType,
    BadgeType,
    LearningDifficulty,
    UserRole,
)
from app.domain.entities.user import User
from app.domain.entities.student_profile import StudentProfile
from app.domain.entities.chapter import Chapter
from app.domain.entities.progress import Progress
from app.domain.entities.badge import Badge


# ─── Sample IDs ──────────────────────────────────────────────

ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
TEACHER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
PARENT_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")
STUDENT_ID = uuid.UUID("00000000-0000-0000-0000-000000000004")
PROFILE_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
CHAPTER_ID = uuid.UUID("00000000-0000-0000-0000-000000000020")
PROGRESS_ID = uuid.UUID("00000000-0000-0000-0000-000000000030")


# ─── User Fixtures ───────────────────────────────────────────

@pytest.fixture
def admin_user() -> User:
    return User(
        id=ADMIN_ID,
        email="admin@test.com",
        name="Test Admin",
        hashed_password="hashed_pw",
        role=UserRole.ADMIN,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def teacher_user() -> User:
    return User(
        id=TEACHER_ID,
        email="teacher@test.com",
        name="Test Teacher",
        hashed_password="hashed_pw",
        role=UserRole.TEACHER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def student_user() -> User:
    return User(
        id=STUDENT_ID,
        email="student@test.com",
        name="Test Student",
        hashed_password="hashed_pw",
        role=UserRole.STUDENT,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ─── Profile Fixtures ───────────────────────────────────────

@pytest.fixture
def student_profile() -> StudentProfile:
    return StudentProfile(
        id=PROFILE_ID,
        user_id=STUDENT_ID,
        age=8,
        learning_difficulty=LearningDifficulty.DYSLEXIA,
        current_level=1,
        total_score=0,
        preferences={"font_family": "OpenDyslexic", "font_size": 20},
        streak_days=0,
        last_activity_date=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ─── Chapter Fixtures ───────────────────────────────────────

@pytest.fixture
def sample_chapter() -> Chapter:
    return Chapter(
        id=CHAPTER_ID,
        difficulty_type=LearningDifficulty.DYSLEXIA,
        chapter_number=1,
        title="Harfleri Tanıyalım",
        description="Test chapter",
        content_config={"activity": {"type": "letter_matching"}},
        activity_type=ActivityType.LETTER_MATCHING,
        difficulty_level=1,
        expected_duration_minutes=10,
        min_score_to_pass=60,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )


# ─── Progress Fixtures ──────────────────────────────────────

@pytest.fixture
def sample_progress() -> Progress:
    return Progress(
        id=PROGRESS_ID,
        student_id=PROFILE_ID,
        chapter_id=CHAPTER_ID,
        is_completed=False,
        score=None,
        attempts=0,
        time_spent_seconds=0,
        started_at=datetime.now(timezone.utc),
        completed_at=None,
        updated_at=datetime.now(timezone.utc),
    )


# ─── Mock Repository Fixtures ───────────────────────────────

@pytest.fixture
def mock_user_repo():
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_profile_repo():
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_chapter_repo():
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_progress_repo():
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_badge_repo():
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_ai_repo():
    repo = AsyncMock()
    return repo
