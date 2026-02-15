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

    # ─── DYSCALCULIA (Diskalkuli) - 5 Bölüm ────────────────
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 1,
        "title": "Sayıları Tanıyalım",
        "description": "Somut nesnelerle sayıları tanıma ve sayma aktivitesi.",
        "activity_type": ActivityType.CONCRETE_COUNTING,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "visual_aids": True,
            "activity": {
                "type": "concrete_counting",
                "instructions": "Nesneleri say ve doğru sayıyı seç!",
                "exercises": [
                    {"objects": "🍎🍎🍎", "answer": 3, "options": [2, 3, 4]},
                    {"objects": "⭐⭐⭐⭐⭐", "answer": 5, "options": [4, 5, 6]},
                    {"objects": "🐟🐟", "answer": 2, "options": [1, 2, 3]},
                    {"objects": "🌸🌸🌸🌸", "answer": 4, "options": [3, 4, 5]},
                    {"objects": "🎈🎈🎈🎈🎈🎈🎈", "answer": 7, "options": [6, 7, 8]},
                ],
                "number_line_visible": True,
                "show_fingers": True,
            },
            "calculator_available": False,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 10,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 2,
        "title": "Sayı Çizgisi Macerası",
        "description": "İnteraktif sayı çizgisi üzerinde sayı yerleştirme ve karşılaştırma.",
        "activity_type": ActivityType.NUMBER_LINE,
        "difficulty_level": 2,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 50,
        "content_config": {
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "activity": {
                "type": "number_line",
                "instructions": "Sayıyı sayı çizgisinde doğru yere yerleştir!",
                "number_range": {"min": 0, "max": 20},
                "exercises": [
                    {"number": 5, "hint": "5, 4'ten büyük 6'dan küçük"},
                    {"number": 10, "hint": "10, tam ortada"},
                    {"number": 3, "hint": "3, başlangıca yakın"},
                    {"number": 15, "hint": "15, 10 ile 20 arasında"},
                    {"number": 8, "hint": "8, 10'a yakın ama küçük"},
                ],
                "interactive": True,
                "show_landmarks": [0, 5, 10, 15, 20],
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
        "chapter_number": 3,
        "title": "Toplama Arkadaşım",
        "description": "Görsel nesnelerle basit toplama işlemleri.",
        "activity_type": ActivityType.VISUAL_MATH,
        "difficulty_level": 2,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "activity": {
                "type": "visual_addition",
                "instructions": "Nesneleri topla ve cevabı bul!",
                "problems": [
                    {
                        "visual": "🍎🍎 + 🍎 = ?",
                        "equation": "2 + 1 = ?",
                        "answer": 3,
                        "options": [2, 3, 4],
                        "step_by_step": ["İlk grupta 2 elma var", "İkinci grupta 1 elma var", "Hepsini say: 3"],
                    },
                    {
                        "visual": "⭐⭐⭐ + ⭐⭐ = ?",
                        "equation": "3 + 2 = ?",
                        "answer": 5,
                        "options": [4, 5, 6],
                        "step_by_step": ["İlk grupta 3 yıldız var", "İkinci grupta 2 yıldız var", "Hepsini say: 5"],
                    },
                    {
                        "visual": "🎈🎈🎈🎈 + 🎈🎈🎈 = ?",
                        "equation": "4 + 3 = ?",
                        "answer": 7,
                        "options": [6, 7, 8],
                        "step_by_step": ["İlk grupta 4 balon var", "İkinci grupta 3 balon var", "Hepsini say: 7"],
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
        "title": "Şekiller Dünyası",
        "description": "Temel geometrik şekilleri tanıma ve sınıflandırma.",
        "activity_type": ActivityType.SHAPE_LEARNING,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 60,
        "content_config": {
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "activity": {
                "type": "shape_recognition",
                "instructions": "Şekilleri tanı ve doğru sepete koy!",
                "shapes": [
                    {"name": "Daire", "sides": 0, "image": "circle.png", "color": "#FF6B6B", "real_life": "Top, pizza, saat"},
                    {"name": "Kare", "sides": 4, "image": "square.png", "color": "#4ECDC4", "real_life": "Pencere, kutu, fayans"},
                    {"name": "Üçgen", "sides": 3, "image": "triangle.png", "color": "#45B7D1", "real_life": "Çatı, pizza dilimi, piramit"},
                    {"name": "Dikdörtgen", "sides": 4, "image": "rectangle.png", "color": "#96CEB4", "real_life": "Kapı, kitap, telefon"},
                ],
                "sorting_game": True,
                "show_properties": True,
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSCALCULIA,
        "chapter_number": 5,
        "title": "Grafik Okuma Macerası",
        "description": "Basit çubuk grafikleri okuma ve yorumlama.",
        "activity_type": ActivityType.GRAPH_EXERCISE,
        "difficulty_level": 4,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "activity": {
                "type": "bar_chart_reading",
                "instructions": "Grafiği oku ve soruları cevapla!",
                "charts": [
                    {
                        "title": "Sınıftaki Hayvan Sahipleri",
                        "data": [
                            {"label": "Kedi", "value": 5, "color": "#FF6B6B"},
                            {"label": "Köpek", "value": 8, "color": "#4ECDC4"},
                            {"label": "Balık", "value": 3, "color": "#45B7D1"},
                            {"label": "Kuş", "value": 4, "color": "#96CEB4"},
                        ],
                        "questions": [
                            {"question": "En çok hangi hayvan var?", "answer": "Köpek"},
                            {"question": "Kaç kişinin kedisi var?", "answer": "5"},
                            {"question": "Balık mı kuş mu daha çok?", "answer": "Kuş"},
                        ],
                    },
                ],
                "visual_bars": True,
                "interactive_hover": True,
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 15,
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
