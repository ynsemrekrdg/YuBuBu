import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Eye, EyeOff, ChevronRight, Check, Edit3 } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface SightWord {
  word: string;
  level: number;
}

const WORD_LISTS: { level: number; title: string; words: string[] }[] = [
  { level: 1, title: 'Temel Kelimeler', words: ['bir', 'bu', 've', 'ben', 'sen', 'ne', 'var', 'çok'] },
  { level: 2, title: 'Günlük Kelimeler', words: ['okul', 'ev', 'anne', 'baba', 'kitap', 'kalem', 'güneş', 'çocuk'] },
  { level: 3, title: 'Eylem Kelimeleri', words: ['gitmek', 'gelmek', 'yazmak', 'okumak', 'oynamak', 'sevmek'] },
];

type Phase = 'flash' | 'cover' | 'write' | 'compare';

export default function SightWordSpellingGame({ onComplete }: GameProps) {
  const [listIdx, setListIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('flash');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentList = WORD_LISTS[listIdx];
  const currentWord = currentList.words[wordIdx];
  const totalWords = WORD_LISTS.reduce((acc, l) => acc + l.words.length, 0);

  const handlePhaseTransition = useCallback(() => {
    switch (phase) {
      case 'flash':
        setPhase('cover');
        break;
      case 'cover':
        setPhase('write');
        break;
      case 'write':
        // Compare
        const correct = userInput.trim().toLowerCase() === currentWord.toLowerCase();
        setIsCorrect(correct);
        setPhase('compare');
        if (correct) {
          playSound('correct');
          setScore(prev => prev + Math.round(100 / totalWords));
        } else {
          playSound('wrong');
        }
        break;
      case 'compare':
        // Next word
        setPhase('flash');
        setUserInput('');
        setIsCorrect(null);

        if (wordIdx < currentList.words.length - 1) {
          setWordIdx(prev => prev + 1);
        } else if (listIdx < WORD_LISTS.length - 1) {
          setListIdx(prev => prev + 1);
          setWordIdx(0);
        } else {
          onComplete(Math.min(100, score));
        }
        break;
    }
  }, [phase, userInput, currentWord, wordIdx, listIdx, score, onComplete, totalWords, currentList.words.length]);

  const completedWords = WORD_LISTS.slice(0, listIdx).reduce((acc, l) => acc + l.words.length, 0) + wordIdx;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{completedWords + 1} / {totalWords}</span>
        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
          {currentList.title}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-5">
        {/* Phase indicator */}
        <div className="flex justify-center gap-1 mb-6">
          {[
            { key: 'flash', label: 'Gör', icon: '👀' },
            { key: 'cover', label: 'Ört', icon: '🙈' },
            { key: 'write', label: 'Yaz', icon: '✏️' },
            { key: 'compare', label: 'Karşılaştır', icon: '🔍' },
          ].map((p, i) => (
            <div
              key={p.key}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                phase === p.key ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span>{p.icon}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* FLASH - Show word */}
          {phase === 'flash' && (
            <motion.div key="flash" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Eye className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="text-5xl font-bold text-purple-800 mb-4"
              >
                {currentWord}
              </motion.div>
              <p className="text-purple-600 text-sm">Bu kelimeyi iyi oku ve hafızana al!</p>
            </motion.div>
          )}

          {/* COVER - Word hidden */}
          {phase === 'cover' && (
            <motion.div key="cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <EyeOff className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <div className="text-5xl text-gray-300 mb-4">
                {'•'.repeat(currentWord.length)}
              </div>
              <p className="text-gray-500 text-sm">Kelime gizlendi! Hatırladın mı?</p>
            </motion.div>
          )}

          {/* WRITE - User types */}
          {phase === 'write' && (
            <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <Edit3 className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <p className="text-purple-700 font-bold mb-4">Kelimeyi yaz!</p>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && userInput.trim() && handlePhaseTransition()}
                autoFocus
                className="w-full text-center text-3xl font-bold p-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                placeholder="..."
              />
            </motion.div>
          )}

          {/* COMPARE */}
          {phase === 'compare' && (
            <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              {isCorrect ? (
                <div className="bg-green-50 rounded-xl p-6">
                  <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700 mb-1">Doğru! ✨</p>
                  <p className="text-green-600">{currentWord}</p>
                </div>
              ) : (
                <div className="bg-red-50 rounded-xl p-6">
                  <p className="text-red-600 mb-2">Senin yazdığın: <span className="font-bold line-through">{userInput}</span></p>
                  <p className="text-green-700 text-2xl font-bold">Doğrusu: {currentWord}</p>
                  <p className="text-gray-500 text-sm mt-2">Bir dahaki sefere doğru yazacaksın!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePhaseTransition}
          disabled={phase === 'write' && !userInput.trim()}
          className="w-full mt-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <ChevronRight className="w-5 h-5" />
          {phase === 'flash' ? 'Ört!' : phase === 'cover' ? 'Yazmaya Başla!' : phase === 'write' ? 'Kontrol Et' : 'Sonraki Kelime'}
        </motion.button>
      </div>

      <div className="text-center mt-3 text-sm text-gray-500">
        Puan: <span className="font-bold text-purple-600">{score}</span>
      </div>
    </div>
  );
}
