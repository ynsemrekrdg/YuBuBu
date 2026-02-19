"""
SQLAlchemy ORM models for all domain entities.
Maps domain objects to PostgreSQL tables with proper relationships,
indexes, and constraints.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.entities.enums import (
    ActivityType,
    BadgeType,
    DifficultyLevel,
    LearningDifficulty,
    UserRole,
)
from app.infrastructure.database.session import Base


class UserModel(Base):
    """SQLAlchemy model for User entity."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    email: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    username: Mapped[Optional[str]] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(512), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role_enum", create_type=True),
        nullable=False,
        default=UserRole.STUDENT,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    student_profile: Mapped[Optional["StudentProfileModel"]] = relationship(
        "StudentProfileModel", back_populates="user", uselist=False, lazy="selectin",
        foreign_keys="StudentProfileModel.user_id"
    )
    ai_conversations: Mapped[List["AIConversationModel"]] = relationship(
        "AIConversationModel", back_populates="user", lazy="dynamic"
    )
    teacher_profile: Mapped[Optional["TeacherModel"]] = relationship(
        "TeacherModel", back_populates="user", uselist=False, lazy="selectin"
    )

    __table_args__ = (
        Index("ix_users_role", "role"),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username}, role={self.role})>"


class StudentProfileModel(Base):
    """SQLAlchemy model for StudentProfile entity."""

    __tablename__ = "student_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    age: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    learning_difficulty: Mapped[LearningDifficulty] = mapped_column(
        SAEnum(LearningDifficulty, name="learning_difficulty_enum", create_type=True),
        nullable=False,
    )
    current_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    preferences: Mapped[Dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_activity_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    school_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("schools.id", ondelete="SET NULL"), nullable=True
    )
    teacher_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True
    )
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="student_profile",
        foreign_keys=[user_id]
    )
    progress_records: Mapped[List["ProgressModel"]] = relationship(
        "ProgressModel", back_populates="student", lazy="dynamic"
    )
    badges: Mapped[List["BadgeModel"]] = relationship(
        "BadgeModel", back_populates="student", lazy="selectin"
    )
    school: Mapped[Optional["SchoolModel"]] = relationship(
        "SchoolModel", back_populates="students", lazy="selectin"
    )
    teacher: Mapped[Optional["TeacherModel"]] = relationship(
        "TeacherModel", back_populates="students", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_student_profiles_difficulty", "learning_difficulty"),
        Index("ix_student_profiles_user_id", "user_id"),
        Index("ix_student_profiles_level", "current_level"),
        Index("ix_student_profiles_parent_id", "parent_id"),
    )

    def __repr__(self) -> str:
        return f"<StudentProfile(id={self.id}, difficulty={self.learning_difficulty})>"


class ChapterModel(Base):
    """SQLAlchemy model for Chapter entity."""

    __tablename__ = "chapters"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    difficulty_type: Mapped[LearningDifficulty] = mapped_column(
        SAEnum(LearningDifficulty, name="learning_difficulty_enum", create_type=False),
        nullable=False,
    )
    chapter_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_config: Mapped[Dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    activity_type: Mapped[ActivityType] = mapped_column(
        SAEnum(ActivityType, name="activity_type_enum", create_type=True),
        nullable=False,
    )
    difficulty_level: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    expected_duration_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=15
    )
    min_score_to_pass: Mapped[int] = mapped_column(
        Integer, nullable=False, default=60
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    progress_records: Mapped[List["ProgressModel"]] = relationship(
        "ProgressModel", back_populates="chapter", lazy="dynamic"
    )

    __table_args__ = (
        Index("ix_chapters_difficulty_type", "difficulty_type"),
        Index("ix_chapters_number", "difficulty_type", "chapter_number", unique=True),
        Index("ix_chapters_active", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Chapter(id={self.id}, title={self.title})>"


class ProgressModel(Base):
    """SQLAlchemy model for Progress entity."""

    __tablename__ = "progress"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    chapter_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("chapters.id", ondelete="CASCADE"),
        nullable=False,
    )
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    student: Mapped["StudentProfileModel"] = relationship(
        "StudentProfileModel", back_populates="progress_records"
    )
    chapter: Mapped["ChapterModel"] = relationship(
        "ChapterModel", back_populates="progress_records"
    )

    __table_args__ = (
        Index("ix_progress_student_id", "student_id"),
        Index("ix_progress_chapter_id", "chapter_id"),
        Index(
            "ix_progress_student_chapter",
            "student_id",
            "chapter_id",
            unique=True,
        ),
        Index("ix_progress_completed", "student_id", "completed"),
    )

    def __repr__(self) -> str:
        return f"<Progress(student={self.student_id}, chapter={self.chapter_id}, score={self.score})>"


class AIConversationModel(Base):
    """SQLAlchemy model for AIConversation entity."""

    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    role_context: Mapped[str] = mapped_column(
        String(50), nullable=False, default="student"
    )
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="ai_conversations"
    )

    __table_args__ = (
        Index("ix_ai_conversations_user_id", "user_id"),
        Index("ix_ai_conversations_timestamp", "user_id", "timestamp"),
    )

    def __repr__(self) -> str:
        return f"<AIConversation(id={self.id}, user={self.user_id})>"


class BadgeModel(Base):
    """SQLAlchemy model for Badge entity."""

    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    badge_type: Mapped[BadgeType] = mapped_column(
        SAEnum(BadgeType, name="badge_type_enum", create_type=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String(100), nullable=False, default="ğŸ†")
    earned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    student: Mapped["StudentProfileModel"] = relationship(
        "StudentProfileModel", back_populates="badges"
    )

    __table_args__ = (
        Index("ix_badges_student_id", "student_id"),
        Index("ix_badges_student_type", "student_id", "badge_type", unique=True),
    )

    def __repr__(self) -> str:
        return f"<Badge(student={self.student_id}, type={self.badge_type})>"


class SchoolModel(Base):
    """SQLAlchemy model for School entity."""

    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    district: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    teachers: Mapped[List["TeacherModel"]] = relationship(
        "TeacherModel", back_populates="school", lazy="selectin"
    )
    students: Mapped[List["StudentProfileModel"]] = relationship(
        "StudentProfileModel", back_populates="school", lazy="dynamic"
    )

    def __repr__(self) -> str:
        return f"<School(id={self.id}, name={self.name})>"


class TeacherModel(Base):
    """SQLAlchemy model for Teacher entity."""

    __tablename__ = "teachers"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    school_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    branch: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="teacher_profile"
    )
    school: Mapped["SchoolModel"] = relationship(
        "SchoolModel", back_populates="teachers"
    )
    students: Mapped[List["StudentProfileModel"]] = relationship(
        "StudentProfileModel", back_populates="teacher", lazy="dynamic"
    )

    __table_args__ = (
        Index("ix_teachers_school_id", "school_id"),
        Index("ix_teachers_user_id", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<Teacher(id={self.id}, user_id={self.user_id})>"


class ParentStudentRelationModel(Base):
    """SQLAlchemy model for parent-student relationship."""

    __tablename__ = "parent_student_relations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    parent_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_psr_parent_id", "parent_id"),
        Index("ix_psr_student_id", "student_id"),
        Index("ix_psr_unique", "parent_id", "student_id", unique=True),
    )

    def __repr__(self) -> str:
        return f"<ParentStudentRelation(parent={self.parent_id}, student={self.student_id})>"
