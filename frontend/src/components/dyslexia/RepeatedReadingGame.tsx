import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Pause, BarChart3 } from 'lucide-react';
import { speak, playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

/**
 * RepeatedReadingGame – Tekrarlı Okuma Oyunu
 * Orton-Gillingham Aşama 4: Akıcılık (Fluency)
 *
 * 3 okuma protokolü: her okumada WPM takibi.
 * Okuma cetveli (ruler), kelime vurgulama, ilerleme grafiği.
 */

interface ReadingText {
  title: string;
  words: string[];
  emoji: string;
}

const TEXTS: ReadingText[] = [
  {
    title: 'Küçük Kedi',
    emoji: '🐱',
    words: ['Bir', 'küçük', 'kedi', 'vardı.', 'Kedi', 'çok', 'tatlı', 'idi.', 'Her', 'gün', 'bahçede', 'oynardı.', 'Süt', 'içmeyi', 'çok', 'severdi.', 'Akşam', 'olunca', 'yatağına', 'giderdi.'],
  },
  {
    title: 'Güneşli Gün',
    emoji: '☀️',
    words: ['Bugün', 'hava', 'çok', 'güzel.', 'Güneş', 'parlıyor.', 'Kuşlar', 'şarkı', 'söylüyor.', 'Çocuklar', 'parkta', 'oynuyor.', 'Herkes', 'çok', 'mutlu.', 'Ne', 'güzel', 'bir', 'gün!'],
  },
  {
    title: 'Okul Yolu',
    emoji: '🏫',
    words: ['Sabah', 'erken', 'kalktım.', 'Kahvaltımı', 'yaptım.', 'Çantamı', 'aldım.', 'Okula', 'yürüdüm.', 'Arkadaşlarımla', 'buluştum.', 'Birlikte', 'sınıfa', 'girdik.', 'Ders', 'başladı.', 'Çok', 'eğlendik.'],
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

export default function RepeatedReadingGame({ onComplete }: GameProps) {
  const [text] = useState(() => shuffle(TEXTS)[0]);
  const totalReadings = 3;
  const [readingNum, setReadingNum] = useState(1);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [wpmResults, setWpmResults] = useState<number[]>([]);
  const [readingStartTime, setReadingStartTime] = useState(0);
  const [score, setScore] = useState(0);
  const [rulerPosition, setRulerPosition] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance words every ~600ms (simulating reading pace)
  useEffect(() => {
    if (!isReading) return;

    intervalRef.current = setInterval(() => {
      setCurrentWordIdx((prev) => {
        if (prev + 1 >= text.words.length) {
          // Reading complete
          clearInterval(intervalRef.current!);
          setIsReading(false);

          const elapsed = (Date.now() - readingStartTime) / 1000 / 60; // minutes
          const wpm = Math.round(text.words.length / elapsed);

          setWpmResults((prev) => {
            const newResults = [...prev, wpm];
            // Score based on improvement
            const readingScore = Math.min(wpm * 2, 40);
            setScore((s) => s + readingScore);

            if (newResults.length >= totalReadings) {
              // All readings done
              setTimeout(() => {
                setFinished(true);
                const timeSpent = Math.floor((Date.now() - startTime) / 1000);
                const totalScore = score + readingScore;
                playSound('success');
                onComplete(Math.min(totalScore, 100), timeSpent);
              }, 1500);
            }

            return newResults;
          });

          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isReading, readingStartTime, text.words.length, totalReadings, startTime, score, onComplete]);

  // Update ruler position based on current word
  useEffect(() => {
    const progress = (currentWordIdx / text.words.length) * 100;
    setRulerPosition(progress);
  }, [currentWordIdx, text.words.length]);

  const startReading = useCallback(() => {
    setCurrentWordIdx(0);
    setReadingStartTime(Date.now());
    setIsReading(true);
    speak('Kelimeleri takip et ve sesli oku!', 0.9);
  }, []);

  const handleWordTap = useCallback(
    (idx: number) => {
      if (!isReading) return;
      // Allow tapping to advance to next word
      if (idx === currentWordIdx + 1) {
        setCurrentWordIdx(idx);
        playSound('click');
      }
    },
    [isReading, currentWordIdx]
  );

  if (finished) return null;

  return (
    <div className="dyslexia-module p-6 rounded-2xl min-h-[400px] flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-lg">
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          Okuma {readingNum} / {totalReadings}
        </span>
        <span className="text-sm font-bold bg-white/60 px-3 py-1 rounded-lg">
          ⭐ {score} puan
        </span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{text.emoji}</span>
        <h2 className="text-2xl font-bold">{text.title}</h2>
        <button
          onClick={() => speak(text.title, 0.8)}
          className="p-2 bg-orange-400 text-white rounded-full hover:bg-orange-500 transition-colors"
          aria-label="Başlığı sesli oku"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Reading ruler */}
      <div className="w-full max-w-lg">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-orange-400 rounded-full"
            animate={{ width: `${rulerPosition}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Text display */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200 w-full max-w-lg min-h-[200px]">
        <div className="flex flex-wrap gap-x-2 gap-y-3" style={{ lineHeight: '2.2' }}>
          {text.words.map((word, idx) => {
            const isCurrent = idx === currentWordIdx && isReading;
            const isRead = idx < currentWordIdx;

            return (
              <motion.span
                key={idx}
                onClick={() => handleWordTap(idx)}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : {}}
                transition={isCurrent ? { repeat: Infinity, duration: 0.8 } : {}}
                className={`
                  text-xl font-bold px-1 rounded transition-all cursor-pointer
                  ${isCurrent ? 'bg-orange-200 text-orange-800 scale-110' : ''}
                  ${isRead ? 'text-green-600' : ''}
                  ${!isCurrent && !isRead ? 'text-gray-700' : ''}
                `}
              >
                {word}
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      {!isReading && wpmResults.length < totalReadings && (
        <motion.button
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          onClick={startReading}
          className="flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl
            font-bold text-lg hover:bg-green-600 transition-colors min-h-[60px]"
        >
          <Play className="w-6 h-6" />
          {wpmResults.length === 0
            ? 'Okumaya Başla!'
            : `${wpmResults.length + 1}. Okumaya Başla`}
        </motion.button>
      )}

      {isReading && (
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="font-bold text-orange-700">Okuyorsun...</span>
          </motion.div>
        </div>
      )}

      {/* WPM Results */}
      {wpmResults.length > 0 && !isReading && (
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            <span className="font-bold">Okuma Hızın (Kelime/Dakika):</span>
          </div>
          <div className="flex gap-3 justify-center">
            {wpmResults.map((wpm, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.2 }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="bg-orange-400 rounded-lg text-white font-bold px-4 py-2"
                  style={{ height: `${Math.max(40, wpm)}px` }}
                >
                  {wpm}
                </div>
                <span className="text-sm font-bold text-gray-500">{i + 1}. okuma</span>
              </motion.div>
            ))}
          </div>
          {wpmResults.length >= 2 && (
            <p className="text-center mt-3 font-bold text-green-600">
              {wpmResults[wpmResults.length - 1] > wpmResults[0]
                ? `🎉 Hızın arttı! +${wpmResults[wpmResults.length - 1] - wpmResults[0]} kelime/dk`
                : '💪 Pratik yapmaya devam et!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
