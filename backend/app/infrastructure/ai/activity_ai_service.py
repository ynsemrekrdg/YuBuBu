"""
Aktivite-içi AI Servisi — 3 katmanlı AI desteği.

Katman 1: Gerçek zamanlı ipucu, değerlendirme, uyarlanabilir zorluk
Katman 2: Oturum sonu analiz, sonraki adım önerisi
Özel: Kişiselleştirilmiş pratik oluşturma
"""

import json
from typing import Any, Dict, List, Optional
from uuid import UUID

import openai
from loguru import logger

from app.config import settings
from app.domain.entities.ai_conversation import AIConversation
from app.domain.entities.enums import LearningDifficulty
from app.domain.repositories.ai_conversation_repository import AIConversationRepository
from app.domain.repositories.progress_repository import ProgressRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository
from app.infrastructure.ai.activity_prompts import (
    ADAPTIVE_DIFFICULTY_PROMPT,
    EVALUATE_WORK_PROMPT,
    NEXT_STEPS_PROMPT,
    PERSONALIZED_PRACTICE_PROMPT,
    SESSION_ANALYSIS_PROMPT,
    get_activity_hint_prompt,
)
from app.infrastructure.cache.redis_cache import RedisCache


class ActivityAIService:
    """3 katmanlı AI servisi: aktivite-içi destek, oturum analizi, kişiselleştirme."""

    def __init__(
        self,
        conversation_repo: AIConversationRepository,
        profile_repo: StudentProfileRepository,
        progress_repo: ProgressRepository,
        cache: RedisCache,
    ):
        self._conversation_repo = conversation_repo
        self._profile_repo = profile_repo
        self._progress_repo = progress_repo
        self._cache = cache
        self._client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # ─── Yardımcılar ────────────────────────────────────────

    def _parse_json(self, text: str) -> Any:
        """AI yanıtından JSON çıkar."""
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
        try:
            start = text.find("[")
            end = text.rfind("]") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
        return {"raw_response": text}

    async def _call_openai(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 512,
    ) -> tuple[str, int]:
        """OpenAI API çağrısı yap, (yanıt_metni, token_sayısı) döndür."""
        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            text = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            return text, tokens
        except openai.APIError as e:
            logger.error(f"OpenAI API hatası: {e}")
            raise

    async def _save_conversation(
        self,
        user_id: UUID,
        message: str,
        response: str,
        context: dict,
        tokens: int,
    ) -> None:
        """Konuşmayı veritabanına kaydet."""
        await self._conversation_repo.create(
            AIConversation(
                user_id=user_id,
                message=message,
                response=response,
                context=context,
                role_context="student",
                tokens_used=tokens,
            )
        )

    # ═════════════════════════════════════════════════════════
    # KATMAN 1: AKTİVİTE İÇİ GERÇEK ZAMANLI DESTEK
    # ═════════════════════════════════════════════════════════

    async def provide_activity_hint(
        self,
        student_id: UUID,
        chapter_id: str,
        activity_type: str,
        problem: dict,
        student_attempt: dict,
        context: dict,
    ) -> Dict[str, Any]:
        """
        Aktivite sırasında anlık ipucu ver.

        Args:
            student_id: Öğrenci UUID
            chapter_id: Bölüm ID
            activity_type: Aktivite tipi (ör. "counting", "letter_formation")
            problem: Soru/görev bilgisi {question, correct_answer, ...}
            student_attempt: Öğrenci cevabı {answer, attempt_number}
            context: Ek bilgi {error_type, chapter_title, learning_difficulty}

        Returns:
            {hint, hint_level, should_show_answer, visual_aid, encouragement}
        """
        # Öğrenci profilini al
        profile = await self._profile_repo.get_by_user_id(student_id)
        difficulty = context.get(
            "learning_difficulty",
            profile.learning_difficulty.value if profile else "dyslexia",
        )

        hint_level = min(student_attempt.get("attempt_number", 1), 3)
        prompt_template = get_activity_hint_prompt(difficulty)

        prompt = prompt_template.format(
            chapter_title=context.get("chapter_title", "Bilinmeyen Bölüm"),
            activity_type=activity_type,
            problem_description=problem.get("question", str(problem)),
            student_answer=student_attempt.get("answer", ""),
            correct_answer=problem.get("correct_answer", ""),
            attempt_number=student_attempt.get("attempt_number", 1),
            error_type=context.get("error_type", "belirtilmedi"),
            hint_level=hint_level,
        )

        try:
            text, tokens = await self._call_openai(
                prompt,
                f"İpucu ver: Deneme #{student_attempt.get('attempt_number', 1)}",
                max_tokens=256,
            )
            result = self._parse_json(text)

            # Konuşmayı kaydet
            await self._save_conversation(
                student_id,
                f"[Aktivite İpucu] {activity_type} — {problem.get('question', '')}",
                text,
                {"type": "activity_hint", "chapter_id": chapter_id, "hint_level": hint_level},
                tokens,
            )

            logger.info(
                f"Activity hint: student={student_id}, type={activity_type}, "
                f"level={hint_level}, tokens={tokens}"
            )

            # Fallback alanları ekle
            result.setdefault("hint", text[:100])
            result.setdefault("hint_level", hint_level)
            result.setdefault("should_show_answer", hint_level >= 3)
            result.setdefault("visual_aid", "none")
            result.setdefault("encouragement", "Harika gidiyorsun! 💪")
            return result

        except Exception as e:
            logger.error(f"Activity hint error: {e}")
            return {
                "hint": "Yavaşça düşün ve tekrar dene! Yapabilirsin! 💪",
                "hint_level": hint_level,
                "should_show_answer": False,
                "visual_aid": "none",
                "encouragement": "Her deneme seni güçlendirir! 🌟",
            }

    async def evaluate_student_work(
        self,
        student_id: UUID,
        activity_type: str,
        work_type: str,
        work_data: dict,
    ) -> Dict[str, Any]:
        """
        Öğrenci çalışmasını AI ile değerlendir.

        Args:
            student_id: Öğrenci UUID
            activity_type: Aktivite tipi
            work_type: "handwriting" | "reading" | "math" | "writing"
            work_data: {content, target, activity_description, ...}

        Returns:
            {score, feedback, strengths, improvements, error_analysis}
        """
        profile = await self._profile_repo.get_by_user_id(student_id)
        difficulty = profile.learning_difficulty.value if profile else "dyslexia"
        age = profile.age if profile else 8
        level = profile.current_level if profile else 1

        prompt = EVALUATE_WORK_PROMPT.format(
            learning_difficulty=difficulty,
            student_age=age,
            student_level=level,
            work_type=work_type,
            activity_description=work_data.get("activity_description", activity_type),
            work_data=json.dumps(work_data.get("content", work_data), ensure_ascii=False),
        )

        try:
            text, tokens = await self._call_openai(prompt, "Bu çalışmayı değerlendir.")
            result = self._parse_json(text)

            await self._save_conversation(
                student_id,
                f"[Çalışma Değerlendirme] {work_type} — {activity_type}",
                text,
                {"type": "evaluate_work", "work_type": work_type},
                tokens,
            )

            logger.info(
                f"Evaluate work: student={student_id}, type={work_type}, "
                f"score={result.get('score', '?')}"
            )

            result.setdefault("score", 2)
            result.setdefault("feedback", "Çalışmaya devam et!")
            result.setdefault("strengths", ["Çaba gösterdin"])
            result.setdefault("improvements", ["Pratik yapmaya devam et"])
            result.setdefault("error_analysis", {"error_type": "none", "pattern": "", "severity": "low"})
            return result

        except Exception as e:
            logger.error(f"Evaluate work error: {e}")
            return {
                "score": 2,
                "feedback": "Harika çaba! Pratik yaptıkça daha da gelişeceksin.",
                "strengths": ["Göreve başlama cesareti", "Çaba gösterme"],
                "improvements": ["Pratik yapmaya devam et"],
                "error_analysis": {"error_type": "none", "pattern": "", "severity": "low"},
            }

    async def adaptive_difficulty_suggestion(
        self,
        student_id: UUID,
        recent_performance: list,
    ) -> Dict[str, Any]:
        """
        Son performansa göre zorluk seviyesi önerisi.

        Args:
            student_id: Öğrenci UUID
            recent_performance: Son aktivitelerin listesi [{score, hints_used, time, errors}]

        Returns:
            {action, reason, confidence, next_difficulty, specific_adjustments}
        """
        profile = await self._profile_repo.get_by_user_id(student_id)
        difficulty = profile.learning_difficulty.value if profile else "dyslexia"
        level = profile.current_level if profile else 1

        perf_text = "\n".join(
            f"- Aktivite {i+1}: Skor={p.get('score', 0)}, "
            f"İpucu={p.get('hints_used', 0)}, "
            f"Süre={p.get('time_seconds', 0)}s, "
            f"Hata={p.get('errors', 0)}"
            for i, p in enumerate(recent_performance[-10:])
        )

        prompt = ADAPTIVE_DIFFICULTY_PROMPT.format(
            learning_difficulty=difficulty,
            current_level=level,
            performance_data=perf_text or "Veri yok",
        )

        try:
            text, tokens = await self._call_openai(prompt, "Zorluk önerisi yap.", max_tokens=256)
            result = self._parse_json(text)

            await self._save_conversation(
                student_id,
                f"[Zorluk Önerisi] {len(recent_performance)} aktivite analizi",
                text,
                {"type": "adaptive_difficulty", "activities_count": len(recent_performance)},
                tokens,
            )

            result.setdefault("action", "maintain")
            result.setdefault("reason", "Mevcut seviye uygun görünüyor.")
            result.setdefault("confidence", 0.7)
            result.setdefault("next_difficulty", "medium")
            result.setdefault("specific_adjustments", [])
            return result

        except Exception as e:
            logger.error(f"Adaptive difficulty error: {e}")
            return {
                "action": "maintain",
                "reason": "Değerlendirme yapılamadı, mevcut seviye korunuyor.",
                "confidence": 0.5,
                "next_difficulty": "medium",
                "specific_adjustments": [],
            }

    # ═════════════════════════════════════════════════════════
    # KATMAN 2: BÖLÜM SONRASI ANALİZ
    # ═════════════════════════════════════════════════════════

    async def analyze_session_performance(
        self,
        student_id: UUID,
        session_data: dict,
    ) -> Dict[str, Any]:
        """
        Oturum sonunda detaylı performans analizi.

        Args:
            student_id: Öğrenci UUID
            session_data: {
                chapter_id, chapter_title, activity_type,
                activities_completed, time_spent, hints_used,
                errors: [{type, count}], scores: [int]
            }

        Returns:
            {dominant_error, severity, intervention_needed, intervention_type,
             teacher_note, parent_note, positive_observations, session_summary}
        """
        profile = await self._profile_repo.get_by_user_id(student_id)
        difficulty = profile.learning_difficulty.value if profile else "dyslexia"
        age = profile.age if profile else 8
        level = profile.current_level if profile else 1

        errors_text = json.dumps(session_data.get("errors", []), ensure_ascii=False)
        scores_text = json.dumps(session_data.get("scores", []), ensure_ascii=False)

        prompt = SESSION_ANALYSIS_PROMPT.format(
            learning_difficulty=difficulty,
            student_age=age,
            student_level=level,
            chapter_title=session_data.get("chapter_title", "Bilinmeyen"),
            activity_type=session_data.get("activity_type", "genel"),
            activities_completed=session_data.get("activities_completed", 0),
            time_spent=session_data.get("time_spent", 0),
            hints_used=session_data.get("hints_used", 0),
            errors=errors_text,
            scores=scores_text,
        )

        try:
            text, tokens = await self._call_openai(prompt, "Oturum analizi yap.", max_tokens=768)
            result = self._parse_json(text)

            await self._save_conversation(
                student_id,
                f"[Oturum Analizi] {session_data.get('chapter_title', '')}",
                text,
                {"type": "session_analysis", "chapter_id": session_data.get("chapter_id", "")},
                tokens,
            )

            logger.info(
                f"Session analysis: student={student_id}, "
                f"chapter={session_data.get('chapter_title', '')}, "
                f"severity={result.get('severity', '?')}"
            )

            result.setdefault("dominant_error", "none")
            result.setdefault("error_frequency", 0)
            result.setdefault("severity", "low")
            result.setdefault("intervention_needed", False)
            result.setdefault("intervention_type", None)
            result.setdefault("teacher_note", "Öğrenci iyi bir performans gösterdi.")
            result.setdefault("parent_note", "Çocuğunuz güzel ilerliyor!")
            result.setdefault("positive_observations", ["Göreve katılım sağladı"])
            result.setdefault("session_summary", "Oturum başarıyla tamamlandı.")
            return result

        except Exception as e:
            logger.error(f"Session analysis error: {e}")
            return {
                "dominant_error": "none",
                "error_frequency": 0,
                "severity": "low",
                "intervention_needed": False,
                "intervention_type": None,
                "teacher_note": "Analiz oluşturulamadı.",
                "parent_note": "Çocuğunuz aktiviteyi tamamladı.",
                "positive_observations": ["Aktiviteyi tamamladı"],
                "session_summary": "Oturum tamamlandı.",
            }

    async def generate_next_steps(
        self,
        student_id: UUID,
        current_chapter_id: str,
        performance_summary: dict,
    ) -> Dict[str, Any]:
        """
        Performansa göre sonraki adım önerisi.

        Returns:
            {next_action, reason, next_chapter_id, review_activities,
             intervention_module, encouragement}
        """
        profile = await self._profile_repo.get_by_user_id(student_id)
        difficulty = profile.learning_difficulty.value if profile else "dyslexia"
        level = profile.current_level if profile else 1

        prompt = NEXT_STEPS_PROMPT.format(
            learning_difficulty=difficulty,
            student_level=level,
            chapter_title=performance_summary.get("chapter_title", ""),
            average_score=performance_summary.get("average_score", 0),
            dominant_error=performance_summary.get("dominant_error", "none"),
            severity=performance_summary.get("severity", "low"),
            intervention_needed=performance_summary.get("intervention_needed", False),
            available_chapters="Sistem tarafından belirlenecek",
        )

        try:
            text, tokens = await self._call_openai(prompt, "Sonraki adımı öner.", max_tokens=512)
            result = self._parse_json(text)

            await self._save_conversation(
                student_id,
                f"[Sonraki Adım] chapter={current_chapter_id}",
                text,
                {"type": "next_steps", "chapter_id": current_chapter_id},
                tokens,
            )

            result.setdefault("next_action", "continue")
            result.setdefault("reason", "Mevcut seviyede devam önerilir.")
            result.setdefault("next_chapter_id", None)
            result.setdefault("review_activities", [])
            result.setdefault("intervention_module", None)
            result.setdefault("encouragement", "Harikasın! 🌟")
            return result

        except Exception as e:
            logger.error(f"Next steps error: {e}")
            return {
                "next_action": "continue",
                "reason": "Değerlendirme yapılamadı, devam önerilir.",
                "next_chapter_id": None,
                "review_activities": [],
                "intervention_module": None,
                "encouragement": "Sen başarabilirsin! 💪",
            }

    # ═════════════════════════════════════════════════════════
    # ÖZEL: KİŞİSELLEŞTİRİLMİŞ PRATİK
    # ═════════════════════════════════════════════════════════

    async def generate_personalized_practice(
        self,
        student_id: UUID,
        weak_skill: str,
        count: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Zayıf alana özel pratik problemleri oluştur.

        Args:
            student_id: Öğrenci UUID
            weak_skill: "blending" | "place_value" | "handwriting" | "spelling" vb.
            count: Oluşturulacak problem sayısı (default 5)

        Returns:
            [{id, question, correct_answer, options, hint, difficulty, skill_focus}]
        """
        profile = await self._profile_repo.get_by_user_id(student_id)
        difficulty = profile.learning_difficulty.value if profile else "dyslexia"
        age = profile.age if profile else 8
        level = profile.current_level if profile else 1

        # Cache kontrolü
        cache_key = f"practice:{student_id}:{weak_skill}:{count}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached

        prompt = PERSONALIZED_PRACTICE_PROMPT.format(
            learning_difficulty=difficulty,
            student_age=age,
            student_level=level,
            weak_skill=weak_skill,
            count=count,
        )

        try:
            text, tokens = await self._call_openai(
                prompt,
                f"{weak_skill} alanı için {count} pratik problemi oluştur.",
                max_tokens=1024,
            )
            parsed = self._parse_json(text)

            await self._save_conversation(
                student_id,
                f"[Kişisel Pratik] {weak_skill} x{count}",
                text,
                {"type": "personalized_practice", "skill": weak_skill, "count": count},
                tokens,
            )

            # Liste formatına dönüştür
            if isinstance(parsed, list):
                problems = parsed
            elif "items" in parsed:
                problems = parsed["items"]
            elif isinstance(parsed, dict) and "raw_response" not in parsed:
                problems = [parsed]
            else:
                problems = self._generate_fallback_problems(weak_skill, count)

            # 30 dakika cache'le
            await self._cache.set(cache_key, problems, expire_seconds=1800)

            logger.info(
                f"Personalized practice: student={student_id}, "
                f"skill={weak_skill}, count={len(problems)}"
            )
            return problems

        except Exception as e:
            logger.error(f"Personalized practice error: {e}")
            return self._generate_fallback_problems(weak_skill, count)

    def _generate_fallback_problems(
        self, weak_skill: str, count: int
    ) -> List[Dict[str, Any]]:
        """Fallback pratik problemleri oluştur."""
        templates = {
            "place_value": [
                {"question": "23'teki 2 neyi gösterir?", "correct_answer": "2 onluk", "options": ["2 birlik", "2 onluk", "2 yüzlük", "20"], "hint": "İlk basamağa bak"},
                {"question": "45'te kaç tane onluk var?", "correct_answer": "4", "options": ["4", "5", "45", "40"], "hint": "Onlar basamağına bak"},
                {"question": "67 = ? onluk + ? birlik", "correct_answer": "6 onluk 7 birlik", "options": ["6 onluk 7 birlik", "7 onluk 6 birlik", "67 birlik", "6 yüzlük"], "hint": "Sol basamak onluk"},
            ],
            "blending": [
                {"question": "/k/ /e/ /d/ /i/ harflerini birleştir", "correct_answer": "kedi", "options": ["kede", "kedi", "kadi", "kidi"], "hint": "Sesleri yavaşça birleştir"},
                {"question": "/e/ /l/ /m/ /a/ harflerini birleştir", "correct_answer": "elma", "options": ["elma", "emla", "alma", "olma"], "hint": "İlk iki sesi birleştir, sonra ekle"},
            ],
            "handwriting": [
                {"question": "'a' harfini yaz", "correct_answer": "a", "options": [], "hint": "Daire çiz, sonra sağa çizgi ekle"},
                {"question": "'b' harfini yaz", "correct_answer": "b", "options": [], "hint": "Yukarıdan aşağı çizgi, sonra sağa göbek"},
            ],
        }

        problems = templates.get(weak_skill, templates.get("place_value", []))
        result = []
        for i in range(min(count, len(problems))):
            p = problems[i].copy()
            p["id"] = i + 1
            p["difficulty"] = "easy" if i < count // 2 else "medium"
            p["skill_focus"] = weak_skill
            result.append(p)
        return result
