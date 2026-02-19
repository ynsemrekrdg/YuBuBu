import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface ExpandTask {
  base: string;
  question: string; // 5W1H
  options: string[];
  correctIdx: number;
  expanded: string;
}

const TASKS: ExpandTask[] = [
  {
    base: 'Çocuk koştu.',
    question: 'Nerede?',
    options: ['parkta', 'güzelce', 'üç'],
    correctIdx: 0,
    expanded: 'Çocuk parkta koştu.',
  },
  {
    base: 'Kedi uyudu.',
    question: 'Nasıl?',
    options: ['hızlıca', 'mışıl mışıl', 'evde'],
    correctIdx: 1,
    expanded: 'Kedi mışıl mışıl uyudu.',
  },
  {
    base: 'Ayşe resim yaptı.',
    question: 'Ne zaman?',
    options: ['güzel', 'dün', 'okula'],
    correctIdx: 1,
    expanded: 'Ayşe dün resim yaptı.',
  },
  {
    base: 'Kuş öttü.',
    question: 'Nasıl?',
    options: ['neşeyle', 'ağaçta', 'beş'],
    correctIdx: 0,
    expanded: 'Kuş neşeyle öttü.',
  },
  {
    base: 'Anne yemek pişirdi.',
    question: 'Nerede?',
    options: ['mutfakta', 'hızla', 'güzel'],
    correctIdx: 0,
    expanded: 'Anne mutfakta yemek pişirdi.',
  },
  {
    base: 'Ali top oynadı.',
    question: 'Kiminle?',
    options: ['arkadaşıyla', 'hızlı', 'evde'],
    correctIdx: 0,
    expanded: 'Ali arkadaşıyla top oynadı.',
  },
  {
    base: 'Öğretmen ders anlattı.',
    question: 'Ne zaman?',
    options: ['bugün', 'okulda', 'iki'],
    correctIdx: 0,
    expanded: 'Öğretmen bugün ders anlattı.',
  },
  {
    base: 'Balık yüzdü.',
    question: 'Nerede?',
    options: ['hızla', 'gölde', 'büyük'],
    correctIdx: 1,
    expanded: 'Balık gölde yüzdü.',
  },
];

export default function ExpandedSentencesGame({ onComplete }: GameProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const task = TASKS[idx];
  const isCorrect = selected === task.correctIdx;

  const handleSelect = useCallback((i: number) => {
    if (submitted) return;
    setSelected(i);
  }, [submitted]);

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
          <Plus className="inline w-5 h-5 mr-1" /> Cümleyi Genişlet
        </h3>
        <p className="text-sm text-amber-600 text-center mb-4">5N1K sorusuna uygun kelimeyi seç</p>

        {/* Base sentence */}
        <div className="bg-amber-50 rounded-xl p-4 text-center mb-4">
          <p className="text-xl font-bold text-amber-900">{task.base}</p>
        </div>

        {/* Question */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-blue-50 rounded-xl p-3 text-center mb-4 border border-blue-200"
        >
          <span className="text-blue-700 font-bold text-lg">{task.question}</span>
        </motion.div>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {task.options.map((opt, i) => {
            let bg = 'bg-white border-2 border-gray-200 hover:border-amber-400';
            if (selected === i && !submitted) bg = 'bg-amber-100 border-2 border-amber-500';
            if (submitted && i === task.correctIdx) bg = 'bg-green-100 border-2 border-green-500';
            if (submitted && selected === i && !isCorrect) bg = 'bg-red-100 border-2 border-red-400';

            return (
              <motion.button key={i} whileTap={!submitted ? { scale: 0.97 } : {}} onClick={() => handleSelect(i)}
                className={`w-full p-3 rounded-xl font-bold text-lg text-center ${bg} transition-colors`}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Expanded sentence preview */}
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-xl p-4 text-center mb-4 border border-green-200"
          >
            <Sparkles className="w-5 h-5 text-green-500 inline mr-1" />
            <span className="text-green-800 font-bold">{task.expanded}</span>
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
