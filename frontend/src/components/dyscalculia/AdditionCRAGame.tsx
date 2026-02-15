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
  { a: 3, b: 2, answer: 5, emoji: '🍊', options: [4, 5, 6, 3] },
  { a: 4, b: 3, answer: 7, emoji: '🍎', options: [6, 7, 8, 5] },
  { a: 5, b: 2, answer: 7, emoji: '⭐', options: [6, 7, 8, 9] },
  { a: 2, b: 4, answer: 6, emoji: '🎈', options: [5, 6, 7, 4] },
  { a: 6, b: 3, answer: 9, emoji: '🌸', options: [8, 9, 10, 7] },
];

type Phase = 'concrete' | 'representational' | 'abstract';

export default function AdditionCRAGame({ onComplete }: GameProps) {
  const [problemIdx, setProblemIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>('concrete');
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  // Concrete phase states
  const [group1Moved, setGroup1Moved] = useState(false);
  const [group2Moved, setGroup2Moved] = useState(false);

  // Representational phase state
  const [animStep, setAnimStep] = useState(0);
  const [animPhase, setAnimPhase] = useState<'idle' | 'first' | 'second' | 'done'>('idle');

  const current = PROBLEMS[problemIdx];

  const resetRound = useCallback(() => {
    setGroup1Moved(false);
    setGroup2Moved(false);
    setAnimStep(0);
    setAnimPhase('idle');
    setPhase('concrete');
    setFeedback(null);
  }, []);

  // Concrete: move groups to total area
  const handleMoveGroup1 = () => {
    if (group1Moved || feedback) return;
    setGroup1Moved(true);
    playSound('click');
  };

  const handleMoveGroup2 = () => {
    if (!group1Moved || group2Moved || feedback) return;
    setGroup2Moved(true);
    playSound('click');
    // After both groups moved, go to answer
  };

  const handleConcreteAnswer = (num: number) => {
    if (feedback || !group2Moved) return;
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

  // Representational: number line animation
  const startNumberLine = () => {
    if (animPhase !== 'idle') return;
    setAnimPhase('first');
    setAnimStep(0);

    // First jump: go to 'a'
    let step = 0;
    const interval1 = setInterval(() => {
      step++;
      setAnimStep(step);
      playSound('click');
      if (step >= current.a) {
        clearInterval(interval1);
        setAnimPhase('second');

        // Small pause then second jump
        setTimeout(() => {
          let step2 = current.a;
          const interval2 = setInterval(() => {
            step2++;
            setAnimStep(step2);
            playSound('click');
            if (step2 >= current.a + current.b) {
              clearInterval(interval2);
              setAnimPhase('done');
            }
          }, 500);
        }, 600);
      }
    }, 500);
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

  // Abstract: direct calculation
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
        <span className="bg-violet-100 px-3 py-1.5 rounded-lg text-sm font-bold text-violet-700">
          {phaseLabels[phase]}
        </span>
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          ⭐ {score}
        </span>
      </div>

      {/* Phase progress dots */}
      <div className="flex gap-2">
        {(['concrete', 'representational', 'abstract'] as Phase[]).map((p) => (
          <div
            key={p}
            className={`w-3 h-3 rounded-full transition-all ${
              p === phase ? 'bg-violet-600 scale-125' : 
              (['concrete', 'representational', 'abstract'].indexOf(p) < ['concrete', 'representational', 'abstract'].indexOf(phase)) ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Problem display */}
      <motion.div
        key={`${problemIdx}-${phase}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* ─── CONCRETE PHASE ─── */}
        {phase === 'concrete' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-gray-800 text-center">
              {current.a} + {current.b} = ? → Nesneleri birleştir!
            </p>

            <div className="flex gap-4 w-full">
              {/* Group 1 */}
              <motion.button
                onClick={handleMoveGroup1}
                disabled={group1Moved}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  group1Moved ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-red-50 border-red-200 hover:border-red-400 cursor-pointer'
                }`}
                whileHover={!group1Moved ? { scale: 1.02 } : {}}
                whileTap={!group1Moved ? { scale: 0.98 } : {}}
              >
                <p className="text-sm font-bold text-red-600 mb-2">İLK GRUP</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {Array.from({ length: current.a }, (_, i) => (
                    <span key={i} className="text-3xl">{current.emoji}</span>
                  ))}
                </div>
              </motion.button>

              {/* Group 2 */}
              <motion.button
                onClick={handleMoveGroup2}
                disabled={!group1Moved || group2Moved}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  group2Moved ? 'bg-gray-50 border-gray-200 opacity-50' : 
                  group1Moved ? 'bg-blue-50 border-blue-200 hover:border-blue-400 cursor-pointer' : 'bg-blue-50 border-blue-200 opacity-50'
                }`}
                whileHover={group1Moved && !group2Moved ? { scale: 1.02 } : {}}
              >
                <p className="text-sm font-bold text-blue-600 mb-2">İKİNCİ GRUP</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {Array.from({ length: current.b }, (_, i) => (
                    <span key={i} className="text-3xl">{current.emoji}</span>
                  ))}
                </div>
              </motion.button>
            </div>

            {/* Total area */}
            <div className="w-full p-4 rounded-2xl border-2 border-green-200 bg-green-50 min-h-[80px]">
              <p className="text-sm font-bold text-green-600 mb-2">TOPLAM</p>
              <div className="flex flex-wrap gap-1 justify-center">
                <AnimatePresence>
                  {group1Moved && Array.from({ length: current.a }, (_, i) => (
                    <motion.span
                      key={`g1-${i}`}
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-3xl"
                    >
                      {current.emoji}
                    </motion.span>
                  ))}
                  {group2Moved && Array.from({ length: current.b }, (_, i) => (
                    <motion.span
                      key={`g2-${i}`}
                      initial={{ scale: 0, y: -20 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-3xl"
                    >
                      {current.emoji}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Answer */}
            {group2Moved && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                <p className="text-lg font-bold text-gray-700">Toplam kaç tane?</p>
                <div className="flex gap-2">
                  {current.options.map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleConcreteAnswer(num)}
                      disabled={!!feedback}
                      className={`w-14 h-14 rounded-xl text-xl font-bold border-2 ${
                        feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' :
                        'bg-white border-violet-300 text-gray-800 hover:border-violet-500'
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

        {/* ─── REPRESENTATIONAL PHASE ─── */}
        {phase === 'representational' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg font-bold text-gray-800 text-center">
              Sayı doğrusunda {current.a} + {current.b} = ?
            </p>

            {/* Number line */}
            <div className="w-full px-4">
              <div className="relative pt-8 pb-2">
                {/* Car animation */}
                <motion.div
                  animate={{ left: `${(animStep / 10) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="absolute top-0 -ml-3 text-2xl"
                >
                  🚗
                </motion.div>

                {/* Line */}
                <div className="h-1 bg-gray-300 rounded-full w-full relative">
                  {/* First jump trail */}
                  {animStep > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.min(animStep, current.a) / 10) * 100}%` }}
                      className="absolute h-1 bg-blue-400 rounded-full top-0 left-0"
                    />
                  )}
                  {/* Second jump trail */}
                  {animStep > current.a && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((animStep - current.a) / 10) * 100}%` }}
                      className="absolute h-1 bg-green-400 rounded-full top-0"
                      style={{ left: `${(current.a / 10) * 100}%` }}
                    />
                  )}
                </div>

                {/* Numbers */}
                <div className="flex justify-between mt-2">
                  {Array.from({ length: 11 }, (_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-gray-400 mb-1" />
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center
                        ${i === 0 ? 'bg-gray-200' : ''}
                        ${i === current.a ? 'bg-blue-200 text-blue-700' : ''}
                        ${i === current.answer && animPhase === 'done' ? 'bg-green-200 text-green-700' : ''}
                        ${!([0, current.a, current.answer].includes(i)) ? 'text-gray-500' : ''}
                      `}>
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div className="flex justify-center gap-4 mt-2 text-sm font-bold">
                {animPhase !== 'idle' && (
                  <span className="text-blue-600">+{current.a}</span>
                )}
                {(animPhase === 'second' || animPhase === 'done') && (
                  <span className="text-green-600">+{current.b}</span>
                )}
              </div>
            </div>

            {/* Start animation button */}
            {animPhase === 'idle' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startNumberLine}
                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700"
              >
                🚗 Arabayı başlat!
              </motion.button>
            )}

            {/* Answer options */}
            {animPhase === 'done' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                <p className="text-lg font-bold text-gray-700">Araba hangi sayıda durdu?</p>
                <div className="flex gap-2">
                  {current.options.map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRepAnswer(num)}
                      disabled={!!feedback}
                      className={`w-14 h-14 rounded-xl text-xl font-bold border-2 ${
                        feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' :
                        'bg-white border-violet-300 text-gray-800 hover:border-violet-500'
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

        {/* ─── ABSTRACT PHASE ─── */}
        {phase === 'abstract' && (
          <div className="flex flex-col items-center gap-5">
            <p className="text-lg font-bold text-gray-600 text-center">Şimdi doğrudan çöz!</p>

            <div className="bg-white rounded-2xl px-10 py-6 shadow-lg border-2 border-violet-200">
              <p className="text-5xl font-bold text-center" style={{ fontFamily: 'monospace' }}>
                {current.a} + {current.b} = <span className="text-violet-400">?</span>
              </p>
            </div>

            {/* Number pad */}
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
                    ${!feedback ? 'bg-white border-violet-300 text-gray-800 hover:border-violet-500 cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
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
                ? `🎉 Mükemmel! ${current.a} + ${current.b} = ${current.answer}`
                : '✅ Doğru! Sonraki aşamaya geçiyoruz!'
              : '🤔 Tekrar deneyelim! Birlikte sayalım.'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
