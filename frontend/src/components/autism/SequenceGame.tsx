import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface SequenceStep {
  id: number;
  label: string;
  icon: string;
  order: number;
}

const SEQUENCES: SequenceStep[][] = [
  [
    { id: 1, label: 'Uyan', icon: '🛏️', order: 1 },
    { id: 2, label: 'Yüzünü yıka', icon: '🧼', order: 2 },
    { id: 3, label: 'Kahvaltı yap', icon: '🥣', order: 3 },
    { id: 4, label: 'Dişlerini fırçala', icon: '🪥', order: 4 },
  ],
  [
    { id: 5, label: 'Ayakkabılarını giy', icon: '👟', order: 1 },
    { id: 6, label: 'Çantanı al', icon: '🎒', order: 2 },
    { id: 7, label: 'Kapıyı aç', icon: '🚪', order: 3 },
    { id: 8, label: 'Otobüse bin', icon: '🚌', order: 4 },
  ],
  [
    { id: 9, label: 'Malzemeleri hazırla', icon: '🥕', order: 1 },
    { id: 10, label: 'Malzemeleri kes', icon: '🔪', order: 2 },
    { id: 11, label: 'Pişir', icon: '🍳', order: 3 },
    { id: 12, label: 'Tabağa koy', icon: '🍽️', order: 4 },
  ],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SequenceGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [items, setItems] = useState<SequenceStep[]>(() => shuffle(SEQUENCES[0]));
  const [score, setScore] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const checkOrder = useCallback(() => {
    const correct = items.every((item, idx) => item.order === idx + 1);
    setChecked(true);
    setIsCorrect(correct);

    if (correct) {
      playSound('success');
      const newScore = score + Math.round(100 / SEQUENCES.length);
      setScore(newScore);

      setTimeout(() => {
        if (roundIdx + 1 >= SEQUENCES.length) {
          setGameOver(true);
          onComplete(newScore, Math.floor((Date.now() - startTime) / 1000));
        } else {
          setRoundIdx((r) => r + 1);
          setItems(shuffle(SEQUENCES[roundIdx + 1]));
          setChecked(false);
          setIsCorrect(false);
        }
      }, 1500);
    } else {
      playSound('error');
      setTimeout(() => setChecked(false), 1200);
    }
  }, [items, score, roundIdx, startTime, onComplete]);

  if (gameOver) return null;

  return (
    <div className="theme-autism p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-autism-card px-3 py-1 rounded-lg text-sm font-bold text-autism-text">
          Sıralama {roundIdx + 1} / {SEQUENCES.length}
        </span>
        <span className="bg-autism-card px-3 py-1 rounded-lg text-sm font-bold text-autism-text">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-autism-accent/30">
        <p className="font-calm text-lg font-bold text-autism-text text-center">
          📋 Kartları doğru sıraya koy
        </p>
      </div>

      {/* Sortable Cards */}
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="w-full max-w-md space-y-3"
      >
        {items.map((item, idx) => (
          <Reorder.Item
            key={item.id}
            value={item}
            className={`
              flex items-center gap-4 p-4 rounded-xl border-2 cursor-grab active:cursor-grabbing
              transition-colors duration-300
              ${checked && isCorrect ? 'bg-green-50 border-green-400' : ''}
              ${checked && !isCorrect && item.order !== idx + 1 ? 'bg-red-50 border-red-300' : ''}
              ${!checked ? 'bg-white border-autism-accent/30 hover:border-autism-primary' : ''}
            `}
            whileDrag={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="font-calm text-base font-semibold text-autism-text flex-1">
              {item.label}
            </span>
            <span className="w-8 h-8 bg-autism-card rounded-full flex items-center justify-center text-sm font-bold text-autism-primary">
              {idx + 1}
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setItems(shuffle(SEQUENCES[roundIdx])); setChecked(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200"
        >
          <RotateCcw className="w-4 h-4" /> Karıştır
        </button>
        <button
          onClick={checkOrder}
          disabled={checked && isCorrect}
          className="flex items-center gap-2 px-6 py-2 bg-autism-primary text-white rounded-xl text-sm font-bold hover:bg-teal-700 disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" /> Kontrol Et
        </button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {checked && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}
          >
            {isCorrect ? '✅ Doğru sıralama! Harika!' : '❌ Tekrar dene, sıralama yanlış.'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
