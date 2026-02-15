import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * SyllableSegmentGame – Hece Bölme Oyunu
 * Orton-Gillingham Aşama 1: Fonolojik Farkındalık
 *
 * Çocuk kelimeyi hecelere ayırır.
 * Alkış animasyonu ile kinestetik destek.
 * Her hece bir vagon: "tren" metaforu.
 */

interface SyllableWord {
  word: string;
  syllables: string[];
  emoji: string;
}

const WORDS: SyllableWord[] = [
  { word: 'ARABA', syllables: ['A', 'RA', 'BA'], emoji: '🚗' },
  { word: 'ELMA', syllables: ['EL', 'MA'], emoji: '🍎' },
  { word: 'KALEM', syllables: ['KA', 'LEM'], emoji: '✏️' },
  { word: 'MASA', syllables: ['MA', 'SA'], emoji: '🪑' },
  { word: 'KEDİ', syllables: ['KE', 'Dİ'], emoji: '🐱' },
  { word: 'BALIK', syllables: ['BA', 'LIK'], emoji: '🐟' },
  { word: 'OKUL', syllables: ['O', 'KUL'], emoji: '🏫' },
  { word: 'ÇİÇEK', syllables: ['Çİ', 'ÇEK'], emoji: '🌸' },
  { word: 'BİLGİSAYAR', syllables: ['BİL', 'Gİ', 'SA', 'YAR'], emoji: '💻' },
  { word: 'HAYVAN', syllables: ['HAY', 'VAN'], emoji: '🐾' },
  { word: 'KAPALI', syllables: ['KA', 'PA', 'LI'], emoji: '🚪' },
  { word: 'UÇ', syllables: ['UÇ'], emoji: '✈️' },
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SyllableSegmentGame({ onComplete }: GameProps) {
  const totalRounds = 6;
  const [rounds] = useState(() => shuffle(WORDS).slice(0, totalRounds));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [tappedCount, setTappedCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [clapAnim, setClapAnim] = useState(false);
  const [startTime] = useState(Date.now());

  const currentWord = rounds[round];
  const correctSyllableCount = currentWord.syllables.length;

  const handleClap = useCallback(() => {
    if (showResult) return;
    setClapAnim(true);
    playSound('click');
    setTimeout(() => setClapAnim(false), 200);
    setTappedCount((c) => c + 1);
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (showResult) return;

    const correct = tappedCount === correctSyllableCount;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setScore((s) => s + 20);
      playSound('success');
      speak(`Doğru! ${currentWord.word} kelimesi ${correctSyllableCount} heceli.`, 0.9);
    } else {
      playSound('click');
      speak(
        `${currentWord.word} kelimesi ${correctSyllableCount} heceli: ${currentWord.syllables.join(' - ')}`,
        0.85
      );
    }

    setTimeout(() => {
      setShowResult(false);
      setTappedCount(0);
      if (round + 1 >= totalRounds) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const finalScore = correct ? score + 20 : score;
        onComplete(finalScore, timeSpent);
      } else {
        setRound((r) => r + 1);
      }
    }, correct ? 1500 : 2500);
  }, [showResult, tappedCount, correctSyllableCount, currentWord, round, totalRounds, score, startTime, onComplete]);

  const handleReset = () => {
    setTappedCount(0);
  };

  return (
    <div className="dyslexia-module p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          Kelime {round + 1} / {totalRounds}
        </span>
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      {/* Instruction */}
      <div className="flex items-center gap-3">
        <p className="text-xl font-bold text-center">
          Kelimeyi alkışlayarak hecele! 👏
        </p>
        <button
          onClick={() =>
            speak('Kelimeyi sesli söyle ve her hece için bir kez alkışla! Sonra kontrol et.', 0.85)
          }
          className="p-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
          aria-label="Talimatı sesli oku"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Target Word */}
      <motion.div
        key={currentWord.word}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className="bg-white rounded-2xl shadow-xl px-10 py-6 border-4 border-orange-300"
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">{currentWord.emoji}</span>
          <span className="text-3xl font-bold tracking-wider">{currentWord.word}</span>
          <button
            onClick={() => speak(currentWord.word, 0.7)}
            className="p-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
            aria-label={`${currentWord.word} kelimesini sesli oku`}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Clap counter & train wagons */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span className="text-lg font-bold">🚂</span>
        {Array.from({ length: tappedCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            className="bg-orange-200 border-2 border-orange-400 rounded-lg px-4 py-2 text-lg font-bold"
          >
            📦
          </motion.div>
        ))}
        {tappedCount === 0 && (
          <span className="text-gray-400 text-lg">Alkışla, vagonlar eklensin!</span>
        )}
      </div>

      {/* Clap button */}
      <motion.button
        onClick={handleClap}
        disabled={showResult}
        animate={clapAnim ? { scale: 1.3 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500 }}
        className="text-6xl bg-white rounded-full shadow-lg p-6 border-4 border-orange-300
          hover:border-orange-500 transition-colors min-h-[80px] min-w-[80px]
          focus-visible:outline-4 focus-visible:outline-yellow-400"
        aria-label="Alkışla - hece say"
      >
        👏
      </motion.button>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={handleReset}
          disabled={showResult}
          className="px-5 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold
            hover:bg-gray-300 transition-colors min-h-[48px]"
        >
          🔄 Sıfırla
        </button>
        <button
          onClick={handleSubmit}
          disabled={showResult || tappedCount === 0}
          className="px-5 py-3 bg-green-500 text-white rounded-xl font-bold
            hover:bg-green-600 transition-colors min-h-[48px]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✅ Kontrol Et ({tappedCount} hece)
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`text-center p-4 rounded-xl ${
              isCorrect ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {isCorrect ? (
              <p className="text-xl font-bold">
                ✅ Doğru! {correctSyllableCount} hece!
              </p>
            ) : (
              <div>
                <p className="text-lg font-bold mb-2">
                  🔄 {correctSyllableCount} heceli:
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {currentWord.syllables.map((syl, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.3 }}
                      className="bg-white px-4 py-2 rounded-lg border-2 border-yellow-400 text-xl font-bold"
                    >
                      {syl}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
