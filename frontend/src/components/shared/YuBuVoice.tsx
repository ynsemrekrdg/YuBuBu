/**
 * YuBuVoice — YuBu Karakterinin Ses Bileşeni.
 * Backend TTS API ile sunucu tarafı ses üretir.
 * Fallback olarak tarayıcı Web Speech API kullanır.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { ttsService, type YuBuEmotion } from '../../services/tts.service';
import { browserSpeak } from '../../utils/accessibility';

interface YuBuVoiceProps {
  /** Seslendirilecek metin */
  text: string;
  /** Otomatik çal */
  autoPlay?: boolean;
  /** Emosyon tipi */
  emotion?: YuBuEmotion;
  /** Senaryo key (text yerine senaryo kullan) */
  scenario?: string;
  /** Compact mode — sadece ikon buton */
  compact?: boolean;
  /** Avatar göster */
  showAvatar?: boolean;
  /** Konuşma balonu göster */
  showBubble?: boolean;
  /** Ses bittiğinde callback */
  onComplete?: () => void;
  /** Ek CSS class */
  className?: string;
}

export default function YuBuVoice({
  text,
  autoPlay = false,
  emotion = 'neutral',
  scenario,
  compact = false,
  showAvatar = false,
  showBubble = false,
  onComplete,
  className = '',
}: YuBuVoiceProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const playVoice = useCallback(async () => {
    if (playing || loading) return;

    setLoading(true);
    setError(false);

    try {
      let audioUrl: string;

      if (scenario) {
        audioUrl = await ttsService.speakScenario(scenario);
      } else {
        audioUrl = await ttsService.speak({ text, emotion });
      }

      setLoading(false);
      setPlaying(true);

      await ttsService.playAudioUrl(audioUrl);

      setPlaying(false);
      onComplete?.();
    } catch (err) {
      console.warn('YuBu TTS hatası, tarayıcı sesine geçiliyor:', err);
      setLoading(false);
      setError(true);

      // Fallback: Tarayıcı Web Speech API
      try {
        setPlaying(true);
        browserSpeak(text);
        // Web Speech API senkron değil, tahmini süre
        setTimeout(() => {
          setPlaying(false);
          onComplete?.();
        }, Math.max(2000, text.length * 80));
      } catch {
        setPlaying(false);
      }
    }
  }, [text, emotion, scenario, playing, loading, onComplete]);

  const stopVoice = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setLoading(false);
  }, []);

  // Otomatik çal
  useEffect(() => {
    if (autoPlay && text) {
      // Küçük gecikme — component mount sonrası çal
      const timer = setTimeout(playVoice, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, text]); // playVoice değiştiğinde tetiklenmemesi için kasıtlı olarak dışarıda

  // ─── Compact Mode (sadece ikon) ─────────────────────────
  if (compact) {
    return (
      <button
        onClick={playing ? stopVoice : playVoice}
        disabled={loading}
        className={`transition-colors ${
          playing
            ? 'text-yub-500 hover:text-yub-700'
            : error
              ? 'text-orange-400 hover:text-orange-600'
              : 'text-gray-400 hover:text-gray-600'
        } ${className}`}
        aria-label={playing ? 'Sesi durdur' : 'YuBu sesiyle dinle'}
        title={playing ? 'Durdur' : error ? 'Tarayıcı sesiyle dinle' : 'YuBu ile dinle'}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : playing ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  // ─── Full Mode (Avatar + Balon) ─────────────────────────
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* YuBu Avatar */}
      {showAvatar && (
        <motion.div
          className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 flex items-center justify-center shadow-md shrink-0 ${
            playing ? 'ring-2 ring-yub-400 ring-offset-2' : ''
          }`}
          animate={playing ? { scale: [1, 1.05, 1], y: [0, -2, 0] } : {}}
          transition={playing ? { repeat: Infinity, duration: 0.6 } : {}}
        >
          <span className="text-2xl" role="img" aria-label="YuBu">
            {playing ? '🗣️' : emotion === 'happy' ? '😊' : emotion === 'gentle' ? '🤗' : '✨'}
          </span>
        </motion.div>
      )}

      <div className="flex-1 min-w-0">
        {/* Konuşma balonu */}
        {showBubble && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm border border-gray-100 mb-2"
            >
              <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Oynat/Durdur butonu */}
        <button
          onClick={playing ? stopVoice : playVoice}
          disabled={loading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            playing
              ? 'bg-yub-100 text-yub-700 hover:bg-yub-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Hazırlanıyor...</span>
            </>
          ) : playing ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span>Durdur</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>{error ? 'Tekrar Dinle' : 'YuBu ile Dinle'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// YuBu Senaryo Butonu — Tek tıkla önceden tanımlı sesi çal
// ═══════════════════════════════════════════════════════════════

interface YuBuScenarioButtonProps {
  scenario: string;
  label?: string;
  className?: string;
  onComplete?: () => void;
}

export function YuBuScenarioButton({
  scenario,
  label,
  className = '',
  onComplete,
}: YuBuScenarioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const play = async () => {
    if (playing || loading) return;
    setLoading(true);
    try {
      const url = await ttsService.speakScenario(scenario);
      setLoading(false);
      setPlaying(true);
      await ttsService.playAudioUrl(url);
      setPlaying(false);
      onComplete?.();
    } catch (err) {
      console.warn('Senaryo sesi çalınamadı:', err);
      setLoading(false);
      setPlaying(false);
    }
  };

  return (
    <button
      onClick={play}
      disabled={playing || loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${playing ? 'bg-yub-100 text-yub-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-yub-50 hover:border-yub-300'}
        disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : playing ? (
        <Volume2 className="w-3 h-3 animate-pulse" />
      ) : (
        <Volume2 className="w-3 h-3" />
      )}
      <span>{label || scenario}</span>
    </button>
  );
}
