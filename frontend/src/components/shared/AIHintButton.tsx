/**
 * AIHintButton — Aktivite içi "İpucu İste" butonu.
 * Otomatik tetikleme + manuel butonu destekler.
 * Deneme sayısına göre ipucu seviyesi artar.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Sparkles, Loader2 } from 'lucide-react';
import { useActivityHint } from '../../hooks/useAIActivity';
import type { ActivityHintResponse } from '../../services/ai-activity.service';

interface AIHintButtonProps {
  /** Bölüm ID */
  chapterId: string;
  /** Aktivite tipi (ör. "counting", "letter_formation") */
  activityType: string;
  /** Mevcut problem bilgisi */
  problem: { question: string; correct_answer?: string; [key: string]: unknown };
  /** Öğrencinin son girişi */
  studentAnswer: string;
  /** Deneme sayısı */
  attemptNumber: number;
  /** Bölüm başlığı */
  chapterTitle?: string;
  /** Öğrenme güçlüğü tipi */
  learningDifficulty?: string;
  /** Hata tipi (varsa) */
  errorType?: string;
  /** Otomatik ipucu göster (X saniye hareketsizlikten sonra) — 0 = kapalı */
  autoHintDelay?: number;
  /** İpucu gelince callback */
  onHintReceived?: (hint: ActivityHintResponse) => void;
  /** Küçük mod (sadece ikon) */
  compact?: boolean;
  /** Renk varyantı */
  variant?: 'yellow' | 'blue' | 'green' | 'purple';
}

const VARIANT_COLORS = {
  yellow: { bg: 'bg-yellow-100 hover:bg-yellow-200', text: 'text-yellow-700', border: 'border-yellow-300', panel: 'bg-yellow-50 border-yellow-200' },
  blue: { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-700', border: 'border-blue-300', panel: 'bg-blue-50 border-blue-200' },
  green: { bg: 'bg-green-100 hover:bg-green-200', text: 'text-green-700', border: 'border-green-300', panel: 'bg-green-50 border-green-200' },
  purple: { bg: 'bg-purple-100 hover:bg-purple-200', text: 'text-purple-700', border: 'border-purple-300', panel: 'bg-purple-50 border-purple-200' },
};

export default function AIHintButton({
  chapterId,
  activityType,
  problem,
  studentAnswer,
  attemptNumber,
  chapterTitle = '',
  learningDifficulty = '',
  errorType = '',
  autoHintDelay = 0,
  onHintReceived,
  compact = false,
  variant = 'yellow',
}: AIHintButtonProps) {
  const [showHint, setShowHint] = useState(false);
  const [hintData, setHintData] = useState<ActivityHintResponse | null>(null);
  const [autoPrompt, setAutoPrompt] = useState(false);
  const hintMutation = useActivityHint();
  const colors = VARIANT_COLORS[variant];

  const requestHint = useCallback(async () => {
    try {
      const result = await hintMutation.mutateAsync({
        chapter_id: chapterId,
        activity_type: activityType,
        problem,
        student_attempt: {
          answer: studentAnswer,
          attempt_number: attemptNumber,
        },
        context: {
          chapter_title: chapterTitle,
          learning_difficulty: learningDifficulty,
          error_type: errorType,
        },
      });
      setHintData(result);
      setShowHint(true);
      setAutoPrompt(false);
      onHintReceived?.(result);
    } catch {
      setHintData({
        hint: 'Yardım şu an oluşturulamadı. Tekrar dene! 💪',
        hint_level: 1,
        should_show_answer: false,
        visual_aid: 'none',
        encouragement: 'Sen başarabilirsin! 🌟',
      });
      setShowHint(true);
    }
  }, [chapterId, activityType, problem, studentAnswer, attemptNumber, chapterTitle, learningDifficulty, errorType, hintMutation, onHintReceived]);

  // Otomatik ipucu teklifi (hareketsizlik zamanlayıcı)
  useEffect(() => {
    if (autoHintDelay <= 0 || showHint || hintData) return;
    const timer = setTimeout(() => {
      setAutoPrompt(true);
    }, autoHintDelay);
    return () => clearTimeout(timer);
  }, [autoHintDelay, showHint, hintData, studentAnswer]);

  // Yeni soru/deneme gelince sıfırla
  useEffect(() => {
    setHintData(null);
    setShowHint(false);
    setAutoPrompt(false);
  }, [problem.question]);

  return (
    <div className="relative">
      {/* Otomatik ipucu teklifi */}
      <AnimatePresence>
        {autoPrompt && !showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className={`absolute bottom-full mb-2 left-0 right-0 ${colors.panel} border rounded-xl px-3 py-2 shadow-lg z-10`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${colors.text} shrink-0`} />
              <span className="text-sm font-medium">Yardım ister misin?</span>
              <button
                onClick={requestHint}
                className={`ml-auto text-xs font-bold ${colors.text} hover:underline`}
              >
                Evet!
              </button>
              <button onClick={() => setAutoPrompt(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* İpucu butonu */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={requestHint}
        disabled={hintMutation.isPending}
        className={`${colors.bg} ${colors.text} ${compact ? 'p-2' : 'px-4 py-2'} rounded-xl transition-colors flex items-center gap-2 font-medium border ${colors.border}`}
        aria-label="AI İpucu İste"
      >
        {hintMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Lightbulb className="w-5 h-5" />
        )}
        {!compact && (
          <span className="text-sm">
            {hintMutation.isPending ? 'Düşünüyorum...' : '💡 İpucu'}
          </span>
        )}
      </motion.button>

      {/* İpucu paneli */}
      <AnimatePresence>
        {showHint && hintData && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`mt-2 ${colors.panel} border rounded-xl p-4 shadow-md relative`}
          >
            <button
              onClick={() => setShowHint(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className={`w-5 h-5 ${colors.text} shrink-0 mt-0.5`} />
              <div>
                <p className="text-sm font-medium text-gray-800">{hintData.hint}</p>
                {hintData.visual_aid && hintData.visual_aid !== 'none' && (
                  <span className="inline-block mt-1 text-xs bg-white/50 px-2 py-0.5 rounded-full">
                    💡 {hintData.visual_aid === 'number_line' ? 'Sayı doğrusu dene' :
                        hintData.visual_aid === 'blocks' ? 'Blok kullan' :
                        hintData.visual_aid === 'fingers' ? 'Parmaklarını kullan' :
                        hintData.visual_aid === 'syllable_split' ? 'Hecelere ayır' :
                        hintData.visual_aid === 'stroke_order' ? 'Çizgi sırasına bak' :
                        hintData.visual_aid}
                  </span>
                )}
              </div>
            </div>

            {hintData.encouragement && (
              <p className={`text-xs ${colors.text} mt-2 font-medium`}>
                {hintData.encouragement}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-2 rounded-full ${
                    level <= hintData.hint_level ? 'bg-current' : 'bg-gray-200'
                  }`}
                />
              ))}
              <span className="text-[10px] text-gray-400 ml-1">
                İpucu {hintData.hint_level}/3
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
