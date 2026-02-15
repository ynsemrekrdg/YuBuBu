import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface PlaceValueRound {
  target: number;
  tens: number;
  ones: number;
}

const ROUNDS: PlaceValueRound[] = [
  { target: 23, tens: 2, ones: 3 },
  { target: 15, tens: 1, ones: 5 },
  { target: 31, tens: 3, ones: 1 },
  { target: 47, tens: 4, ones: 7 },
  { target: 12, tens: 1, ones: 2 },
];

export default function PlaceValueBlocksGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [tensCount, setTensCount] = useState(0);
  const [onesCount, setOnesCount] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [hintLevel, setHintLevel] = useState(0);

  const current = ROUNDS[roundIdx];
  const currentValue = tensCount * 10 + onesCount;

  const handleAddTen = () => {
    if (feedback) return;
    if (tensCount < 9) {
      setTensCount(t => t + 1);
      playSound('click');
    }
  };

  const handleRemoveTen = () => {
    if (feedback) return;
    if (tensCount > 0) {
      setTensCount(t => t - 1);
      playSound('click');
    }
  };

  const handleAddOne = () => {
    if (feedback) return;
    if (onesCount < 9) {
      setOnesCount(o => o + 1);
      playSound('click');
    }
  };

  const handleRemoveOne = () => {
    if (feedback) return;
    if (onesCount > 0) {
      setOnesCount(o => o - 1);
      playSound('click');
    }
  };

  const handleCheck = () => {
    if (feedback) return;

    if (currentValue === current.target) {
      setFeedback('correct');
      playSound('success');
      const newScore = score + 20;
      setScore(newScore);

      setTimeout(() => {
        setFeedback(null);
        setTensCount(0);
        setOnesCount(0);
        setHintLevel(0);
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
      setHintLevel(h => Math.min(h + 1, 3));
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const handleHint = () => {
    setHintLevel(h => Math.min(h + 1, 3));
  };

  if (gameOver) return null;

  return (
    <div className="dyscalculia-module p-6 rounded-2xl min-h-[500px] flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          Soru {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          ⭐ {score} puan
        </span>
      </div>

      {/* Target */}
      <motion.div
        key={roundIdx}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl px-8 py-4 shadow-lg border-2 border-violet-300"
      >
        <p className="text-lg font-bold text-gray-600 text-center mb-1">Hedef Sayı</p>
        <p className="text-5xl font-bold text-center" style={{ fontFamily: 'monospace' }}>
          <span style={{ color: '#FC8181' }}>{current.tens}</span>
          <span style={{ color: '#68D391' }}>{current.ones}</span>
        </p>
      </motion.div>

      {/* Hint */}
      {hintLevel >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-sm text-yellow-800"
        >
          {hintLevel === 1 && `${current.target} için kaç onluk gerekir?`}
          {hintLevel === 2 && `${current.tens} onluk gerekir (${current.tens} × 10 = ${current.tens * 10})`}
          {hintLevel >= 3 && `${current.tens} onluk + ${current.ones} birlik = ${current.target}`}
        </motion.div>
      )}

      {/* Blocks Area */}
      <div className="flex gap-6 w-full max-w-lg">
        {/* Tens section */}
        <div className="flex-1 bg-red-50 rounded-2xl p-4 border-2 border-red-200">
          <p className="text-center font-bold text-red-600 mb-3 text-lg">ONLAR</p>

          {/* Tens blocks visualization */}
          <div className="flex flex-wrap gap-2 justify-center min-h-[80px] mb-3">
            {Array.from({ length: tensCount }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-red-300 rounded-lg shadow-sm flex items-center justify-center"
                style={{ width: 40, height: 24 }}
              >
                <span className="text-xs font-bold text-red-800">10</span>
              </motion.div>
            ))}
          </div>

          {/* Tens controls */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRemoveTen}
              disabled={tensCount <= 0 || !!feedback}
              className="w-10 h-10 rounded-full bg-red-200 text-red-700 font-bold text-xl flex items-center justify-center disabled:opacity-30"
            >
              −
            </motion.button>
            <span className="text-3xl font-bold text-red-600 w-10 text-center" style={{ fontFamily: 'monospace' }}>
              {tensCount}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddTen}
              disabled={tensCount >= 9 || !!feedback}
              className="w-10 h-10 rounded-full bg-red-200 text-red-700 font-bold text-xl flex items-center justify-center disabled:opacity-30"
            >
              +
            </motion.button>
          </div>
          <p className="text-center text-sm text-red-500 mt-1 font-bold">= {tensCount * 10}</p>
        </div>

        {/* Ones section */}
        <div className="flex-1 bg-green-50 rounded-2xl p-4 border-2 border-green-200">
          <p className="text-center font-bold text-green-600 mb-3 text-lg">BİRLER</p>

          {/* Ones blocks visualization */}
          <div className="flex flex-wrap gap-2 justify-center min-h-[80px] mb-3">
            {Array.from({ length: onesCount }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-300 rounded shadow-sm flex items-center justify-center"
                style={{ width: 24, height: 24 }}
              >
                <span className="text-xs font-bold text-green-800">1</span>
              </motion.div>
            ))}
          </div>

          {/* Ones controls */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRemoveOne}
              disabled={onesCount <= 0 || !!feedback}
              className="w-10 h-10 rounded-full bg-green-200 text-green-700 font-bold text-xl flex items-center justify-center disabled:opacity-30"
            >
              −
            </motion.button>
            <span className="text-3xl font-bold text-green-600 w-10 text-center" style={{ fontFamily: 'monospace' }}>
              {onesCount}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddOne}
              disabled={onesCount >= 9 || !!feedback}
              className="w-10 h-10 rounded-full bg-green-200 text-green-700 font-bold text-xl flex items-center justify-center disabled:opacity-30"
            >
              +
            </motion.button>
          </div>
          <p className="text-center text-sm text-green-500 mt-1 font-bold">= {onesCount}</p>
        </div>
      </div>

      {/* Current total */}
      <div className="bg-white rounded-2xl px-6 py-3 shadow-md border-2 border-gray-200">
        <p className="text-center text-sm text-gray-500 font-bold">Senin Sayın</p>
        <p className="text-4xl font-bold text-center" style={{ fontFamily: 'monospace' }}>
          <span style={{ color: '#FC8181' }}>{tensCount}</span>
          <span style={{ color: '#68D391' }}>{onesCount}</span>
          <span className="text-gray-400 text-2xl ml-2">= {currentValue}</span>
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleHint}
          disabled={hintLevel >= 3}
          className="px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-xl font-bold text-sm hover:bg-yellow-200 disabled:opacity-40"
        >
          💡 İpucu
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCheck}
          disabled={!!feedback}
          className="px-8 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-50 shadow-lg"
        >
          ✓ Kontrol Et
        </motion.button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-xl font-bold px-6 py-3 rounded-2xl ${
              feedback === 'correct'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {feedback === 'correct'
              ? `🎉 Süper! ${current.tens} onluk + ${current.ones} birlik = ${current.target}`
              : `🤔 Şu an ${currentValue} var. ${current.target} için biraz daha düzelt!`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
