import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface PunctuationTask {
  text: string;
  slots: { position: number; correct: string }[];
  display: string[]; // pre-split with blanks
}

// Tasks where user selects correct punctuation for marked positions
interface QuizTask {
  sentence: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const CUPS_INFO = [
  { letter: 'C', label: 'Büyük Harf', desc: 'Cümle başı ve özel isimler büyük harfle başlar', color: 'bg-blue-100 text-blue-700' },
  { letter: 'U', label: 'Anlam', desc: 'Cümle anlamlı mı? (Understanding)', color: 'bg-green-100 text-green-700' },
  { letter: 'P', label: 'Noktalama', desc: 'Doğru noktalama işaretleri kullanıldı mı?', color: 'bg-purple-100 text-purple-700' },
  { letter: 'S', label: 'Yazım', desc: 'Kelimeler doğru yazılmış mı? (Spelling)', color: 'bg-orange-100 text-orange-700' },
];

const QUIZ_TASKS: QuizTask[] = [
  {
    sentence: 'Bugün hava çok güzel___',
    question: 'Cümle sonuna hangi işaret gelir?',
    options: ['.', '?', '!', ','],
    correctIdx: 0,
    explanation: 'Düz cümlelerin sonuna nokta (.) konur.',
  },
  {
    sentence: 'Kaç yaşındasın___',
    question: 'Cümle sonuna hangi işaret gelir?',
    options: ['.', '?', '!', ','],
    correctIdx: 1,
    explanation: 'Soru cümlelerinin sonuna soru işareti (?) konur.',
  },
  {
    sentence: 'Ne güzel bir gün___',
    question: 'Cümle sonuna hangi işaret gelir?',
    options: ['.', '?', '!', ','],
    correctIdx: 2,
    explanation: 'Duygu ve heyecan bildiren cümlelere ünlem (!) konur.',
  },
  {
    sentence: 'Elma___ armut___ ve portakal aldık.',
    question: 'Virgüller nereye konulmalı?',
    options: ['Elma, armut, ve portakal', 'Elma, armut ve portakal', 'Elma armut, ve portakal,'],
    correctIdx: 1,
    explanation: '"ve" bağlacından önce virgül konmaz.',
  },
  {
    sentence: 'ali ankara\'ya gitti___',
    question: 'Bu cümlede kaç yazım hatası var?',
    options: ['1 hata', '2 hata', '3 hata'],
    correctIdx: 1,
    explanation: '"Ali" ve "Ankara" özel isimdir, büyük harfle başlar. Cümle sonuna nokta konur.',
  },
  {
    sentence: 'Dün akşam ne yedin___',
    question: 'Cümle sonuna hangi işaret gelir?',
    options: ['.', '?', '!'],
    correctIdx: 1,
    explanation: '"Ne yedin" bir soru cümlesidir, soru işareti (?) konur.',
  },
  {
    sentence: 'Aman___ Dikkat et___',
    question: 'İşaretler neler olmalı?',
    options: ['Aman! Dikkat et!', 'Aman. Dikkat et.', 'Aman, Dikkat et!'],
    correctIdx: 0,
    explanation: 'Uyarı ve heyecan bildiren cümlelerde ünlem (!) kullanılır.',
  },
  {
    sentence: 'Annesi___ "Gel buraya" dedi___',
    question: 'İşaretler neler olmalı?',
    options: ['Annesi, "Gel buraya" dedi.', 'Annesi: "Gel buraya" dedi.', 'Annesi "Gel buraya" dedi!'],
    correctIdx: 0,
    explanation: 'Konuşma cümlelerinde virgül kullanılır, cümle sonuna nokta konur.',
  },
];

export default function PunctuationPracticeGame({ onComplete }: GameProps) {
  const [showCUPS, setShowCUPS] = useState(true);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const task = QUIZ_TASKS[idx];
  const isCorrect = selected === task.correctIdx;

  const handleSubmit = useCallback(() => {
    if (selected === null) return;
    setSubmitted(true);
    if (isCorrect) {
      playSound('correct');
      setScore(prev => prev + Math.round(100 / QUIZ_TASKS.length));
    } else {
      playSound('wrong');
    }
  }, [selected, isCorrect]);

  const handleNext = useCallback(() => {
    if (idx < QUIZ_TASKS.length - 1) {
      setIdx(prev => prev + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      onComplete(Math.min(100, score));
    }
  }, [idx, score, onComplete]);

  // CUPS intro screen
  if (showCUPS) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-5">
          <h3 className="text-xl font-bold text-amber-800 text-center mb-4">CUPS Kontrol Listesi ✅</h3>
          <p className="text-sm text-amber-600 text-center mb-4">Yazarken bu kontrolleri hep yap!</p>

          <div className="space-y-3 mb-6">
            {CUPS_INFO.map((item) => (
              <motion.div key={item.letter} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className={`flex items-center gap-3 p-3 rounded-xl ${item.color}`}
              >
                <span className="text-3xl font-black">{item.letter}</span>
                <div>
                  <p className="font-bold">{item.label}</p>
                  <p className="text-sm opacity-80">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCUPS(false)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold"
          >
            Alıştırmaya Başla! 🎯
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{idx + 1} / {QUIZ_TASKS.length}</span>
        <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold">Puan: {score}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-5">
        <h3 className="text-lg font-bold text-amber-800 text-center mb-4">Noktalama İşaretleri ✏️</h3>

        {/* Sentence with blanks */}
        <div className="bg-amber-50 rounded-xl p-4 text-center mb-3">
          <p className="text-xl font-bold text-amber-900 leading-relaxed">
            {task.sentence.split('___').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="inline-block w-8 h-8 mx-1 border-b-2 border-dashed border-amber-500 align-bottom" />
                )}
              </span>
            ))}
          </p>
        </div>

        <p className="text-center text-amber-700 font-bold mb-4">{task.question}</p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {task.options.map((opt, i) => {
            let cls = 'p-3 rounded-xl border-2 font-bold text-lg text-center cursor-pointer transition-all ';
            if (selected === i && !submitted) cls += 'border-amber-500 bg-amber-100';
            else if (submitted && i === task.correctIdx) cls += 'border-green-500 bg-green-100';
            else if (submitted && selected === i && !isCorrect) cls += 'border-red-400 bg-red-100';
            else cls += 'border-gray-200 bg-white hover:border-amber-400';

            return (
              <motion.button key={i} whileTap={!submitted ? { scale: 0.95 } : {}}
                onClick={() => !submitted && setSelected(i)} className={cls}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}
          >
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${isCorrect ? 'text-green-500' : 'text-orange-500'}`} />
              <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>{task.explanation}</p>
            </div>
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
            <ArrowRight className="w-5 h-5" /> {idx < QUIZ_TASKS.length - 1 ? 'Sonraki' : 'Bitir'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
