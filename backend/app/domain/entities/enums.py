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
    DYSGRAPHIA = "dysgraphia"
    DYSCALCULIA = "dyscalculia"


class ActivityType(str, Enum):
    """Types of learning activities."""
    WORD_RECOGNITION = "word_recognition"
    LETTER_MATCHING = "letter_matching"
    AUDIO_FEEDBACK = "audio_feedback"
    READING_EXERCISE = "reading_exercise"
    PHONICS_GAME = "phonics_game"
    STEP_BY_STEP = "step_by_step"
    LETTER_TRACING = "letter_tracing"
    HANDWRITING_PRACTICE = "handwriting_practice"
    STROKE_ORDER = "stroke_order"
    FINE_MOTOR = "fine_motor"
    COPY_TEXT = "copy_text"
    NUMBER_LINE = "number_line"
    VISUAL_MATH = "visual_math"
    SHAPE_LEARNING = "shape_learning"
    CONCRETE_COUNTING = "concrete_counting"
    GRAPH_EXERCISE = "graph_exercise"
    PLACE_VALUE = "place_value"
    ADDITION_CRA = "addition_cra"
    SUBTRACTION_CRA = "subtraction_cra"
    WORD_PROBLEM = "word_problem"
    NUMBER_COMPARISON = "number_comparison"
    # Dyslexia - Orton-Gillingham
    RHYME_MATCHING = "rhyme_matching"
    SYLLABLE_SEGMENTATION = "syllable_segmentation"
    LETTER_SOUND = "letter_sound"
    SIGHT_WORD = "sight_word"
    REPEATED_READING = "repeated_reading"
    COMPREHENSION = "comprehension"
    # Dysgraphia - Evidence-Based Writing
    GRIP_TRAINING = "grip_training"
    SHAPE_TRACING = "shape_tracing"
    EYE_HAND_COORDINATION = "eye_hand_coordination"
    SPATIAL_AWARENESS = "spatial_awareness"
    LETTER_FORMATION_SIMPLE = "letter_formation_simple"
    LETTER_FORMATION_COMPLEX = "letter_formation_complex"
    UPPERCASE_LETTERS = "uppercase_letters"
    TURKISH_SPECIAL_CHARS = "turkish_special_chars"
    PHONICS_SPELLING = "phonics_spelling"
    SYLLABLE_SPELLING = "syllable_spelling"
    SPELLING_RULES = "spelling_rules"
    SIGHT_WORD_SPELLING = "sight_word_spelling"
    SIMPLE_SENTENCES = "simple_sentences"
    EXPANDED_SENTENCES = "expanded_sentences"
    COMPOUND_SENTENCES = "compound_sentences"
    PUNCTUATION_PRACTICE = "punctuation_practice"
    WRITING_PLANNING = "writing_planning"
    PARAGRAPH_WRITING = "paragraph_writing"
    STORY_WRITING = "story_writing"
    REVISION_EDITING = "revision_editing"


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
