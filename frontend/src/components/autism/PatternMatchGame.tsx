import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface PatternRound {
  pattern: string[];
  answer: string;
  options: string[];
}

const ROUNDS: PatternRound[] = [
  { pattern: ['🔴', '🔵', '🔴', '🔵', '🔴'], answer: '🔵', options: ['🔵', '🟢', '🔴', '🟡'] },
  { pattern: ['⭐', '⭐', '🌙', '⭐', '⭐'], answer: '🌙', options: ['⭐', '🌙', '☀️', '🌍'] },
  { pattern: ['🟩', '🟨', '🟩', '🟨', '🟩'], answer: '🟨', options: ['🟩', '🟨', '🟦', '🟥'] },
  { pattern: ['🐱', '🐶', '🐱', '🐶', '🐱'], answer: '🐶', options: ['🐱', '🐶', '🐰', '🐸'] },
  { pattern: ['▲', '●', '■', '▲', '●'], answer: '■', options: ['▲', '●', '■', '◆'] },
];

export default function PatternMatchGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const current = ROUNDS[roundIdx];

  const handleSelect = (option: string) => {
    if (feedback) return;

    const correct = option === current.answer;
    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
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
      playSound('error');
      setTimeout(() => setFeedback(null), 800);
    }
  };

  if (gameOver) return null;

  return (
    <div className="theme-autism p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-autism-card px-3 py-1 rounded-lg text-sm font-bold text-autism-text">
          Kalıp {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-autism-card px-3 py-1 rounded-lg text-sm font-bold text-autism-text">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-autism-accent/30">
        <p className="font-calm text-lg font-bold text-autism-text text-center">
          🧩 Kalıba uyan sonraki şekli bul
        </p>
      </div>

      {/* Pattern Display */}
      <div className="flex items-center gap-3 bg-white rounded-2xl p-6 shadow-md border border-autism-accent/20">
        {current.pattern.map((item, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15 }}
            className="text-4xl"
          >
            {item}
          </motion.span>
        ))}
        <motion.span
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-4xl w-12 h-12 border-3 border-dashed border-autism-primary rounded-xl flex items-center justify-center"
        >
          ?
        </motion.span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {current.options.map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(option)}
            disabled={!!feedback}
            className={`
              p-6 rounded-xl border-2 text-4xl text-center
              transition-all duration-200
              ${feedback === 'correct' && option === current.answer ? 'bg-green-100 border-green-500' : ''}
              ${!feedback ? 'bg-white border-autism-accent/30 hover:border-autism-primary cursor-pointer' : 'bg-white border-gray-200'}
            `}
            aria-label={`Seçenek: ${option}`}
          >
            {option}
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
            {feedback === 'correct' ? '✅ Doğru! Mükemmel!' : '❌ Tekrar dene!'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
