import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

export default function FocusTimerGame({ onComplete }: GameProps) {
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(6);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(0);
  const [counter, setCounter] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<'perfect' | 'close' | 'miss' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [focusMode, setFocusMode] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Generate new target each round
  useEffect(() => {
    setTarget(Math.floor(Math.random() * 6) + 3); // 3-8 seconds
    setCounter(0);
    setResult(null);
    setRunning(false);
  }, [round]);

  // Counter
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setCounter((c) => {
        const next = +(c + 0.1).toFixed(1);
        // Auto-stop at 10 seconds (safety)
        if (next >= 10) {
          clearInterval(intervalRef.current);
          setRunning(false);
        }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleStop = () => {
    if (!running) {
      setRunning(true);
      setCounter(0);
      setResult(null);
      return;
    }

    clearInterval(intervalRef.current);
    setRunning(false);

    const diff = Math.abs(counter - target);
    let points = 0;
    let res: 'perfect' | 'close' | 'miss';

    if (diff <= 0.3) {
      res = 'perfect';
      points = 20;
      playSound('badge');
    } else if (diff <= 1) {
      res = 'close';
      points = 10;
      playSound('success');
    } else {
      res = 'miss';
      points = 2;
      playSound('error');
    }

    setResult(res);
    setScore((s) => s + points);

    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        setGameOver(true);
        onComplete(score + points, Math.floor((Date.now() - startTime) / 1000));
      } else {
        setRound((r) => r + 1);
      }
    }, 1500);
  };

  if (gameOver) return null;

  const progress = Math.min((counter / 10) * 100, 100);
  const targetPos = (target / 10) * 100;

  return (
    <div className={`theme-adhd p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-5 transition-all ${focusMode ? 'bg-gray-900' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${focusMode ? 'bg-gray-700 text-white' : 'bg-adhd-card'}`}>
          Tur {round + 1} / {totalRounds}
        </span>
        <button
          onClick={() => setFocusMode((f) => !f)}
          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${focusMode ? 'bg-adhd-primary text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          <Target className="w-3 h-3" />
          {focusMode ? 'Odak AÇIK' : 'Odak modu'}
        </button>
        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${focusMode ? 'bg-gray-700 text-white' : 'bg-adhd-card'}`}>
          ⭐ {score}
        </span>
      </div>

      {/* Target */}
      <motion.div
        key={round}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`text-center p-6 rounded-2xl ${focusMode ? 'bg-gray-800 text-white' : 'bg-white shadow-lg'}`}
      >
        <p className="text-sm font-bold text-gray-400 mb-1">Hedef Süre</p>
        <p className="text-6xl font-bold text-adhd-primary">{target}.0<span className="text-2xl">s</span></p>
      </motion.div>

      {/* Visual Timer Bar */}
      <div className="w-full max-w-md relative">
        <div className={`h-6 rounded-full overflow-hidden ${focusMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <motion.div
            className={`h-full rounded-full ${
              result === 'perfect' ? 'bg-green-500' :
              result === 'close' ? 'bg-yellow-500' :
              result === 'miss' ? 'bg-red-500' :
              'bg-adhd-primary'
            }`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        {/* Target marker */}
        <div
          className="absolute top-0 w-1 h-6 bg-black/50"
          style={{ left: `${targetPos}%` }}
        >
          <div className="absolute -top-5 -left-2 text-xs font-bold">🎯</div>
        </div>
        <p className="text-center mt-2 text-2xl font-bold">
          {counter.toFixed(1)}s
        </p>
      </div>

      {/* Start/Stop Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleStop}
        disabled={!!result}
        className={`
          px-10 py-4 rounded-2xl text-xl font-bold text-white transition-all
          ${running ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-adhd-secondary hover:bg-green-600'}
          disabled:opacity-50
        `}
      >
        {running ? (
          <span className="flex items-center gap-2"><Zap className="w-6 h-6" /> DURDUR!</span>
        ) : result ? (
          'Bekle...'
        ) : (
          '▶️ BAŞLAT'
        )}
      </motion.button>

      {/* Feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className={`text-2xl font-bold ${
              result === 'perfect' ? 'text-green-500' :
              result === 'close' ? 'text-yellow-600' :
              'text-red-500'
            }`}>
              {result === 'perfect' && '🎯 MÜKEMMEL! Tam isabet!'}
              {result === 'close' && '👍 Yaklaştın! Fark: ' + Math.abs(counter - target).toFixed(1) + 's'}
              {result === 'miss' && '💪 Biraz uzak! Fark: ' + Math.abs(counter - target).toFixed(1) + 's'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
