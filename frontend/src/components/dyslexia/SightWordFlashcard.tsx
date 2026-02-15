import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eye, Clock, RotateCcw } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * SightWordFlashcard – Görsel Kelime Kartları
 * Orton-Gillingham Aşama 3: Kelime Tanıma
 *
 * Sık kullanılan kelimeleri 1 saniyede tanıma pratiği.
 * Flash kart gösterisi + hafıza testi.
 * Aralıklı tekrar (spaced repetition) yaklaşımı.
 */

interface SightWord {
  word: string;
  emoji: string;
  sentence: string;
}

const SIGHT_WORDS: SightWord[] = [
  { word: 'BU', emoji: '👉', sentence: 'Bu bir kedi.' },
  { word: 'VE', emoji: '🔗', sentence: 'Kedi ve köpek.' },
  { word: 'BİR', emoji: '1️⃣', sentence: 'Bir elma yedim.' },
  { word: 'İLE', emoji: '🤝', sentence: 'Annem ile gittim.' },
  { word: 'DA', emoji: '➕', sentence: 'Ben da geldim.' },
  { word: 'ÇOK', emoji: '🌟', sentence: 'Çok güzel!' },
  { word: 'NE', emoji: '❓', sentence: 'Ne yapıyorsun?' },
  { word: 'İÇİN', emoji: '🎯', sentence: 'Senin için aldım.' },
  { word: 'AMA', emoji: '🔄', sentence: 'Ama ben istemiyorum.' },
  { word: 'HER', emoji: '♾️', sentence: 'Her gün okurum.' },
  { word: 'DEĞİL', emoji: '❌', sentence: 'Bu doğru değil.' },
  { word: 'GİBİ', emoji: '🪞', sentence: 'Kuş gibi uçmak.' },
];

type GamePhase = 'flash' | 'recall';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SightWordFlashcard({ onComplete }: GameProps) {
  const totalWords = 6;
  const [words] = useState(() => shuffle(SIGHT_WORDS).slice(0, totalWords));
  const [wordIdx, setWordIdx] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('flash');
  const [score, setScore] = useState(0);
  const [showWord, setShowWord] = useState(true);
  const [recallOptions, setRecallOptions] = useState<SightWord[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [flashTimer, setFlashTimer] = useState(3);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = words[wordIdx];

  // Flash phase: show word for 3 seconds, then test recall
  useEffect(() => {
    if (gamePhase !== 'flash' || !showWord) return;

    setFlashTimer(3);
    timerRef.current = setInterval(() => {
      setFlashTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setShowWord(false);
          // Build recall options
          const others = shuffle(SIGHT_WORDS.filter((w) => w.word !== current.word)).slice(0, 2);
          setRecallOptions(shuffle([current, ...others]));
          setGamePhase('recall');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gamePhase, showWord, current, wordIdx]);

  const handleRecall = useCallback(
    (selected: SightWord) => {
      if (feedback) return;

      if (selected.word === current.word) {
        setScore((s) => s + 20);
        setFeedback('correct');
        playSound('success');
        speak(`Harika! "${current.word}" kelimesini tanıdın!`, 0.9);

        setTimeout(() => {
          setFeedback(null);
          if (wordIdx + 1 >= totalWords) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            onComplete(score + 20, timeSpent);
          } else {
            setWordIdx((i) => i + 1);
            setGamePhase('flash');
            setShowWord(true);
          }
        }, 1500);
      } else {
        setFeedback('retry');
        playSound('click');
        speak('Tekrar bak! Kelimeyi hatırlamaya çalış.', 0.9);
        setTimeout(() => setFeedback(null), 1000);
      }
    },
    [feedback, current, wordIdx, totalWords, score, startTime, onComplete]
  );

  return (
    <div className="dyslexia-module p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          Kelime {wordIdx + 1} / {totalWords}
        </span>
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      {/* Flash Phase */}
      <AnimatePresence mode="wait">
        {gamePhase === 'flash' && showWord && (
          <motion.div
            key={`flash-${wordIdx}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" />
              <p className="text-xl font-bold">Kelimeye bak ve hatırla!</p>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="flex gap-1">
                {[3, 2, 1].map((t) => (
                  <div
                    key={t}
                    className={`w-4 h-4 rounded-full transition-colors ${
                      flashTimer >= t ? 'bg-orange-400' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Word Card */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="bg-white rounded-2xl shadow-xl px-12 py-8 border-4 border-orange-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl">{current.emoji}</span>
                <span className="text-4xl font-bold tracking-wider">{current.word}</span>
              </div>
            </motion.div>

            {/* Sentence */}
            <p className="text-lg text-center">
              Cümle: &quot;<span className="font-bold">{current.sentence}</span>&quot;
            </p>

            <button
              onClick={() => speak(`${current.word}. ${current.sentence}`, 0.8)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full
                hover:bg-blue-600 transition-colors min-h-[48px]"
            >
              <Volume2 className="w-5 h-5" /> Sesli Oku
            </button>
          </motion.div>
        )}

        {/* Recall Phase */}
        {gamePhase === 'recall' && (
          <motion.div
            key={`recall-${wordIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="text-xl font-bold text-center">
              🤔 Az önce hangi kelimeyi gördün?
            </p>

            <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
              {recallOptions.map((opt, i) => {
                const isCorrectAnswer = feedback === 'correct' && opt.word === current.word;
                const isRetry = feedback === 'retry';

                return (
                  <motion.button
                    key={opt.word}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => handleRecall(opt)}
                    disabled={feedback === 'correct'}
                    className={`
                      flex flex-col items-center gap-3 p-6 rounded-2xl border-3
                      cursor-pointer transition-all min-h-[100px]
                      hover:shadow-lg hover:scale-105
                      focus-visible:outline-4 focus-visible:outline-yellow-400
                      ${isCorrectAnswer ? 'bg-green-100 border-green-400 scale-110' : ''}
                      ${!feedback ? 'bg-white border-gray-200 hover:border-orange-300' : 'bg-white border-gray-200'}
                    `}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-2xl font-bold tracking-wide">{opt.word}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback === 'correct' && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.1 }}
                  exit={{ scale: 0 }}
                  className="text-xl font-bold text-green-600"
                >
                  ✅ Doğru! &quot;{current.word}&quot; kelimesini hatırladın!
                </motion.p>
              )}
              {feedback === 'retry' && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-lg font-bold text-yellow-600"
                >
                  🔄 Tekrar dene! Kelimeyi hatırla.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
