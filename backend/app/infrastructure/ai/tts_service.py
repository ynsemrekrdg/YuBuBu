"""
YuBu Text-to-Speech Service.
Converts text to speech using ElevenLabs API with YuBu character voice.
Jessica voice — Playful, Bright, Warm, Cute.
Supports emotion-based voice settings for a child-friendly experience.
"""

import re
from typing import Literal, Optional

import httpx
from loguru import logger

from app.config import settings

# ─── ElevenLabs Defaults ──────────────────────────────
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_MODEL = "eleven_multilingual_v2"  # Türkçe dahil çok dilli
YUBU_VOICE_ID = "cgSgspJ2msm6clMCkdW9"  # Jessica — Playful, Bright, Warm, Cute

# Emosyon bazlı ses ayarları (ElevenLabs voice_settings)
# stability: 0 = çok değişken/enerjik, 1 = monoton/sakin
# similarity_boost: model'e sadakat
# style: 0 = nötr, 1 = abartılı stil
EMOTION_VOICE_SETTINGS = {
    "happy": {"stability": 0.35, "similarity_boost": 0.80, "style": 0.70, "use_speaker_boost": True},
    "encouraging": {"stability": 0.50, "similarity_boost": 0.75, "style": 0.50, "use_speaker_boost": True},
    "gentle": {"stability": 0.65, "similarity_boost": 0.70, "style": 0.30, "use_speaker_boost": True},
    "neutral": {"stability": 0.50, "similarity_boost": 0.75, "style": 0.45, "use_speaker_boost": True},
    "excited": {"stability": 0.25, "similarity_boost": 0.85, "style": 0.80, "use_speaker_boost": True},
}

EmotionType = Literal["happy", "encouraging", "gentle", "neutral", "excited"]


class YuBuVoice:
    """
    YuBu karakterinin ses servisi.
    ElevenLabs API ile Türkçe metni sese dönüştürür.
    Jessica sesi — çocuk dostu, oyunsu, sıcak.
    """

    def __init__(self):
        self._api_key = settings.ELEVENLABS_API_KEY
        self._voice_id = getattr(settings, "ELEVENLABS_VOICE_ID", YUBU_VOICE_ID)
        self._model = getattr(settings, "ELEVENLABS_MODEL", ELEVENLABS_MODEL)

    async def speak(
        self,
        text: str,
        emotion: EmotionType = "neutral",
        speed: Optional[float] = None,
    ) -> bytes:
        """
        Metni YuBu sesiyle konuştur (ElevenLabs).

        Args:
            text: Konuşturulacak metin (Türkçe)
            emotion: Emosyon tipi — ses ayarlarını belirler
            speed: Kullanılmıyor (ElevenLabs uyumluluğu için tutuldu)

        Returns:
            MP3 formatında ses verisi (bytes)
        """
        clean_text = self._prepare_text(text, emotion)
        voice_settings = EMOTION_VOICE_SETTINGS.get(
            emotion, EMOTION_VOICE_SETTINGS["neutral"]
        )

        payload = {
            "text": clean_text,
            "model_id": self._model,
            "voice_settings": voice_settings,
        }

        url = f"{ELEVENLABS_API_URL}/text-to-speech/{self._voice_id}"
        headers = {
            "xi-api-key": self._api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()

                audio_bytes = response.content

                logger.info(
                    f"YuBu TTS (ElevenLabs): {len(clean_text)} chars, "
                    f"emotion={emotion}, voice={self._voice_id}, "
                    f"audio_size={len(audio_bytes)} bytes"
                )

                return audio_bytes

        except httpx.HTTPStatusError as e:
            logger.error(f"ElevenLabs API error: {e.response.status_code} — {e.response.text[:200]}")
            raise
        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise

    def _prepare_text(self, text: str, emotion: EmotionType) -> str:
        """
        Metni TTS için hazırla.
        Emosyon etiketlerini temizle, uzun boşlukları kaldır.
        """
        text = re.sub(r'\[EMOTION:\s*\w+\]', '', text).strip()
        text = re.sub(r'\s+', ' ', text)

        if emotion == "gentle":
            text = text.replace('!', '.')

        return text.strip()

    async def speak_scenario(self, scenario_key: str) -> Optional[bytes]:
        """
        Önceden tanımlı YuBu senaryolarını seslendirme.
        """
        from app.infrastructure.ai.yubu_prompts import YUBU_SCENARIOS

        scenario = YUBU_SCENARIOS.get(scenario_key)
        if not scenario:
            logger.warning(f"Unknown YuBu scenario: {scenario_key}")
            return None

        return await self.speak(
            text=scenario["text"],
            emotion=scenario["emotion"],
        )
