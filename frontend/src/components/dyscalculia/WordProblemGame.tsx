import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface WordProblem {
  story: string;
  emoji: string;
  firstInfo: number;
  changeInfo: number;
  operation: '+' | '-';
  answer: number;
  keyword: string;
  keywordMeaning: string;
  options: number[];
}

const PROBLEMS: WordProblem[] = [
  {
    story: 'Ali\'nin 3 elması var. Annesi ona 4 elma daha verdi.',
    emoji: '🍎',
    firstInfo: 3,
    changeInfo: 4,
    operation: '+',
    answer: 7,
    keyword: 'daha verdi',
    keywordMeaning: 'ekleme/toplama',
    options: [6, 7, 8, 5],
  },
  {
    story: 'Bahçede 8 kuş vardı. 3 tanesi uçtu.',
    emoji: '🐦',
    firstInfo: 8,
    changeInfo: 3,
    operation: '-',
    answer: 5,
    keyword: 'uçtu',
    keywordMeaning: 'çıkarma/azalma',
    options: [4, 5, 6, 3],
  },
  {
    story: 'Elif 5 çiçek topladı. Sonra 2 çiçek daha buldu.',
    emoji: '🌸',
    firstInfo: 5,
    changeInfo: 2,
    operation: '+',
    answer: 7,
    keyword: 'daha buldu',
    keywordMeaning: 'ekleme/toplama',
    options: [6, 7, 8, 3],
  },
  {
    story: 'Kutuda 6 kurabiye vardı. Cem 2 tane yedi.',
    emoji: '🍪',
    firstInfo: 6,
    changeInfo: 2,
    operation: '-',
    answer: 4,
    keyword: 'yedi',
    keywordMeaning: 'çıkarma/azalma',
    options: [3, 4, 5, 2],
  },
  {
    story: 'Sınıfta 4 erkek ve 5 kız öğrenci var.',
    emoji: '👧',
    firstInfo: 4,
    changeInfo: 5,
    operation: '+',
    answer: 9,
    keyword: 've',
    keywordMeaning: 'birleştirme/toplama',
    options: [8, 9, 10, 7],
  },
];

type Step = 'read' | 'find_first' | 'find_change' | 'select_op' | 'calculate' | 'verify';
const STEPS: Step[] = ['read', 'find_first', 'find_change', 'select_op', 'calculate', 'verify'];
const STEP_LABELS: Record<Step, string> = {
  read: '📖 Oku',
  find_first: '🔍 İlk Bilgi',
  find_change: '🔄 Değişen',
  select_op: '➕➖ İşlem Seç',
  calculate: '🧮 Hesapla',
  verify: '✅ Doğrula',
};

export default function WordProblemGame({ onComplete }: GameProps) {
  const [problemIdx, setProblemIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [step, setStep] = useState<Step>('read');
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [selectedOp, setSelectedOp] = useState<'+' | '-' | null>(null);

  const current = PROBLEMS[problemIdx];
  const stepIdx = STEPS.indexOf(step);

  const resetRound = useCallback(() => {
    setStep('read');
    setFeedback(null);
    setSelectedOp(null);
  }, []);

  const nextStep = () => {
    const next = STEPS[stepIdx + 1];
    if (next) setStep(next);
  };

  const handleOpSelect = (op: '+' | '-') => {
    if (feedback) return;
    setSelectedOp(op);
    if (op === current.operation) {
      setFeedback('correct');
      playSound('success');
      setTimeout(() => {
        setFeedback(null);
        nextStep();
      }, 1000);
    } else {
      setFeedback('retry');
      playSound('click');
      setTimeout(() => {
        setFeedback(null);
        setSelectedOp(null);
      }, 1000);
    }
  };

  const handleCalculate = (num: number) => {
    if (feedback) return;
    if (num === current.answer) {
      setFeedback('correct');
      playSound('success');
      setTimeout(() => {
        setFeedback(null);
        nextStep();
      }, 1200);
    } else {
      setFeedback('retry');
      playSound('click');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleVerify = () => {
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
  };

  if (gameOver) return null;

  return (
    <div className="dyscalculia-module p-5 rounded-2xl min-h-[480px] flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          Soru {problemIdx + 1} / {PROBLEMS.length}
        </span>
        <span className="bg-teal-100 px-3 py-1.5 rounded-lg text-sm font-bold text-teal-700">
          {STEP_LABELS[step]}
        </span>
        <span className="bg-white/80 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700 shadow-sm">
          ⭐ {score}
        </span>
      </div>

      {/* Step progress */}
      <div className="flex gap-1.5 w-full max-w-lg">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-all ${
              i < stepIdx ? 'bg-green-400' :
              i === stepIdx ? 'bg-teal-500' :
              'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <motion.div
        key={`${problemIdx}-${step}`}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Story card - always visible */}
        <div className="bg-white rounded-2xl p-5 border-2 border-teal-200 shadow-sm mb-4">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{current.emoji}</span>
            <p className="text-lg font-medium text-gray-800 leading-relaxed flex-1">
              {current.story}
            </p>
          </div>

          {/* Highlighted keyword */}
          {stepIdx >= 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Anahtar kelime:</span> "{current.keyword}" → {current.keywordMeaning}
              </p>
            </motion.div>
          )}
        </div>

        {/* ─── STEP: READ ─── */}
        {step === 'read' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-base text-gray-600 text-center">
              Problemi dikkatlice oku ve anladığında devam et.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold text-base hover:bg-teal-700"
            >
              Okudum, devam edelim! →
            </motion.button>
          </div>
        )}

        {/* ─── STEP: FIND_FIRST ─── */}
        {step === 'find_first' && (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200 w-full">
              <p className="text-sm font-bold text-blue-600 mb-2">İLK BİLGİ (başlangıç sayısı)</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-bold text-blue-700" style={{ fontFamily: 'monospace' }}>
                  {current.firstInfo}
                </span>
                <span className="text-3xl">{current.emoji}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold text-base hover:bg-teal-700"
            >
              Buldum! Sonraki adım →
            </motion.button>
          </div>
        )}

        {/* ─── STEP: FIND_CHANGE ─── */}
        {step === 'find_change' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3 w-full">
              <div className="flex-1 bg-blue-50 rounded-xl p-3 border border-blue-200 text-center">
                <p className="text-xs font-bold text-blue-500">İLK BİLGİ</p>
                <p className="text-2xl font-bold text-blue-700">{current.firstInfo}</p>
              </div>
              <div className="flex-1 bg-purple-50 rounded-xl p-3 border border-purple-200 text-center">
                <p className="text-xs font-bold text-purple-500">DEĞİŞEN</p>
                <p className="text-2xl font-bold text-purple-700">{current.changeInfo}</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold text-base hover:bg-teal-700"
            >
              Anladım! İşlemi seçelim →
            </motion.button>
          </div>
        )}

        {/* ─── STEP: SELECT_OP ─── */}
        {step === 'select_op' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-base font-bold text-gray-700 text-center">
              Hangi işlemi kullanmalıyız?
            </p>
            <div className="flex gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleOpSelect('+')}
                disabled={!!feedback}
                className={`w-24 h-24 rounded-2xl text-4xl font-bold border-3 transition-all ${
                  selectedOp === '+' && feedback === 'correct' ? 'bg-green-100 border-green-500 text-green-700' :
                  selectedOp === '+' && feedback === 'retry' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                  'bg-white border-blue-300 text-blue-600 hover:border-blue-500 cursor-pointer'
                }`}
              >
                ➕
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handleOpSelect('-')}
                disabled={!!feedback}
                className={`w-24 h-24 rounded-2xl text-4xl font-bold border-3 transition-all ${
                  selectedOp === '-' && feedback === 'correct' ? 'bg-green-100 border-green-500 text-green-700' :
                  selectedOp === '-' && feedback === 'retry' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
                  'bg-white border-red-300 text-red-600 hover:border-red-500 cursor-pointer'
                }`}
              >
                ➖
              </motion.button>
            </div>
          </div>
        )}

        {/* ─── STEP: CALCULATE ─── */}
        {step === 'calculate' && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white rounded-2xl px-8 py-5 shadow-lg border-2 border-teal-200">
              <p className="text-4xl font-bold text-center" style={{ fontFamily: 'monospace' }}>
                {current.firstInfo} {current.operation} {current.changeInfo} = <span className="text-teal-400">?</span>
              </p>
            </div>
            <div className="flex gap-2">
              {current.options.map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCalculate(num)}
                  disabled={!!feedback}
                  className={`w-16 h-16 rounded-2xl text-2xl font-bold border-2 shadow-sm transition-all
                    ${feedback === 'correct' && num === current.answer ? 'bg-green-100 border-green-500 text-green-700' : ''}
                    ${!feedback ? 'bg-white border-teal-300 text-gray-800 hover:border-teal-500 cursor-pointer' : 'bg-white border-gray-200 text-gray-400'}
                  `}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP: VERIFY ─── */}
        {step === 'verify' && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-green-50 rounded-2xl p-5 border-2 border-green-200 w-full text-center">
              <p className="text-sm font-bold text-green-600 mb-2">SONUÇ KONTROLÜ</p>
              <p className="text-3xl font-bold text-green-700" style={{ fontFamily: 'monospace' }}>
                {current.firstInfo} {current.operation} {current.changeInfo} = {current.answer}
              </p>
              <p className="text-base text-green-600 mt-3">
                "{current.story.slice(0, 40)}..." → Cevap: <strong>{current.answer}</strong> {current.emoji}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleVerify}
              disabled={!!feedback}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700"
            >
              ✅ Doğru! Devam et!
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && step !== 'verify' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold px-6 py-3 rounded-2xl ${
              feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {feedback === 'correct'
              ? '✅ Doğru!'
              : '🤔 Tekrar düşünelim!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
