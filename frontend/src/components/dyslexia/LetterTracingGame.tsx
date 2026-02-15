import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, RotateCcw } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface TraceLetter {
  letter: string;
  points: { x: number; y: number; order: number }[];
}

const LETTERS: TraceLetter[] = [
  { letter: 'A', points: [{ x: 20, y: 90, order: 1 }, { x: 50, y: 10, order: 2 }, { x: 80, y: 90, order: 3 }, { x: 35, y: 55, order: 4 }, { x: 65, y: 55, order: 5 }] },
  { letter: 'B', points: [{ x: 25, y: 10, order: 1 }, { x: 25, y: 90, order: 2 }, { x: 60, y: 10, order: 3 }, { x: 75, y: 30, order: 4 }, { x: 60, y: 50, order: 5 }, { x: 75, y: 70, order: 6 }, { x: 60, y: 90, order: 7 }] },
  { letter: 'C', points: [{ x: 75, y: 20, order: 1 }, { x: 50, y: 10, order: 2 }, { x: 25, y: 30, order: 3 }, { x: 20, y: 50, order: 4 }, { x: 25, y: 70, order: 5 }, { x: 50, y: 90, order: 6 }, { x: 75, y: 80, order: 7 }] },
  { letter: 'D', points: [{ x: 25, y: 10, order: 1 }, { x: 25, y: 90, order: 2 }, { x: 55, y: 10, order: 3 }, { x: 75, y: 30, order: 4 }, { x: 78, y: 50, order: 5 }, { x: 75, y: 70, order: 6 }, { x: 55, y: 90, order: 7 }] },
  { letter: 'E', points: [{ x: 70, y: 10, order: 1 }, { x: 25, y: 10, order: 2 }, { x: 25, y: 50, order: 3 }, { x: 60, y: 50, order: 4 }, { x: 25, y: 90, order: 5 }, { x: 70, y: 90, order: 6 }] },
];

export default function LetterTracingGame({ onComplete }: GameProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hitPoints, setHitPoints] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  const current = LETTERS[currentIdx];
  const nextPoint = current.points[hitPoints.length];

  const handlePointClick = (order: number) => {
    if (!nextPoint || order !== nextPoint.order) {
      playSound('error');
      return;
    }

    playSound('click');
    const newHits = [...hitPoints, order];
    setHitPoints(newHits);

    if (newHits.length === current.points.length) {
      // Letter complete!
      playSound('success');
      speak(`${current.letter} harfi tamamlandı!`);
      const letterScore = score + 20;
      setScore(letterScore);

      setTimeout(() => {
        if (currentIdx + 1 >= LETTERS.length) {
          setCompleted(true);
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          onComplete(letterScore, timeSpent);
        } else {
          setCurrentIdx((i) => i + 1);
          setHitPoints([]);
        }
      }, 1000);
    }
  };

  const reset = () => {
    setHitPoints([]);
  };

  if (completed) return null;

  return (
    <div className="theme-dyslexia p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-white/50 px-3 py-1 rounded-lg text-sm font-bold">
          Harf {currentIdx + 1} / {LETTERS.length}
        </span>
        <span className="bg-white/50 px-3 py-1 rounded-lg text-sm font-bold">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="flex items-center gap-3">
        <p className="text-xl font-bold">Noktaları sırayla tıkla:</p>
        <button
          onClick={() => speak(`${current.letter} harfini çiz`)}
          className="p-2 bg-dyslexia-primary text-white rounded-full"
          aria-label="Talimatı sesli oku"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Letter Display with huge letter in bg */}
      <div className="relative w-72 h-72 bg-white rounded-2xl border-4 border-dyslexia-secondary shadow-lg">
        {/* Ghost letter */}
        <div className="absolute inset-0 flex items-center justify-center text-[160px] font-bold text-gray-100 select-none pointer-events-none">
          {current.letter}
        </div>

        {/* Lines between hit points */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {hitPoints.map((_, i) => {
            if (i === 0) return null;
            const from = current.points[i - 1];
            const to = current.points[i];
            return (
              <line
                key={i}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="#FF6B35"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Interactive points */}
        {current.points.map((point) => {
          const isHit = hitPoints.includes(point.order);
          const isNext = nextPoint?.order === point.order;

          return (
            <motion.button
              key={point.order}
              onClick={() => handlePointClick(point.order)}
              className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center text-sm font-bold
                transition-all duration-200 focus-visible:outline-4 focus-visible:outline-yellow-400
                ${isHit ? 'bg-green-500 text-white scale-75' : ''}
                ${isNext ? 'bg-dyslexia-primary text-white animate-pulse-glow scale-110' : ''}
                ${!isHit && !isNext ? 'bg-gray-300 text-gray-500' : ''}
              `}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              animate={isNext ? { scale: [1, 1.2, 1] } : {}}
              transition={isNext ? { repeat: Infinity, duration: 1.5 } : {}}
              aria-label={`Nokta ${point.order}${isNext ? ' - şimdi tıkla' : ''}`}
            >
              {point.order}
            </motion.button>
          );
        })}
      </div>

      {/* Reset button */}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-white/50 rounded-xl text-sm font-medium hover:bg-white/80 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Baştan Başla
      </button>

      {/* Feedback */}
      <AnimatePresence>
        {hitPoints.length === current.points.length && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.2 }}
            exit={{ scale: 0 }}
            className="text-3xl font-bold text-green-600"
          >
            ✅ {current.letter} Tamamlandı!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
