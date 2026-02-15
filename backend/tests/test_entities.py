"""Tests for domain entities."""

import uuid
from datetime import datetime, timezone

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


class TestUser:
    def test_user_creation(self, student_user):
        assert student_user.email == "student@test.com"
        assert student_user.role == UserRole.STUDENT
        assert student_user.is_active is True

    def test_is_admin(self, admin_user, student_user):
        assert admin_user.is_admin() is True
        assert student_user.is_admin() is False

    def test_is_teacher(self, teacher_user, student_user):
        assert teacher_user.is_teacher() is True
        assert student_user.is_teacher() is False

    def test_is_student(self, student_user, admin_user):
        assert student_user.is_student() is True
        assert admin_user.is_student() is False


class TestStudentProfile:
    def test_profile_creation(self, student_profile):
        assert student_profile.age == 8
        assert student_profile.learning_difficulty == LearningDifficulty.DYSLEXIA
        assert student_profile.current_level == 1
        assert student_profile.total_score == 0

    def test_get_default_preferences_dyslexia(self):
        prefs = StudentProfile.get_default_preferences(LearningDifficulty.DYSLEXIA)
        assert prefs["font_family"] == "OpenDyslexic"
        assert prefs["audio_feedback"] is True
        assert "background_color" in prefs

    def test_get_default_preferences_autism(self):
        prefs = StudentProfile.get_default_preferences(LearningDifficulty.AUTISM)
        assert prefs["predictable_layout"] is True
        assert prefs["minimal_animations"] is True

    def test_get_default_preferences_dyscalculia(self):
        prefs = StudentProfile.get_default_preferences(LearningDifficulty.DYSCALCULIA)
        assert prefs["visual_math_tools"] is True
        assert prefs["number_line_visible"] is True

    def test_get_default_preferences_adhd(self):
        prefs = StudentProfile.get_default_preferences(LearningDifficulty.ADHD)
        assert prefs["short_activities"] is True
        assert prefs["instant_rewards"] is True


class TestChapter:
    def test_chapter_creation(self, sample_chapter):
        assert sample_chapter.title == "Harfleri Tanıyalım"
        assert sample_chapter.difficulty_type == LearningDifficulty.DYSLEXIA
        assert sample_chapter.activity_type == ActivityType.LETTER_MATCHING
        assert sample_chapter.is_active is True


class TestProgress:
    def test_progress_creation(self, sample_progress):
        assert sample_progress.is_completed is False
        assert sample_progress.attempts == 0
        assert sample_progress.score is None

    def test_mark_completed(self, sample_progress):
        sample_progress.mark_completed(score=85)
        assert sample_progress.is_completed is True
        assert sample_progress.score == 85
        assert sample_progress.completed_at is not None

    def test_add_attempt(self, sample_progress):
        sample_progress.add_attempt(120)
        assert sample_progress.attempts == 1
        assert sample_progress.time_spent_seconds == 120

        sample_progress.add_attempt(60)
        assert sample_progress.attempts == 2
        assert sample_progress.time_spent_seconds == 180

    def test_average_time_per_attempt(self, sample_progress):
        assert sample_progress.average_time_per_attempt == 0.0

        sample_progress.add_attempt(120)
        sample_progress.add_attempt(60)
        assert sample_progress.average_time_per_attempt == 90.0


class TestEnums:
    def test_learning_difficulties(self):
        assert LearningDifficulty.DYSLEXIA.value == "dyslexia"
        assert LearningDifficulty.AUTISM.value == "autism"
        assert LearningDifficulty.DYSCALCULIA.value == "dyscalculia"
        assert LearningDifficulty.ADHD.value == "adhd"

    def test_user_roles(self):
        assert UserRole.STUDENT.value == "student"
        assert UserRole.PARENT.value == "parent"
        assert UserRole.TEACHER.value == "teacher"
        assert UserRole.ADMIN.value == "admin"

    def test_badge_types(self):
        assert len(BadgeType) == 10

    def test_activity_types(self):
        assert len(ActivityType) == 20
