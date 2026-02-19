import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Link } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface CompoundTask {
  sentence1: string;
  sentence2: string;
  connectors: string[];
  correctIdx: number;
  result: string;
}

const TASKS: CompoundTask[] = [
  {
    sentence1: 'Hava güzeldi.',
    sentence2: 'Parka gittik.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 0,
    result: 'Hava güzeldi ve parka gittik.',
  },
  {
    sentence1: 'Çok çalıştı.',
    sentence2: 'Sınavı geçemedi.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 1,
    result: 'Çok çalıştı ama sınavı geçemedi.',
  },
  {
    sentence1: 'Eve geldim.',
    sentence2: 'Çok yorulmuştum.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 2,
    result: 'Eve geldim çünkü çok yorulmuştum.',
  },
  {
    sentence1: 'Yemek yedi.',
    sentence2: 'Su içti.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 0,
    result: 'Yemek yedi ve su içti.',
  },
  {
    sentence1: 'Dışarı çıkmak istedi.',
    sentence2: 'Yağmur yağıyordu.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 1,
    result: 'Dışarı çıkmak istedi ama yağmur yağıyordu.',
  },
  {
    sentence1: 'Ağladı.',
    sentence2: 'Oyuncağı kırıldı.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 2,
    result: 'Ağladı çünkü oyuncağı kırıldı.',
  },
  {
    sentence1: 'Kitabını aldı.',
    sentence2: 'Okumaya başladı.',
    connectors: ['ve', 'ama', 'sonra'],
    correctIdx: 2,
    result: 'Kitabını aldı sonra okumaya başladı.',
  },
  {
    sentence1: 'Erken kalktı.',
    sentence2: 'Okula geç kaldı.',
    connectors: ['ve', 'ama', 'çünkü'],
    correctIdx: 1,
    result: 'Erken kalktı ama okula geç kaldı.',
  },
];

const CONNECTOR_COLORS: Record<string, string> = {
  've': 'bg-blue-100 text-blue-700 border-blue-300',
  'ama': 'bg-orange-100 text-orange-700 border-orange-300',
  'çünkü': 'bg-purple-100 text-purple-700 border-purple-300',
  'sonra': 'bg-green-100 text-green-700 border-green-300',
};

export default function CompoundSentencesGame({ onComplete }: GameProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const task = TASKS[idx];
  const isCorrect = selected === task.correctIdx;

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    setSubmitted(true);
    if (isCorrect) {
      playSound('correct');
      setScore(prev => prev + Math.round(100 / TASKS.length));
    } else {
      playSound('wrong');
    }
  }, [selected, isCorrect]);

  const handleNext = useCallback(() => {
    if (idx < TASKS.length - 1) {
      setIdx(prev => prev + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      onComplete(Math.min(100, score));
    }
  }, [idx, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{idx + 1} / {TASKS.length}</span>
        <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-5">
        <h3 className="text-lg font-bold text-amber-800 text-center mb-1">
          <Link className="inline w-5 h-5 mr-1" /> Bileşik Cümle Kur
        </h3>
        <p className="text-sm text-amber-600 text-center mb-5">İki cümleyi doğru bağlaçla birleştir</p>

        {/* Two sentences */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="font-bold text-amber-900">{task.sentence1}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
            {selected !== null ? task.connectors[selected] : '?'}
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="font-bold text-amber-900">{task.sentence2}</p>
          </div>
        </div>

        {/* Connector choices */}
        <div className="flex justify-center gap-3 mb-5">
          {task.connectors.map((c, i) => {
            let cls = `px-5 py-2 rounded-xl border-2 font-bold text-lg cursor-pointer transition-all ${CONNECTOR_COLORS[c] || 'bg-gray-100 text-gray-600 border-gray-300'}`;
            if (selected === i && !submitted) cls += ' ring-2 ring-amber-500 scale-105';
            if (submitted && i === task.correctIdx) cls += ' ring-2 ring-green-500';
            if (submitted && selected === i && !isCorrect) cls += ' ring-2 ring-red-500 line-through';

            return (
              <motion.button key={i} whileTap={!submitted ? { scale: 0.9 } : {}}
                onClick={() => !submitted && setSelected(i)} className={cls}
              >
                {c}
              </motion.button>
            );
          })}
        </div>

        {/* Result */}
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 text-center mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
          >
            {isCorrect ? (
              <p className="text-green-800 font-bold">✨ {task.result}</p>
            ) : (
              <>
                <p className="text-red-600 text-sm mb-1">Doğru bağlaç: <strong>{task.connectors[task.correctIdx]}</strong></p>
                <p className="text-green-700 font-bold">{task.result}</p>
              </>
            )}
          </motion.div>
        )}

        {!submitted ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={selected === null}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Kontrol Et
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleNext}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" /> {idx < TASKS.length - 1 ? 'Sonraki' : 'Bitir'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
