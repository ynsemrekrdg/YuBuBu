"""
Seed data: 20 Learning Chapters (5 per difficulty type).
Each chapter includes full content_config JSON with activity details.
Run with: python -m app.seed_data
"""

import asyncio
import uuid
from datetime import datetime

from loguru import logger

from app.domain.entities.enums import ActivityType, LearningDifficulty
from app.infrastructure.database.models import (
    BadgeModel,
    ChapterModel,
    ProgressModel,
    StudentProfileModel,
    UserModel,
)
from app.infrastructure.database.session import async_session_factory, init_db
from app.application.services.auth_service import AuthService

# ═══════════════════════════════════════════════════════════════
# CHAPTER DEFINITIONS - 20 Chapters (5 per difficulty)
# ═══════════════════════════════════════════════════════════════

CHAPTERS = [
    # ─── DYSLEXIA (Disleksi) - 5 Bölüm ─────────────────────
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 1,
        "title": "Harfleri Tanıyalım",
        "description": "Büyük harflerle temel harf tanıma aktivitesi. OpenDyslexic font ile okunabilir harfler.",
        "activity_type": ActivityType.LETTER_MATCHING,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 28,
            "background_color": "#FFF9E6",
            "text_color": "#1A1A2E",
            "line_spacing": 2.0,
            "activity": {
                "type": "letter_matching",
                "instructions": "Aynı harfleri eşleştir!",
                "letters": [
                    {"letter": "A", "match_id": 1, "image": "apple.png"},
                    {"letter": "B", "match_id": 2, "image": "ball.png"},
                    {"letter": "C", "match_id": 3, "image": "cat.png"},
                    {"letter": "D", "match_id": 4, "image": "dog.png"},
                    {"letter": "E", "match_id": 5, "image": "elephant.png"},
                ],
                "pairs_count": 5,
                "show_image_hints": True,
            },
            "audio_feedback": True,
            "success_sound": "correct_chime.mp3",
            "error_sound": "try_again.mp3",
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 10,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 2,
        "title": "Kelime Avcısı",
        "description": "Basit kelimeleri resimlerle eşleştirme oyunu. Sesli geri bildirim ile desteklenir.",
        "activity_type": ActivityType.WORD_RECOGNITION,
        "difficulty_level": 2,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 24,
            "background_color": "#FFF9E6",
            "text_color": "#1A1A2E",
            "activity": {
                "type": "word_recognition",
                "instructions": "Kelimeyi doğru resimle eşleştir!",
                "words": [
                    {"word": "KEDI", "image": "cat.png", "audio": "kedi.mp3"},
                    {"word": "KÖPEK", "image": "dog.png", "audio": "kopek.mp3"},
                    {"word": "BALIK", "image": "fish.png", "audio": "balik.mp3"},
                    {"word": "KUŞ", "image": "bird.png", "audio": "kus.mp3"},
                    {"word": "TAVŞAN", "image": "rabbit.png", "audio": "tavsan.mp3"},
                    {"word": "AT", "image": "horse.png", "audio": "at.mp3"},
                ],
                "display_mode": "large_text",
                "syllable_highlight": True,
            },
            "audio_feedback": True,
            "reading_guide": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 3,
        "title": "Sesli Okuma Dostum",
        "description": "Kısa hikayeler sesli olarak okunur, çocuk takip eder ve tekrar eder.",
        "activity_type": ActivityType.AUDIO_FEEDBACK,
        "difficulty_level": 2,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 50,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 26,
            "background_color": "#FFF9E6",
            "text_color": "#1A1A2E",
            "line_spacing": 2.5,
            "activity": {
                "type": "audio_reading",
                "instructions": "Hikayeyi dinle, sonra sen oku!",
                "story": {
                    "title": "Küçük Kedi",
                    "paragraphs": [
                        "Bir küçük kedi vardı.",
                        "Kedi süt severdi.",
                        "Her gün bahçede oynardı.",
                        "Akşam olunca uyurdu.",
                    ],
                    "audio_file": "kucuk_kedi.mp3",
                    "word_highlight_timing": True,
                },
                "reading_speed": "slow",
                "highlight_current_word": True,
                "repeat_mode": True,
            },
            "audio_feedback": True,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 3,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 4,
        "title": "Hece Bulmaca",
        "description": "Kelimeleri hecelere ayırma ve birleştirme oyunu.",
        "activity_type": ActivityType.PHONICS_GAME,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 24,
            "background_color": "#FFF9E6",
            "activity": {
                "type": "syllable_puzzle",
                "instructions": "Heceleri birleştirerek kelimeyi oluştur!",
                "words": [
                    {"word": "ARABA", "syllables": ["A", "RA", "BA"]},
                    {"word": "OKUL", "syllables": ["O", "KUL"]},
                    {"word": "KALEM", "syllables": ["KA", "LEM"]},
                    {"word": "DEFTER", "syllables": ["DEF", "TER"]},
                    {"word": "KİTAP", "syllables": ["Kİ", "TAP"]},
                    {"word": "MASA", "syllables": ["MA", "SA"]},
                    {"word": "BİLGİSAYAR", "syllables": ["BİL", "Gİ", "SA", "YAR"]},
                ],
                "drag_and_drop": True,
                "audio_pronunciation": True,
            },
            "audio_feedback": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 5,
        "title": "Cümle Kurma Şampiyonu",
        "description": "Karışık kelimeleri doğru sıraya koyarak cümle oluşturma.",
        "activity_type": ActivityType.READING_EXERCISE,
        "difficulty_level": 4,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 22,
            "background_color": "#FFF9E6",
            "activity": {
                "type": "sentence_building",
                "instructions": "Kelimeleri doğru sıraya koyarak cümle oluştur!",
                "sentences": [
                    {
                        "correct": "Kedi süt içer",
                        "words": ["içer", "Kedi", "süt"],
                        "image": "cat_milk.png",
                    },
                    {
                        "correct": "Güneş parlıyor",
                        "words": ["parlıyor", "Güneş"],
                        "image": "sun.png",
                    },
                    {
                        "correct": "Çocuklar parkta oynar",
                        "words": ["oynar", "Çocuklar", "parkta"],
                        "image": "park.png",
                    },
                    {
                        "correct": "Annem yemek yapıyor",
                        "words": ["yapıyor", "Annem", "yemek"],
                        "image": "cooking.png",
                    },
                ],
                "drag_and_drop": True,
                "show_image_clue": True,
            },
            "audio_feedback": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 15,
            },
        },
    },

    # ─── DYSGRAPHIA (Disgrafi) - 5 Bölüm ─────────────────────
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 1,
        "title": "Harfleri Tanıyalım",
        "description": "Temel harfleri tanıma ve parmakla izleme aktivitesi. Büyük çizgi aralıkları.",
        "activity_type": ActivityType.LETTER_TRACING,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "wide_line_spacing": True,
            "dotted_guidelines": True,
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "activity": {
                "type": "letter_tracing",
                "instructions": "Noktalı çizgileri takip ederek harfi yaz! ✍️",
                "letters": [
                    {"letter": "A", "stroke_count": 3, "guide_image": "letter_a_guide.png"},
                    {"letter": "B", "stroke_count": 3, "guide_image": "letter_b_guide.png"},
                    {"letter": "C", "stroke_count": 1, "guide_image": "letter_c_guide.png"},
                    {"letter": "D", "stroke_count": 2, "guide_image": "letter_d_guide.png"},
                    {"letter": "E", "stroke_count": 4, "guide_image": "letter_e_guide.png"},
                ],
                "show_stroke_order": True,
                "show_arrows": True,
                "line_thickness": 4,
            },
            "stroke_guides": True,
            "motor_exercises": True,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 10,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 2,
        "title": "Çizgi Takibi",
        "description": "Düz, eğri ve dalgalı çizgileri takip etme. İnce motor beceri geliştirme.",
        "activity_type": ActivityType.FINE_MOTOR,
        "difficulty_level": 1,
        "expected_duration_minutes": 8,
        "min_score_to_pass": 50,
        "content_config": {
            "wide_line_spacing": True,
            "dotted_guidelines": True,
            "background_color": "#F0FFF4",
            "activity": {
                "type": "line_tracing",
                "instructions": "Parmağınla çizgiyi takip et! Yavaş ve dikkatli ol. 🖊️",
                "lines": [
                    {"type": "straight", "direction": "horizontal", "length": 200},
                    {"type": "straight", "direction": "vertical", "length": 150},
                    {"type": "zigzag", "peaks": 4, "amplitude": 30},
                    {"type": "wave", "waves": 3, "amplitude": 25},
                    {"type": "spiral", "turns": 2, "size": 100},
                ],
                "tolerance_px": 15,
                "show_progress": True,
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 8,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 3,
        "title": "Harf Yazma Sırası",
        "description": "Harflerin doğru yazılış sırasını öğrenme. Adım adım rehberlik.",
        "activity_type": ActivityType.STROKE_ORDER,
        "difficulty_level": 2,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 50,
        "content_config": {
            "wide_line_spacing": True,
            "dotted_guidelines": True,
            "background_color": "#F0FFF4",
            "activity": {
                "type": "stroke_order_practice",
                "instructions": "Harfi doğru sırayla yaz! Numaralı okları takip et. ✏️",
                "letters": [
                    {
                        "letter": "K",
                        "strokes": [
                            {"order": 1, "description": "Yukarıdan aşağı düz çizgi"},
                            {"order": 2, "description": "Ortadan sağ yukarı çapraz"},
                            {"order": 3, "description": "Ortadan sağ aşağı çapraz"},
                        ],
                    },
                    {
                        "letter": "M",
                        "strokes": [
                            {"order": 1, "description": "Sol dikey çizgi"},
                            {"order": 2, "description": "Sol üstten ortaya çapraz"},
                            {"order": 3, "description": "Ortadan sağ yukarı çapraz"},
                            {"order": 4, "description": "Sağ dikey çizgi"},
                        ],
                    },
                    {
                        "letter": "S",
                        "strokes": [
                            {"order": 1, "description": "Üst yarım daire (sağdan sola)"},
                            {"order": 2, "description": "Alt yarım daire (soldan sağa)"},
                        ],
                    },
                ],
                "animation_speed": "slow",
                "repeat_demo": True,
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 4,
        "title": "Kelime Yazma",
        "description": "Basit kelimeleri noktalı çizgi üzerinde yazma pratiği.",
        "activity_type": ActivityType.HANDWRITING_PRACTICE,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 50,
        "content_config": {
            "wide_line_spacing": True,
            "dotted_guidelines": True,
            "background_color": "#F0FFF4",
            "activity": {
                "type": "word_writing",
                "instructions": "Kelimeyi noktalı çizgilerin üzerine yaz! 📝",
                "words": [
                    {"word": "EV", "hint_image": "house.png", "letter_count": 2},
                    {"word": "AY", "hint_image": "moon.png", "letter_count": 2},
                    {"word": "GÖZ", "hint_image": "eye.png", "letter_count": 3},
                    {"word": "KUŞ", "hint_image": "bird.png", "letter_count": 3},
                    {"word": "OKUL", "hint_image": "school.png", "letter_count": 4},
                ],
                "show_dotted_word": True,
                "letter_spacing": "wide",
                "line_guides": True,
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 5,
        "title": "Cümle Kopyalama",
        "description": "Basit cümleleri bakarak kopyalama. Satır takibi ve boşluk bırakma.",
        "activity_type": ActivityType.COPY_TEXT,
        "difficulty_level": 4,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "wide_line_spacing": True,
            "dotted_guidelines": True,
            "background_color": "#F0FFF4",
            "activity": {
                "type": "sentence_copying",
                "instructions": "Yukarıdaki cümleyi aşağıya yaz! Boşluklara dikkat et. ✍️",
                "sentences": [
                    {"text": "Bu bir ev.", "word_count": 3},
                    {"text": "Kedi süt içer.", "word_count": 3},
                    {"text": "Güneş parlıyor.", "word_count": 2},
                    {"text": "Ben okula giderim.", "word_count": 3},
                    {"text": "Bugün hava güzel.", "word_count": 3},
                ],
                "show_model_text": True,
                "highlight_spaces": True,
                "word_by_word_mode": True,
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 15,
            },
        },
    },

    # ─── DYSCALCULIA (Diskalkuli) - 5 Bölüm (CRA Modeli) ────
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 1,
        "title": "Sayı Kavramı ve Büyüklük",
        "description": "Sayıları somut nesnelerle tanıma, sayı büyüklüğünü kavrama ve karşılaştırma. CRA modelinin somut aşamasından başlayarak soyut karşılaştırmaya ilerleme.",
        "activity_type": ActivityType.CONCRETE_COUNTING,
        "difficulty_level": 1,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 50,
        "content_config": {
            "background_color": "#FFFBF0",
            "text_color": "#2D3748",
            "cra_phase": "concrete_to_abstract",
            "activity": {
                "type": "concrete_counting",
                "instructions": "Nesneleri tek tek say ve doğru sayıyı bul!",
                "games": ["concreteCount", "numberComparison"],
                "counting_exercises": [
                    {"emoji": "🍎", "count": 3, "options": [2, 3, 4, 5], "touch_to_count": True},
                    {"emoji": "⭐", "count": 5, "options": [4, 5, 6, 3], "touch_to_count": True},
                    {"emoji": "🐟", "count": 4, "options": [3, 5, 4, 6], "touch_to_count": True},
                    {"emoji": "🌸", "count": 7, "options": [6, 7, 8, 5], "touch_to_count": True},
                    {"emoji": "🏀", "count": 6, "options": [5, 7, 6, 8], "touch_to_count": True},
                ],
                "comparison_exercises": [
                    {"left": 7, "right": 4, "correct": "left", "dots": True},
                    {"left": 3, "right": 8, "correct": "right", "dots": True},
                    {"left": 5, "right": 5, "correct": "equal", "dots": True},
                    {"left": 9, "right": 6, "correct": "left", "dots": True},
                    {"left": 2, "right": 7, "correct": "right", "dots": True},
                ],
            },
            "accessibility": {
                "text_to_speech": True,
                "touch_area_min": 44,
                "contrast_ratio": 7,
                "animation_speed": "slow",
            },
            "feedback": {
                "correct_color": "#48BB78",
                "retry_color": "#ECC94B",
                "never_red_x": True,
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 2,
        "title": "Basamak Değeri",
        "description": "Onlar ve birler basamağını somut bloklarla kavrama. Renk kodlu basamak sistemi ile sayıların yapısını anlama.",
        "activity_type": ActivityType.PLACE_VALUE,
        "difficulty_level": 2,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 50,
        "content_config": {
            "background_color": "#FFFBF0",
            "text_color": "#2D3748",
            "cra_phase": "concrete_representational",
            "activity": {
                "type": "place_value",
                "instructions": "Blokları kullanarak sayıları oluştur!",
                "games": ["placeValue", "numberComparison"],
                "block_exercises": [
                    {"target": 23, "tens_color": "#FC8181", "ones_color": "#68D391"},
                    {"target": 15, "tens_color": "#FC8181", "ones_color": "#68D391"},
                    {"target": 31, "tens_color": "#FC8181", "ones_color": "#68D391"},
                    {"target": 47, "tens_color": "#FC8181", "ones_color": "#68D391"},
                    {"target": 12, "tens_color": "#FC8181", "ones_color": "#68D391"},
                ],
                "digit_recognition": [
                    {"number": 47, "question": "onlar", "answer": 4, "options": [4, 7]},
                    {"number": 23, "question": "birler", "answer": 3, "options": [2, 3]},
                    {"number": 56, "question": "onlar", "answer": 5, "options": [5, 6]},
                    {"number": 81, "question": "birler", "answer": 1, "options": [8, 1]},
                    {"number": 39, "question": "onlar", "answer": 3, "options": [3, 9]},
                ],
            },
            "colors": {
                "tens": "#FC8181",
                "ones": "#68D391",
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 3,
        "title": "Toplama (CRA Modeli)",
        "description": "Toplamayı somuttan soyuta CRA modeli ile öğrenme. Nesneleri birleştirme, sayı doğrusunda ilerleme ve sembolik toplama.",
        "activity_type": ActivityType.ADDITION_CRA,
        "difficulty_level": 2,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "background_color": "#FFFBF0",
            "text_color": "#2D3748",
            "cra_phase": "full_cra",
            "activity": {
                "type": "addition_cra",
                "instructions": "Toplamayı adım adım öğrenelim!",
                "games": ["additionCRA", "numberLine"],
                "problems": [
                    {
                        "a": 3, "b": 2, "answer": 5,
                        "emoji": "🍊",
                        "concrete_instruction": "İlk gruptaki portakalları toplam alanına sürükle!",
                        "representational_instruction": "Sayı doğrusunda 3'ten başla, 2 adım ilerle!",
                        "abstract_instruction": "3 + 2 = ?",
                    },
                    {
                        "a": 4, "b": 3, "answer": 7,
                        "emoji": "🍎",
                        "concrete_instruction": "İlk gruptaki elmaları toplam alanına sürükle!",
                        "representational_instruction": "Sayı doğrusunda 4'ten başla, 3 adım ilerle!",
                        "abstract_instruction": "4 + 3 = ?",
                    },
                    {
                        "a": 5, "b": 2, "answer": 7,
                        "emoji": "⭐",
                        "concrete_instruction": "İlk gruptaki yıldızları toplam alanına sürükle!",
                        "representational_instruction": "Sayı doğrusunda 5'ten başla, 2 adım ilerle!",
                        "abstract_instruction": "5 + 2 = ?",
                    },
                    {
                        "a": 2, "b": 4, "answer": 6,
                        "emoji": "🎈",
                        "concrete_instruction": "İlk gruptaki balonları toplam alanına sürükle!",
                        "representational_instruction": "Sayı doğrusunda 2'den başla, 4 adım ilerle!",
                        "abstract_instruction": "2 + 4 = ?",
                    },
                    {
                        "a": 6, "b": 3, "answer": 9,
                        "emoji": "🌸",
                        "concrete_instruction": "İlk gruptaki çiçekleri toplam alanına sürükle!",
                        "representational_instruction": "Sayı doğrusunda 6'dan başla, 3 adım ilerle!",
                        "abstract_instruction": "6 + 3 = ?",
                    },
                ],
                "show_number_line": True,
                "show_steps": True,
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 4,
        "title": "Çıkarma (CRA Modeli)",
        "description": "Çıkarmayı somuttan soyuta CRA modeli ile öğrenme. Nesneleri ayırma, sayı doğrusunda geri gitme ve sembolik çıkarma.",
        "activity_type": ActivityType.SUBTRACTION_CRA,
        "difficulty_level": 3,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "background_color": "#FFFBF0",
            "text_color": "#2D3748",
            "cra_phase": "full_cra",
            "activity": {
                "type": "subtraction_cra",
                "instructions": "Çıkarmayı adım adım öğrenelim!",
                "games": ["subtractionCRA", "numberLine"],
                "problems": [
                    {
                        "a": 5, "b": 2, "answer": 3,
                        "emoji": "🍎",
                        "concrete_instruction": "Sepetten 2 elmayı dışarı çıkar!",
                        "representational_instruction": "Sayı doğrusunda 5'ten başla, 2 adım geri git!",
                        "abstract_instruction": "5 - 2 = ?",
                    },
                    {
                        "a": 7, "b": 3, "answer": 4,
                        "emoji": "🍊",
                        "concrete_instruction": "Sepetten 3 portakalı dışarı çıkar!",
                        "representational_instruction": "Sayı doğrusunda 7'den başla, 3 adım geri git!",
                        "abstract_instruction": "7 - 3 = ?",
                    },
                    {
                        "a": 6, "b": 4, "answer": 2,
                        "emoji": "⭐",
                        "concrete_instruction": "6 yıldızdan 4 tanesini çıkar!",
                        "representational_instruction": "Sayı doğrusunda 6'dan başla, 4 adım geri git!",
                        "abstract_instruction": "6 - 4 = ?",
                    },
                    {
                        "a": 8, "b": 3, "answer": 5,
                        "emoji": "🎈",
                        "concrete_instruction": "8 balondan 3 tanesini uçur!",
                        "representational_instruction": "Sayı doğrusunda 8'den başla, 3 adım geri git!",
                        "abstract_instruction": "8 - 3 = ?",
                    },
                    {
                        "a": 9, "b": 5, "answer": 4,
                        "emoji": "🌸",
                        "concrete_instruction": "9 çiçekten 5 tanesini kopar!",
                        "representational_instruction": "Sayı doğrusunda 9'dan başla, 5 adım geri git!",
                        "abstract_instruction": "9 - 5 = ?",
                    },
                ],
                "show_number_line": True,
                "show_steps": True,
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 5,
        "title": "Problem Çözme Stratejileri",
        "description": "Sözel problemleri adım adım çözme. Açık öğretim formatıyla problemi okuma, bilgi çıkarma, işlem seçme ve doğrulama.",
        "activity_type": ActivityType.WORD_PROBLEM,
        "difficulty_level": 3,
        "expected_duration_minutes": 18,
        "min_score_to_pass": 60,
        "content_config": {
            "background_color": "#FFFBF0",
            "text_color": "#2D3748",
            "cra_phase": "abstract_with_support",
            "activity": {
                "type": "word_problem",
                "instructions": "Problemi adım adım birlikte çözelim!",
                "games": ["wordProblem", "additionCRA"],
                "problems": [
                    {
                        "text": "Ali'nin 3 topu var. 2 top daha aldı. Kaç topu oldu?",
                        "first_info": {"label": "İlk bilgi", "value": "3 top", "options": ["3 top", "2 top", "5 top"]},
                        "change_info": {"label": "Ne değişti?", "value": "+2 top aldı", "options": ["+2 top aldı", "-2 top verdi"]},
                        "operation": {"label": "Hangi işlem?", "value": "+", "options": ["+ TOPLAMA", "- ÇIKARMA"]},
                        "equation": "3 + 2 = ?",
                        "answer": 5,
                        "keyword": "aldı",
                        "keyword_meaning": "ekleme → toplama",
                        "visual": "🏀🏀🏀 + 🏀🏀",
                    },
                    {
                        "text": "Ayşe'nin 7 çiçeği var. 3 tanesini arkadaşına verdi. Kaç çiçeği kaldı?",
                        "first_info": {"label": "İlk bilgi", "value": "7 çiçek", "options": ["7 çiçek", "3 çiçek", "4 çiçek"]},
                        "change_info": {"label": "Ne değişti?", "value": "-3 çiçek verdi", "options": ["+3 çiçek aldı", "-3 çiçek verdi"]},
                        "operation": {"label": "Hangi işlem?", "value": "-", "options": ["+ TOPLAMA", "- ÇIKARMA"]},
                        "equation": "7 - 3 = ?",
                        "answer": 4,
                        "keyword": "verdi",
                        "keyword_meaning": "çıkarma → eksiltme",
                        "visual": "🌸🌸🌸🌸🌸🌸🌸 - 🌸🌸🌸",
                    },
                    {
                        "text": "Bahçede 4 kedi var. 5 kedi daha geldi. Kaç kedi oldu?",
                        "first_info": {"label": "İlk bilgi", "value": "4 kedi", "options": ["4 kedi", "5 kedi", "9 kedi"]},
                        "change_info": {"label": "Ne değişti?", "value": "+5 kedi geldi", "options": ["+5 kedi geldi", "-5 kedi gitti"]},
                        "operation": {"label": "Hangi işlem?", "value": "+", "options": ["+ TOPLAMA", "- ÇIKARMA"]},
                        "equation": "4 + 5 = ?",
                        "answer": 9,
                        "keyword": "geldi",
                        "keyword_meaning": "ekleme → toplama",
                        "visual": "🐱🐱🐱🐱 + 🐱🐱🐱🐱🐱",
                    },
                    {
                        "text": "Ağaçta 8 kuş var. 4 kuş uçup gitti. Kaç kuş kaldı?",
                        "first_info": {"label": "İlk bilgi", "value": "8 kuş", "options": ["8 kuş", "4 kuş", "12 kuş"]},
                        "change_info": {"label": "Ne değişti?", "value": "-4 kuş gitti", "options": ["+4 kuş geldi", "-4 kuş gitti"]},
                        "operation": {"label": "Hangi işlem?", "value": "-", "options": ["+ TOPLAMA", "- ÇIKARMA"]},
                        "equation": "8 - 4 = ?",
                        "answer": 4,
                        "keyword": "gitti",
                        "keyword_meaning": "çıkarma → eksiltme",
                        "visual": "🐦🐦🐦🐦🐦🐦🐦🐦 - 🐦🐦🐦🐦",
                    },
                ],
                "step_navigation": True,
                "visual_diagram": True,
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 18,
            },
        },
    },

]


# ═══════════════════════════════════════════════════════════════
# SEED USERS AND PROFILES
# ═══════════════════════════════════════════════════════════════

SEED_USERS = [
    {
        "email": "admin@yububu.com",
        "name": "Admin Kullanıcı",
        "password": "admin123456",
        "role": "admin",
    },
    {
        "email": "teacher@yububu.com",
        "name": "Ayşe Öğretmen",
        "password": "teacher123456",
        "role": "teacher",
    },
    {
        "email": "parent@yububu.com",
        "name": "Mehmet Veli",
        "password": "parent123456",
        "role": "parent",
    },
    {
        "email": "student.dyslexia@yububu.com",
        "name": "Ali Disleksi",
        "password": "student123456",
        "role": "student",
        "profile": {
            "age": 8,
            "learning_difficulty": LearningDifficulty.DYSLEXIA,
            "preferences": {
                "font_family": "OpenDyslexic",
                "font_size": 20,
                "high_contrast": True,
                "audio_feedback": True,
            },
        },
    },
    {
        "email": "student.dysgraphia@yububu.com",
        "name": "Zeynep Disgrafi",
        "password": "student123456",
        "role": "student",
        "profile": {
            "age": 7,
            "learning_difficulty": LearningDifficulty.DYSGRAPHIA,
            "preferences": {
                "wide_line_spacing": True,
                "dotted_guidelines": True,
                "stroke_guides": True,
                "motor_exercises": True,
            },
        },
    },
    {
        "email": "student.dyscalculia@yububu.com",
        "name": "Can Diskalkuli",
        "password": "student123456",
        "role": "student",
        "profile": {
            "age": 9,
            "learning_difficulty": LearningDifficulty.DYSCALCULIA,
            "preferences": {
                "visual_math_tools": True,
                "number_line_visible": True,
                "step_by_step_solutions": True,
            },
        },
    },
]


async def seed_database():
    """Seed the database with initial data."""
    from app.domain.entities.enums import UserRole

    logger.info("🌱 Starting database seeding...")

    await init_db()

    async with async_session_factory() as session:
        # Check if data already exists
        from sqlalchemy import select, func
        user_count_result = await session.execute(select(func.count(UserModel.id)))
        user_count = user_count_result.scalar() or 0

        chapter_count_result = await session.execute(select(func.count(ChapterModel.id)))
        chapter_count = chapter_count_result.scalar() or 0

        if user_count > 0 and chapter_count > 0:
            logger.info("Database already has data. Skipping seed.")
            return

        # Create users (if none exist)
        created_users = {}
        if user_count == 0:
            for user_data in SEED_USERS:
                user_model = UserModel(
                    id=uuid.uuid4(),
                    email=user_data["email"],
                    name=user_data["name"],
                    hashed_password=AuthService.hash_password(user_data["password"]),
                    role=UserRole(user_data["role"]),
                    is_active=True,
                )
                session.add(user_model)
                created_users[user_data["email"]] = user_model
                logger.info(f"  Created user: {user_data['email']} ({user_data['role']})")

            await session.flush()

            # Create student profiles
            for user_data in SEED_USERS:
                if "profile" in user_data:
                    user_model = created_users[user_data["email"]]
                    profile_data = user_data["profile"]
                    profile_model = StudentProfileModel(
                        id=uuid.uuid4(),
                        user_id=user_model.id,
                        age=profile_data["age"],
                        learning_difficulty=profile_data["learning_difficulty"],
                        current_level=1,
                        total_score=0,
                        preferences=profile_data["preferences"],
                        streak_days=0,
                    )
                    session.add(profile_model)
                    logger.info(
                        f"  Created profile: {user_data['name']} "
                        f"({profile_data['learning_difficulty'].value})"
                    )

            await session.flush()

        # Create chapters (if none exist)
        if chapter_count == 0:
            for ch_data in CHAPTERS:
                chapter_model = ChapterModel(
                    id=uuid.uuid4(),
                    difficulty_type=ch_data["difficulty_type"],
                    chapter_number=ch_data["chapter_number"],
                    title=ch_data["title"],
                    description=ch_data["description"],
                    content_config=ch_data["content_config"],
                    activity_type=ch_data["activity_type"],
                    difficulty_level=ch_data["difficulty_level"],
                    expected_duration_minutes=ch_data["expected_duration_minutes"],
                    min_score_to_pass=ch_data["min_score_to_pass"],
                    is_active=True,
                )
                session.add(chapter_model)
                logger.info(
                    f"  Created chapter: {ch_data['title']} "
                    f"({ch_data['difficulty_type'].value} #{ch_data['chapter_number']})"
                )

        await session.commit()
        logger.info("✅ Database seeding completed!")
        logger.info(f"   - {len(SEED_USERS)} users created")
        logger.info(f"   - {len(CHAPTERS)} chapters created")
        logger.info(
            f"   - {sum(1 for u in SEED_USERS if 'profile' in u)} student profiles created"
        )


if __name__ == "__main__":
    asyncio.run(seed_database())
