/**
 * YuBu TTS (Text-to-Speech) Service.
 * Backend API üzerinden YuBu sesini oluşturur ve cache'ler.
 */

import api from './api';

export type YuBuEmotion = 'happy' | 'encouraging' | 'gentle' | 'neutral' | 'excited';

export interface TTSSpeakRequest {
  text: string;
  emotion?: YuBuEmotion;
  speed?: number | null;
}

export interface TTSScenarioRequest {
  scenario: string;
}

export interface YuBuScenario {
  text: string;
  emotion: string;
  description: string;
}

export interface YuBuScenariosResponse {
  scenarios: Record<string, YuBuScenario>;
}

// Basit bir in-memory audio cache
const audioCache = new Map<string, string>(); // key → blob URL
const MAX_CACHE = 50;

function getCacheKey(text: string, emotion: string): string {
  return `${emotion}::${text.slice(0, 100)}`;
}

function cacheAudioUrl(key: string, url: string): void {
  if (audioCache.size >= MAX_CACHE) {
    // En eski entry'yi sil
    const firstKey = audioCache.keys().next().value;
    if (firstKey) {
      const oldUrl = audioCache.get(firstKey);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      audioCache.delete(firstKey);
    }
  }
  audioCache.set(key, url);
}

export const ttsService = {
  /**
   * Metni YuBu sesiyle seslendirme (MP3 döner)
   */
  async speak(request: TTSSpeakRequest): Promise<string> {
    const emotion = request.emotion || 'neutral';
    const key = getCacheKey(request.text, emotion);

    // Cache'den kontrol et
    const cached = audioCache.get(key);
    if (cached) return cached;

    const response = await api.post('/api/ai/tts/speak', {
      text: request.text,
      emotion,
      speed: request.speed ?? null,
    }, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    cacheAudioUrl(key, url);
    return url;
  },

  /**
   * Önceden tanımlı senaryo sesini çal
   */
  async speakScenario(scenario: string): Promise<string> {
    const key = `scenario::${scenario}`;

    const cached = audioCache.get(key);
    if (cached) return cached;

    const response = await api.post('/api/ai/tts/scenario', { scenario }, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    cacheAudioUrl(key, url);
    return url;
  },

  /**
   * Mevcut senaryoların listesi
   */
  async getScenarios(): Promise<YuBuScenariosResponse> {
    const res = await api.get<YuBuScenariosResponse>('/api/ai/tts/scenarios');
    return res.data;
  },

  /**
   * Blob URL'den ses çal
   */
  playAudioUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  },

  /**
   * Cache temizle
   */
  clearCache(): void {
    audioCache.forEach((url) => URL.revokeObjectURL(url));
    audioCache.clear();
  },
};
