"""
Dysgraphia-specific AI Service.
Provides writing coaching, handwriting assessment, sentence checking,
spelling help, story idea generation, and composition feedback.

Evidence-based: Graham & Harris (2005), MacArthur (2009), Morphy & Graham (2012)
"""

import json
from typing import Any, Dict, List, Optional
from uuid import UUID

import openai
from loguru import logger

from app.config import settings
from app.domain.entities.ai_conversation import AIConversation
from app.domain.repositories.ai_conversation_repository import AIConversationRepository
from app.domain.repositories.progress_repository import ProgressRepository
from app.domain.repositories.student_profile_repository import StudentProfileRepository
from app.infrastructure.ai.dysgraphia_prompts import (
    COMPOSITION_FEEDBACK_PROMPT,
    DYSGRAPHIA_WRITING_COACH_PROMPT,
    HANDWRITING_ASSESSMENT_PROMPT,
    SENTENCE_CHECK_PROMPT,
    SPELLING_HELP_PROMPT,
    STORY_IDEAS_PROMPT,
)
from app.infrastructure.cache.redis_cache import RedisCache


class DysgraphiaAIService:
    """AI service specialized for dysgraphia writing support."""

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

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Extract JSON from AI response text."""
        try:
            json_start = text.find("{")
            json_end = text.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(text[json_start:json_end])
        except json.JSONDecodeError:
            pass
        # Try array
        try:
            arr_start = text.find("[")
            arr_end = text.rfind("]") + 1
            if arr_start >= 0 and arr_end > arr_start:
                return {"items": json.loads(text[arr_start:arr_end])}
        except json.JSONDecodeError:
            pass
        return {"raw_response": text}

    async def check_sentence(
        self,
        user_id: UUID,
        sentence: str,
        focus_area: str = "general",
    ) -> Dict[str, Any]:
        """
        Check a student's sentence for errors with dysgraphia-sensitive feedback.
        Focus on content first, mechanics second.
        """
        prompt = SENTENCE_CHECK_PROMPT.format(
            sentence=sentence,
            focus_area=focus_area,
        )

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=512,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Bu cümleyi kontrol et: '{sentence}'"},
                ],
            )

            result_text = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            result = self._parse_json_response(result_text)

            # Save conversation
            await self._conversation_repo.create(AIConversation(
                user_id=user_id,
                message=f"[Cümle Kontrolü] {sentence}",
                response=result_text,
                context={"type": "sentence_check", "focus": focus_area},
                role_context="student",
                tokens_used=tokens,
            ))

            logger.info(f"Sentence check: user={user_id}, errors={len(result.get('errors', []))}")
            return result

        except openai.APIError as e:
            logger.error(f"OpenAI API error (sentence check): {e}")
            return {
                "praise": "Güzel bir cümle yazmışsın!",
                "errors": [],
                "corrected_sentence": sentence,
                "tip": "Yazmaya devam et!",
            }

    async def spelling_help(
        self,
        user_id: UUID,
        word: str,
        context: str = "",
    ) -> Dict[str, Any]:
        """
        Provide spelling help without giving the answer directly.
        Uses phonetic breakdown, syllable segmentation, and rule hints.
        """
        prompt = SPELLING_HELP_PROMPT.format(word=word, context=context)

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=512,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"'{word}' kelimesini yazmak istiyorum."},
                ],
            )

            result_text = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            result = self._parse_json_response(result_text)

            await self._conversation_repo.create(AIConversation(
                user_id=user_id,
                message=f"[Yazım Yardımı] {word}",
                response=result_text,
                context={"type": "spelling_help", "word": word},
                role_context="student",
                tokens_used=tokens,
            ))

            logger.info(f"Spelling help: user={user_id}, word={word}")
            return result

        except openai.APIError as e:
            logger.error(f"OpenAI API error (spelling help): {e}")
            return {
                "syllables": word,
                "sounds": "",
                "strategy": "Ses Ses Yaz",
                "hint": "Kelimeyi yavaşça seslendir ve her sesi bir harfe çevir.",
                "rule": "",
                "similar_words": [],
                "encouragement": "Harika gidiyorsun! 🌟",
            }

    async def generate_story_ideas(
        self,
        user_id: UUID,
        topic: str = "serbest",
        student_age: int = 8,
    ) -> List[Dict[str, Any]]:
        """
        Generate story ideas for writing planning with graphic organizer support.
        """
        prompt = STORY_IDEAS_PROMPT.format(topic=topic, age=student_age)

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=1024,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"'{topic}' konusunda hikaye fikirleri üret."},
                ],
            )

            result_text = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            parsed = self._parse_json_response(result_text)

            await self._conversation_repo.create(AIConversation(
                user_id=user_id,
                message=f"[Hikaye Fikirleri] {topic}",
                response=result_text,
                context={"type": "story_ideas", "topic": topic},
                role_context="student",
                tokens_used=tokens,
            ))

            # Return as list
            if "items" in parsed:
                return parsed["items"]
            elif isinstance(parsed, list):
                return parsed
            return [parsed]

        except openai.APIError as e:
            logger.error(f"OpenAI API error (story ideas): {e}")
            return [
                {
                    "title": "Kayıp Kedi",
                    "character": "Minik kedi Boncuk",
                    "setting": "Mahalle",
                    "problem": "Boncuk evini bulamıyor",
                    "hint": "Bir gün Boncuk adında minik bir kedi...",
                },
                {
                    "title": "Sihirli Kalem",
                    "character": "Elif adında kız",
                    "setting": "Okul",
                    "problem": "Kalem her yazdığını gerçek yapıyor",
                    "hint": "Elif bir gün masasında parlayan bir kalem buldu...",
                },
                {
                    "title": "Uçan Balon",
                    "character": "Kırmızı bir balon",
                    "setting": "Gökyüzü",
                    "problem": "Balon çok yükseğe çıktı, geri dönemiyor",
                    "hint": "Park yerinde kırmızı bir balon havaya uçtu...",
                },
            ]

    async def composition_feedback(
        self,
        user_id: UUID,
        text: str,
        task_type: str = "serbest yazma",
    ) -> Dict[str, Any]:
        """
        Provide comprehensive composition feedback using rubric-based assessment.
        Prioritizes ideas and organization over mechanics for dysgraphia students.
        """
        prompt = COMPOSITION_FEEDBACK_PROMPT.format(text=text, task_type=task_type)

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=1024,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": f"Bu yazıyı değerlendir:\n\n{text}"},
                ],
            )

            result_text = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            result = self._parse_json_response(result_text)

            await self._conversation_repo.create(AIConversation(
                user_id=user_id,
                message=f"[Kompozisyon Değerlendirme] {text[:100]}...",
                response=result_text,
                context={"type": "composition_feedback", "task": task_type},
                role_context="student",
                tokens_used=tokens,
            ))

            logger.info(f"Composition feedback: user={user_id}, words={len(text.split())}")
            return result

        except openai.APIError as e:
            logger.error(f"OpenAI API error (composition): {e}")
            return {
                "scores": {"ideas": 3, "organization": 3, "sentence_structure": 3, "mechanics": 2, "total": 11},
                "praise": "Güzel fikirler yazmışsın!",
                "strengths": ["Yazma cesareti", "Fikir üretimi"],
                "improvements": [{"area": "Detay", "suggestion": "Daha fazla detay ekle"}],
                "next_step": "Bir detay daha eklemeyi dene",
                "encouragement": "Her yazımda gelişiyorsun! ✍️",
                "word_count": len(text.split()),
            }

    async def writing_coach(
        self,
        user_id: UUID,
        message: str,
        writing_task: str = "serbest yazma",
    ) -> Dict[str, Any]:
        """
        Real-time writing coach interaction for dysgraphia students.
        """
        prompt = DYSGRAPHIA_WRITING_COACH_PROMPT.format(writing_task=writing_task)

        # Get recent conversation history
        recent = await self._conversation_repo.get_recent_context(user_id, limit=4)
        messages = [{"role": "system", "content": prompt}]
        for conv in recent:
            if "[Yazma Koçu]" in conv.message:
                messages.append({"role": "user", "content": conv.message.replace("[Yazma Koçu] ", "")})
                messages.append({"role": "assistant", "content": conv.response})
        messages.append({"role": "user", "content": message})

        try:
            response = await self._client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                max_tokens=256,
                messages=messages,
            )

            ai_response = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0

            await self._conversation_repo.create(AIConversation(
                user_id=user_id,
                message=f"[Yazma Koçu] {message}",
                response=ai_response,
                context={"type": "writing_coach", "task": writing_task},
                role_context="student",
                tokens_used=tokens,
            ))

            return {
                "response": ai_response,
                "tokens_used": tokens,
            }

        except openai.APIError as e:
            logger.error(f"OpenAI API error (writing coach): {e}")
            return {
                "response": "Yazmaya devam et, harika gidiyorsun! Takılırsan bana sor. ✍️",
                "tokens_used": 0,
            }
