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
    # ─── DYSLEXIA (Disleksi) - Orton-Gillingham Temelli 5 Bölüm ─────────────────────
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 1,
        "title": "Ses Farkındalığı",
        "description": "Kafiye eşleştirme ve hece bölme ile fonolojik farkındalık geliştirme. Çok duyulu (VAKT) yaklaşım.",
        "activity_type": ActivityType.RHYME_MATCHING,
        "difficulty_level": 1,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 24,
            "background_color": "#FFFACD",
            "text_color": "#1F2937",
            "line_spacing": 1.8,
            "letter_spacing": "0.12em",
            "activity": {
                "type": "phonological_awareness",
                "instructions": "Sesleri dinle, kafiye ve heceleri keşfet!",
                "games": ["rhymeMatch", "syllableSegment"],
                "og_phase": "phonological_awareness",
                "vakt_modalities": ["visual", "auditory", "kinesthetic"],
            },
            "audio_feedback": True,
            "positive_only_feedback": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 2,
        "title": "Harf-Ses İlişkisi (Phonics)",
        "description": "Harflerin seslerini öğrenme - Gör, Duy, Havada Yaz, İzle (VAKT). Orton-Gillingham phonics yaklaşımı.",
        "activity_type": ActivityType.LETTER_SOUND,
        "difficulty_level": 2,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 28,
            "background_color": "#FFFACD",
            "text_color": "#1F2937",
            "line_spacing": 1.8,
            "letter_spacing": "0.12em",
            "activity": {
                "type": "letter_sound_mapping",
                "instructions": "Her harfin sesini öğren: Gör, Duy, Havada Yaz, İzle!",
                "games": ["letterSound", "wordMatch"],
                "og_phase": "alphabetic_principle",
                "vakt_modalities": ["visual", "auditory", "kinesthetic", "tactile"],
            },
            "audio_feedback": True,
            "positive_only_feedback": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 3,
        "title": "Kelime Tanıma",
        "description": "Sık kullanılan kelimeleri hızlıca tanıma - görsel hafıza kartları ve kelime eşleştirme.",
        "activity_type": ActivityType.SIGHT_WORD,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 26,
            "background_color": "#FFFACD",
            "text_color": "#1F2937",
            "line_spacing": 1.8,
            "letter_spacing": "0.12em",
            "activity": {
                "type": "sight_word_recognition",
                "instructions": "Kelimeleri hızlıca tanı ve eşleştir!",
                "games": ["sightWordFlashcard", "wordMatch"],
                "og_phase": "word_recognition",
                "vakt_modalities": ["visual", "auditory"],
            },
            "audio_feedback": True,
            "positive_only_feedback": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 5,
                "time_limit_minutes": 12,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 4,
        "title": "Okuma Akıcılığı",
        "description": "Tekrarlı okuma ile akıcılık geliştirme - kelime hızı (WPM) takibi ve okuma cetveli.",
        "activity_type": ActivityType.REPEATED_READING,
        "difficulty_level": 4,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 50,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 24,
            "background_color": "#FFFACD",
            "text_color": "#1F2937",
            "line_spacing": 2.0,
            "letter_spacing": "0.12em",
            "activity": {
                "type": "fluency_practice",
                "instructions": "Metni oku, hızını artır, akıcılığını geliştir!",
                "games": ["repeatedReading", "letterTracing"],
                "og_phase": "fluency",
                "vakt_modalities": ["visual", "auditory"],
                "reading_ruler": True,
                "wpm_tracking": True,
            },
            "audio_feedback": True,
            "positive_only_feedback": True,
            "success_criteria": {
                "min_score": 50,
                "max_attempts": 3,
                "time_limit_minutes": 15,
            },
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSLEXIA,
        "chapter_number": 5,
        "title": "Okuduğunu Anlama",
        "description": "Tahmin et, sorgula, görselleştir, bağla, özetle - 5 strateji ile okuduğunu anlama.",
        "activity_type": ActivityType.COMPREHENSION,
        "difficulty_level": 5,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "font": "OpenDyslexic",
            "font_size": 24,
            "background_color": "#FFFACD",
            "text_color": "#1F2937",
            "line_spacing": 2.0,
            "letter_spacing": "0.12em",
            "activity": {
                "type": "reading_comprehension",
                "instructions": "Hikayeyi oku, soruları yanıtla, stratejileri kullan!",
                "games": ["comprehension"],
                "og_phase": "comprehension",
                "strategies": ["predict", "question", "visualize", "connect", "summarize"],
            },
            "audio_feedback": True,
            "positive_only_feedback": True,
            "success_criteria": {
                "min_score": 60,
                "max_attempts": 3,
                "time_limit_minutes": 15,
            },
        },
    },

    # ═══════════════════════════════════════════════════════════════
    # DYSGRAPHIA (Disgrafi) - 20 Bölüm (Kanıta Dayalı Yazma Eğitimi)
    # Graham & Harris (2005), MacArthur (2009), Morphy & Graham (2012)
    # 5 Ana Bölüm × 4 Ünite: Ön-Yazma → Harf Oluşturma → Yazım → Cümle → Kompozisyon
    # ═══════════════════════════════════════════════════════════════

    # ─── BÖLÜM 1: ÖN-YAZMA BECERİLERİ (Pre-Writing Skills) ─────
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 1,
        "title": "Kalem Tutuş ve Kavrama",
        "description": "Doğru kalem tutuşu (tripod grip), el pozisyonu ve parmak gücü geliştirme. Wet-Dry-Try yöntemi ile temel kavrama becerileri.",
        "activity_type": ActivityType.GRIP_TRAINING,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "section": "pre_writing",
            "section_title": "Ön-Yazma Becerileri",
            "section_color": "#10B981",
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "methodology": "wet_dry_try",
            "literature_ref": "Olsen (2003) - Handwriting Without Tears",
            "activity": {
                "type": "grip_training",
                "instructions": "Doğru kalem tutuşunu öğren! Üç parmak tutuşu ile başla. ✍️",
                "exercises": [
                    {
                        "name": "Üç Parmak Tutuşu",
                        "description": "Baş parmak, işaret parmağı ve orta parmakla kalem tutma",
                        "visual_guide": "tripod_grip_guide",
                        "steps": ["Kalemi işaret parmağına yerleştir", "Baş parmakla tut", "Orta parmakla destekle"],
                    },
                    {
                        "name": "Parmak Gücü Egzersizi",
                        "description": "Hamur sıkma, makas kullanma simülasyonu",
                        "exercises": ["squeeze_release", "pinch_drag", "finger_tap"],
                    },
                    {
                        "name": "Islak-Kuru-Dene",
                        "description": "Wet-Dry-Try yöntemiyle temel izleme",
                        "phases": ["wet_trace", "dry_trace", "try_alone"],
                    },
                ],
                "haptic_feedback": True,
                "show_hand_position": True,
            },
            "success_criteria": {"min_score": 50, "max_attempts": 5, "time_limit_minutes": 10},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 2,
        "title": "Şekil ve Çizgi İzleme",
        "description": "Temel şekiller (daire, kare, üçgen) ve çizgi türlerini (düz, eğri, dalgalı) izleme. Görsel-motor koordinasyon.",
        "activity_type": ActivityType.SHAPE_TRACING,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "section": "pre_writing",
            "section_title": "Ön-Yazma Becerileri",
            "section_color": "#10B981",
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "methodology": "progressive_complexity",
            "activity": {
                "type": "shape_tracing",
                "instructions": "Şekilleri ve çizgileri parmağınla takip et! 🖊️",
                "shapes": [
                    {"type": "horizontal_line", "difficulty": 1, "label": "Düz Çizgi"},
                    {"type": "vertical_line", "difficulty": 1, "label": "Dikey Çizgi"},
                    {"type": "circle", "difficulty": 2, "label": "Daire"},
                    {"type": "square", "difficulty": 2, "label": "Kare"},
                    {"type": "triangle", "difficulty": 3, "label": "Üçgen"},
                    {"type": "zigzag", "difficulty": 3, "label": "Zikzak"},
                    {"type": "wave", "difficulty": 4, "label": "Dalgalı Çizgi"},
                    {"type": "spiral", "difficulty": 4, "label": "Spiral"},
                ],
                "tolerance_px": 20,
                "show_direction_arrows": True,
                "animation_guide": True,
                "progressive_fade": True,
            },
            "success_criteria": {"min_score": 50, "max_attempts": 5, "time_limit_minutes": 10},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 3,
        "title": "Göz-El Koordinasyonu",
        "description": "Labirent takibi, nokta birleştirme ve hedef vurma aktiviteleri. İnce motor beceri ve görsel-motor entegrasyonu.",
        "activity_type": ActivityType.EYE_HAND_COORDINATION,
        "difficulty_level": 1,
        "expected_duration_minutes": 10,
        "min_score_to_pass": 50,
        "content_config": {
            "section": "pre_writing",
            "section_title": "Ön-Yazma Becerileri",
            "section_color": "#10B981",
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "methodology": "visual_motor_integration",
            "activity": {
                "type": "eye_hand_coordination",
                "instructions": "Gözlerinle takip et, elinle çiz! 👀✋",
                "games": [
                    {
                        "type": "maze",
                        "difficulty_levels": [1, 2, 3],
                        "description": "Labirentten çıkış yolunu bul ve çiz",
                    },
                    {
                        "type": "dot_connect",
                        "max_dots": 20,
                        "description": "Numaralı noktaları birleştirerek resim oluştur",
                    },
                    {
                        "type": "target_trace",
                        "description": "Hareketli hedefi izle ve üzerine bas",
                        "speed": "slow",
                    },
                ],
                "adaptive_difficulty": True,
            },
            "success_criteria": {"min_score": 50, "max_attempts": 5, "time_limit_minutes": 10},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 4,
        "title": "Uzamsal Farkındalık ve Satır Bilgisi",
        "description": "Üç çizgi sistemi (üst, orta, alt), harf boyutu kavramı ve sayfa düzeni. Yazı alanı farkındalığı.",
        "activity_type": ActivityType.SPATIAL_AWARENESS,
        "difficulty_level": 2,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 50,
        "content_config": {
            "section": "pre_writing",
            "section_title": "Ön-Yazma Becerileri",
            "section_color": "#10B981",
            "background_color": "#F0FFF4",
            "text_color": "#22543D",
            "methodology": "three_line_system",
            "activity": {
                "type": "spatial_awareness",
                "instructions": "Üç çizgi sistemini tanı! Harfler nerede yaşar? 📏",
                "exercises": [
                    {
                        "name": "Üç Çizgi Tanıma",
                        "description": "Üst çizgi, orta çizgi ve alt çizgiyi tanı",
                        "zones": ["sky_line", "mid_line", "base_line", "descender_line"],
                    },
                    {
                        "name": "Harf Boyutu",
                        "description": "Büyük (uzun), orta ve kuyruklu harfleri tanı",
                        "categories": {
                            "tall": ["b", "d", "f", "h", "k", "l", "t"],
                            "small": ["a", "c", "e", "m", "n", "o", "r", "s", "u"],
                            "descender": ["g", "j", "p", "q", "y"],
                        },
                    },
                    {
                        "name": "Yerleştirme Oyunu",
                        "description": "Harfi doğru çizgi aralığına yerleştir",
                    },
                ],
                "three_line_guide": True,
                "color_coded_zones": True,
            },
            "success_criteria": {"min_score": 50, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },

    # ─── BÖLÜM 2: HARF OLUŞTURMA (Letter Formation) ─────────────
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 5,
        "title": "Basit Harfler (Düz Çizgi Harfler)",
        "description": "Düz çizgilerden oluşan harfleri yazma: I, L, T, E, F, H. Vuruş sırası ve yön okları ile rehberlik.",
        "activity_type": ActivityType.LETTER_FORMATION_SIMPLE,
        "difficulty_level": 2,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "letter_formation",
            "section_title": "Harf Oluşturma",
            "section_color": "#3B82F6",
            "background_color": "#EFF6FF",
            "text_color": "#1E3A5F",
            "methodology": "wet_dry_try",
            "literature_ref": "Graham (1999) - Handwriting instruction",
            "activity": {
                "type": "letter_formation",
                "sub_type": "simple_strokes",
                "instructions": "Düz çizgili harfleri öğren! Ok yönünü takip et. ✏️",
                "letters": [
                    {"letter": "I", "strokes": [{"dir": "top_down", "type": "vertical"}], "difficulty": 1},
                    {"letter": "L", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "left_right", "type": "horizontal"}], "difficulty": 1},
                    {"letter": "T", "strokes": [{"dir": "left_right", "type": "horizontal"}, {"dir": "top_down", "type": "vertical"}], "difficulty": 1},
                    {"letter": "E", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "left_right", "type": "horizontal"}, {"dir": "left_right", "type": "horizontal"}, {"dir": "left_right", "type": "horizontal"}], "difficulty": 2},
                    {"letter": "F", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "left_right", "type": "horizontal"}, {"dir": "left_right", "type": "horizontal"}], "difficulty": 2},
                    {"letter": "H", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "top_down", "type": "vertical"}, {"dir": "left_right", "type": "horizontal"}], "difficulty": 2},
                ],
                "three_line_guide": True,
                "show_stroke_order": True,
                "show_direction_arrows": True,
                "animation_demo": True,
                "practice_phases": ["watch", "trace_dotted", "trace_faded", "write_alone"],
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 6,
        "title": "Eğri Çizgi Harfler",
        "description": "Eğri ve yuvarlak çizgiler içeren harfleri yazma: C, O, S, U, J, G, D, B, P, R. Kılavuz noktalar ile yazım.",
        "activity_type": ActivityType.LETTER_FORMATION_COMPLEX,
        "difficulty_level": 3,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "letter_formation",
            "section_title": "Harf Oluşturma",
            "section_color": "#3B82F6",
            "background_color": "#EFF6FF",
            "text_color": "#1E3A5F",
            "methodology": "wet_dry_try",
            "activity": {
                "type": "letter_formation",
                "sub_type": "curved_strokes",
                "instructions": "Eğri çizgili harfleri öğren! Yavaşça ve dikkatli ol. 🎨",
                "letters": [
                    {"letter": "C", "strokes": [{"dir": "counterclockwise", "type": "curve"}], "difficulty": 1},
                    {"letter": "O", "strokes": [{"dir": "counterclockwise", "type": "circle"}], "difficulty": 1},
                    {"letter": "S", "strokes": [{"dir": "curve_reverse", "type": "s_curve"}], "difficulty": 2},
                    {"letter": "U", "strokes": [{"dir": "down_curve_up", "type": "u_shape"}], "difficulty": 2},
                    {"letter": "D", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "clockwise", "type": "curve"}], "difficulty": 3},
                    {"letter": "B", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "clockwise", "type": "curve"}, {"dir": "clockwise", "type": "curve"}], "difficulty": 3},
                    {"letter": "P", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "clockwise", "type": "curve"}], "difficulty": 3},
                    {"letter": "R", "strokes": [{"dir": "top_down", "type": "vertical"}, {"dir": "clockwise", "type": "curve"}, {"dir": "diagonal", "type": "line"}], "difficulty": 3},
                ],
                "three_line_guide": True,
                "show_stroke_order": True,
                "show_direction_arrows": True,
                "animation_demo": True,
                "practice_phases": ["watch", "trace_dotted", "trace_faded", "write_alone"],
                "guide_points": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 15},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 7,
        "title": "Büyük ve Küçük Harf Eşleştirme",
        "description": "Büyük ve küçük harf formlarını ilişkilendirme, doğru boyut ve konum farkındalığı. Harf çifti tanıma.",
        "activity_type": ActivityType.UPPERCASE_LETTERS,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "letter_formation",
            "section_title": "Harf Oluşturma",
            "section_color": "#3B82F6",
            "background_color": "#EFF6FF",
            "text_color": "#1E3A5F",
            "methodology": "comparative_practice",
            "activity": {
                "type": "uppercase_lowercase_matching",
                "instructions": "Büyük ve küçük harfleri eşleştir ve yaz! Aa Bb Cc 📖",
                "letter_pairs": [
                    {"upper": "A", "lower": "a", "group": "tall_small"},
                    {"upper": "B", "lower": "b", "group": "tall_tall"},
                    {"upper": "C", "lower": "c", "group": "tall_small"},
                    {"upper": "D", "lower": "d", "group": "tall_tall"},
                    {"upper": "E", "lower": "e", "group": "tall_small"},
                    {"upper": "G", "lower": "g", "group": "tall_descender"},
                    {"upper": "K", "lower": "k", "group": "tall_tall"},
                    {"upper": "M", "lower": "m", "group": "tall_small"},
                    {"upper": "N", "lower": "n", "group": "tall_small"},
                    {"upper": "R", "lower": "r", "group": "tall_small"},
                ],
                "games": [
                    {"type": "match_drag", "description": "Büyük harfi küçük harfle eşleştir"},
                    {"type": "write_pair", "description": "Çifti üç çizgili satırda yaz"},
                    {"type": "size_sort", "description": "Harfleri boyutlarına göre grupla"},
                ],
                "three_line_guide": True,
                "size_comparison": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 8,
        "title": "Türkçe Özel Harfler",
        "description": "Ç, Ğ, İ, Ö, Ş, Ü harflerinin yazımı. Nokta, şapka ve kuyruk detayları ile özel karakter eğitimi.",
        "activity_type": ActivityType.TURKISH_SPECIAL_CHARS,
        "difficulty_level": 3,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "letter_formation",
            "section_title": "Harf Oluşturma",
            "section_color": "#3B82F6",
            "background_color": "#EFF6FF",
            "text_color": "#1E3A5F",
            "methodology": "detail_focused",
            "activity": {
                "type": "turkish_special_chars",
                "instructions": "Türkçeye özel harfleri öğren! Noktalar ve işaretler çok önemli! 🇹🇷",
                "special_letters": [
                    {
                        "letter": "Ç", "base": "C", "modifier": "cedilla",
                        "tip": "Önce C yaz, sonra altına kuyruk ekle",
                        "common_error": "Kuyruk unutulur veya yanlış yöne gider",
                    },
                    {
                        "letter": "Ğ", "base": "G", "modifier": "breve",
                        "tip": "Önce G yaz, sonra üstüne küçük hilal koy",
                        "common_error": "Hilal yerine düz çizgi çizilir",
                    },
                    {
                        "letter": "İ", "base": "I", "modifier": "dot_above",
                        "tip": "Büyük İ'nin noktası var, küçük ı'nın yok!",
                        "common_error": "I ve İ karıştırılır",
                    },
                    {
                        "letter": "Ö", "base": "O", "modifier": "diaeresis",
                        "tip": "Önce O yaz, sonra üstüne iki nokta koy",
                        "common_error": "Noktalar çok uzak veya çok yakın",
                    },
                    {
                        "letter": "Ş", "base": "S", "modifier": "cedilla",
                        "tip": "Önce S yaz, sonra altına kuyruk ekle",
                        "common_error": "Kuyruk Ç ile karıştırılır",
                    },
                    {
                        "letter": "Ü", "base": "U", "modifier": "diaeresis",
                        "tip": "Önce U yaz, sonra üstüne iki nokta koy",
                        "common_error": "Ö ile karıştırılır",
                    },
                ],
                "three_line_guide": True,
                "show_base_first": True,
                "highlight_modifier": True,
                "comparison_pairs": [["I", "İ"], ["O", "Ö"], ["U", "Ü"], ["C", "Ç"], ["S", "Ş"], ["G", "Ğ"]],
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 15},
        },
    },

    # ─── BÖLÜM 3: YAZIM BECERİLERİ (Spelling Skills) ───────────
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 9,
        "title": "Ses-Harf İlişkisi ve Fonetik Yazım",
        "description": "Duyduğun sesi doğru harfle yazma. Elkonin kutuları ile ses segmentasyonu ve fonetik farkındalık.",
        "activity_type": ActivityType.PHONICS_SPELLING,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "spelling",
            "section_title": "Yazım Becerileri",
            "section_color": "#8B5CF6",
            "background_color": "#F5F3FF",
            "text_color": "#4C1D95",
            "methodology": "elkonin_boxes",
            "literature_ref": "Elkonin (1973) - Sound analysis method",
            "activity": {
                "type": "phonics_spelling",
                "instructions": "Sesi dinle, doğru harfi bul ve kutuya yerleştir! 🔊",
                "exercises": [
                    {
                        "word": "AT",
                        "sounds": ["A", "T"],
                        "boxes": 2,
                        "image": "horse",
                        "difficulty": 1,
                    },
                    {
                        "word": "EL",
                        "sounds": ["E", "L"],
                        "boxes": 2,
                        "image": "hand",
                        "difficulty": 1,
                    },
                    {
                        "word": "KUŞ",
                        "sounds": ["K", "U", "Ş"],
                        "boxes": 3,
                        "image": "bird",
                        "difficulty": 2,
                    },
                    {
                        "word": "OKUL",
                        "sounds": ["O", "K", "U", "L"],
                        "boxes": 4,
                        "image": "school",
                        "difficulty": 2,
                    },
                    {
                        "word": "ÇOCUK",
                        "sounds": ["Ç", "O", "C", "U", "K"],
                        "boxes": 5,
                        "image": "child",
                        "difficulty": 3,
                    },
                ],
                "audio_support": True,
                "elkonin_visual": True,
                "drag_drop": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 10,
        "title": "Hece Bölme ve Birleştirme",
        "description": "Türkçe hece yapısı, hecelere ayırma ve birleştirme. Ritmik hece sayma ve çok heceli kelime yazımı.",
        "activity_type": ActivityType.SYLLABLE_SPELLING,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "spelling",
            "section_title": "Yazım Becerileri",
            "section_color": "#8B5CF6",
            "background_color": "#F5F3FF",
            "text_color": "#4C1D95",
            "methodology": "syllable_segmentation",
            "activity": {
                "type": "syllable_spelling",
                "instructions": "Kelimeleri hecelere ayır, sonra birleştir! He-ce-le-re 👏",
                "word_sets": [
                    {
                        "level": 1,
                        "title": "İki Heceli",
                        "words": [
                            {"word": "ANNE", "syllables": ["AN", "NE"]},
                            {"word": "BABA", "syllables": ["BA", "BA"]},
                            {"word": "OKUL", "syllables": ["O", "KUL"]},
                            {"word": "KALEM", "syllables": ["KA", "LEM"]},
                        ],
                    },
                    {
                        "level": 2,
                        "title": "Üç Heceli",
                        "words": [
                            {"word": "KELEBEK", "syllables": ["KE", "LE", "BEK"]},
                            {"word": "ÖĞRENCİ", "syllables": ["ÖĞ", "REN", "Cİ"]},
                            {"word": "BİLGİSAYAR", "syllables": ["BİL", "Gİ", "SA", "YAR"]},
                        ],
                    },
                ],
                "clap_rhythm": True,
                "visual_separator": True,
                "color_coded_syllables": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 11,
        "title": "Yazım Kuralları",
        "description": "Türkçe yazım kuralları: büyük-küçük harf, birleşik kelimeler, ek yazımı. Ki/de/da ayrımı.",
        "activity_type": ActivityType.SPELLING_RULES,
        "difficulty_level": 4,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "section": "spelling",
            "section_title": "Yazım Becerileri",
            "section_color": "#8B5CF6",
            "background_color": "#F5F3FF",
            "text_color": "#4C1D95",
            "methodology": "rule_based_practice",
            "activity": {
                "type": "spelling_rules",
                "instructions": "Doğru yazım kuralını öğren ve uygula! 📚",
                "rule_categories": [
                    {
                        "rule": "capitalization",
                        "title": "Büyük Harf Kuralları",
                        "examples": [
                            {"correct": "Ankara", "incorrect": "ankara", "rule": "Özel isimler büyük harfle başlar"},
                            {"correct": "Ali okula gitti.", "incorrect": "ali okula gitti.", "rule": "Cümle başı büyük harf"},
                        ],
                    },
                    {
                        "rule": "ki_de_da",
                        "title": "Ki / De / Da Yazımı",
                        "examples": [
                            {"correct": "evdeki", "incorrect": "evde ki", "rule": "-ki bitişik yazılır (sıfat yapan)"},
                            {"correct": "Sen de gel.", "incorrect": "Sende gel.", "rule": "De/da bağlacı ayrı yazılır"},
                        ],
                    },
                    {
                        "rule": "apostrophe",
                        "title": "Kesme İşareti",
                        "examples": [
                            {"correct": "Atatürk'ün", "incorrect": "Atatürkün", "rule": "Özel isimlere ek gelince kesme işareti"},
                        ],
                    },
                ],
                "interactive_exercises": True,
                "ai_spelling_help": True,
            },
            "success_criteria": {"min_score": 60, "max_attempts": 5, "time_limit_minutes": 15},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 12,
        "title": "Sık Kullanılan Kelimeler",
        "description": "Günlük hayatta en çok kullanılan 50 kelimeyi doğru yazma pratiği. Flash kart ve tekrar yöntemi.",
        "activity_type": ActivityType.SIGHT_WORD_SPELLING,
        "difficulty_level": 3,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "spelling",
            "section_title": "Yazım Becerileri",
            "section_color": "#8B5CF6",
            "background_color": "#F5F3FF",
            "text_color": "#4C1D95",
            "methodology": "sight_word_practice",
            "activity": {
                "type": "sight_word_spelling",
                "instructions": "Bu kelimeleri hızlıca tanı ve doğru yaz! ⚡",
                "word_lists": [
                    {
                        "level": 1,
                        "title": "Temel Kelimeler",
                        "words": ["bir", "bu", "ve", "ben", "sen", "o", "ne", "var", "yok", "çok"],
                    },
                    {
                        "level": 2,
                        "title": "Günlük Kelimeler",
                        "words": ["okul", "ev", "anne", "baba", "kitap", "kalem", "su", "ekmek", "güneş", "çocuk"],
                    },
                    {
                        "level": 3,
                        "title": "Eylem Kelimeleri",
                        "words": ["gitmek", "gelmek", "yazmak", "okumak", "yemek", "içmek", "oynamak", "uyumak", "sevmek", "bilmek"],
                    },
                ],
                "flash_card_mode": True,
                "spaced_repetition": True,
                "cover_copy_compare": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },

    # ─── BÖLÜM 4: CÜMLE YAZMA (Sentence Construction) ───────────
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 13,
        "title": "Basit Cümle Kurma",
        "description": "Özne + Yüklem yapısıyla basit cümleler oluşturma. Kelime sıralama ve cümle tamamlama.",
        "activity_type": ActivityType.SIMPLE_SENTENCES,
        "difficulty_level": 4,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "sentences",
            "section_title": "Cümle Yazma",
            "section_color": "#F59E0B",
            "background_color": "#FFFBEB",
            "text_color": "#78350F",
            "methodology": "sentence_combining",
            "literature_ref": "Graham & Perin (2007) - Writing Next",
            "activity": {
                "type": "simple_sentences",
                "instructions": "Kelimeleri sıraya koy ve cümle oluştur! 📝",
                "exercises": [
                    {
                        "type": "word_order",
                        "words_shuffled": ["gider", "okula", "Ali"],
                        "correct": "Ali okula gider.",
                        "structure": "Özne + Yer + Yüklem",
                    },
                    {
                        "type": "word_order",
                        "words_shuffled": ["sever", "kedileri", "Ayşe"],
                        "correct": "Ayşe kedileri sever.",
                        "structure": "Özne + Nesne + Yüklem",
                    },
                    {
                        "type": "sentence_completion",
                        "template": "_____ parkta oynuyor.",
                        "options": ["Çocuk", "Kitap", "Masa"],
                        "correct": "Çocuk",
                    },
                    {
                        "type": "sentence_completion",
                        "template": "Kedi _____ içiyor.",
                        "options": ["süt", "araba", "bulut"],
                        "correct": "süt",
                    },
                ],
                "drag_drop_words": True,
                "sentence_structure_hint": True,
                "ai_sentence_check": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 14,
        "title": "Cümle Genişletme",
        "description": "Basit cümlelere sıfat, zarf ve yer bildiren sözcükler ekleyerek zenginleştirme. 5N1K ile detay ekleme.",
        "activity_type": ActivityType.EXPANDED_SENTENCES,
        "difficulty_level": 4,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "sentences",
            "section_title": "Cümle Yazma",
            "section_color": "#F59E0B",
            "background_color": "#FFFBEB",
            "text_color": "#78350F",
            "methodology": "sentence_expansion",
            "activity": {
                "type": "expanded_sentences",
                "instructions": "Cümleye detay ekle! Kim? Ne? Nerede? Nasıl? 🔍",
                "exercises": [
                    {
                        "base_sentence": "Kedi uyuyor.",
                        "expansions": [
                            {"question": "Nasıl?", "example": "Kedi sessizce uyuyor.", "addition": "zarf"},
                            {"question": "Nerede?", "example": "Kedi yatakta sessizce uyuyor.", "addition": "yer"},
                            {"question": "Hangi?", "example": "Küçük kedi yatakta sessizce uyuyor.", "addition": "sıfat"},
                        ],
                    },
                    {
                        "base_sentence": "Çocuk oynuyor.",
                        "expansions": [
                            {"question": "Nerede?", "example": "Çocuk parkta oynuyor.", "addition": "yer"},
                            {"question": "Ne zaman?", "example": "Çocuk öğleden sonra parkta oynuyor.", "addition": "zaman"},
                            {"question": "Nasıl?", "example": "Çocuk öğleden sonra parkta neşeyle oynuyor.", "addition": "zarf"},
                        ],
                    },
                ],
                "5w1h_prompts": True,
                "color_coded_additions": True,
                "progressive_building": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 15},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 15,
        "title": "Bağlaçlı Cümleler",
        "description": "Ve, ama, çünkü, veya bağlaçlarıyla birleşik cümle oluşturma. İki fikri birleştirme becerisi.",
        "activity_type": ActivityType.COMPOUND_SENTENCES,
        "difficulty_level": 5,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "section": "sentences",
            "section_title": "Cümle Yazma",
            "section_color": "#F59E0B",
            "background_color": "#FFFBEB",
            "text_color": "#78350F",
            "methodology": "sentence_combining",
            "literature_ref": "Saddler & Graham (2005) - Sentence combining",
            "activity": {
                "type": "compound_sentences",
                "instructions": "İki cümleyi bağlaçla birleştir! Ve, ama, çünkü... 🔗",
                "connectors": [
                    {
                        "word": "ve",
                        "usage": "İki şeyi eklemek için",
                        "example": "Kitap okudum ve resim yaptım.",
                        "exercises": [
                            {"sentence1": "Parkta oynadık", "sentence2": "Dondurma yedik", "expected": "Parkta oynadık ve dondurma yedik."},
                        ],
                    },
                    {
                        "word": "ama",
                        "usage": "Zıtlık göstermek için",
                        "example": "Hava güzeldi ama soğuktu.",
                        "exercises": [
                            {"sentence1": "Koşmak istiyorum", "sentence2": "Ayağım acıyor", "expected": "Koşmak istiyorum ama ayağım acıyor."},
                        ],
                    },
                    {
                        "word": "çünkü",
                        "usage": "Neden bildirmek için",
                        "example": "Eve girdim çünkü yağmur yağıyordu.",
                        "exercises": [
                            {"sentence1": "Mutluyum", "sentence2": "Denem çok iyi geçti", "expected": "Mutluyum çünkü denem çok iyi geçti."},
                        ],
                    },
                ],
                "drag_drop_connector": True,
                "ai_sentence_check": True,
            },
            "success_criteria": {"min_score": 60, "max_attempts": 5, "time_limit_minutes": 15},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 16,
        "title": "Noktalama İşaretleri",
        "description": "Nokta, virgül, soru işareti, ünlem işareti kullanımı. CUPS stratejisi (Capitalization, Usage, Punctuation, Spelling).",
        "activity_type": ActivityType.PUNCTUATION_PRACTICE,
        "difficulty_level": 4,
        "expected_duration_minutes": 12,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "sentences",
            "section_title": "Cümle Yazma",
            "section_color": "#F59E0B",
            "background_color": "#FFFBEB",
            "text_color": "#78350F",
            "methodology": "CUPS_strategy",
            "literature_ref": "CUPS editing strategy",
            "activity": {
                "type": "punctuation_practice",
                "instructions": "Doğru noktalama işaretini koy! . , ? ! 🔤",
                "exercises": [
                    {
                        "type": "add_punctuation",
                        "sentence": "Bugün hava çok güzel",
                        "correct_mark": ".",
                        "explanation": "Düz cümle sonuna nokta koyarız",
                    },
                    {
                        "type": "add_punctuation",
                        "sentence": "Sen kaç yaşındasın",
                        "correct_mark": "?",
                        "explanation": "Soru cümlesi sonuna soru işareti koyarız",
                    },
                    {
                        "type": "add_punctuation",
                        "sentence": "Ne güzel bir gün",
                        "correct_mark": "!",
                        "explanation": "Şaşırma veya sevinç cümlesi sonuna ünlem koyarız",
                    },
                    {
                        "type": "add_comma",
                        "sentence": "Elma armut ve muz aldım",
                        "correct_positions": [4, 10],
                        "explanation": "Sıralanan kelimeler arasına virgül koyarız",
                    },
                    {
                        "type": "cups_check",
                        "sentence": "ali ankara'ya gitti",
                        "errors": ["capitalization", "apostrophe"],
                        "corrected": "Ali Ankara'ya gitti.",
                    },
                ],
                "cups_checklist": True,
                "drag_drop_marks": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 12},
        },
    },

    # ─── BÖLÜM 5: KOMPOZİSYON (Composition / Text Production) ──
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 17,
        "title": "Yazma Planı Oluşturma",
        "description": "Grafik düzenleyici (graphic organizer) ile yazıya başlamadan önce planlama. Zihin haritası ve 5N1K düzenleyicisi.",
        "activity_type": ActivityType.WRITING_PLANNING,
        "difficulty_level": 5,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "composition",
            "section_title": "Kompozisyon",
            "section_color": "#EF4444",
            "background_color": "#FEF2F2",
            "text_color": "#7F1D1D",
            "methodology": "SRSD",
            "literature_ref": "Harris & Graham (2016) - SRSD Strategy",
            "activity": {
                "type": "writing_planning",
                "instructions": "Yazmadan önce planla! Düşüncelerini düzenle. 🗺️",
                "organizers": [
                    {
                        "type": "mind_map",
                        "title": "Zihin Haritası",
                        "description": "Ana fikirleri ortaya, detayları dallara yaz",
                        "center_topic_examples": ["Benim Ailem", "Okulum", "En Sevdiğim Hayvan"],
                    },
                    {
                        "type": "5w1h_organizer",
                        "title": "5N1K Düzenleyici",
                        "description": "Kim, Ne, Nerede, Ne zaman, Neden, Nasıl",
                        "fields": ["Kim?", "Ne oldu?", "Nerede?", "Ne zaman?", "Neden?", "Nasıl?"],
                    },
                    {
                        "type": "beginning_middle_end",
                        "title": "Başlangıç-Gelişme-Sonuç",
                        "description": "Hikayeni üç bölüme ayır",
                        "sections": ["Başlangıç", "Gelişme", "Sonuç"],
                    },
                ],
                "drag_drop_ideas": True,
                "ai_topic_suggestions": True,
                "template_export": True,
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 15},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 18,
        "title": "Paragraf Yazma",
        "description": "Ana fikir cümlesi, destekleyici cümleler ve sonuç cümlesi ile paragraf oluşturma. Hamburger modeli.",
        "activity_type": ActivityType.PARAGRAPH_WRITING,
        "difficulty_level": 5,
        "expected_duration_minutes": 18,
        "min_score_to_pass": 60,
        "content_config": {
            "section": "composition",
            "section_title": "Kompozisyon",
            "section_color": "#EF4444",
            "background_color": "#FEF2F2",
            "text_color": "#7F1D1D",
            "methodology": "hamburger_model",
            "activity": {
                "type": "paragraph_writing",
                "instructions": "Paragrafını hamburger gibi düşün! Üst ekmek = giriş, malzeme = detaylar, alt ekmek = sonuç 🍔",
                "hamburger_model": {
                    "top_bun": {"label": "Ana Fikir Cümlesi", "hint": "Paragrafın ne hakkında olduğunu söyle"},
                    "filling_1": {"label": "Destekleyici Cümle 1", "hint": "Ana fikri destekleyen bir detay"},
                    "filling_2": {"label": "Destekleyici Cümle 2", "hint": "Başka bir detay veya örnek"},
                    "filling_3": {"label": "Destekleyici Cümle 3", "hint": "Bir örnek daha (isteğe bağlı)"},
                    "bottom_bun": {"label": "Sonuç Cümlesi", "hint": "Ana fikri tekrar söyle veya özetle"},
                },
                "topic_prompts": [
                    {"topic": "En Sevdiğim Mevsim", "starter": "En sevdiğim mevsim _____ çünkü..."},
                    {"topic": "Okulumuz", "starter": "Okulumuz çok güzel bir yer..."},
                    {"topic": "Bir Hayvan", "starter": "_____ benim en sevdiğim hayvan..."},
                ],
                "word_count_target": {"min": 30, "max": 80},
                "ai_composition_feedback": True,
            },
            "success_criteria": {"min_score": 60, "max_attempts": 5, "time_limit_minutes": 18},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 19,
        "title": "Hikaye Yazma",
        "description": "SRSD (Self-Regulated Strategy Development) ile hikaye oluşturma. Karakter, olay örgüsü ve sonuç ile yaratıcı yazma.",
        "activity_type": ActivityType.STORY_WRITING,
        "difficulty_level": 5,
        "expected_duration_minutes": 20,
        "min_score_to_pass": 55,
        "content_config": {
            "section": "composition",
            "section_title": "Kompozisyon",
            "section_color": "#EF4444",
            "background_color": "#FEF2F2",
            "text_color": "#7F1D1D",
            "methodology": "SRSD",
            "literature_ref": "Harris & Graham (2016) - SRSD for story writing",
            "activity": {
                "type": "story_writing",
                "instructions": "Kendi hikayeni yaz! Karakterini seç, olayları planla, hikayeyi oluştur. 📖✨",
                "story_elements": {
                    "character": {"label": "Karakter", "prompt": "Hikayenin kahramanı kim?", "examples": ["Cesur bir kedi", "Meraklı bir çocuk", "Uçan bir balık"]},
                    "setting": {"label": "Mekan", "prompt": "Hikaye nerede geçiyor?", "examples": ["Büyülü bir orman", "Uzay istasyonu", "Deniz altı"]},
                    "problem": {"label": "Sorun", "prompt": "Ne sorun var?", "examples": ["Kayıp bir hazine", "Yolunu kaybetti", "Büyülendi"]},
                    "events": {"label": "Olaylar", "prompt": "Ne oldu?", "max_events": 3},
                    "solution": {"label": "Çözüm", "prompt": "Sorun nasıl çözüldü?"},
                    "ending": {"label": "Son", "prompt": "Hikaye nasıl bitti?"},
                },
                "visual_story_map": True,
                "sentence_starters": True,
                "ai_story_ideas": True,
                "word_count_target": {"min": 50, "max": 150},
            },
            "success_criteria": {"min_score": 55, "max_attempts": 5, "time_limit_minutes": 20},
        },
    },
    {
        "difficulty_type": LearningDifficulty.DYSGRAPHIA,
        "chapter_number": 20,
        "title": "Düzeltme ve Düzenleme",
        "description": "Kendi yazısını gözden geçirme, hata tespiti ve düzeltme. COPS/CUPS kontrol listesi kullanarak öz-değerlendirme.",
        "activity_type": ActivityType.REVISION_EDITING,
        "difficulty_level": 5,
        "expected_duration_minutes": 15,
        "min_score_to_pass": 60,
        "content_config": {
            "section": "composition",
            "section_title": "Kompozisyon",
            "section_color": "#EF4444",
            "background_color": "#FEF2F2",
            "text_color": "#7F1D1D",
            "methodology": "CUPS_strategy",
            "literature_ref": "MacArthur (2009) - Revision strategies",
            "activity": {
                "type": "revision_editing",
                "instructions": "Yazını kontrol et ve düzelt! CUPS listesini kullan. 🔍✏️",
                "cups_checklist": {
                    "C": {"label": "Capitalization (Büyük Harf)", "check": "Cümle başları ve özel isimler büyük harf mi?"},
                    "U": {"label": "Usage (Kullanım)", "check": "Kelimeler doğru kullanılmış mı?"},
                    "P": {"label": "Punctuation (Noktalama)", "check": "Nokta, virgül, soru işareti doğru mu?"},
                    "S": {"label": "Spelling (Yazım)", "check": "Kelimeler doğru yazılmış mı?"},
                },
                "practice_texts": [
                    {
                        "title": "Hatalı Metin 1",
                        "text": "ali dün okula gitti ama kitabını unutmuş çok üzüldu",
                        "errors": [
                            {"type": "capitalization", "position": 0, "correction": "Ali"},
                            {"type": "punctuation", "position": 20, "correction": ". A"},
                            {"type": "spelling", "position": 46, "correction": "üzüldü"},
                            {"type": "punctuation", "position": -1, "correction": "."},
                        ],
                        "corrected": "Ali dün okula gitti. Ama kitabını unutmuş. Çok üzüldü.",
                    },
                    {
                        "title": "Hatalı Metin 2",
                        "text": "bugün hava cok güzel parkda oynadık anne bize dondurma aldı",
                        "errors": [
                            {"type": "capitalization", "position": 0, "correction": "Bugün"},
                            {"type": "spelling", "position": 11, "correction": "çok"},
                            {"type": "spelling", "position": 22, "correction": "parkta"},
                            {"type": "punctuation", "position": 29, "correction": ". A"},
                            {"type": "punctuation", "position": -1, "correction": "."},
                        ],
                        "corrected": "Bugün hava çok güzel. Parkta oynadık. Anne bize dondurma aldı.",
                    },
                ],
                "highlight_errors": True,
                "error_categories": True,
                "ai_revision_feedback": True,
                "self_evaluation_rubric": True,
            },
            "success_criteria": {"min_score": 60, "max_attempts": 5, "time_limit_minutes": 15},
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

        if user_count > 0 and chapter_count >= len(CHAPTERS):
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

        # Create chapters (insert missing ones)
        if chapter_count < len(CHAPTERS):
            # Get existing chapter numbers per difficulty_type
            existing_result = await session.execute(
                select(ChapterModel.difficulty_type, ChapterModel.chapter_number)
            )
            existing_set = {(str(r[0]), r[1]) for r in existing_result.fetchall()}

            for ch_data in CHAPTERS:
                key = (ch_data["difficulty_type"].name, ch_data["chapter_number"])
                if key not in existing_set:
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
