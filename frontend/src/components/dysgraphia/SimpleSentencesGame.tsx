import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Check, RefreshCw, ArrowRight } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface SentenceData {
  words: string[];
  correct: string;
  hint?: string;
}

const SENTENCES: SentenceData[] = [
  { words: ['gitti', 'okula', 'Ali'], correct: 'Ali okula gitti', hint: 'Kim nereye ne yaptı?' },
  { words: ['yedi', 'elmayı', 'Ayşe'], correct: 'Ayşe elmayı yedi', hint: 'Kim neyi ne yaptı?' },
  { words: ['koştu', 'parkta', 'Köpek'], correct: 'Köpek parkta koştu', hint: 'Kim nerede ne yaptı?' },
  { words: ['okuyor', 'kitap', 'Öğretmen'], correct: 'Öğretmen kitap okuyor', hint: 'Kim ne yapıyor?' },
  { words: ['içti', 'sütü', 'Bebek'], correct: 'Bebek sütü içti', hint: 'Kim neyi ne yaptı?' },
  { words: ['yağıyor', 'dışarıda', 'Yağmur'], correct: 'Yağmur dışarıda yağıyor', hint: 'Ne nerede ne yapıyor?' },
  { words: ['pişirdi', 'yemek', 'Annem'], correct: 'Annem yemek pişirdi', hint: 'Kim ne ne yaptı?' },
  { words: ['uçuyor', 'gökyüzünde', 'Kuş'], correct: 'Kuş gökyüzünde uçuyor', hint: 'Kim nerede ne yapıyor?' },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SimpleSentencesGame({ onComplete }: GameProps) {
  const [idx, setIdx] = useState(0);
  const [order, setOrder] = useState<string[]>(() => shuffle(SENTENCES[0].words));
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const sentence = SENTENCES[idx];

  const handleSubmit = useCallback(() => {
    const result = order.join(' ');
    const correct = result === sentence.correct;
    setIsCorrect(correct);
    setSubmitted(true);
    if (correct) {
      playSound('correct');
      setScore(prev => prev + Math.round(100 / SENTENCES.length));
    } else {
      playSound('wrong');
    }
  }, [order, sentence.correct]);

  const handleNext = useCallback(() => {
    if (idx < SENTENCES.length - 1) {
      const next = idx + 1;
      setIdx(next);
      setOrder(shuffle(SENTENCES[next].words));
      setSubmitted(false);
      setIsCorrect(false);
      setShowHint(false);
    } else {
      onComplete(Math.min(100, score));
    }
  }, [idx, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Cümle {idx + 1} / {SENTENCES.length}</span>
        <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-5">
        <h3 className="text-lg font-bold text-amber-800 text-center mb-2">Kelimeleri Sırala 🧩</h3>
        <p className="text-sm text-amber-600 text-center mb-4">
          Türkçe cümle sırası: <strong>Özne → Tümleç → Yüklem</strong>
        </p>

        {/* Hint */}
        {sentence.hint && (
          <button onClick={() => setShowHint(!showHint)} className="text-xs text-amber-500 underline mb-3 block mx-auto">
            {showHint ? 'İpucunu Gizle' : 'İpucu Göster'}
          </button>
        )}
        <AnimatePresence>
          {showHint && (
            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="text-center text-sm bg-amber-50 text-amber-700 p-2 rounded-lg mb-3"
            >
              💡 {sentence.hint}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Reorderable words */}
        <Reorder.Group axis="x" values={order} onReorder={submitted ? () => {} : setOrder}
          className="flex flex-wrap gap-2 justify-center min-h-[56px] bg-amber-50 p-4 rounded-xl mb-4"
        >
          {order.map((word) => (
            <Reorder.Item key={word} value={word}
              className={`px-4 py-2 rounded-xl font-bold text-lg cursor-grab active:cursor-grabbing select-none ${
                submitted
                  ? isCorrect
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                  : 'bg-white border-2 border-amber-300 text-amber-800 shadow-sm'
              }`}
              whileHover={!submitted ? { scale: 1.05 } : {}}
              whileDrag={{ scale: 1.1, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
            >
              {word}
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Formed sentence preview */}
        <div className="text-center text-lg text-gray-700 mb-4">
          "{order.join(' ')}"
        </div>

        {submitted && !isCorrect && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-green-700 font-bold mb-3">
            Doğru sıra: {sentence.correct}
          </motion.p>
        )}

        {!submitted ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Kontrol Et
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleNext}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" /> {idx < SENTENCES.length - 1 ? 'Sonraki' : 'Bitir'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
