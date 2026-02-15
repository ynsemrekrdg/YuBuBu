"""initial migration - create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users ──────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("student", "parent", "teacher", "admin", name="userrole"),
            nullable=False,
            server_default="student",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    # ── Student Profiles ──────────────────────────────────
    op.create_table(
        "student_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column(
            "learning_difficulty",
            sa.Enum("dyslexia", "dysgraphia", "dyscalculia", name="learningdifficulty"),
            nullable=False,
        ),
        sa.Column("current_level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("total_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("preferences", postgresql.JSON(), nullable=True),
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_student_profiles_user_id", "student_profiles", ["user_id"], unique=True)
    op.create_index(
        "ix_student_profiles_difficulty",
        "student_profiles",
        ["learning_difficulty"],
    )

    # ── Chapters ──────────────────────────────────────────
    op.create_table(
        "chapters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "difficulty_type",
            sa.Enum("dyslexia", "dysgraphia", "dyscalculia", name="learningdifficulty"),
            nullable=False,
        ),
        sa.Column("chapter_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("content_config", postgresql.JSON(), nullable=False),
        sa.Column(
            "activity_type",
            sa.Enum(
                "word_recognition",
                "letter_matching",
                "audio_feedback",
                "reading_exercise",
                "phonics_game",
                "step_by_step",
                "visual_schedule",
                "routine_activity",
                "social_story",
                "pattern_recognition",
                "number_line",
                "visual_math",
                "shape_learning",
                "concrete_counting",
                "graph_exercise",
                "quick_challenge",
                "reward_game",
                "focus_exercise",
                "timer_activity",
                "badge_quest",
                name="activitytype",
            ),
            nullable=False,
        ),
        sa.Column("difficulty_level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("expected_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("min_score_to_pass", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("difficulty_type", "chapter_number", name="uq_chapter_difficulty_number"),
    )
    op.create_index("ix_chapters_difficulty", "chapters", ["difficulty_type"])

    # ── Progress ──────────────────────────────────────────
    op.create_table(
        "progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "chapter_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chapters.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("student_id", "chapter_id", name="uq_progress_student_chapter"),
    )
    op.create_index("ix_progress_student", "progress", ["student_id"])
    op.create_index("ix_progress_chapter", "progress", ["chapter_id"])

    # ── AI Conversations ──────────────────────────────────
    op.create_table(
        "ai_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("response", sa.Text(), nullable=False),
        sa.Column("context_data", postgresql.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_ai_conversations_user", "ai_conversations", ["user_id"])
    op.create_index(
        "ix_ai_conversations_student",
        "ai_conversations",
        ["student_id"],
    )

    # ── Badges ────────────────────────────────────────────
    op.create_table(
        "badges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "badge_type",
            sa.Enum(
                "first_step",
                "fast_learner",
                "perfect_score",
                "streak_3",
                "streak_7",
                "streak_30",
                "chapter_master",
                "difficulty_conqueror",
                "social_butterfly",
                "ai_explorer",
                name="badgetype",
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "earned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("student_id", "badge_type", name="uq_badge_student_type"),
    )
    op.create_index("ix_badges_student", "badges", ["student_id"])


def downgrade() -> None:
    op.drop_table("badges")
    op.drop_table("ai_conversations")
    op.drop_table("progress")
    op.drop_table("chapters")
    op.drop_table("student_profiles")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS badgetype")
    op.execute("DROP TYPE IF EXISTS activitytype")
    op.execute("DROP TYPE IF EXISTS learningdifficulty")
    op.execute("DROP TYPE IF EXISTS userrole")
