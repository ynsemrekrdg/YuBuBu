"""
AI Service using OpenAI ChatGPT API.
Provides personalized AI conversations, hints, and performance analysis.
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
from app.infrastructure.ai.prompts import (
    get_analysis_prompt,
    get_hint_prompt,
    get_system_prompt,
)
from app.infrastructure.cache.redis_cache import RedisCache


class AIService:
    """Service for AI-powered educational interactions using OpenAI ChatGPT."""

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

    async def chat(
        self,
        user_id: UUID,
        message: str,
        role_context: str = "student",
    ) -> AIConversation:
        """
        Send a message to ChatGPT and get a personalized response.
        Context-aware based on student profile and conversation history.
        """
        # Get student profile for context
        profile = await self._profile_repo.get_by_user_id(user_id)
        learning_difficulty = (
            profile.learning_difficulty if profile
            else LearningDifficulty.DYSLEXIA
        )

        # Get system prompt
        system_prompt = get_system_prompt(learning_difficulty, role_context)

        # Build context from profile
        if profile:
            system_prompt += f"""
MEVCUT ÖĞRENCİ DURUMU:
- Yaş: {profile.age}
- Seviye: {profile.current_level}
- Toplam puan: {profile.total_score}
- Seri gün: {profile.streak_days}
"""

        # Get recent conversation history for context
        recent = await self._conversation_repo.get_recent_context(user_id, limit=6)
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt}
        ]
        for conv in recent:
            messages.append({"role": "user", "content": conv.message})
            messages.append({"role": "assistant", "content": conv.response})
        messages.append({"role": "user", "content": message})

        try:
            # Call OpenAI ChatGPT API
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                messages=messages,
            )

            ai_response = response.choices[0].message.content or ""
            tokens_used = response.usage.total_tokens if response.usage else 0

            # Save conversation
            conversation = AIConversation(
                user_id=user_id,
                message=message,
                response=ai_response,
                context={
                    "learning_difficulty": learning_difficulty.value,
                    "role_context": role_context,
                    "student_level": profile.current_level if profile else 1,
                },
                role_context=role_context,
                tokens_used=tokens_used,
            )
            saved = await self._conversation_repo.create(conversation)

            logger.info(
                f"AI chat: user={user_id}, tokens={tokens_used}, "
                f"difficulty={learning_difficulty.value}"
            )
            return saved

        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            # Return a fallback response
            fallback = AIConversation(
                user_id=user_id,
                message=message,
                response="Şu anda yanıt veremiyorum. Lütfen biraz sonra tekrar deneyin. 🙏",
                context={"error": str(e)},
                role_context=role_context,
                tokens_used=0,
            )
            return await self._conversation_repo.create(fallback)

    async def get_hint(
        self,
        user_id: UUID,
        chapter_id: UUID,
        chapter_title: str,
        activity_type: str,
        hint_level: int = 1,
    ) -> Dict[str, Any]:
        """
        Generate a hint for a specific chapter activity.
        """
        profile = await self._profile_repo.get_by_user_id(user_id)
        learning_difficulty = (
            profile.learning_difficulty if profile
            else LearningDifficulty.DYSLEXIA
        )

        # Check cache first
        cache_key = f"hint:{chapter_id}:{learning_difficulty.value}:{hint_level}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached

        system_prompt = get_hint_prompt(
            learning_difficulty, chapter_title, activity_type, hint_level
        )

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=512,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"'{chapter_title}' aktivitesi için ipucu ver."},
                ],
            )

            hint_text = response.choices[0].message.content or ""

            result = {
                "chapter_id": str(chapter_id),
                "hint": hint_text,
                "hint_level": hint_level,
                "encouragement": self._get_encouragement(learning_difficulty),
            }

            # Cache hint for 1 hour
            await self._cache.set(cache_key, result, expire_seconds=3600)

            return result

        except openai.APIError as e:
            logger.error(f"OpenAI API error (hint): {e}")
            return {
                "chapter_id": str(chapter_id),
                "hint": "Bir ipucu üretilirken sorun oluştu. Tekrar dene! 💪",
                "hint_level": hint_level,
                "encouragement": "Sen başarabilirsin! 🌟",
            }

    async def analyze_student(self, student_id: UUID) -> Dict[str, Any]:
        """
        Generate AI-powered analysis of student performance.
        """
        profile = await self._profile_repo.get_by_id(student_id)
        if not profile:
            raise ValueError(f"Öğrenci profili bulunamadı: {student_id}")

        analytics = await self._progress_repo.get_analytics(student_id)
        system_prompt = get_analysis_prompt(profile.learning_difficulty, analytics)

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=1024,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Bu öğrencinin performans analizini yap."},
                ],
            )

            response_text = response.choices[0].message.content or ""

            # Try to parse JSON response
            try:
                # Find JSON block in response
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    analysis_data = json.loads(response_text[json_start:json_end])
                else:
                    analysis_data = {
                        "analysis": response_text,
                        "strengths": [],
                        "areas_for_improvement": [],
                        "recommendations": [],
                        "encouragement_message": "",
                    }
            except json.JSONDecodeError:
                analysis_data = {
                    "analysis": response_text,
                    "strengths": [],
                    "areas_for_improvement": [],
                    "recommendations": [],
                    "encouragement_message": "",
                }

            return {
                "student_id": str(student_id),
                "learning_difficulty": profile.learning_difficulty.value,
                **analysis_data,
            }

        except openai.APIError as e:
            logger.error(f"OpenAI API error (analysis): {e}")
            return {
                "student_id": str(student_id),
                "learning_difficulty": profile.learning_difficulty.value,
                "analysis": "Analiz şu anda oluşturulamıyor.",
                "strengths": ["Platforma düzenli giriş yapıyor"],
                "areas_for_improvement": ["Daha fazla veri gerekiyor"],
                "recommendations": ["Aktivitelere devam etmeyi deneyin"],
                "encouragement_message": "Her adım ileri doğru bir ilerlemedir! 🌟",
            }

    def _get_encouragement(self, difficulty: LearningDifficulty) -> str:
        """Get a difficulty-specific encouragement message."""
        messages = {
            LearningDifficulty.DYSLEXIA: "Her kelimeyi doğru okuduğunda daha da güçleniyorsun! 📚",
            LearningDifficulty.AUTISM: "Adım adım ilerliyorsun, harika gidiyorsun! ⭐",
            LearningDifficulty.DYSCALCULIA: "Sayılar seninle dost, birlikte çözelim! 🔢",
            LearningDifficulty.ADHD: "Odaklanabildin, süpersin! Bir sonraki hedefe! 🎯",
        }
        return messages.get(difficulty, "Çok iyi gidiyorsun! 🌟")
