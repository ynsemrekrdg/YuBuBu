import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight, Check, X } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface PhonicsWord {
  word: string;
  sounds: string[];
  image: string;
  difficulty: number;
}

const WORDS: PhonicsWord[] = [
  { word: 'AT', sounds: ['A', 'T'], image: '🐴', difficulty: 1 },
  { word: 'EL', sounds: ['E', 'L'], image: '✋', difficulty: 1 },
  { word: 'OD', sounds: ['O', 'D'], image: '🔥', difficulty: 1 },
  { word: 'KUŞ', sounds: ['K', 'U', 'Ş'], image: '🐦', difficulty: 2 },
  { word: 'GÖZ', sounds: ['G', 'Ö', 'Z'], image: '👁️', difficulty: 2 },
  { word: 'OKUL', sounds: ['O', 'K', 'U', 'L'], image: '🏫', difficulty: 2 },
  { word: 'ÇOCUK', sounds: ['Ç', 'O', 'C', 'U', 'K'], image: '👧', difficulty: 3 },
  { word: 'GÜNEŞ', sounds: ['G', 'Ü', 'N', 'E', 'Ş'], image: '☀️', difficulty: 3 },
];

const ALL_LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export default function PhonicsSpellingGame({ onComplete }: GameProps) {
  const [wordIdx, setWordIdx] = useState(0);
  const [filledBoxes, setFilledBoxes] = useState<(string | null)[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);

  const word = WORDS[wordIdx];
  const boxes = word.sounds.length;

  // Initialize filled boxes
  if (filledBoxes.length !== boxes) {
    setFilledBoxes(new Array(boxes).fill(null));
  }

  // Available letter choices (correct + distractors)
  const [choices] = useState(() => {
    const createChoices = (w: PhonicsWord) => {
      const letters = [...w.sounds];
      const distractors = ALL_LETTERS.filter(l => !w.sounds.includes(l)).sort(() => Math.random() - 0.5).slice(0, Math.max(4, 8 - w.sounds.length));
      return [...letters, ...distractors].sort(() => Math.random() - 0.5);
    };
    return WORDS.map(w => createChoices(w));
  });

  const handleLetterDrop = useCallback((letter: string) => {
    const firstEmpty = filledBoxes.findIndex(b => b === null);
    if (firstEmpty === -1) return;

    const expected = word.sounds[firstEmpty];
    const newBoxes = [...filledBoxes];

    if (letter === expected) {
      newBoxes[firstEmpty] = letter;
      setFilledBoxes(newBoxes);
      playSound('click');

      // Check if word complete
      if (newBoxes.every(b => b !== null)) {
        setFeedback({ correct: true, msg: `Harika! "${word.word}" kelimesini doğru yazdın! 🎉` });
        playSound('correct');
        setScore(prev => prev + Math.round(100 / WORDS.length));

        setTimeout(() => {
          setFeedback(null);
          if (wordIdx < WORDS.length - 1) {
            setWordIdx(prev => prev + 1);
            setFilledBoxes([]);
          } else {
            onComplete(Math.min(100, score + Math.round(100 / WORDS.length)));
          }
        }, 1500);
      }
    } else {
      playSound('wrong');
      setFeedback({ correct: false, msg: `Bu ses "${letter}" değil, tekrar dene!` });
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [filledBoxes, word, wordIdx, score, onComplete]);

  const handlePlaySound = () => {
    // In production, would use Web Speech API
    playSound('click');
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">{wordIdx + 1} / {WORDS.length}</span>
        <div className="flex gap-1">
          {WORDS.map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < wordIdx ? 'bg-purple-500' : i === wordIdx ? 'bg-purple-400 animate-pulse' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-5">
        {/* Word image & sound */}
        <div className="text-center mb-6">
          <span className="text-6xl block mb-3">{word.image}</span>
          <button
            onClick={handlePlaySound}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-full text-purple-700 font-bold text-sm transition-colors"
          >
            <Volume2 className="w-4 h-4" /> Sesi Dinle
          </button>
        </div>

        {/* Elkonin boxes */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: boxes }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`w-14 h-14 rounded-xl border-3 flex items-center justify-center text-2xl font-bold transition-all ${
                filledBoxes[i]
                  ? 'bg-purple-100 border-purple-400 text-purple-800'
                  : i === filledBoxes.filter(b => b !== null).length
                  ? 'bg-purple-50 border-purple-400 border-dashed animate-pulse'
                  : 'bg-gray-50 border-gray-200 border-dashed'
              }`}
              style={{ borderWidth: '3px' }}
            >
              {filledBoxes[i] || ''}
            </motion.div>
          ))}
        </div>

        {/* Letter choices */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {(choices[wordIdx] || []).map((letter, i) => {
            const isUsed = filledBoxes.includes(letter);
            return (
              <motion.button
                key={`${letter}-${i}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleLetterDrop(letter)}
                disabled={isUsed || !!feedback}
                className={`w-11 h-11 rounded-xl font-bold text-lg transition-all ${
                  isUsed
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
                }`}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-3 rounded-xl text-center font-bold ${
                feedback.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {feedback.correct ? <Check className="w-5 h-5 inline mr-1" /> : <X className="w-5 h-5 inline mr-1" />}
              {feedback.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center mt-3 text-sm text-gray-500">
        Puan: <span className="font-bold text-purple-600">{score}</span>
      </div>
    </div>
  );
}
