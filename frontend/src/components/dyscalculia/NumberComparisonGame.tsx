import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface ComparisonRound {
  left: number;
  right: number;
  correct: 'left' | 'right' | 'equal';
}

const ROUNDS: ComparisonRound[] = [
  { left: 7, right: 4, correct: 'left' },
  { left: 3, right: 8, correct: 'right' },
  { left: 9, right: 6, correct: 'left' },
  { left: 2, right: 7, correct: 'right' },
  { left: 6, right: 6, correct: 'equal' },
];

function DotDisplay({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex flex-wrap justify-center gap-1 mt-2 max-w-[120px]">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export default function NumberComparisonGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [selected, setSelected] = useState<'left' | 'right' | 'equal' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const current = ROUNDS[roundIdx];

  const handleSelect = (choice: 'left' | 'right' | 'equal') => {
    if (feedback) return;
    setSelected(choice);

    if (choice === current.correct) {
      setFeedback('correct');
      playSound('success');
      const newScore = score + 20;
      setScore(newScore);

      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
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
        setSelected(null);
      }, 1200);
    }
  };

  if (gameOver) return null;

  const showEqual = current.left === current.right;

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

      {/* Question */}
      <motion.p
        key={roundIdx}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 text-center"
        style={{ fontFamily: "'Comic Sans MS', 'Chalkboard', sans-serif" }}
      >
        HANGİSİ DAHA BÜYÜK?
      </motion.p>

      {/* Cards */}
      <div className="flex items-center gap-4">
        {/* Left card */}
        <motion.button
          key={`left-${roundIdx}`}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect('left')}
          disabled={!!feedback}
          className={`
            w-36 rounded-2xl p-5 shadow-lg border-3 transition-all flex flex-col items-center
            ${selected === 'left' && feedback === 'correct' ? 'bg-green-100 border-green-500' : ''}
            ${selected === 'left' && feedback === 'retry' ? 'bg-yellow-50 border-yellow-400' : ''}
            ${!feedback ? 'bg-white border-blue-200 hover:border-blue-400 cursor-pointer' : ''}
            ${feedback && selected !== 'left' ? 'bg-white border-gray-200 opacity-60' : ''}
          `}
          style={{ minHeight: 180, touchAction: 'manipulation' }}
        >
          <span className="text-7xl font-bold text-blue-600" style={{ fontFamily: 'monospace' }}>
            {current.left}
          </span>
          <DotDisplay count={current.left} color="#3182CE" />
        </motion.button>

        {/* VS */}
        <div className="text-2xl font-bold text-gray-400">VS</div>

        {/* Right card */}
        <motion.button
          key={`right-${roundIdx}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect('right')}
          disabled={!!feedback}
          className={`
            w-36 rounded-2xl p-5 shadow-lg border-3 transition-all flex flex-col items-center
            ${selected === 'right' && feedback === 'correct' ? 'bg-green-100 border-green-500' : ''}
            ${selected === 'right' && feedback === 'retry' ? 'bg-yellow-50 border-yellow-400' : ''}
            ${!feedback ? 'bg-white border-violet-200 hover:border-violet-400 cursor-pointer' : ''}
            ${feedback && selected !== 'right' ? 'bg-white border-gray-200 opacity-60' : ''}
          `}
          style={{ minHeight: 180, touchAction: 'manipulation' }}
        >
          <span className="text-7xl font-bold text-violet-600" style={{ fontFamily: 'monospace' }}>
            {current.right}
          </span>
          <DotDisplay count={current.right} color="#7C3AED" />
        </motion.button>
      </div>

      {/* Equal button */}
      {showEqual && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect('equal')}
          disabled={!!feedback}
          className={`
            px-8 py-3 rounded-2xl text-lg font-bold border-2 transition-all
            ${selected === 'equal' && feedback === 'correct' ? 'bg-green-100 border-green-500 text-green-700' : ''}
            ${!feedback ? 'bg-white border-gray-300 text-gray-700 hover:border-violet-400 cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
          `}
          style={{ touchAction: 'manipulation' }}
        >
          = EŞİT
        </motion.button>
      )}

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
              ? current.correct === 'equal'
                ? '🎉 Doğru! İkisi de eşit!'
                : `🎉 Doğru! ${current.correct === 'left' ? current.left : current.right} daha büyük!`
              : '🤔 Tekrar düşün! Noktaları say.'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
