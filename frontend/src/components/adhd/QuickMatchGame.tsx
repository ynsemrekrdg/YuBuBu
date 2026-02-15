import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

const COLORS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound() {
  const shown = shuffle(COLORS).slice(0, 4);
  const missingIdx = Math.floor(Math.random() * 4);
  const missing = shown[missingIdx];
  const display = shown.filter((_, i) => i !== missingIdx);
  // Options: the missing + 2 random wrong
  const wrong = COLORS.filter((c) => !shown.includes(c)).slice(0, 2);
  const options = shuffle([missing, ...wrong, display[0]]);
  return { shown, display, missing, options };
}

export default function QuickMatchGame({ onComplete }: GameProps) {
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(8);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [phase, setPhase] = useState<'show' | 'guess' | 'feedback'>('show');
  const [roundData, setRoundData] = useState(generateRound);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [showPoints, setShowPoints] = useState(0);

  // Show phase: display cards for 2 seconds
  useEffect(() => {
    if (phase !== 'show') return;
    const timer = setTimeout(() => {
      setPhase('guess');
      setTimeLeft(10);
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase, round]);

  // Countdown timer during guess phase
  useEffect(() => {
    if (phase !== 'guess') return;
    if (timeLeft <= 0) {
      setFeedback('wrong');
      setPhase('feedback');
      setCombo(0);
      playSound('error');
      setTimeout(() => nextRound(), 1000);
      return;
    }
    const t = setTimeout(() => setTimeLeft((tl) => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const nextRound = useCallback(() => {
    if (round + 1 >= totalRounds) {
      setGameOver(true);
      onComplete(score, Math.floor((Date.now() - startTime) / 1000));
    } else {
      setRound((r) => r + 1);
      setRoundData(generateRound());
      setPhase('show');
      setFeedback(null);
    }
  }, [round, totalRounds, score, startTime, onComplete]);

  const handleGuess = (color: string) => {
    if (phase !== 'guess') return;

    if (color === roundData.missing) {
      const newCombo = combo + 1;
      const comboBonus = newCombo >= 3 ? 5 : 0;
      const points = 10 + comboBonus + Math.max(0, timeLeft);
      setShowPoints(points);
      setScore((s) => s + points);
      setCombo(newCombo);
      setFeedback('correct');
      playSound('success');
    } else {
      setFeedback('wrong');
      setCombo(0);
      playSound('error');
    }
    setPhase('feedback');
    setTimeout(() => nextRound(), 1000);
  };

  if (gameOver) return null;

  return (
    <div className="theme-adhd p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-5">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-adhd-card px-3 py-1 rounded-lg text-sm font-bold">
          {round + 1} / {totalRounds}
        </span>
        {combo >= 2 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-adhd-primary text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1"
          >
            <Zap className="w-4 h-4" /> {combo}x Kombo!
          </motion.span>
        )}
        <span className="bg-adhd-card px-3 py-1 rounded-lg text-sm font-bold">
          ⭐ {score}
        </span>
      </div>

      {/* Timer */}
      {phase === 'guess' && (
        <div className="w-full max-w-md">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timeLeft <= 3 ? 'bg-red-500' : 'bg-adhd-secondary'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 10) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className={`text-center text-sm font-bold mt-1 ${timeLeft <= 3 ? 'text-red-500' : 'text-gray-500'}`}>
            ⏱️ {timeLeft}s
          </p>
        </div>
      )}

      {/* Phase: Show */}
      {phase === 'show' && (
        <div className="text-center">
          <p className="text-lg font-bold text-adhd-text mb-4">🧠 İyi bak ve hatırla!</p>
          <div className="flex gap-4">
            {roundData.shown.map((color, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="text-6xl"
              >
                {color}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Phase: Guess */}
      {phase === 'guess' && (
        <div className="text-center">
          <p className="text-lg font-bold text-adhd-text mb-3">🤔 Hangi renk eksik?</p>
          <div className="flex gap-4 mb-6">
            {roundData.display.map((color, i) => (
              <span key={i} className="text-5xl">{color}</span>
            ))}
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-5xl"
            >
              ❓
            </motion.span>
          </div>
          <div className="flex gap-3 justify-center">
            {roundData.options.map((color, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleGuess(color)}
                className="text-5xl p-3 bg-white rounded-2xl border-2 border-adhd-primary/30 hover:border-adhd-primary shadow-md cursor-pointer"
                aria-label={`Seçenek ${i + 1}`}
              >
                {color}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-center"
          >
            <p className={`text-3xl font-bold ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
              {feedback === 'correct' ? '⚡ Doğru!' : '💥 Yanlış!'}
            </p>
            {feedback === 'correct' && showPoints > 0 && (
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                className="text-2xl font-bold text-adhd-primary mt-1"
              >
                +{showPoints} puan!
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
