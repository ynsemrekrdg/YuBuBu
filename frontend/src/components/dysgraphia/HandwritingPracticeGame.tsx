import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface WritingRound {
  word: string;
  hint: string;
  image: string;
  letters: string[];
}

const ROUNDS: WritingRound[] = [
  { word: 'EV', hint: 'İçinde yaşarız', image: '🏠', letters: ['E', 'V'] },
  { word: 'AY', hint: 'Geceleri gökyüzünde parlıyor', image: '🌙', letters: ['A', 'Y'] },
  { word: 'GÖZ', hint: 'Onlarla görürüz', image: '👁️', letters: ['G', 'Ö', 'Z'] },
  { word: 'KUŞ', hint: 'Gökyüzünde uçar', image: '🐦', letters: ['K', 'U', 'Ş'] },
  { word: 'OKUL', hint: 'Her gün öğrenmeye gittiğimiz yer', image: '🏫', letters: ['O', 'K', 'U', 'L'] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HandwritingPracticeGame({ onComplete }: GameProps) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>(() =>
    shuffle([...ROUNDS[0].letters, ...getDistractors(ROUNDS[0].letters)])
  );
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const current = ROUNDS[roundIdx];

  const handleLetterClick = useCallback((letter: string, idx: number) => {
    if (feedback) return;

    const nextExpected = current.letters[selectedLetters.length];

    if (letter === nextExpected) {
      const newSelected = [...selectedLetters, letter];
      setSelectedLetters(newSelected);
      playSound('click');

      // Remove from available
      const newAvailable = [...availableLetters];
      newAvailable.splice(idx, 1);
      setAvailableLetters(newAvailable);

      // Check if word is complete
      if (newSelected.length === current.letters.length) {
        setFeedback('correct');
        playSound('success');
        const newScore = score + Math.round(100 / ROUNDS.length);
        setScore(newScore);

        setTimeout(() => {
          setFeedback(null);
          if (roundIdx + 1 >= ROUNDS.length) {
            setGameOver(true);
            onComplete(newScore, Math.floor((Date.now() - startTime) / 1000));
          } else {
            const nextIdx = roundIdx + 1;
            setRoundIdx(nextIdx);
            setSelectedLetters([]);
            setAvailableLetters(
              shuffle([...ROUNDS[nextIdx].letters, ...getDistractors(ROUNDS[nextIdx].letters)])
            );
          }
        }, 1500);
      }
    } else {
      setFeedback('wrong');
      playSound('error');
      setTimeout(() => {
        setFeedback(null);
        // Reset selections for this round
        setSelectedLetters([]);
        setAvailableLetters(
          shuffle([...current.letters, ...getDistractors(current.letters)])
        );
      }, 800);
    }
  }, [feedback, current, selectedLetters, availableLetters, score, roundIdx, startTime, onComplete]);

  if (gameOver) return null;

  return (
    <div className="theme-dysgraphia p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <span className="bg-dysgraphia-card px-3 py-1 rounded-lg text-sm font-bold text-dysgraphia-text">
          Kelime {roundIdx + 1} / {ROUNDS.length}
        </span>
        <span className="bg-dysgraphia-card px-3 py-1 rounded-lg text-sm font-bold text-dysgraphia-text">
          ✍️ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-dysgraphia-accent/30">
        <p className="font-calm text-lg font-bold text-dysgraphia-text text-center">
          📝 Harfleri doğru sırayla seçerek kelimeyi yaz
        </p>
      </div>

      {/* Word Image & Hint */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-6xl">{current.image}</span>
        <p className="text-sm text-gray-500 italic">{current.hint}</p>
      </div>

      {/* Writing area - dotted slots */}
      <div className="flex gap-3 items-center">
        {current.letters.map((letter, idx) => (
          <motion.div
            key={idx}
            animate={
              feedback === 'correct' && selectedLetters.length === current.letters.length
                ? { scale: [1, 1.2, 1] }
                : {}
            }
            className={`
              w-14 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-2xl font-bold
              transition-all duration-300
              ${idx < selectedLetters.length
                ? 'border-dysgraphia-primary bg-dysgraphia-card text-dysgraphia-text'
                : 'border-gray-300 bg-white text-transparent'}
            `}
          >
            {idx < selectedLetters.length ? selectedLetters[idx] : letter}
            {/* Bottom writing line */}
            <div className="absolute bottom-1 left-2 right-2 h-px bg-dysgraphia-primary/30" />
          </motion.div>
        ))}
      </div>

      {/* Available letters */}
      <div className="flex flex-wrap gap-3 justify-center max-w-sm">
        <AnimatePresence mode="popLayout">
          {availableLetters.map((letter, idx) => (
            <motion.button
              key={`${letter}-${idx}`}
              layout
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleLetterClick(letter, idx)}
              disabled={!!feedback}
              className={`
                w-12 h-14 rounded-xl border-2 text-xl font-bold shadow-sm
                transition-colors duration-200
                ${feedback === 'wrong'
                  ? 'bg-red-50 border-red-300 text-red-500'
                  : 'bg-white border-dysgraphia-primary/30 text-dysgraphia-text hover:border-dysgraphia-primary hover:bg-dysgraphia-card cursor-pointer'}
              `}
              aria-label={`Harf: ${letter}`}
            >
              {letter}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-2xl font-bold text-green-600"
          >
            ✅ Harika! Doğru yazdın!
          </motion.div>
        )}
        {feedback === 'wrong' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg font-bold text-red-500"
          >
            Tekrar dene! Sırayı takip et ✍️
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getDistractors(letters: string[]): string[] {
  const allLetters = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
  const distractors = allLetters.filter((l) => !letters.includes(l));
  // Pick 2-3 random distractors
  const count = Math.min(3, distractors.length);
  const shuffled = distractors.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
