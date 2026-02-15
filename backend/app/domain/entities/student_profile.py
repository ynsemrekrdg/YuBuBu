"""
Domain entity: StudentProfile
Represents a student's learning profile with difficulty type and preferences.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from app.domain.entities.enums import LearningDifficulty


@dataclass
class StudentProfile:
    """Student profile with learning difficulty information and preferences."""

    id: UUID = field(default_factory=uuid4)
    user_id: UUID = field(default_factory=uuid4)
    age: int = 0
    learning_difficulty: LearningDifficulty = LearningDifficulty.DYSLEXIA
    current_level: int = 1
    total_score: int = 0
    preferences: Dict[str, Any] = field(default_factory=dict)
    streak_days: int = 0
    last_activity_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def get_default_preferences(self) -> Dict[str, Any]:
        """Return default UI/UX preferences based on learning difficulty."""
        defaults = {
            LearningDifficulty.DYSLEXIA: {
                "font_family": "OpenDyslexic",
                "font_size": 18,
                "high_contrast": True,
                "line_spacing": 2.0,
                "background_color": "#FFF9E6",
                "text_color": "#1A1A2E",
                "audio_feedback": True,
                "reading_guide": True,
                "syllable_highlight": True,
            },
            LearningDifficulty.AUTISM: {
                "predictable_layout": True,
                "minimal_animations": True,
                "clear_instructions": True,
                "visual_schedule": True,
                "sensory_safe_colors": True,
                "background_color": "#F0F4F8",
                "text_color": "#2D3748",
                "transition_warnings": True,
                "routine_reminders": True,
            },
            LearningDifficulty.DYSCALCULIA: {
                "visual_math_tools": True,
                "number_line_visible": True,
                "concrete_examples": True,
                "step_by_step_solutions": True,
                "graph_based_learning": True,
                "background_color": "#F0FFF4",
                "text_color": "#22543D",
                "calculator_available": True,
                "manipulatives": True,
            },
            LearningDifficulty.ADHD: {
                "short_activities": True,
                "max_activity_minutes": 10,
                "instant_rewards": True,
                "colorful_interface": True,
                "progress_bars_visible": True,
                "gamification_enhanced": True,
                "background_color": "#FFF5F5",
                "text_color": "#742A2A",
                "break_reminders": True,
                "timer_visible": True,
            },
        }
        return defaults.get(self.learning_difficulty, {})

    def calculate_level(self) -> int:
        """Calculate level based on total score. Every 500 points = 1 level."""
        return max(1, self.total_score // 500 + 1)
