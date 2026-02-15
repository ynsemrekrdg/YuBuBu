"""
Domain enums for YuBuBu Education Platform.
Defines all enumeration types used across the domain layer.
"""

from enum import Enum


class UserRole(str, Enum):
    """User roles in the system."""
    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class LearningDifficulty(str, Enum):
    """Types of learning difficulties supported by the platform."""
    DYSLEXIA = "dyslexia"
    AUTISM = "autism"
    DYSCALCULIA = "dyscalculia"
    ADHD = "adhd"


class ActivityType(str, Enum):
    """Types of learning activities."""
    WORD_RECOGNITION = "word_recognition"
    LETTER_MATCHING = "letter_matching"
    AUDIO_FEEDBACK = "audio_feedback"
    READING_EXERCISE = "reading_exercise"
    PHONICS_GAME = "phonics_game"
    STEP_BY_STEP = "step_by_step"
    VISUAL_SCHEDULE = "visual_schedule"
    ROUTINE_ACTIVITY = "routine_activity"
    SOCIAL_STORY = "social_story"
    PATTERN_RECOGNITION = "pattern_recognition"
    NUMBER_LINE = "number_line"
    VISUAL_MATH = "visual_math"
    SHAPE_LEARNING = "shape_learning"
    CONCRETE_COUNTING = "concrete_counting"
    GRAPH_EXERCISE = "graph_exercise"
    QUICK_CHALLENGE = "quick_challenge"
    REWARD_GAME = "reward_game"
    FOCUS_EXERCISE = "focus_exercise"
    TIMER_ACTIVITY = "timer_activity"
    BADGE_QUEST = "badge_quest"


class DifficultyLevel(int, Enum):
    """Difficulty levels for chapters."""
    BEGINNER = 1
    EASY = 2
    MEDIUM = 3
    HARD = 4
    ADVANCED = 5


class BadgeType(str, Enum):
    """Types of badges/achievements."""
    FIRST_CHAPTER = "first_chapter"
    PERFECT_SCORE = "perfect_score"
    STREAK_3 = "streak_3"
    STREAK_7 = "streak_7"
    STREAK_30 = "streak_30"
    LEVEL_UP = "level_up"
    SPEED_DEMON = "speed_demon"
    PERSISTENT = "persistent"
    EXPLORER = "explorer"
    MASTER = "master"
