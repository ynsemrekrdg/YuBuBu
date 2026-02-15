"""Tests for application services (unit tests with mocked repositories)."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

from app.domain.entities.enums import (
    LearningDifficulty,
    UserRole,
    BadgeType,
)
from app.domain.entities.user import User
from app.domain.entities.student_profile import StudentProfile
from app.domain.entities.chapter import Chapter
from app.domain.entities.progress import Progress
from app.domain.entities.badge import Badge
from app.application.services.auth_service import AuthService
from app.application.services.student_service import StudentService
from app.application.services.chapter_service import ChapterService
from app.application.services.progress_service import ProgressService
from app.application.services.gamification_service import GamificationService


# ═══════════════════════════════════════════════════════════════
# AUTH SERVICE
# ═══════════════════════════════════════════════════════════════

class TestAuthService:
    def test_hash_password(self):
        password = "test_password_123"
        hashed = AuthService.hash_password(password)
        assert hashed != password
        assert AuthService.verify_password(password, hashed) is True

    def test_verify_password_wrong(self):
        hashed = AuthService.hash_password("correct_password")
        assert AuthService.verify_password("wrong_password", hashed) is False

    def test_create_and_decode_token(self):
        user_id = uuid.uuid4()
        token = AuthService.create_access_token(
            user_id=user_id,
            email="test@test.com",
            role=UserRole.STUDENT,
        )
        assert token is not None
        assert isinstance(token, str)

    @pytest.mark.asyncio
    async def test_register_user(self, mock_user_repo):
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.create.return_value = User(
            id=uuid.uuid4(),
            email="new@test.com",
            name="New User",
            hashed_password="hashed",
            role=UserRole.STUDENT,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        service = AuthService(mock_user_repo)
        user = await service.register(
            email="new@test.com",
            name="New User",
            password="password123",
            role=UserRole.STUDENT,
        )

        assert user.email == "new@test.com"
        mock_user_repo.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, mock_user_repo, student_user):
        mock_user_repo.get_by_email.return_value = student_user

        service = AuthService(mock_user_repo)

        with pytest.raises(ValueError, match="kayıtlı"):
            await service.register(
                email="student@test.com",
                name="Dup User",
                password="password123",
                role=UserRole.STUDENT,
            )

    @pytest.mark.asyncio
    async def test_authenticate_success(self, mock_user_repo):
        password = "test_password"
        hashed = AuthService.hash_password(password)

        user = User(
            id=uuid.uuid4(),
            email="auth@test.com",
            name="Auth User",
            hashed_password=hashed,
            role=UserRole.STUDENT,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        mock_user_repo.get_by_email.return_value = user

        service = AuthService(mock_user_repo)
        result = await service.authenticate("auth@test.com", password)

        assert result is not None
        assert "access_token" in result

    @pytest.mark.asyncio
    async def test_authenticate_wrong_password(self, mock_user_repo):
        hashed = AuthService.hash_password("correct")
        user = User(
            id=uuid.uuid4(),
            email="auth@test.com",
            name="Auth User",
            hashed_password=hashed,
            role=UserRole.STUDENT,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        mock_user_repo.get_by_email.return_value = user

        service = AuthService(mock_user_repo)
        with pytest.raises(ValueError, match="[Gg]eçersiz|hatalı"):
            await service.authenticate("auth@test.com", "wrong")


# ═══════════════════════════════════════════════════════════════
# STUDENT SERVICE
# ═══════════════════════════════════════════════════════════════

class TestStudentService:
    @pytest.mark.asyncio
    async def test_create_profile(self, mock_profile_repo, mock_progress_repo):
        expected = StudentProfile(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            age=8,
            learning_difficulty=LearningDifficulty.DYSLEXIA,
            current_level=1,
            total_score=0,
            preferences={},
            streak_days=0,
            last_activity_date=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        mock_profile_repo.get_by_user_id.return_value = None
        mock_profile_repo.create.return_value = expected

        service = StudentService(mock_profile_repo, mock_progress_repo)
        result = await service.create_profile(
            user_id=expected.user_id,
            age=8,
            learning_difficulty=LearningDifficulty.DYSLEXIA,
        )

        assert result.age == 8
        assert result.learning_difficulty == LearningDifficulty.DYSLEXIA

    @pytest.mark.asyncio
    async def test_get_profile(self, mock_profile_repo, mock_progress_repo, student_profile):
        mock_profile_repo.get_by_user_id.return_value = student_profile

        service = StudentService(mock_profile_repo, mock_progress_repo)
        result = await service.get_profile(student_profile.user_id)

        assert result is not None
        assert result.id == student_profile.id


# ═══════════════════════════════════════════════════════════════
# CHAPTER SERVICE
# ═══════════════════════════════════════════════════════════════

class TestChapterService:
    @pytest.mark.asyncio
    async def test_list_chapters(self, mock_chapter_repo, sample_chapter):
        mock_chapter_repo.list_by_difficulty.return_value = [sample_chapter]

        service = ChapterService(mock_chapter_repo)
        result = await service.list_chapters(LearningDifficulty.DYSLEXIA)

        assert len(result) == 1
        assert result[0].title == "Harfleri Tanıyalım"

    @pytest.mark.asyncio
    async def test_get_chapter(self, mock_chapter_repo, sample_chapter):
        mock_chapter_repo.get_by_id.return_value = sample_chapter

        service = ChapterService(mock_chapter_repo)
        result = await service.get_chapter(sample_chapter.id)

        assert result is not None
        assert result.id == sample_chapter.id


# ═══════════════════════════════════════════════════════════════
# GAMIFICATION SERVICE
# ═══════════════════════════════════════════════════════════════

class TestGamificationService:
    def test_calculate_score(self):
        service = GamificationService.__new__(GamificationService)
        score = service.calculate_score(
            base_score=80,
            time_spent_seconds=120,
            expected_minutes=10,
            attempts=1,
        )
        # Base 80 + speed bonus (under time) + first attempt bonus
        assert score >= 80

    def test_calculate_score_no_bonus_over_time(self):
        service = GamificationService.__new__(GamificationService)
        score = service.calculate_score(
            base_score=80,
            time_spent_seconds=900,  # 15 min (over expected 10)
            expected_minutes=10,
            attempts=3,
        )
        # No speed bonus, no first attempt bonus, attempt penalty
        assert score <= 80


# ═══════════════════════════════════════════════════════════════
# SEED DATA VALIDATION
# ═══════════════════════════════════════════════════════════════

class TestSeedData:
    def test_chapters_count(self):
        from app.seed_data import CHAPTERS
        assert len(CHAPTERS) == 20

    def test_chapters_per_difficulty(self):
        from app.seed_data import CHAPTERS

        difficulties = {}
        for ch in CHAPTERS:
            diff = ch["difficulty_type"]
            difficulties[diff] = difficulties.get(diff, 0) + 1

        assert difficulties[LearningDifficulty.DYSLEXIA] == 5
        assert difficulties[LearningDifficulty.AUTISM] == 5
        assert difficulties[LearningDifficulty.DYSCALCULIA] == 5
        assert difficulties[LearningDifficulty.ADHD] == 5

    def test_all_chapters_have_content_config(self):
        from app.seed_data import CHAPTERS
        for ch in CHAPTERS:
            assert "content_config" in ch
            assert isinstance(ch["content_config"], dict)
            assert "activity" in ch["content_config"]
            assert "success_criteria" in ch["content_config"]

    def test_seed_users_count(self):
        from app.seed_data import SEED_USERS
        assert len(SEED_USERS) == 7  # admin, teacher, parent, 4 students

    def test_seed_users_all_roles(self):
        from app.seed_data import SEED_USERS
        roles = {u["role"] for u in SEED_USERS}
        assert "admin" in roles
        assert "teacher" in roles
        assert "parent" in roles
        assert "student" in roles

    def test_all_difficulties_have_student(self):
        from app.seed_data import SEED_USERS
        difficulties = set()
        for u in SEED_USERS:
            if "profile" in u:
                difficulties.add(u["profile"]["learning_difficulty"])
        assert LearningDifficulty.DYSLEXIA in difficulties
        assert LearningDifficulty.AUTISM in difficulties
        assert LearningDifficulty.DYSCALCULIA in difficulties
        assert LearningDifficulty.ADHD in difficulties
