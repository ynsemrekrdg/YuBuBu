import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface NumberLineRound {
  question: string;
  start: number;
  steps: number;
  answer: number;
  options: number[];
}

const ROUNDS: NumberLineRound[] = [
  { question: '3 + 2 = ?', start: 3, steps: 2, answer: 5, options: [4, 5, 6, 7] },
  { question: '5 + 3 = ?', start: 5, steps: 3, answer: 8, options: [7, 8, 9, 6] },
  { question: '2 + 4 = ?', start: 2, steps: 4, answer: 6, options: [5, 6, 7, 8] },
  { question: '7 + 2 = ?', start: 7, steps: 2, answer: 9, options: [8, 9, 10, 7] },
  { question: '4 + 4 = ?', start: 4, steps: 4, answer: 8, options: [6, 7, 8, 9] },
];

export default function NumberLineGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [animStep, setAnimStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const current = ROUNDS[roundIdx];

  const startAnimation = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setAnimStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnimStep(step);
      playSound('click');
      if (step >= current.steps) {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 600);
  }, [animating, current.steps]);

  const handleSelect = (num: number) => {
    if (feedback || animating) return;

    if (num === current.answer) {
      setFeedback('correct');
      playSound('success');
      const newScore = score + 20;
      setScore(newScore);

      setTimeout(() => {
        setFeedback(null);
        setAnimStep(0);
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

  const ballPos = current.start + animStep;

  return (
    <div className="theme-dyscalculia p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="bg-dyscalculia-card px-3 py-1 rounded-lg text-sm font-bold text-dyscalculia-text">
          Soru {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-dyscalculia-card px-3 py-1 rounded-lg text-sm font-bold text-dyscalculia-text">
          ⭐ {score} puan
        </span>
      </div>

      {/* Question */}
      <motion.div
        key={roundIdx}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl px-8 py-4 shadow-lg border-2 border-dyscalculia-primary"
      >
        <p className="text-3xl font-bold text-dyscalculia-text text-center">{current.question}</p>
      </motion.div>

      {/* Number Line */}
      <div className="w-full max-w-lg px-4">
        <div className="relative">
          {/* Line */}
          <div className="h-1 bg-gray-300 rounded-full w-full" />

          {/* Numbers */}
          <div className="flex justify-between -mt-4">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-1 h-3 bg-gray-400 mb-1" />
                <span
                  className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center
                    ${i === current.start ? 'bg-dyscalculia-primary text-white' : ''}
                    ${i === current.answer && feedback === 'correct' ? 'bg-green-500 text-white' : ''}
                    ${i >= current.start && i <= current.start + animStep && i !== current.start ? 'bg-dyscalculia-secondary text-white' : ''}
                    ${!([current.start, current.answer].includes(i)) && !(i > current.start && i <= current.start + animStep) ? 'text-gray-500' : ''}
                  `}
                >
                  {i}
                </span>
              </div>
            ))}
          </div>

          {/* Animated Ball */}
          <motion.div
            animate={{ left: `${(ballPos / 10) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute -top-8 -ml-4"
          >
            <div className="text-3xl">🔵</div>
          </motion.div>
        </div>
      </div>

      {/* Animate Button */}
      <button
        onClick={startAnimation}
        disabled={animating || !!feedback}
        className="px-6 py-2 bg-dyscalculia-primary text-white rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {animating ? 'Sayıyor...' : '🎯 Sayı çizgisinde göster'}
      </button>

      {/* Answer Options */}
      <div className="flex gap-3">
        {current.options.map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelect(num)}
            disabled={!!feedback || animating}
            className={`
              w-16 h-16 rounded-2xl text-2xl font-bold border-2 transition-all
              ${feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' : ''}
              ${!feedback ? 'bg-white border-dyscalculia-primary/30 text-dyscalculia-text hover:border-dyscalculia-primary cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
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
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-2xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-500'}`}
          >
            {feedback === 'correct' ? '🎉 Doğru! Harika!' : '🤔 Tekrar dene!'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
