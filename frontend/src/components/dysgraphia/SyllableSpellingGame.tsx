import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X, Volume2 } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface SyllableWord {
  word: string;
  syllables: string[];
}

interface WordSet {
  level: number;
  title: string;
  words: SyllableWord[];
}

const WORD_SETS: WordSet[] = [
  {
    level: 1,
    title: 'İki Heceli Kelimeler',
    words: [
      { word: 'ANNE', syllables: ['AN', 'NE'] },
      { word: 'BABA', syllables: ['BA', 'BA'] },
      { word: 'OKUL', syllables: ['O', 'KUL'] },
      { word: 'KALEM', syllables: ['KA', 'LEM'] },
      { word: 'KITAP', syllables: ['KI', 'TAP'] },
    ],
  },
  {
    level: 2,
    title: 'Üç Heceli Kelimeler',
    words: [
      { word: 'KELEBEK', syllables: ['KE', 'LE', 'BEK'] },
      { word: 'ÖĞRENCİ', syllables: ['ÖĞ', 'REN', 'Cİ'] },
      { word: 'KARPUZ', syllables: ['KAR', 'PUZ'] },
      { word: 'TABURE', syllables: ['TA', 'BU', 'RE'] },
    ],
  },
];

type Phase = 'split' | 'combine';

export default function SyllableSpellingGame({ onComplete }: GameProps) {
  const [setIdx, setSetIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('split');
  const [selectedSyllables, setSelectedSyllables] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);

  const currentSet = WORD_SETS[setIdx];
  const currentWord = currentSet.words[wordIdx];

  // Shuffled syllable choices for splitting
  const [syllableChoices] = useState(() =>
    WORD_SETS.map(set =>
      set.words.map(w => {
        const extras = ['MA', 'LI', 'KE', 'TU', 'REN', 'BA', 'SI'].filter(s => !w.syllables.includes(s));
        const distractors = extras.sort(() => Math.random() - 0.5).slice(0, 2);
        return [...w.syllables, ...distractors].sort(() => Math.random() - 0.5);
      })
    )
  );

  const handleSyllableSelect = useCallback((syllable: string) => {
    if (feedback) return;

    const expected = currentWord.syllables[selectedSyllables.length];
    if (syllable === expected) {
      const newSelected = [...selectedSyllables, syllable];
      setSelectedSyllables(newSelected);
      playSound('click');

      if (newSelected.length === currentWord.syllables.length) {
        // Word complete
        setFeedback({ correct: true, msg: `Doğru! ${currentWord.syllables.join('-')} 👏` });
        playSound('correct');
        const pts = Math.round(100 / WORD_SETS.reduce((acc, s) => acc + s.words.length, 0));
        setScore(prev => prev + pts);

        setTimeout(() => {
          setFeedback(null);
          setSelectedSyllables([]);

          if (wordIdx < currentSet.words.length - 1) {
            setWordIdx(prev => prev + 1);
          } else if (setIdx < WORD_SETS.length - 1) {
            setSetIdx(prev => prev + 1);
            setWordIdx(0);
          } else {
            onComplete(Math.min(100, score + pts));
          }
        }, 1500);
      }
    } else {
      playSound('wrong');
      setFeedback({ correct: false, msg: `Bu hece şimdi gelmiyor, tekrar dene!` });
      setTimeout(() => setFeedback(null), 1000);
    }
  }, [selectedSyllables, currentWord, wordIdx, setIdx, score, onComplete, currentSet.words.length, feedback]);

  const handleClap = () => {
    playSound('click');
  };

  const totalWords = WORD_SETS.reduce((acc, s) => acc + s.words.length, 0);
  const completedWords = WORD_SETS.slice(0, setIdx).reduce((acc, s) => acc + s.words.length, 0) + wordIdx;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{completedWords + 1} / {totalWords}</span>
        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
          {currentSet.title}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-5">
        {/* Word display */}
        <div className="text-center mb-6">
          <motion.h3
            key={`${setIdx}-${wordIdx}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold text-purple-800 mb-2"
          >
            {currentWord.word}
          </motion.h3>
          <p className="text-purple-600 text-sm">Bu kelimeyi hecelere ayır!</p>

          {/* Clap rhythm button */}
          <button
            onClick={handleClap}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-purple-50 hover:bg-purple-100 rounded-full text-purple-600 text-sm"
          >
            👏 {currentWord.syllables.length} hece
          </button>
        </div>

        {/* Syllable boxes */}
        <div className="flex justify-center gap-2 mb-6">
          {currentWord.syllables.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`min-w-[60px] h-14 px-3 rounded-xl border-3 flex items-center justify-center text-xl font-bold transition-all ${
                selectedSyllables[i]
                  ? 'bg-purple-100 border-purple-400 text-purple-800'
                  : i === selectedSyllables.length
                  ? 'bg-purple-50 border-purple-400 border-dashed animate-pulse'
                  : 'bg-gray-50 border-gray-200 border-dashed'
              }`}
              style={{ borderWidth: '3px' }}
            >
              {selectedSyllables[i] || (i === selectedSyllables.length ? '?' : '')}
            </motion.div>
          ))}
        </div>

        {/* Color-coded separator preview */}
        {selectedSyllables.length === currentWord.syllables.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4"
          >
            <div className="flex justify-center gap-1">
              {currentWord.syllables.map((syl, i) => (
                <span key={i} className="px-2 py-1 rounded bg-purple-200 text-purple-800 font-bold">
                  {syl}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Syllable choices */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {(syllableChoices[setIdx]?.[wordIdx] || []).map((syl, i) => {
            const isUsed = selectedSyllables.includes(syl);
            return (
              <motion.button
                key={`${syl}-${i}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSyllableSelect(syl)}
                disabled={isUsed || !!feedback}
                className={`px-4 py-2 rounded-xl font-bold text-lg transition-all ${
                  isUsed
                    ? 'bg-gray-100 text-gray-300'
                    : 'bg-purple-500 text-white hover:bg-purple-600 shadow-md'
                }`}
              >
                {syl}
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
