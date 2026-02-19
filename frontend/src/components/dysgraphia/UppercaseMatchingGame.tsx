import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface LetterPair {
  upper: string;
  lower: string;
  group: string;
}

const LETTER_PAIRS: LetterPair[] = [
  { upper: 'A', lower: 'a', group: 'tall_small' },
  { upper: 'B', lower: 'b', group: 'tall_tall' },
  { upper: 'C', lower: 'c', group: 'tall_small' },
  { upper: 'D', lower: 'd', group: 'tall_tall' },
  { upper: 'E', lower: 'e', group: 'tall_small' },
  { upper: 'G', lower: 'g', group: 'tall_descender' },
  { upper: 'K', lower: 'k', group: 'tall_tall' },
  { upper: 'M', lower: 'm', group: 'tall_small' },
  { upper: 'N', lower: 'n', group: 'tall_small' },
  { upper: 'R', lower: 'r', group: 'tall_small' },
];

type Phase = 'match' | 'write' | 'sort';

interface MatchState {
  selectedUpper: string | null;
  matched: string[];
}

export default function UppercaseMatchingGame({ onComplete }: GameProps) {
  const [phase, setPhase] = useState<Phase>('match');
  const [matchState, setMatchState] = useState<MatchState>({ selectedUpper: null, matched: [] });
  const [writeIdx, setWriteIdx] = useState(0);
  const [sortAnswers, setSortAnswers] = useState<{ letter: string; answer: string }[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Shuffled lowercase for matching
  const [shuffledLower] = useState(() => [...LETTER_PAIRS].map(p => p.lower).sort(() => Math.random() - 0.5));

  const handleUpperClick = (upper: string) => {
    if (matchState.matched.includes(upper)) return;
    setMatchState(prev => ({ ...prev, selectedUpper: upper }));
    playSound('click');
  };

  const handleLowerClick = useCallback((lower: string) => {
    const { selectedUpper, matched } = matchState;
    if (!selectedUpper || matched.includes(selectedUpper)) return;

    const pair = LETTER_PAIRS.find(p => p.upper === selectedUpper);
    if (pair?.lower === lower) {
      // Correct match
      playSound('correct');
      const newMatched = [...matched, selectedUpper];
      setMatchState({ selectedUpper: null, matched: newMatched });
      setScore(prev => prev + 5);

      if (newMatched.length === LETTER_PAIRS.length) {
        setTimeout(() => setPhase('write'), 800);
      }
    } else {
      playSound('wrong');
      setMatchState(prev => ({ ...prev, selectedUpper: null }));
    }
  }, [matchState]);

  const handleWriteNext = () => {
    setScore(prev => prev + 3);
    playSound('click');
    if (writeIdx < 4) {
      setWriteIdx(prev => prev + 1);
    } else {
      setPhase('sort');
    }
  };

  const handleSortAnswer = (letter: string, sizeGroup: string) => {
    const pair = LETTER_PAIRS.find(p => p.lower === letter);
    const correct = pair?.group.includes('small') ? 'small' :
                    pair?.group.includes('descender') ? 'descender' : 'tall';

    setSortAnswers(prev => [...prev, { letter, answer: sizeGroup }]);
    if (sizeGroup === correct) {
      playSound('correct');
      setScore(prev => prev + 5);
    } else {
      playSound('wrong');
    }

    // Check if all sorted
    if (sortAnswers.length + 1 >= 6) {
      setTimeout(() => onComplete(Math.min(100, score + 5)), 800);
    }
  };

  const sortLetters = ['a', 'b', 'g', 'e', 'k', 'p'].filter(l => !sortAnswers.find(a => a.letter === l));

  return (
    <div className="max-w-lg mx-auto">
      {/* Phase indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { key: 'match', label: '🔗 Eşleştir', count: `${matchState.matched.length}/${LETTER_PAIRS.length}` },
          { key: 'write', label: '✏️ Yaz' },
          { key: 'sort', label: '📊 Sınıfla' },
        ].map((p) => (
          <div
            key={p.key}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              phase === p.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {p.label}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MATCH PHASE */}
        {phase === 'match' && (
          <motion.div key="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-5"
          >
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">Büyük ve Küçük Harfleri Eşleştir!</h3>

            {/* Uppercase row */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {LETTER_PAIRS.map((pair) => (
                <motion.button
                  key={pair.upper}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleUpperClick(pair.upper)}
                  className={`w-12 h-12 rounded-xl text-lg font-bold transition-all ${
                    matchState.matched.includes(pair.upper) ? 'bg-green-100 text-green-500 border-green-300' :
                    matchState.selectedUpper === pair.upper ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300' :
                    'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  } border-2`}
                  disabled={matchState.matched.includes(pair.upper)}
                >
                  {matchState.matched.includes(pair.upper) ? <Check className="w-5 h-5 mx-auto" /> : pair.upper}
                </motion.button>
              ))}
            </div>

            <div className="text-center text-gray-400 text-sm mb-3">⬇️ eşleştir ⬇️</div>

            {/* Lowercase row */}
            <div className="flex flex-wrap gap-2 justify-center">
              {shuffledLower.map((lower) => {
                const isMatched = matchState.matched.some(u => LETTER_PAIRS.find(p => p.upper === u)?.lower === lower);
                return (
                  <motion.button
                    key={lower}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLowerClick(lower)}
                    className={`w-12 h-12 rounded-xl text-lg font-bold transition-all ${
                      isMatched ? 'bg-green-100 text-green-500 border-green-300' :
                      'bg-gray-50 text-gray-800 border-gray-200 hover:bg-blue-50'
                    } border-2`}
                    disabled={isMatched || !matchState.selectedUpper}
                  >
                    {isMatched ? <Check className="w-5 h-5 mx-auto" /> : lower}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* WRITE PHASE */}
        {phase === 'write' && (
          <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-5"
          >
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">Harf Çiftini Yaz!</h3>
            <div className="text-center mb-6">
              <span className="text-6xl font-bold text-blue-800">
                {LETTER_PAIRS[writeIdx].upper}{LETTER_PAIRS[writeIdx].lower}
              </span>
              <p className="text-gray-500 mt-2">Bu çifti üç çizgili satırda yaz</p>
            </div>

            {/* Three-line writing area */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4 relative h-24">
              <div className="absolute inset-x-4 top-4 border-t border-blue-300 border-dashed" />
              <div className="absolute inset-x-4 top-12 border-t border-blue-200 border-dashed" />
              <div className="absolute inset-x-4 bottom-4 border-t-2 border-blue-400" />
              <div className="text-center text-4xl font-bold text-blue-300 mt-2 tracking-[0.5em]">
                {LETTER_PAIRS[writeIdx].upper}{LETTER_PAIRS[writeIdx].lower}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWriteNext}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              {writeIdx < 4 ? 'Sonraki Çift' : 'Sınıflamaya Geç'}
            </motion.button>
          </motion.div>
        )}

        {/* SORT PHASE */}
        {phase === 'sort' && (
          <motion.div key="sort" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-5"
          >
            <h3 className="text-lg font-bold text-blue-800 mb-4 text-center">Harfi Boyutuna Göre Sınıfla!</h3>

            {sortLetters.length > 0 ? (
              <>
                <div className="text-center mb-6">
                  <motion.span
                    key={sortLetters[0]}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-7xl font-bold text-blue-800"
                  >
                    {sortLetters[0]}
                  </motion.span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'tall', label: '⬆️ Uzun (üst çizgiye kadar)', color: 'bg-blue-500' },
                    { key: 'small', label: '➡️ Kısa (orta bölgede)', color: 'bg-green-500' },
                    { key: 'descender', label: '⬇️ Kuyruklu (aşağı iner)', color: 'bg-red-500' },
                  ].map((btn) => (
                    <motion.button
                      key={btn.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSortAnswer(sortLetters[0], btn.key)}
                      className={`w-full py-3 ${btn.color} text-white rounded-xl font-bold`}
                    >
                      {btn.label}
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <span className="text-5xl">🎉</span>
                <p className="text-gray-600 mt-2">Harika! Tüm harfleri sınıfladın!</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-4 text-sm text-gray-500">
        Puan: <span className="font-bold text-blue-600">{score}</span>
      </div>
    </div>
  );
}
