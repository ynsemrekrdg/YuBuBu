import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ThumbsUp, RotateCcw, ChevronRight } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface GripExercise {
  name: string;
  description: string;
  steps: string[];
  icon: string;
}

const EXERCISES: GripExercise[] = [
  {
    name: 'Üç Parmak Tutuşu',
    description: 'Doğru kalem tutuşunu öğren: baş parmak, işaret parmağı ve orta parmak.',
    steps: [
      'Kalemi işaret parmağının üstüne yerleştir',
      'Baş parmakla hafifçe kavra',
      'Orta parmakla alttan destekle',
      'Yüzük ve serçe parmaklar avuç içine kıvrılır',
    ],
    icon: '✍️',
  },
  {
    name: 'Sıkma-Bırakma',
    description: 'Parmak kaslarını güçlendir! Hayal et ki hamur sıkıyorsun.',
    steps: [
      'Parmaklarını sık (3 saniye tut)',
      'Yavaşça bırak',
      'Tekrar sık',
      'Beş kez tekrarla',
    ],
    icon: '💪',
  },
  {
    name: 'Parmak Ucu Dokunuşu',
    description: 'Her parmağını sırayla baş parmağa dokundur.',
    steps: [
      'İşaret parmağı → baş parmak',
      'Orta parmak → baş parmak',
      'Yüzük parmağı → baş parmak',
      'Serçe parmak → baş parmak',
    ],
    icon: '👆',
  },
  {
    name: 'Islak-Kuru-Dene',
    description: 'Wet-Dry-Try yöntemi: Islak parmakla iz, kuru parmakla iz, sonra yalnız dene.',
    steps: [
      '🌊 ISLAK: Parmağınla şekli ıslak olarak iz',
      '🏜️ KURU: Kuru parmakla aynı şekli iz',
      '✏️ DENE: Şimdi kendi başına yaz!',
    ],
    icon: '🌊',
  },
];

export default function GripTrainingGame({ onComplete }: GameProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const exercise = EXERCISES[currentIdx];
  const isLastStep = stepIdx >= exercise.steps.length - 1;
  const isLastExercise = currentIdx >= EXERCISES.length - 1;

  const handleStepComplete = useCallback(() => {
    playSound('click');
    if (isLastStep) {
      // Exercise complete
      const exerciseScore = 25; // Each exercise = 25 points
      setScore(prev => prev + exerciseScore);
      setCompletedExercises(prev => [...prev, currentIdx]);
      playSound('correct');

      if (isLastExercise) {
        // All exercises done
        setTimeout(() => onComplete(Math.min(100, score + exerciseScore)), 500);
      } else {
        setTimeout(() => {
          setCurrentIdx(prev => prev + 1);
          setStepIdx(0);
        }, 800);
      }
    } else {
      setStepIdx(prev => prev + 1);
    }
  }, [isLastStep, isLastExercise, currentIdx, score, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {EXERCISES.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              completedExercises.includes(i)
                ? 'bg-green-500'
                : i === currentIdx
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-6"
        >
          {/* Exercise header */}
          <div className="text-center mb-6">
            <span className="text-5xl mb-3 block">{exercise.icon}</span>
            <h3 className="text-xl font-bold text-emerald-800">{exercise.name}</h3>
            <p className="text-gray-600 mt-1 text-sm">{exercise.description}</p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {exercise.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  i < stepIdx
                    ? 'bg-green-50 border border-green-200'
                    : i === stepIdx
                    ? 'bg-emerald-50 border-2 border-emerald-400 shadow-md'
                    : 'bg-gray-50 border border-gray-100 opacity-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    i < stepIdx
                      ? 'bg-green-500 text-white'
                      : i === stepIdx
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i <= stepIdx ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Action button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleStepComplete}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isLastStep ? (
              isLastExercise ? (
                <><ThumbsUp className="w-5 h-5" /> Tamamla!</>
              ) : (
                <><ChevronRight className="w-5 h-5" /> Sonraki Egzersiz</>
              )
            ) : (
              <><Hand className="w-5 h-5" /> Yaptım! Sonraki Adım</>
            )}
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Score */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Puan: <span className="font-bold text-emerald-600">{score}</span> / 100
      </div>
    </div>
  );
}
