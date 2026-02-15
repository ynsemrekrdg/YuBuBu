import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface CountRound {
  emoji: string;
  count: number;
  options: number[];
}

const ROUNDS: CountRound[] = [
  { emoji: '🍎', count: 3, options: [2, 3, 4, 5] },
  { emoji: '⭐', count: 5, options: [4, 5, 6, 3] },
  { emoji: '🐟', count: 4, options: [3, 5, 4, 6] },
  { emoji: '🌸', count: 7, options: [6, 7, 8, 5] },
  { emoji: '🏀', count: 6, options: [5, 7, 6, 8] },
];

export default function ConcreteCountingGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [phase, setPhase] = useState<'count' | 'answer'>('count');

  const current = ROUNDS[roundIdx];

  const handleTapObject = useCallback((index: number) => {
    if (feedback || phase !== 'count') return;
    const newTapped = new Set(tapped);
    if (newTapped.has(index)) {
      newTapped.delete(index);
    } else {
      newTapped.add(index);
    }
    setTapped(newTapped);
    playSound('click');

    // After tapping all objects, move to answer phase
    if (newTapped.size === current.count) {
      setTimeout(() => setPhase('answer'), 600);
    }
  }, [feedback, tapped, current.count, phase]);

  const handleSelect = (num: number) => {
    if (feedback) return;

    if (num === current.count) {
      setFeedback('correct');
      playSound('success');
      const newScore = score + 20;
      setScore(newScore);

      setTimeout(() => {
        setFeedback(null);
        setTapped(new Set());
        setPhase('count');
        if (roundIdx + 1 >= ROUNDS.length) {
          setGameOver(true);
          onComplete(newScore, Math.floor((Date.now() - startTime) / 1000));
        } else {
          setRoundIdx((r) => r + 1);
        }
      }, 1500);
    } else {
      setFeedback('retry');
      playSound('click');
      setTimeout(() => {
        setFeedback(null);
        setPhase('count');
        setTapped(new Set());
      }, 1200);
    }
  };

  if (gameOver) return null;

  return (
    <div className="dyscalculia-module p-6 rounded-2xl min-h-[450px] flex flex-col items-center gap-5">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          Soru {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <motion.p
        key={`inst-${roundIdx}-${phase}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-gray-800 text-center"
        style={{ fontFamily: "'Comic Sans MS', 'Chalkboard', sans-serif" }}
      >
        {phase === 'count'
          ? `${current.emoji} Nesnelere tek tek dokun ve say!`
          : 'Kaç tane saydın? Doğru sayıyı seç!'}
      </motion.p>

      {/* Counting Area */}
      <motion.div
        key={roundIdx}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 shadow-lg border-2 border-violet-200 min-w-[300px] relative"
      >
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: current.count }, (_, i) => (
            <motion.button
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileTap={{ scale: 1.2 }}
              onClick={() => handleTapObject(i)}
              className={`text-5xl cursor-pointer select-none relative transition-all duration-200 rounded-xl p-2
                ${tapped.has(i) ? 'bg-yellow-100 ring-3 ring-yellow-400 scale-110' : 'hover:bg-gray-50'}
              `}
              style={{ minWidth: 60, minHeight: 60, touchAction: 'manipulation' }}
              aria-label={`${current.emoji} nesne ${i + 1}`}
            >
              {current.emoji}
              {tapped.has(i) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow"
                >
                  {Array.from(tapped).sort().indexOf(i) + 1}
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
        {/* Counter display */}
        <div className="mt-4 text-center">
          <span className="text-lg font-bold text-gray-600">
            Sayılan: <span className="text-violet-600 text-2xl">{tapped.size}</span>
          </span>
        </div>
      </motion.div>

      {/* Answer Options - only in answer phase */}
      <AnimatePresence>
        {phase === 'answer' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex gap-3"
          >
            {current.options.map((num) => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSelect(num)}
                disabled={!!feedback}
                className={`
                  w-16 h-16 rounded-2xl text-2xl font-bold border-2 transition-all shadow-sm
                  ${feedback === 'correct' && num === current.count ? 'bg-green-100 border-green-500 text-green-700' : ''}
                  ${!feedback ? 'bg-white border-violet-300 text-gray-800 hover:border-violet-500 cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
                `}
                style={{ minWidth: 64, minHeight: 64, touchAction: 'manipulation' }}
                aria-label={`Cevap: ${num}`}
              >
                {num}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xl font-bold px-6 py-3 rounded-2xl ${
              feedback === 'correct'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {feedback === 'correct'
              ? '🎉 Harika! Doğru saydın!'
              : '🤔 Tekrar deneyelim! Birlikte sayalım.'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
