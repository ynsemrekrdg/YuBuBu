import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface WordPair {
  word: string;
  image: string;
  emoji: string;
}

const WORD_PAIRS: WordPair[] = [
  { word: 'ELMA', image: '🍎', emoji: '🍎' },
  { word: 'TOP', image: '⚽', emoji: '⚽' },
  { word: 'KEDİ', image: '🐱', emoji: '🐱' },
  { word: 'BALIK', image: '🐟', emoji: '🐟' },
  { word: 'ARABA', image: '🚗', emoji: '🚗' },
  { word: 'ÇİÇEK', image: '🌸', emoji: '🌸' },
  { word: 'GÜNEŞayfa', image: '☀️', emoji: '☀️' },
  { word: 'YILDIZ', image: '⭐', emoji: '⭐' },
  { word: 'EV', image: '🏠', emoji: '🏠' },
  { word: 'AĞAÇ', image: '🌳', emoji: '🌳' },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function WordMatchGame({ onComplete }: GameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(5);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());

  const rounds = useState(() => {
    const shuffled = shuffle(WORD_PAIRS);
    return shuffled.slice(0, totalRounds).map((correct) => {
      const others = shuffle(WORD_PAIRS.filter((p) => p.word !== correct.word)).slice(0, 3);
      return {
        word: correct,
        options: shuffle([correct, ...others]),
      };
    });
  })[0];

  const currentRound = rounds[round];

  const handleSelect = useCallback(
    (selected: WordPair) => {
      if (feedback) return;

      const isCorrect = selected.word === currentRound.word.word;

      if (isCorrect) {
        setScore((s) => s + 20);
        setFeedback('correct');
        playSound('success');
        speak('Harika! Doğru!', 1.0);
      } else {
        setFeedback('wrong');
        playSound('error');
        speak('Tekrar dene!', 0.9);
      }

      setTimeout(() => {
        setFeedback(null);
        if (isCorrect) {
          if (round + 1 >= totalRounds) {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const finalScore = score + 20;
            setGameOver(true);
            onComplete(finalScore, timeSpent);
          } else {
            setRound((r) => r + 1);
          }
        }
      }, isCorrect ? 1200 : 800);
    },
    [feedback, currentRound, round, totalRounds, score, startTime, onComplete],
  );

  if (gameOver) return null;

  return (
    <div className="theme-dyslexia p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-8">
      {/* Round Info */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/50 px-3 py-1 rounded-lg">
          Soru {round + 1} / {totalRounds}
        </span>
        <span className="text-sm font-bold bg-white/50 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      {/* Word to Match */}
      <motion.div
        key={currentRound.word.word}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="bg-white rounded-2xl shadow-xl px-10 py-6 border-4 border-dyslexia-primary"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold tracking-wider">{currentRound.word.word}</span>
          <button
            onClick={() => speak(currentRound.word.word, 0.8)}
            className="p-2 bg-dyslexia-primary text-white rounded-full hover:bg-orange-600 transition-colors"
            aria-label={`${currentRound.word.word} kelimesini sesli oku`}
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Instruction */}
      <p className="text-lg font-semibold text-center">
        Bu kelimeye uygun resmi seç! 👇
      </p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <AnimatePresence>
          {currentRound.options.map((option, i) => {
            const isCorrectAnswer = feedback === 'correct' && option.word === currentRound.word.word;
            const isWrongAnswer = feedback === 'wrong' && option.word !== currentRound.word.word;

            return (
              <motion.button
                key={`${round}-${option.word}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleSelect(option)}
                disabled={!!feedback}
                className={`
                  relative flex flex-col items-center gap-2 p-6 rounded-2xl border-3 
                  text-6xl cursor-pointer transition-all duration-200
                  hover:shadow-lg hover:scale-105
                  focus-visible:outline-4 focus-visible:outline-yellow-400
                  ${isCorrectAnswer ? 'bg-green-100 border-green-500 animate-correct' : ''}
                  ${isWrongAnswer && feedback === 'wrong' ? 'animate-wrong' : ''}
                  ${!feedback ? 'bg-white border-gray-200 hover:border-dyslexia-primary' : 'bg-white border-gray-200'}
                `}
                aria-label={`${option.word} seçeneği`}
              >
                <span className="text-5xl">{option.emoji}</span>
                {isCorrectAnswer && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <CheckCircle className="w-8 h-8 text-green-500 fill-green-100" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-2xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-500'}`}
          >
            {feedback === 'correct' ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-8 h-8" /> Aferin! 🌟
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <XCircle className="w-8 h-8" /> Tekrar dene! 💪
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
