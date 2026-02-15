import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eye, Ear, Hand } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * LetterSoundGame – Harf-Ses İlişkisi (VAKT) Oyunu
 * Orton-Gillingham Aşama 2: Alphabetic Principle
 *
 * 4 aşamalı öğretim: Gör → Duy → Havada Yaz → Eşleştir
 * Visual – Auditory – Kinesthetic – Tactile
 */

interface LetterItem {
  letter: string;
  sound: string; // TTS text for the sound
  word: string; // Example word
  emoji: string;
}

const LETTERS: LetterItem[] = [
  { letter: 'A', sound: 'aaa', word: 'ARABA', emoji: '🚗' },
  { letter: 'B', sound: 'bö', word: 'BALIK', emoji: '🐟' },
  { letter: 'C', sound: 'cö', word: 'CAM', emoji: '🪟' },
  { letter: 'D', sound: 'dö', word: 'DEFTER', emoji: '📓' },
  { letter: 'E', sound: 'eee', word: 'ELMA', emoji: '🍎' },
  { letter: 'K', sound: 'kö', word: 'KEDİ', emoji: '🐱' },
  { letter: 'M', sound: 'mmm', word: 'MASA', emoji: '🪑' },
  { letter: 'O', sound: 'ooo', word: 'OKUL', emoji: '🏫' },
  { letter: 'S', sound: 'sss', word: 'SU', emoji: '💧' },
  { letter: 'T', sound: 'tö', word: 'TOP', emoji: '⚽' },
];

type Phase = 'see' | 'hear' | 'skywrite' | 'match';

const PHASE_ORDER: Phase[] = ['see', 'hear', 'skywrite', 'match'];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function LetterSoundGame({ onComplete }: GameProps) {
  const totalLetters = 5;
  const [letters] = useState(() => shuffle(LETTERS).slice(0, totalLetters));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('see');
  const [score, setScore] = useState(0);
  const [skyWritePoints, setSkyWritePoints] = useState<{ x: number; y: number }[]>([]);
  const [matchOptions, setMatchOptions] = useState<LetterItem[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [startTime] = useState(Date.now());

  const current = letters[currentIdx];

  const phaseLabels: Record<Phase, { icon: string; label: string }> = {
    see: { icon: '👁️', label: 'GÖR' },
    hear: { icon: '👂', label: 'DUY' },
    skywrite: { icon: '✋', label: 'HAVADA YAZ' },
    match: { icon: '🎯', label: 'EŞLEŞTİR' },
  };

  const nextPhase = useCallback(() => {
    const idx = PHASE_ORDER.indexOf(phase);
    if (idx < PHASE_ORDER.length - 1) {
      const next = PHASE_ORDER[idx + 1];
      setPhase(next);
      if (next === 'match') {
        // Build match options
        const others = shuffle(LETTERS.filter((l) => l.letter !== current.letter)).slice(0, 2);
        setMatchOptions(shuffle([current, ...others]));
      }
    }
  }, [phase, current]);

  const handleMatch = useCallback(
    (selected: LetterItem) => {
      if (feedback) return;

      if (selected.letter === current.letter) {
        setScore((s) => s + 20);
        setFeedback('correct');
        playSound('success');
        speak(`Doğru! ${current.letter} harfi, ${current.word} kelimesinde var!`, 0.9);

        setTimeout(() => {
          setFeedback(null);
          setSkyWritePoints([]);
          if (currentIdx + 1 >= totalLetters) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            onComplete(score + 20, timeSpent);
          } else {
            setCurrentIdx((i) => i + 1);
            setPhase('see');
          }
        }, 1500);
      } else {
        setFeedback('retry');
        playSound('click');
        speak('Tekrar dene!', 0.9);
        setTimeout(() => setFeedback(null), 800);
      }
    },
    [feedback, current, currentIdx, totalLetters, score, startTime, onComplete]
  );

  // Sky-writing: capture mouse/touch movement
  const handleSkyWrite = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      if (e.buttons !== 1) return;
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    setSkyWritePoints((prev) => [...prev, { x, y }]);
  };

  return (
    <div className="dyslexia-module p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          Harf {currentIdx + 1} / {totalLetters}
        </span>
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      {/* Phase indicator */}
      <div className="flex gap-2">
        {PHASE_ORDER.map((p) => (
          <div
            key={p}
            className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${
              p === phase
                ? 'bg-orange-400 text-white scale-110'
                : PHASE_ORDER.indexOf(p) < PHASE_ORDER.indexOf(phase)
                ? 'bg-green-200 text-green-700'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {phaseLabels[p].icon} {phaseLabels[p].label}
          </div>
        ))}
      </div>

      {/* Phase Content */}
      <AnimatePresence mode="wait">
        {/* SEE Phase */}
        {phase === 'see' && (
          <motion.div
            key="see"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-lg font-bold">👁️ Harfe bak:</p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-300"
            >
              <span className="text-[120px] font-bold leading-none">{current.letter}</span>
            </motion.div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{current.emoji}</span>
              <span className="text-2xl font-bold">{current.word}</span>
            </div>
            <button
              onClick={() => {
                speak(`Bu ${current.letter} harfi. ${current.word} kelimesinde var.`, 0.8);
                setTimeout(nextPhase, 1500);
              }}
              className="px-6 py-3 bg-orange-400 text-white rounded-xl font-bold
                hover:bg-orange-500 transition-colors min-h-[60px] text-lg"
            >
              👁️ Gördüm! Devam et
            </button>
          </motion.div>
        )}

        {/* HEAR Phase */}
        {phase === 'hear' && (
          <motion.div
            key="hear"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-lg font-bold">👂 Sesi dinle:</p>
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-300"
            >
              <span className="text-[100px] font-bold leading-none">{current.letter}</span>
            </motion.div>
            <button
              onClick={() => speak(current.sound, 0.6)}
              className="flex items-center gap-2 px-8 py-4 bg-blue-500 text-white rounded-full
                hover:bg-blue-600 transition-colors min-h-[60px] text-xl font-bold"
              aria-label={`${current.letter} harfinin sesini dinle`}
            >
              <Volume2 className="w-6 h-6" /> Sesi Dinle
            </button>
            <p className="text-xl text-center">
              <span className="font-bold">{current.letter}</span> harfi
              &quot;<span className="font-bold">{current.sound}</span>&quot; sesi çıkarır
            </p>
            <button
              onClick={() => {
                speak(current.sound, 0.6);
                setTimeout(nextPhase, 1200);
              }}
              className="px-6 py-3 bg-orange-400 text-white rounded-xl font-bold
                hover:bg-orange-500 transition-colors min-h-[60px] text-lg"
            >
              👂 Duydum! Devam et
            </button>
          </motion.div>
        )}

        {/* SKYWRITE Phase */}
        {phase === 'skywrite' && (
          <motion.div
            key="skywrite"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-lg font-bold">✋ Parmağınla havada yaz:</p>
            <div className="relative">
              {/* Ghost letter */}
              <div className="absolute inset-0 flex items-center justify-center text-[140px] font-bold text-gray-100 pointer-events-none select-none">
                {current.letter}
              </div>
              {/* Drawing area */}
              <div
                className="w-72 h-72 bg-white rounded-2xl border-4 border-purple-300 shadow-lg cursor-crosshair touch-none relative overflow-hidden"
                onMouseMove={handleSkyWrite}
                onTouchMove={handleSkyWrite}
              >
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {skyWritePoints.map((p, i) => {
                    if (i === 0) return null;
                    const prev = skyWritePoints[i - 1];
                    return (
                      <line
                        key={i}
                        x1={prev.x}
                        y1={prev.y}
                        x2={p.x}
                        y2={p.y}
                        stroke="#8B5CF6"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
            <button
              onClick={() => {
                speak(`Harika! ${current.letter} harfini yazdın!`, 0.9);
                playSound('success');
                setTimeout(nextPhase, 800);
              }}
              className="px-6 py-3 bg-orange-400 text-white rounded-xl font-bold
                hover:bg-orange-500 transition-colors min-h-[60px] text-lg"
            >
              ✋ Yazdım! Devam et
            </button>
          </motion.div>
        )}

        {/* MATCH Phase */}
        {phase === 'match' && (
          <motion.div
            key="match"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-lg font-bold">
              🎯 &quot;{current.sound}&quot; sesini çıkaran harfi bul:
            </p>
            <button
              onClick={() => speak(current.sound, 0.6)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full
                hover:bg-blue-600 transition-colors min-h-[48px]"
            >
              <Volume2 className="w-5 h-5" /> Sesi tekrar dinle
            </button>
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {matchOptions.map((opt, i) => {
                const isCorrectAnswer = feedback === 'correct' && opt.letter === current.letter;
                const isRetry = feedback === 'retry';

                return (
                  <motion.button
                    key={opt.letter}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => handleMatch(opt)}
                    disabled={feedback === 'correct'}
                    className={`
                      flex flex-col items-center gap-2 p-6 rounded-2xl border-3
                      cursor-pointer transition-all min-h-[100px]
                      hover:shadow-lg hover:scale-105
                      focus-visible:outline-4 focus-visible:outline-yellow-400
                      ${isCorrectAnswer ? 'bg-green-100 border-green-400 scale-110' : ''}
                      ${!feedback ? 'bg-white border-gray-200 hover:border-orange-300' : 'bg-white border-gray-200'}
                    `}
                  >
                    <span className="text-5xl font-bold">{opt.letter}</span>
                    <span className="text-2xl">{opt.emoji}</span>
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
                  ✅ Doğru! {current.letter} = &quot;{current.sound}&quot;
                </motion.p>
              )}
              {feedback === 'retry' && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-lg font-bold text-yellow-600"
                >
                  🔄 Tekrar dene! Sesi dinle.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
