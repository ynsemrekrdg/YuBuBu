import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface CRAProblem {
  a: number;
  b: number;
  answer: number;
  emoji: string;
  options: number[];
}

const PROBLEMS: CRAProblem[] = [
  { a: 5, b: 2, answer: 3, emoji: '🍭', options: [2, 3, 4, 1] },
  { a: 7, b: 3, answer: 4, emoji: '🍩', options: [3, 4, 5, 2] },
  { a: 6, b: 4, answer: 2, emoji: '🧁', options: [1, 2, 3, 4] },
  { a: 8, b: 5, answer: 3, emoji: '🍪', options: [2, 3, 4, 5] },
  { a: 9, b: 6, answer: 3, emoji: '🍬', options: [2, 3, 4, 1] },
];

type Phase = 'concrete' | 'representational' | 'abstract';

export default function SubtractionCRAGame({ onComplete }: GameProps) {
  const [problemIdx, setProblemIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('concrete');
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  // Concrete: removed items
  const [removedItems, setRemovedItems] = useState<Set<number>>(new Set());

  // Representational
  const [animStep, setAnimStep] = useState(0);
  const [animPhase, setAnimPhase] = useState<'idle' | 'start' | 'removing' | 'done'>('idle');

  const current = PROBLEMS[problemIdx];

  const resetRound = useCallback(() => {
    setRemovedItems(new Set());
    setAnimStep(0);
    setAnimPhase('idle');
    setPhase('concrete');
    setFeedback(null);
  }, []);

  // Concrete: tap to remove items
  const handleRemoveItem = (idx: number) => {
    if (removedItems.has(idx) || feedback) return;
    const next = new Set(removedItems);
    next.add(idx);
    setRemovedItems(next);
    playSound('click');
  };

  const allRemoved = removedItems.size === current.b;

  const handleConcreteAnswer = (num: number) => {
    if (feedback || !allRemoved) return;
    if (num === current.answer) {
      setFeedback('correct');
      playSound('success');
      setTimeout(() => {
        setFeedback(null);
        setPhase('representational');
      }, 1200);
    } else {
      setFeedback('retry');
      playSound('click');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  // Representational: number line backward
  const startNumberLine = () => {
    if (animPhase !== 'idle') return;
    setAnimPhase('start');
    setAnimStep(current.a);

    setTimeout(() => {
      setAnimPhase('removing');
      let step = current.a;
      const interval = setInterval(() => {
        step--;
        setAnimStep(step);
        playSound('click');
        if (step <= current.answer) {
          clearInterval(interval);
          setAnimPhase('done');
        }
      }, 600);
    }, 800);
  };

  const handleRepAnswer = (num: number) => {
    if (feedback || animPhase !== 'done') return;
    if (num === current.answer) {
      setFeedback('correct');
      playSound('success');
      setTimeout(() => {
        setFeedback(null);
        setPhase('abstract');
      }, 1200);
    } else {
      setFeedback('retry');
      playSound('click');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  // Abstract
  const handleAbstractAnswer = (num: number) => {
    if (feedback) return;
    if (num === current.answer) {
      setFeedback('correct');
      playSound('success');
      const newScore = score + 20;
      setScore(newScore);
      setTimeout(() => {
        if (problemIdx + 1 >= PROBLEMS.length) {
          setGameOver(true);
          onComplete(newScore, Math.floor((Date.now() - startTime) / 1000));
        } else {
          setProblemIdx(p => p + 1);
          resetRound();
        }
      }, 1500);
    } else {
      setFeedback('retry');
      playSound('click');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  if (gameOver) return null;

  const phaseLabels = {
    concrete: '1️⃣ Somut',
    representational: '2️⃣ Temsili',
    abstract: '3️⃣ Soyut',
  };

  return (
    <div className="dyscalculia-module p-5 rounded-2xl min-h-[480px] flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          Soru {problemIdx + 1} / {PROBLEMS.length}
        </span>
        <span className="bg-orange-100 px-3 py-1.5 rounded-lg text-sm font-bold text-orange-700">
          {phaseLabels[phase]}
        </span>
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          ⭐ {score}
        </span>
      </div>

      {/* Phase progress */}
      <div className="flex gap-2">
        {(['concrete', 'representational', 'abstract'] as Phase[]).map((p) => (
          <div
            key={p}
            className={`w-3 h-3 rounded-full transition-all ${
              p === phase ? 'bg-orange-500 scale-125' :
              (['concrete', 'representational', 'abstract'].indexOf(p) < ['concrete', 'representational', 'abstract'].indexOf(phase)) ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <motion.div
        key={`${problemIdx}-${phase}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* ─── CONCRETE ─── */}
        {phase === 'concrete' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-gray-800 text-center">
              {current.a} − {current.b} = ? →
              {removedItems.size} / {current.b} tane sil!
            </p>

            {/* Items grid */}
            <div className="bg-white rounded-2xl p-5 border-2 border-orange-200 shadow-sm">
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: current.a }, (_, i) => {
                  const isRemoved = removedItems.has(i);
                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleRemoveItem(i)}
                      disabled={isRemoved || allRemoved || !!feedback}
                      animate={isRemoved ? { scale: 0.3, opacity: 0.2 } : { scale: 1, opacity: 1 }}
                      transition={{ type: 'spring' }}
                      whileTap={!isRemoved && !allRemoved ? { scale: 0.85 } : {}}
                      className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center border-2 transition-colors ${
                        isRemoved ? 'bg-gray-100 border-gray-200 line-through' :
                        allRemoved ? 'bg-green-50 border-green-300' :
                        'bg-orange-50 border-orange-300 hover:border-red-400 cursor-pointer'
                      }`}
                    >
                      {isRemoved ? '✕' : current.emoji}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Answer options */}
            {allRemoved && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                <p className="text-lg font-bold text-gray-700">Kaç tane kaldı?</p>
                <div className="flex gap-2">
                  {current.options.map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleConcreteAnswer(num)}
                      disabled={!!feedback}
                      className={`w-14 h-14 rounded-xl text-xl font-bold border-2 ${
                        feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' :
                        'bg-white border-orange-300 text-gray-800 hover:border-orange-500'
                      }`}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ─── REPRESENTATIONAL ─── */}
        {phase === 'representational' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-gray-800 text-center">
              Sayı doğrusunda {current.a} − {current.b} = ?
            </p>

            <div className="w-full px-4">
              <div className="relative pt-8 pb-2">
                {/* Animated marker */}
                <motion.div
                  animate={{ left: `${(animStep / 10) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="absolute top-0 -ml-3 text-2xl"
                >
                  🐸
                </motion.div>

                {/* Line */}
                <div className="h-1 bg-gray-300 rounded-full w-full relative">
                  {/* Starting position marker */}
                  {animPhase !== 'idle' && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(current.a / 10) * 100}%` }}
                      className="absolute h-1 bg-blue-300 rounded-full top-0 left-0"
                    />
                  )}
                  {/* Subtraction trail */}
                  {animPhase === 'done' && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(current.b / 10) * 100}%` }}
                      className="absolute h-1 bg-red-300 rounded-full top-0"
                      style={{ left: `${(current.answer / 10) * 100}%` }}
                    />
                  )}
                </div>

                {/* Tick marks */}
                <div className="flex justify-between mt-2">
                  {Array.from({ length: 11 }, (_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-gray-400 mb-1" />
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center
                        ${i === current.a ? 'bg-blue-200 text-blue-700' : ''}
                        ${i === current.answer && animPhase === 'done' ? 'bg-green-200 text-green-700' : ''}
                        ${![current.a, current.answer].includes(i) ? 'text-gray-500' : ''}
                      `}>
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-2 text-sm font-bold">
                {animPhase !== 'idle' && (
                  <span className="text-blue-600">Başlangıç: {current.a}</span>
                )}
                {(animPhase === 'removing' || animPhase === 'done') && (
                  <span className="text-red-500">−{current.b}</span>
                )}
              </div>
            </div>

            {animPhase === 'idle' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startNumberLine}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600"
              >
                🐸 Kurbağayı başlat!
              </motion.button>
            )}

            {animPhase === 'done' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                <p className="text-lg font-bold text-gray-700">Kurbağa hangi sayıda durdu?</p>
                <div className="flex gap-2">
                  {current.options.map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRepAnswer(num)}
                      disabled={!!feedback}
                      className={`w-14 h-14 rounded-xl text-xl font-bold border-2 ${
                        feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' :
                        'bg-white border-orange-300 text-gray-800 hover:border-orange-500'
                      }`}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ─── ABSTRACT ─── */}
        {phase === 'abstract' && (
          <div className="flex flex-col items-center gap-5">
            <p className="text-lg font-bold text-gray-600 text-center">Şimdi doğrudan çöz!</p>

            <div className="bg-white rounded-2xl px-10 py-6 shadow-lg border-2 border-orange-200">
              <p className="text-5xl font-bold text-center" style={{ fontFamily: 'monospace' }}>
                {current.a} − {current.b} = <span className="text-orange-400">?</span>
              </p>
            </div>

            <div className="flex gap-2">
              {current.options.map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAbstractAnswer(num)}
                  disabled={!!feedback}
                  className={`w-16 h-16 rounded-2xl text-2xl font-bold border-2 transition-all shadow-sm
                    ${feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' : ''}
                    ${!feedback ? 'bg-white border-orange-300 text-gray-800 hover:border-orange-500 cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
                  `}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold px-6 py-3 rounded-2xl ${
              feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {feedback === 'correct'
              ? phase === 'abstract'
                ? `🎉 Harika! ${current.a} − ${current.b} = ${current.answer}`
                : '✅ Doğru! Sonraki aşamaya geçiyoruz!'
              : '🤔 Tekrar deneyelim! Kalanları sayalım.'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
