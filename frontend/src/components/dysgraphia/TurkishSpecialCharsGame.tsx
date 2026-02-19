import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface TurkishLetter {
  letter: string;
  base: string;
  modifier: string;
  tip: string;
  commonError: string;
  path: string;
}

const TURKISH_LETTERS: TurkishLetter[] = [
  {
    letter: 'Ç', base: 'C', modifier: 'cedilla',
    tip: 'Önce C yaz, sonra altına küçük kuyruk ekle',
    commonError: 'Kuyruk unutulur',
    path: 'M 220 80 C 100 30 40 150 100 240 M 140 240 C 130 270 110 280 100 260',
  },
  {
    letter: 'Ğ', base: 'G', modifier: 'breve',
    tip: 'Önce G yaz, sonra üstüne küçük hilal koy',
    commonError: 'Hilal yerine düz çizgi',
    path: 'M 220 100 C 220 60 80 60 80 150 C 80 260 220 260 220 180 L 220 150 L 160 150 M 120 40 C 140 20 170 20 190 40',
  },
  {
    letter: 'İ', base: 'I', modifier: 'dot',
    tip: 'Büyük İ\'nin üstünde nokta var! (I ve İ farklı)',
    commonError: 'I ve İ karıştırılır',
    path: 'M 150 80 L 150 260 M 150 50 L 150 48',
  },
  {
    letter: 'Ö', base: 'O', modifier: 'diaeresis',
    tip: 'Önce O yaz, sonra üstüne iki nokta koy',
    commonError: 'Noktalar yanlış yerleştirilir',
    path: 'M 150 80 C 60 80 40 180 80 230 C 120 280 230 260 240 200 C 260 140 220 80 150 80 M 120 50 L 120 48 M 180 50 L 180 48',
  },
  {
    letter: 'Ş', base: 'S', modifier: 'cedilla',
    tip: 'Önce S yaz, sonra altına kuyruk ekle',
    commonError: 'Ç ile karıştırılır',
    path: 'M 200 100 C 200 60 100 60 100 120 C 100 160 200 180 200 220 C 200 280 100 280 100 240 M 140 280 C 130 310 110 320 100 300',
  },
  {
    letter: 'Ü', base: 'U', modifier: 'diaeresis',
    tip: 'Önce U yaz, sonra üstüne iki nokta koy',
    commonError: 'Ö ile karıştırılır',
    path: 'M 80 80 L 80 220 C 80 270 220 270 220 220 L 220 80 M 120 50 L 120 48 M 180 50 L 180 48',
  },
];

type Phase = 'learn' | 'practice';

export default function TurkishSpecialCharsGame({ onComplete }: GameProps) {
  const [letterIdx, setLetterIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('learn');
  const [userPaths, setUserPaths] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<SVGSVGElement>(null);

  const letter = TURKISH_LETTERS[letterIdx];

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = canvasRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 300,
      y: ((clientY - rect.top) / rect.height) * 300,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (phase === 'learn') return;
    setIsDrawing(true);
    const pt = getPoint(e);
    if (pt) setUserPaths(prev => [...prev, `M ${pt.x} ${pt.y}`]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getPoint(e);
    if (pt) {
      setUserPaths(prev => {
        const copy = [...prev];
        copy[copy.length - 1] += ` L ${pt.x} ${pt.y}`;
        return copy;
      });
    }
  };

  const handleEnd = () => setIsDrawing(false);

  const handleNext = () => {
    if (phase === 'learn') {
      setPhase('practice');
      return;
    }

    const letterScore = Math.round(100 / TURKISH_LETTERS.length);
    const newScore = score + letterScore;
    setScore(newScore);
    playSound('correct');

    if (letterIdx < TURKISH_LETTERS.length - 1) {
      setTimeout(() => {
        setLetterIdx(prev => prev + 1);
        setPhase('learn');
        setUserPaths([]);
      }, 500);
    } else {
      setTimeout(() => onComplete(Math.min(100, newScore)), 500);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-1 justify-center mb-4">
        {TURKISH_LETTERS.map((l, i) => (
          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            i < letterIdx ? 'bg-blue-500 text-white' : i === letterIdx ? 'bg-blue-200 text-blue-800 ring-2 ring-blue-400' : 'bg-gray-100 text-gray-400'
          }`}>
            {l.letter}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${letterIdx}-${phase}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-blue-800 text-2xl">🇹🇷 {letter.letter} Harfi</h3>
                <p className="text-blue-600 text-sm">Temel: {letter.base} + {letter.modifier === 'cedilla' ? 'kuyruk' : letter.modifier === 'breve' ? 'hilal' : letter.modifier === 'dot' ? 'nokta' : 'iki nokta'}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${phase === 'learn' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {phase === 'learn' ? '📖 Öğren' : '✏️ Yaz'}
              </span>
            </div>
          </div>

          {phase === 'learn' ? (
            <div className="p-5">
              {/* Big letter display */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-4">
                  <span className="text-6xl text-gray-300 font-bold">{letter.base}</span>
                  <span className="text-3xl text-gray-400">→</span>
                  <span className="text-6xl text-blue-600 font-bold">{letter.letter}</span>
                </div>
              </div>

              {/* Tip */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-sm text-green-700 font-medium">💡 {letter.tip}</p>
              </div>

              {/* Common error */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-700">Sık hata: {letter.commonError}</p>
                </div>
              </div>

              {/* Comparison */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-600 font-bold mb-2">Karşılaştır:</p>
                <div className="flex justify-center gap-8">
                  <div className="text-center">
                    <span className="text-4xl text-gray-400">{letter.base}</span>
                    <p className="text-xs text-gray-400 mt-1">(işaretsiz)</p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl text-blue-600 font-bold">{letter.letter}</span>
                    <p className="text-xs text-blue-600 mt-1">(işaretli)</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold"
              >
                ✏️ Şimdi Yazalım!
              </motion.button>
            </div>
          ) : (
            <>
              {/* Drawing canvas */}
              <svg
                ref={canvasRef}
                viewBox="0 0 300 320"
                className="w-full aspect-square touch-none cursor-crosshair bg-gradient-to-b from-blue-50 to-white"
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              >
                {/* Guide */}
                <path d={letter.path} fill="none" stroke="#93C5FD" strokeWidth={2} strokeDasharray="6 3" opacity={0.5} />
                {/* Three lines */}
                <line x1="0" y1="50" x2="300" y2="50" stroke="#BFDBFE" strokeWidth={1} strokeDasharray="4 2" />
                <line x1="0" y1="160" x2="300" y2="160" stroke="#BFDBFE" strokeWidth={1} strokeDasharray="4 2" />
                <line x1="0" y1="260" x2="300" y2="260" stroke="#3B82F6" strokeWidth={2} />
                {/* User paths */}
                {userPaths.map((p, i) => (
                  <path key={i} d={p} fill="none" stroke="#1D4ED8" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>

              <div className="p-4 border-t flex gap-2">
                <button onClick={() => setUserPaths([])} className="px-4 py-3 bg-gray-100 rounded-xl">
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  {letterIdx < TURKISH_LETTERS.length - 1 ? 'Sonraki Harf' : 'Tamamla!'}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
