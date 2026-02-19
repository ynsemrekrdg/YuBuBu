"""Add parent-focused registration system: schools, teachers, parent_student_relations, update users and student_profiles

Revision ID: 002_parent_system
Revises: 001_initial
Create Date: 2024-06-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_parent_system"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Schools table ──
    op.create_table(
        "schools",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("city", sa.String(100), nullable=False, server_default=""),
        sa.Column("district", sa.String(100), nullable=False, server_default=""),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    # ── Teachers table ──
    op.create_table(
        "teachers",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("school_id", sa.Uuid(), sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("branch", sa.String(255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_teachers_school_id", "teachers", ["school_id"])
    op.create_index("ix_teachers_user_id", "teachers", ["user_id"])

    # ── Parent-Student Relations table ──
    op.create_table(
        "parent_student_relations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("parent_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_psr_parent_id", "parent_student_relations", ["parent_id"])
    op.create_index("ix_psr_student_id", "parent_student_relations", ["student_id"])
    op.create_index("ix_psr_unique", "parent_student_relations", ["parent_id", "student_id"], unique=True)

    # ── Update users table: add username, make email nullable ──
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("username", sa.String(100), nullable=True, unique=True))
        batch_op.alter_column("email", existing_type=sa.String(255), nullable=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # ── Update student_profiles: add parent_id, school_id, teacher_id, grade ──
    with op.batch_alter_table("student_profiles") as batch_op:
        batch_op.add_column(sa.Column("parent_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
        batch_op.add_column(sa.Column("school_id", sa.Uuid(), sa.ForeignKey("schools.id", ondelete="SET NULL"), nullable=True))
        batch_op.add_column(sa.Column("teacher_id", sa.Uuid(), sa.ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True))
        batch_op.add_column(sa.Column("grade", sa.Integer(), nullable=True))
    op.create_index("ix_student_profiles_parent_id", "student_profiles", ["parent_id"])


def downgrade() -> None:
    op.drop_index("ix_student_profiles_parent_id", table_name="student_profiles")
    with op.batch_alter_table("student_profiles") as batch_op:
        batch_op.drop_column("grade")
        batch_op.drop_column("teacher_id")
        batch_op.drop_column("school_id")
        batch_op.drop_column("parent_id")

    op.drop_index("ix_users_username", table_name="users")
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("email", existing_type=sa.String(255), nullable=False)
        batch_op.drop_column("username")

    op.drop_table("parent_student_relations")
    op.drop_table("teachers")
    op.drop_table("schools")
