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

    # ─── AUTISM (Otizm) - 5 Bölüm ──────────────────────────
    {
        "difficulty_type": LearningDifficulty.AUTISM,
        "chapter_number": 1,
        "title": "Günlük Rutinlerim",
        "description": "Günlük rutinleri görsel programla takip etme. Öngörülebilir yapı.",
        "activity_type": ActivityType.ROUTINE_ACTIVITY,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "layout": "predictable",
            "minimal_animations": True,
            "background_color": "#F0F4F8",
            "text_color": "#2D3748",
            "activity": {
                "type": "routine_ordering",
                "instructions_step_by_step": [
                    "1. Resimlere bak",
                    "2. Her resim bir günlük aktiviteyi gösteriyor",
                    "3. Resimleri doğru sıraya koy",
                    "4. Bitti butonuna bas",
                ],
                "routines": [
                    {"step": 1, "title": "Uyanma", "image": "wake_up.png", "time": "07:00"},
                    {"step": 2, "title": "Yüz yıkama", "image": "wash_face.png", "time": "07:10"},
                    {"step": 3, "title": "Kahvaltı", "image": "breakfast.png", "time": "07:30"},
                    {"step": 4, "title": "Okula gitme", "image": "go_school.png", "time": "08:00"},
                    {"step": 5, "title": "Ders", "image": "lesson.png", "time": "08:30"},
                ],
                "visual_schedule": True,
                "timer_visible": False,
            },
            "transition_warning": "Bir sonraki adıma geçeceğiz",
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 10,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.AUTISM,
        "chapter_number": 2,
        "title": "Duygular Ne Söylüyor?",
        "description": "Yüz ifadelerinden duyguları tanıma. Net ve açık görseller.",
        "activity_type": ActivityType.SOCIAL_STORY,
        "difficulty_level": 2,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 50,
        "content_config": {
            "layout": "predictable",
            "minimal_animations": True,
            "background_color": "#F0F4F8",
            "activity": {
                "type": "emotion_recognition",
                "instructions_step_by_step": [
                    "1. Yüz resmine bak",
                    "2. Bu kişi ne hissediyor?",
                    "3. Doğru duyguyu seç",
                    "4. İleri butonuna bas",
                ],
                "emotions": [
                    {"emotion": "Mutlu", "image": "happy_face.png", "description": "Ağzı yukarı kıvrık, gülümsüyor"},
                    {"emotion": "Üzgün", "image": "sad_face.png", "description": "Ağzı aşağı kıvrık, ağlıyor olabilir"},
                    {"emotion": "Kızgın", "image": "angry_face.png", "description": "Kaşları çatık, ağzı sıkılmış"},
                    {"emotion": "Korkmuş", "image": "scared_face.png", "description": "Gözleri büyük açılmış"},
                    {"emotion": "Şaşkın", "image": "surprised_face.png", "description": "Ağzı açık, gözleri büyük"},
                ],
                "clear_feedback": True,
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.AUTISM,
        "chapter_number": 3,
        "title": "Adım Adım Talimatlar",
        "description": "Basit talimatları adım adım takip etme aktivitesi.",
        "activity_type": ActivityType.STEP_BY_STEP,
        "difficulty_level": 2,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "layout": "predictable",
            "minimal_animations": True,
            "background_color": "#F0F4F8",
            "activity": {
                "type": "follow_instructions",
                "instructions_step_by_step": [
                    "1. Her adımı oku",
                    "2. Adımı yap",
                    "3. Tamam butonuna bas",
                    "4. Sonraki adıma geç",
                ],
                "tasks": [
                    {
                        "title": "Resim Çiz",
                        "steps": [
                            {"step": 1, "text": "Kağıdı al", "image": "paper.png"},
                            {"step": 2, "text": "Kalemi al", "image": "pencil.png"},
                            {"step": 3, "text": "Bir daire çiz", "image": "circle.png"},
                            {"step": 4, "text": "Daireye gözler ekle", "image": "eyes.png"},
                            {"step": 5, "text": "Ağız çiz. Tebrikler!", "image": "smile.png"},
                        ],
                    },
                ],
                "progress_bar": True,
                "one_step_at_a_time": True,
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 3,
                "time_limit_minutes": 10,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.AUTISM,
        "chapter_number": 4,
        "title": "Görsel Program Oluştur",
        "description": "Kendi günlük programını görsellerle oluşturma.",
        "activity_type": ActivityType.VISUAL_SCHEDULE,
        "difficulty_level": 3,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 50,
        "content_config": {
            "layout": "predictable",
            "minimal_animations": True,
            "background_color": "#F0F4F8",
            "activity": {
                "type": "visual_schedule_builder",
                "instructions_step_by_step": [
                    "1. Sol taraftaki aktivitelere bak",
                    "2. Yapmak istediğin aktiviteyi seç",
                    "3. Sağ tarafa sürükle",
                    "4. Doğru sıraya koy",
                ],
                "available_activities": [
                    {"id": 1, "name": "Kahvaltı", "icon": "🍞", "image": "breakfast.png"},
                    {"id": 2, "name": "Ders Çalışma", "icon": "📚", "image": "study.png"},
                    {"id": 3, "name": "Oyun", "icon": "🎮", "image": "play.png"},
                    {"id": 4, "name": "Yemek", "icon": "🍽️", "image": "lunch.png"},
                    {"id": 5, "name": "Uyku", "icon": "😴", "image": "sleep.png"},
                    {"id": 6, "name": "Spor", "icon": "⚽", "image": "sport.png"},
                ],
                "time_slots": ["Sabah", "Öğle", "Öğleden Sonra", "Akşam"],
            },
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 3,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.AUTISM,
        "chapter_number": 5,
        "title": "Kalıp Tanıma",
        "description": "Renk ve şekil kalıplarını tanıma ve devam ettirme.",
        "activity_type": ActivityType.PATTERN_RECOGNITION,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 60,
        "content_config": {
            "layout": "predictable",
            "minimal_animations": True,
            "background_color": "#F0F4F8",
            "activity": {
                "type": "pattern_completion",
                "instructions_step_by_step": [
                    "1. Sıradaki şekillere bak",
                    "2. Kalıbı bul",
                    "3. Sıradaki şekli seç",
                    "4. Doğru cevabı yerleştir",
                ],
                "patterns": [
                    {
                        "sequence": ["🔴", "🔵", "🔴", "🔵", "?"],
                        "answer": "🔴",
                        "options": ["🔴", "🟢", "🔵"],
                    },
                    {
                        "sequence": ["⭐", "⭐", "🌙", "⭐", "⭐", "?"],
                        "answer": "🌙",
                        "options": ["⭐", "🌙", "☀️"],
                    },
                    {
                        "sequence": ["🟦", "🟦", "🟨", "🟦", "🟦", "?"],
                        "answer": "🟨",
                        "options": ["🟦", "🟨", "🟥"],
                    },
                ],
            },
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 12,
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

    # ─── ADHD (DEHB) - 5 Bölüm ─────────────────────────────
    {
        "difficulty_type": LearningDifficulty.ADHD,
        "chapter_number": 1,
        "title": "Süper Hızlı Eşleştirme!",
        "description": "Kısa süreli, ödüllü resim eşleştirme oyunu. Anında geri bildirim!",
        "activity_type": ActivityType.QUICK_CHALLENGE,
        "difficulty_level": 1,
        "expected_duration_minutes": 5,
        "min_score_to_pass": 50,
        "content_config": {
            "colorful_theme": True,
            "background_color": "#FFF5F5",
            "text_color": "#742A2A",
            "activity": {
                "type": "speed_matching",
                "instructions": "Aynı resimleri en hızlı şekilde eşleştir! ⚡",
                "cards": [
                    {"pair_id": 1, "emoji": "🐱", "name": "Kedi"},
                    {"pair_id": 2, "emoji": "🐶", "name": "Köpek"},
                    {"pair_id": 3, "emoji": "🦁", "name": "Aslan"},
                    {"pair_id": 4, "emoji": "🐸", "name": "Kurbağa"},
                    {"pair_id": 5, "emoji": "🦋", "name": "Kelebek"},
                    {"pair_id": 6, "emoji": "🐠", "name": "Balık"},
                ],
                "time_limit_seconds": 60,
                "points_per_match": 10,
                "speed_bonus": True,
                "combo_multiplier": True,
            },
            "instant_rewards": True,
            "progress_bar": True,
            "animations": "dynamic",
            "break_reminder_minutes": 5,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 10,
                "time_limit_minutes": 5,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.ADHD,
        "chapter_number": 2,
        "title": "Puan Toplayıcı! 🎮",
        "description": "Mini oyunlarla puan toplama. Her doğru cevap = anında ödül!",
        "activity_type": ActivityType.REWARD_GAME,
        "difficulty_level": 2,
        "expected_duration_minutes": 7,
        "min_score_to_pass": 50,
        "content_config": {
            "colorful_theme": True,
            "background_color": "#FFF5F5",
            "activity": {
                "type": "point_collector",
                "instructions": "Her soruyu doğru cevapla ve puan topla! 🏆",
                "rounds": [
                    {
                        "question": "2 + 3 = ?",
                        "options": [4, 5, 6],
                        "answer": 5,
                        "points": 10,
                        "bonus_emoji": "⭐",
                    },
                    {
                        "question": "'Kedi' kelimesi kaç harfli?",
                        "options": [3, 4, 5],
                        "answer": 4,
                        "points": 10,
                        "bonus_emoji": "🌟",
                    },
                    {
                        "question": "Gökkuşağında kaç renk var?",
                        "options": [5, 7, 9],
                        "answer": 7,
                        "points": 15,
                        "bonus_emoji": "🌈",
                    },
                    {
                        "question": "Hangi hayvan havlar?",
                        "options": ["Kedi", "Köpek", "Kuş"],
                        "answer": "Köpek",
                        "points": 10,
                        "bonus_emoji": "🐕",
                    },
                ],
                "streak_bonus": True,
                "achievement_popups": True,
            },
            "instant_rewards": True,
            "timer_visible": True,
            "progress_bar": True,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 10,
                "time_limit_minutes": 7,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.ADHD,
        "chapter_number": 3,
        "title": "Odaklan ve Bul! 🎯",
        "description": "Dikkat ve odaklanma becerisi geliştiren oyun.",
        "activity_type": ActivityType.FOCUS_EXERCISE,
        "difficulty_level": 2,
        "expected_duration_minutes": 5,
        "min_score_to_pass": 50,
        "content_config": {
            "colorful_theme": True,
            "background_color": "#FFF5F5",
            "activity": {
                "type": "find_the_difference",
                "instructions": "İki resim arasındaki farkları bul! Dikkatli bak! 🔍",
                "levels": [
                    {
                        "image_a": "scene_a_1.png",
                        "image_b": "scene_b_1.png",
                        "differences": 3,
                        "time_limit_seconds": 30,
                        "points": 20,
                    },
                    {
                        "image_a": "scene_a_2.png",
                        "image_b": "scene_b_2.png",
                        "differences": 4,
                        "time_limit_seconds": 40,
                        "points": 30,
                    },
                    {
                        "image_a": "scene_a_3.png",
                        "image_b": "scene_b_3.png",
                        "differences": 5,
                        "time_limit_seconds": 50,
                        "points": 40,
                    },
                ],
                "hint_system": True,
                "celebration_animation": True,
            },
            "instant_rewards": True,
            "break_after_level": True,
            "progress_bar": True,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 5,
                "time_limit_minutes": 5,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.ADHD,
        "chapter_number": 4,
        "title": "Zamana Karşı Yarış! ⏱️",
        "description": "Kısa süreli aktivitelerle hızlı düşünme becerisi.",
        "activity_type": ActivityType.TIMER_ACTIVITY,
        "difficulty_level": 3,
        "expected_duration_minutes": 8,
        "min_score_to_pass": 50,
        "content_config": {
            "colorful_theme": True,
            "background_color": "#FFF5F5",
            "activity": {
                "type": "timed_challenges",
                "instructions": "Her mini oyunu süre dolmadan bitir! ⏰",
                "challenges": [
                    {
                        "type": "color_tap",
                        "description": "Ekrandaki mavi dairelere dokunun!",
                        "target_color": "blue",
                        "duration_seconds": 15,
                        "target_count": 10,
                    },
                    {
                        "type": "number_order",
                        "description": "Sayıları küçükten büyüğe sırala!",
                        "numbers": [5, 2, 8, 1, 4],
                        "duration_seconds": 20,
                    },
                    {
                        "type": "word_spell",
                        "description": "Harfleri sürükleyerek kelimeyi yaz!",
                        "word": "OKUL",
                        "scrambled": ["K", "O", "U", "L"],
                        "duration_seconds": 15,
                    },
                ],
                "countdown_visible": True,
                "bonus_time_powerup": True,
            },
            "instant_rewards": True,
            "timer_visible": True,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 10,
                "time_limit_minutes": 8,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.ADHD,
        "chapter_number": 5,
        "title": "Rozet Avcısı! 🏆",
        "description": "Tüm rozetleri toplamak için çeşitli görevleri tamamla!",
        "activity_type": ActivityType.BADGE_QUEST,
        "difficulty_level": 4,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 60,
        "content_config": {
            "colorful_theme": True,
            "background_color": "#FFF5F5",
            "activity": {
                "type": "badge_quest",
                "instructions": "Görevleri tamamla ve rozet kazan! 🎯",
                "quests": [
                    {
                        "badge": "Hızlı Düşünür ⚡",
                        "task": "3 Soruyu 30 saniyede cevapla",
                        "questions": [
                            {"q": "1 + 1 = ?", "a": 2},
                            {"q": "Muz hangi renk?", "a": "Sarı"},
                            {"q": "3 > 2 mi?", "a": "Evet"},
                        ],
                    },
                    {
                        "badge": "Kelime Ustası 📝",
                        "task": "4 kelimeyi doğru hecele",
                        "words": ["EV", "GÖZ", "SU", "AY"],
                    },
                    {
                        "badge": "Matematik Yıldızı ⭐",
                        "task": "5 toplama sorusunu çöz",
                        "problems": ["1+2", "2+3", "4+1", "3+3", "2+2"],
                    },
                ],
                "badge_animation": True,
                "progress_tracker": True,
            },
            "instant_rewards": True,
            "gamification_enhanced": True,
            "progress_bar": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 10,
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
        "email": "student.autism@yububu.com",
        "name": "Zeynep Otizm",
        "password": "student123456",
        "role": "student",
        "profile": {
            "age": 7,
            "learning_difficulty": LearningDifficulty.AUTISM,
            "preferences": {
                "predictable_layout": True,
                "minimal_animations": True,
                "visual_schedule": True,
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
    {
        "email": "student.adhd@yububu.com",
        "name": "Elif DEHB",
        "password": "student123456",
        "role": "student",
        "profile": {
            "age": 8,
            "learning_difficulty": LearningDifficulty.ADHD,
            "preferences": {
                "short_activities": True,
                "instant_rewards": True,
                "colorful_interface": True,
                "timer_visible": True,
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
        result = await session.execute(select(func.count(UserModel.id)))
        count = result.scalar()
        if count and count > 0:
            logger.info("Database already has data. Skipping seed.")
            return

        # Create users
        created_users = {}
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

        # Create chapters
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
