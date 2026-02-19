import type { LearningDifficulty } from '../types';

/**
 * Speak text using the Web Speech API (browser-native, offline fallback)
 */
export function speak(text: string, rate = 0.9, lang = 'tr-TR') {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1.1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Speak text using YuBu TTS (server-side, high quality).
 * Falls back to browser speech if TTS fails.
 */
export async function yubuSpeak(
  text: string,
  emotion: 'happy' | 'encouraging' | 'gentle' | 'neutral' | 'excited' = 'neutral'
): Promise<void> {
  try {
    const { ttsService } = await import('../services/tts.service');
    const url = await ttsService.speak({ text, emotion });
    await ttsService.playAudioUrl(url);
  } catch {
    // Fallback: browser Web Speech API
    speak(text);
  }
}

/**
 * Get accessibility class names based on learning difficulty
 */
export function getThemeClass(difficulty: LearningDifficulty): string {
  const map: Record<LearningDifficulty, string> = {
    dyslexia: 'theme-dyslexia',
    dysgraphia: 'theme-dysgraphia',
    dyscalculia: 'theme-dyscalculia',
  };
  return map[difficulty] || '';
}

/**
 * Get font size based on difficulty
 */
export function getFontSize(difficulty: LearningDifficulty): number {
  const sizes: Record<LearningDifficulty, number> = {
    dyslexia: 20,
    dysgraphia: 18,
    dyscalculia: 18,
  };
  return sizes[difficulty] || 16;
}

/**
 * Get ARIA live region politeness for difficulty
 */
export function getAriaLive(difficulty: LearningDifficulty): 'polite' | 'assertive' {
  // Dyslexia needs immediate feedback
  return difficulty === 'dyslexia' ? 'assertive' : 'polite';
}

/**
 * Play a success or error sound effect  
 */
export function playSound(type: 'success' | 'error' | 'click' | 'badge' | 'correct' | 'wrong' | 'complete') {
  // Map aliases to base sound types
  const aliasMap: Record<string, string> = { correct: 'success', wrong: 'error', complete: 'badge' };
  const resolvedType = aliasMap[type] || type;

  // Use AudioContext for simple tones
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const sounds: Record<string, { freq: number; dur: number; type: OscillatorType }> = {
      success: { freq: 523, dur: 0.2, type: 'sine' },
      error: { freq: 200, dur: 0.3, type: 'square' },
      click: { freq: 800, dur: 0.05, type: 'sine' },
      badge: { freq: 659, dur: 0.15, type: 'triangle' },
    };

    const s = sounds[resolvedType];
    osc.frequency.value = s.freq;
    osc.type = s.type;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + s.dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + s.dur);

    // Play second note for badge/success
    if (resolvedType === 'badge' || resolvedType === 'success') {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = s.freq * 1.5;
      osc2.type = s.type;
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + s.dur);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + s.dur * 2);
      osc2.start(ctx.currentTime + s.dur);
      osc2.stop(ctx.currentTime + s.dur * 2);
    }
  } catch {
    // AudioContext may not be available
  }
}
