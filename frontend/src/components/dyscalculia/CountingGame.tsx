import { useState } from 'react';
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

export default function CountingGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const current = ROUNDS[roundIdx];

  const handleSelect = (num: number) => {
    if (feedback) return;

    if (num === current.count) {
      setFeedback('correct');
      playSound('success');
      const newScore = score + 20;
      setScore(newScore);

      setTimeout(() => {
        setFeedback(null);
        if (roundIdx + 1 >= ROUNDS.length) {
          setGameOver(true);
          onComplete(newScore, Math.floor((Date.now() - startTime) / 1000));
        } else {
          setRoundIdx((r) => r + 1);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
      playSound('error');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  if (gameOver) return null;

  return (
    <div className="theme-dyscalculia p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-dyscalculia-card px-3 py-1 rounded-lg text-sm font-bold">
          Soru {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-dyscalculia-card px-3 py-1 rounded-lg text-sm font-bold">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <p className="text-xl font-bold text-dyscalculia-text text-center">
        Kaç tane {current.emoji} var? Say ve doğru cevabı seç!
      </p>

      {/* Objects to count */}
      <motion.div
        key={roundIdx}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-lg border-2 border-dyscalculia-primary/30 min-w-[280px]"
      >
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: current.count }, (_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.15, type: 'spring' }}
              className="text-5xl cursor-default"
            >
              {current.emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Answer Options */}
      <div className="flex gap-3">
        {current.options.map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelect(num)}
            disabled={!!feedback}
            className={`
              w-16 h-16 rounded-2xl text-2xl font-bold border-2 transition-all
              ${feedback === 'correct' && num === current.count ? 'bg-green-100 border-green-500 text-green-700' : ''}
              ${!feedback ? 'bg-white border-dyscalculia-primary/30 hover:border-dyscalculia-primary text-dyscalculia-text cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
            `}
            aria-label={`Cevap: ${num}`}
          >
            {num}
          </motion.button>
        ))}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.p
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-2xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-500'}`}
          >
            {feedback === 'correct' ? '🎉 Doğru! Süpersin!' : '🤔 Tekrar say!'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
