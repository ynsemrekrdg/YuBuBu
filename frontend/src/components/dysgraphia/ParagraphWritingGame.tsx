import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Layers, ArrowDown } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * Chapter 18 – Hamburger Model Paragraph Writing
 * Top bun = main idea, fillings = details, bottom bun = conclusion
 */

interface ParagraphTask {
  topic: string;
  parts: { label: string; hint: string; layer: 'top' | 'filling' | 'bottom' }[];
}

const TASKS: ParagraphTask[] = [
  {
    topic: 'En Sevdiğim Mevsim',
    parts: [
      { label: 'Ana Fikir (Üst Ekmek)', hint: 'Hangi mevsimi sevdiğini yaz', layer: 'top' },
      { label: 'Detay 1 (Malzeme)', hint: 'Neden sevdiğini anlat', layer: 'filling' },
      { label: 'Detay 2 (Malzeme)', hint: 'Ne yaparsın o mevsimde?', layer: 'filling' },
      { label: 'Detay 3 (Malzeme)', hint: 'Nasıl hissettiriyor?', layer: 'filling' },
      { label: 'Sonuç (Alt Ekmek)', hint: 'Özet cümle yaz', layer: 'bottom' },
    ],
  },
  {
    topic: 'Okulumuz',
    parts: [
      { label: 'Ana Fikir (Üst Ekmek)', hint: 'Okulun hakkında ana cümle', layer: 'top' },
      { label: 'Detay 1 (Malzeme)', hint: 'Okulun nasıl bir yer?', layer: 'filling' },
      { label: 'Detay 2 (Malzeme)', hint: 'En sevdiğin yer neresi?', layer: 'filling' },
      { label: 'Sonuç (Alt Ekmek)', hint: 'Özetleyici cümle', layer: 'bottom' },
    ],
  },
];

const LAYER_STYLES = {
  top: { bg: 'bg-amber-200 border-amber-400', text: 'text-amber-900', emoji: '🍔' },
  filling: { bg: 'bg-green-200 border-green-400', text: 'text-green-900', emoji: '🥬' },
  bottom: { bg: 'bg-amber-200 border-amber-400', text: 'text-amber-900', emoji: '🍔' },
};

export default function ParagraphWritingGame({ onComplete }: GameProps) {
  const [taskIdx, setTaskIdx] = useState(0);
  const [inputs, setInputs] = useState<string[]>(() => TASKS[0].parts.map(() => ''));
  const [showPreview, setShowPreview] = useState(false);
  const [score, setScore] = useState(0);

  const task = TASKS[taskIdx];

  const handleInput = (i: number, value: string) => {
    const copy = [...inputs];
    copy[i] = value;
    setInputs(copy);
  };

  const handleSubmit = useCallback(() => {
    const filledCount = inputs.filter(v => v.trim().length > 3).length;
    const ratio = filledCount / task.parts.length;
    const pts = Math.round(ratio * (100 / TASKS.length));
    setScore(prev => prev + pts);

    if (ratio >= 0.6) {
      playSound('correct');
    }

    setShowPreview(true);
  }, [inputs, task.parts.length]);

  const handleNext = useCallback(() => {
    if (taskIdx < TASKS.length - 1) {
      const next = taskIdx + 1;
      setTaskIdx(next);
      setInputs(TASKS[next].parts.map(() => ''));
      setShowPreview(false);
    } else {
      onComplete(Math.min(100, score));
    }
  }, [taskIdx, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Paragraf {taskIdx + 1} / {TASKS.length}</span>
        <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-5">
        <h3 className="text-lg font-bold text-red-800 text-center mb-1">
          <Layers className="inline w-5 h-5 mr-1" /> Hamburger Paragraf 🍔
        </h3>
        <p className="text-sm text-red-600 text-center mb-2">Her katmanı doldur!</p>

        <div className="bg-red-50 rounded-xl p-2 text-center mb-4">
          <p className="text-red-800 font-bold">Konu: {task.topic}</p>
        </div>

        {!showPreview ? (
          <div className="space-y-2">
            {task.parts.map((part, i) => {
              const style = LAYER_STYLES[part.layer];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-xl border-2 p-3 ${style.bg}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span>{style.emoji}</span>
                    <span className={`text-sm font-bold ${style.text}`}>{part.label}</span>
                  </div>
                  <textarea
                    value={inputs[i]}
                    onChange={(e) => handleInput(i, e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-300"
                    rows={2}
                    placeholder={part.hint}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
            <p className="text-sm text-gray-500 text-center mb-2">Paragrafın:</p>
            <div className="bg-gray-50 rounded-xl p-4 border">
              {inputs.map((text, i) => (
                <span key={i} className={`${text.trim() ? '' : 'text-gray-300'}`}>
                  {text.trim() || '...'}{' '}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {!showPreview ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
            disabled={inputs.filter(v => v.trim().length > 0).length < 2}
            className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Paragrafımı Gör
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleNext}
            className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" /> {taskIdx < TASKS.length - 1 ? 'Sonraki Konu' : 'Bitir'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
