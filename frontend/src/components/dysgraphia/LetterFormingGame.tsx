import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface LetterRound {
  letter: string;
  strokes: string[];
  hint: string;
}

const ROUNDS: LetterRound[] = [
  {
    letter: 'A',
    strokes: ['Sol çapraz çizgi /', 'Sağ çapraz çizgi \\', 'Ortada yatay çizgi —'],
    hint: 'Üçgen gibi düşün, ortasına bir köprü koy!',
  },
  {
    letter: 'B',
    strokes: ['Düz dikey çizgi |', 'Üst yarım daire )', 'Alt yarım daire )'],
    hint: 'Bir direk ve iki göbek!',
  },
  {
    letter: 'E',
    strokes: ['Düz dikey çizgi |', 'Üst yatay çizgi —', 'Orta yatay çizgi —', 'Alt yatay çizgi —'],
    hint: 'Bir tarak gibi düşün, dişleri sağa bakıyor!',
  },
  {
    letter: 'K',
    strokes: ['Düz dikey çizgi |', 'Ortadan sağ yukarı çapraz /', 'Ortadan sağ aşağı çapraz \\'],
    hint: 'Bir direk ve iki kol!',
  },
  {
    letter: 'M',
    strokes: ['Sol dikey çizgi |', 'Sol çapraz \\', 'Sağ çapraz /', 'Sağ dikey çizgi |'],
    hint: 'İki dağ yanyana!',
  },
];

export default function LetterFormingGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [completedStrokes, setCompletedStrokes] = useState<boolean[]>([]);

  const current = ROUNDS[roundIdx];

  const initRound = useCallback((idx: number) => {
    setCurrentStroke(0);
    setCompletedStrokes(new Array(ROUNDS[idx].strokes.length).fill(false));
    setShowHint(false);
  }, []);

  // Initialize first round
  useState(() => {
    initRound(0);
  });

  const handleStrokeComplete = () => {
    const updated = [...completedStrokes];
    updated[currentStroke] = true;
    setCompletedStrokes(updated);
    playSound('click');

    if (currentStroke + 1 >= current.strokes.length) {
      // All strokes done for this letter
      playSound('success');
      const newScore = score + Math.round(100 / ROUNDS.length);
      setScore(newScore);

      setTimeout(() => {
        if (roundIdx + 1 >= ROUNDS.length) {
          setGameOver(true);
          onComplete(newScore, Math.floor((Date.now() - startTime) / 1000));
        } else {
          const nextIdx = roundIdx + 1;
          setRoundIdx(nextIdx);
          initRound(nextIdx);
        }
      }, 1500);
    } else {
      setCurrentStroke((s) => s + 1);
    }
  };

  if (gameOver) return null;

  return (
    <div className="theme-dysgraphia p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-dysgraphia-card px-3 py-1 rounded-lg text-sm font-bold text-dysgraphia-text">
          Harf {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-dysgraphia-card px-3 py-1 rounded-lg text-sm font-bold text-dysgraphia-text">
          ✍️ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-dysgraphia-accent/30">
        <p className="font-calm text-lg font-bold text-dysgraphia-text text-center">
          ✏️ Harfi adım adım yaz
        </p>
      </div>

      {/* Big Letter Display */}
      <motion.div
        key={current.letter}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative w-40 h-40 bg-white rounded-2xl shadow-lg border-2 border-dysgraphia-primary/30 flex items-center justify-center"
      >
        {/* Writing lines */}
        <div className="absolute inset-x-4 top-[45%] h-px bg-dysgraphia-primary/20" />
        <div className="absolute inset-x-4 bottom-6 h-px bg-dysgraphia-primary/30" />
        <span className="text-8xl font-bold text-dysgraphia-primary/20">{current.letter}</span>
      </motion.div>

      {/* Strokes progress */}
      <div className="w-full max-w-md">
        <p className="text-sm text-dysgraphia-text mb-2 font-semibold">Çizgi Adımları:</p>
        <div className="space-y-2">
          {current.strokes.map((stroke, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                completedStrokes[idx]
                  ? 'bg-green-50 border-green-400'
                  : idx === currentStroke
                  ? 'bg-dysgraphia-card border-dysgraphia-primary animate-pulse'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                completedStrokes[idx]
                  ? 'bg-green-500 text-white'
                  : idx === currentStroke
                  ? 'bg-dysgraphia-primary text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {completedStrokes[idx] ? '✓' : idx + 1}
              </span>
              <span className={`text-sm font-calm ${
                idx === currentStroke ? 'font-bold text-dysgraphia-text' : 'text-gray-500'
              }`}>
                {stroke}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Draw button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStrokeComplete}
        className="px-8 py-3 bg-dysgraphia-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-md"
      >
        ✍️ Bu Çizgiyi Yaptım!
      </motion.button>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-2 text-sm text-yellow-700"
          >
            💡 {current.hint}
          </motion.div>
        )}
      </AnimatePresence>

      {!showHint && (
        <button
          onClick={() => setShowHint(true)}
          className="text-sm text-dysgraphia-primary hover:underline"
        >
          İpucu göster
        </button>
      )}
    </div>
  );
}
