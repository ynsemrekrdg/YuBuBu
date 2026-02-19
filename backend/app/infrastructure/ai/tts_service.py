"""
YuBu Text-to-Speech Service.
Converts text to speech using OpenAI TTS API with YuBu character voice settings.
Supports emotion-based voice adjustments.
"""

import io
from typing import Literal, Optional

import openai
from loguru import logger

from app.config import settings

# YuBu ses profil ayarları
YUBU_VOICE = "nova"  # Kadın, genç, enerjik — YuBu için en uygun
YUBU_MODEL = "tts-1"  # Standart kalite (hızlı), "tts-1-hd" yüksek kalite
YUBU_DEFAULT_SPEED = 0.95  # Biraz yavaş (çocuklar anlayabilsin)

# Emosyon bazlı hız ayarları
EMOTION_SPEED_MAP = {
    "happy": 1.05,       # Sevinçli: biraz hızlı, enerjik
    "encouraging": 0.9,  # Cesaretlendirici: yavaş, net
    "gentle": 0.85,      # Nazik: en yavaş, rahatlatıcı
    "neutral": 0.95,     # Normal: standart hız
    "excited": 1.1,      # Heyecanlı: hızlı
}

EmotionType = Literal["happy", "encouraging", "gentle", "neutral", "excited"]


class YuBuVoice:
    """
    YuBu karakterinin ses servisi.
    OpenAI TTS API ile Türkçe metni sese dönüştürür.
    """

    def __init__(self):
        self._client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._voice = getattr(settings, "TTS_VOICE", YUBU_VOICE)
        self._model = getattr(settings, "TTS_MODEL", YUBU_MODEL)

    async def speak(
        self,
        text: str,
        emotion: EmotionType = "neutral",
        speed: Optional[float] = None,
    ) -> bytes:
        """
        Metni YuBu sesiyle konuştur.

        Args:
            text: Konuşturulacak metin (Türkçe)
            emotion: Emosyon tipi — hız ayarını belirler
            speed: Manuel hız ayarı (0.25 - 4.0), None ise emosyona göre

        Returns:
            MP3 formatında ses verisi (bytes)
        """
        # Emosyona göre hız belirle
        if speed is None:
            speed = EMOTION_SPEED_MAP.get(emotion, YUBU_DEFAULT_SPEED)

        # Hız sınırla (OpenAI limiti: 0.25 - 4.0)
        speed = max(0.25, min(4.0, speed))

        # Metni temizle (TTS için uygun hale getir)
        clean_text = self._prepare_text(text, emotion)

        try:
            response = await self._client.audio.speech.create(
                model=self._model,
                voice=self._voice,
                input=clean_text,
                speed=speed,
                response_format="mp3",
            )

            # Response'u bytes olarak oku
            audio_bytes = response.content

            logger.info(
                f"YuBu TTS: {len(clean_text)} chars, "
                f"emotion={emotion}, speed={speed}, "
                f"audio_size={len(audio_bytes)} bytes"
            )

            return audio_bytes

        except openai.APIError as e:
            logger.error(f"OpenAI TTS API error: {e}")
            raise
        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise

    def _prepare_text(self, text: str, emotion: EmotionType) -> str:
        """
        Metni TTS için hazırla.
        Emosyon etiketlerini temizle, uzun boşlukları kaldır.
        """
        # Emosyon etiketlerini temizle
        import re
        text = re.sub(r'\[EMOTION:\s*\w+\]', '', text).strip()

        # Fazla boşlukları temizle
        text = re.sub(r'\s+', ' ', text)

        # Emosyon bazlı küçük düzenlemeler
        if emotion == "happy":
            # Ünlem işaretlerini koru (heyecanlı ton için)
            pass
        elif emotion == "gentle":
            # Ünlem işaretlerini noktaya çevir (yumuşak ton için)
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
