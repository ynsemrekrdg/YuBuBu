import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * RhymeMatchGame – Kafiye Eşleştirme Oyunu
 * Orton-Gillingham Aşama 1: Fonolojik Farkındalık
 * 
 * Çocuk, verilen kelimeye kafiye olan kelimeyi seçer.
 * Çok duyulu: ses + görsel renk + animasyon
 * Pozitif geri bildirim, kırmızı X yok.
 */

interface RhymeSet {
  target: string;
  emoji: string;
  rhyme: string;
  rhymeEmoji: string;
  distractors: { word: string; emoji: string }[];
}

const RHYME_SETS: RhymeSet[] = [
  {
    target: 'KEDİ',
    emoji: '🐱',
    rhyme: 'YEDİ',
    rhymeEmoji: '7️⃣',
    distractors: [
      { word: 'ARABA', emoji: '🚗' },
      { word: 'TOP', emoji: '⚽' },
    ],
  },
  {
    target: 'BAL',
    emoji: '🍯',
    rhyme: 'DAL',
    rhymeEmoji: '🌿',
    distractors: [
      { word: 'KUŞ', emoji: '🐦' },
      { word: 'EV', emoji: '🏠' },
    ],
  },
  {
    target: 'AY',
    emoji: '🌙',
    rhyme: 'TAY',
    rhymeEmoji: '🐴',
    distractors: [
      { word: 'MASA', emoji: '🪑' },
      { word: 'KALEM', emoji: '✏️' },
    ],
  },
  {
    target: 'GÖZ',
    emoji: '👁️',
    rhyme: 'SÖZ',
    rhymeEmoji: '💬',
    distractors: [
      { word: 'ÇİÇEK', emoji: '🌸' },
      { word: 'BALIK', emoji: '🐟' },
    ],
  },
  {
    target: 'EL',
    emoji: '✋',
    rhyme: 'SEL',
    rhymeEmoji: '🌊',
    distractors: [
      { word: 'GÜNEŞ', emoji: '☀️' },
      { word: 'YILDIZ', emoji: '⭐' },
    ],
  },
  {
    target: 'KAR',
    emoji: '❄️',
    rhyme: 'VAR',
    rhymeEmoji: '✅',
    distractors: [
      { word: 'KÖPEK', emoji: '🐶' },
      { word: 'AĞAÇ', emoji: '🌳' },
    ],
  },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function RhymeMatchGame({ onComplete }: GameProps) {
  const totalRounds = 5;
  const [rounds] = useState(() => shuffle(RHYME_SETS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'retry' | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  const currentSet = rounds[round];
  const options = useState(() =>
    rounds.map((r) =>
      shuffle([
        { word: r.rhyme, emoji: r.rhymeEmoji },
        ...r.distractors,
      ])
    )
  )[0];

  const handleSelect = useCallback(
    (word: string) => {
      if (feedback) return;
      setSelectedWord(word);
      const isCorrect = word === currentSet.rhyme;

      if (isCorrect) {
        setScore((s) => s + 20);
        setFeedback('correct');
        playSound('success');
        speak('Harika! Kafiye buldun!', 1.0);

        setTimeout(() => {
          setFeedback(null);
          setSelectedWord(null);
          if (round + 1 >= totalRounds) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            onComplete(score + 20, timeSpent);
          } else {
            setRound((r) => r + 1);
          }
        }, 1200);
      } else {
        setFeedback('retry');
        playSound('click');
        speak('Tekrar dene, kafiyeyi bul!', 0.9);

        setTimeout(() => {
          setFeedback(null);
          setSelectedWord(null);
        }, 1000);
      }
    },
    [feedback, currentSet, round, totalRounds, score, startTime, onComplete]
  );

  return (
    <div className="dyslexia-module p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          Soru {round + 1} / {totalRounds}
        </span>
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="flex items-center gap-3">
        <p className="text-xl font-bold text-center">
          Hangi kelime kafiyeli?
        </p>
        <button
          onClick={() => speak('Hangi kelime kafiyeli? Aynı sesle biten kelimeyi bul!', 0.85)}
          className="p-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
          aria-label="Talimatı sesli oku"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Target Word */}
      <motion.div
        key={currentSet.target}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="bg-white rounded-2xl shadow-xl px-10 py-6 border-4 border-orange-300"
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">{currentSet.emoji}</span>
          <span className="text-3xl font-bold tracking-wider">{currentSet.target}</span>
          <button
            onClick={() => speak(currentSet.target, 0.75)}
            className="p-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
            aria-label={`${currentSet.target} kelimesini sesli oku`}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      <p className="text-lg font-semibold">
        Bu kelimeyle kafiyeli olanı seç! 🎵
      </p>

      {/* Options */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        {options[round].map((opt, i) => {
          const isSelected = selectedWord === opt.word;
          const isCorrectAnswer = feedback === 'correct' && opt.word === currentSet.rhyme;
          const isRetry = feedback === 'retry' && isSelected;

          return (
            <motion.button
              key={`${round}-${opt.word}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(opt.word)}
              disabled={!!feedback}
              className={`
                flex flex-col items-center gap-2 p-5 rounded-2xl border-3
                cursor-pointer transition-all duration-200
                min-h-[80px] text-center
                hover:shadow-lg hover:scale-105
                focus-visible:outline-4 focus-visible:outline-yellow-400
                ${isCorrectAnswer ? 'bg-green-100 border-green-400 scale-110' : ''}
                ${isRetry ? 'bg-yellow-100 border-yellow-400' : ''}
                ${!feedback ? 'bg-white border-gray-200 hover:border-orange-300' : ''}
                ${!isCorrectAnswer && !isRetry && feedback ? 'bg-white border-gray-200' : ''}
              `}
              aria-label={`${opt.word} seçeneği`}
            >
              <span className="text-4xl">{opt.emoji}</span>
              <span className="text-lg font-bold tracking-wide">{opt.word}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.1 }}
            exit={{ scale: 0 }}
            className="text-2xl font-bold text-green-600"
          >
            ✅ {currentSet.target} - {currentSet.rhyme} kafiyeli!
          </motion.div>
        )}
        {feedback === 'retry' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-lg font-bold text-yellow-600"
          >
            🔄 Tekrar dene! Aynı sesle biten kelimeyi bul.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
