import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ChevronRight, Check } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

// Three-line system zones
type Zone = 'sky' | 'mid' | 'base' | 'descender';

interface LetterZoneData {
  letter: string;
  zone: Zone;
  label: string;
}

const ZONE_COLORS: Record<Zone, string> = {
  sky: '#3B82F6',    // Blue - uzun harfler
  mid: '#10B981',    // Green - kısa harfler
  base: '#F59E0B',   // Yellow - orta
  descender: '#EF4444', // Red - kuyruklu harfler
};

const ZONE_LABELS: Record<Zone, string> = {
  sky: 'Üst Çizgi (Uzun)',
  mid: 'Orta Çizgi (Kısa)',
  base: 'Taban Çizgisi',
  descender: 'Kuyruk Bölgesi',
};

const LETTER_DATA: LetterZoneData[] = [
  // Tall letters (b, d, f, h, k, l, t) → sky
  { letter: 'b', zone: 'sky', label: 'Uzun harf - üst çizgiye kadar' },
  { letter: 'd', zone: 'sky', label: 'Uzun harf - üst çizgiye kadar' },
  { letter: 'h', zone: 'sky', label: 'Uzun harf - üst çizgiye kadar' },
  { letter: 'k', zone: 'sky', label: 'Uzun harf - üst çizgiye kadar' },
  { letter: 'l', zone: 'sky', label: 'Uzun harf - üst çizgiye kadar' },
  // Small letters (a, c, e, m, n, o, r, s, u) → mid
  { letter: 'a', zone: 'mid', label: 'Kısa harf - orta bölgede' },
  { letter: 'c', zone: 'mid', label: 'Kısa harf - orta bölgede' },
  { letter: 'e', zone: 'mid', label: 'Kısa harf - orta bölgede' },
  { letter: 'm', zone: 'mid', label: 'Kısa harf - orta bölgede' },
  { letter: 'o', zone: 'mid', label: 'Kısa harf - orta bölgede' },
  // Descender letters (g, j, p, q, y) → descender
  { letter: 'g', zone: 'descender', label: 'Kuyruklu harf - aşağı iner' },
  { letter: 'p', zone: 'descender', label: 'Kuyruklu harf - aşağı iner' },
  { letter: 'y', zone: 'descender', label: 'Kuyruklu harf - aşağı iner' },
];

type Phase = 'learn' | 'sort' | 'place';

export default function SpatialAwarenessGame({ onComplete }: GameProps) {
  const [phase, setPhase] = useState<Phase>('learn');
  const [sortIdx, setSortIdx] = useState(0);
  const [correctSorts, setCorrectSorts] = useState(0);
  const [totalSorts, setTotalSorts] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; msg: string } | null>(null);
  const [placeIdx, setPlaceIdx] = useState(0);
  const [score, setScore] = useState(0);

  // Shuffle letters for sorting phase
  const [shuffledLetters] = useState(() => [...LETTER_DATA].sort(() => Math.random() - 0.5).slice(0, 8));

  const handleZoneSelect = useCallback((selectedZone: Zone) => {
    const letter = shuffledLetters[sortIdx];
    if (!letter) return;
    
    setTotalSorts(prev => prev + 1);
    if (selectedZone === letter.zone) {
      setCorrectSorts(prev => prev + 1);
      setFeedback({ type: 'correct', msg: `Doğru! "${letter.letter}" ${letter.label}` });
      playSound('correct');
    } else {
      setFeedback({ type: 'wrong', msg: `"${letter.letter}" harfi ${ZONE_LABELS[letter.zone]} bölgesine ait.` });
      playSound('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (sortIdx < shuffledLetters.length - 1) {
        setSortIdx(prev => prev + 1);
      } else {
        // Phase complete
        const phaseScore = Math.round((correctSorts / shuffledLetters.length) * 100);
        setScore(phaseScore);
        setTimeout(() => onComplete(phaseScore), 500);
      }
    }, 1500);
  }, [sortIdx, shuffledLetters, correctSorts, onComplete]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Phase tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {(['learn', 'sort'] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => { if (p === 'sort' && phase === 'learn') setPhase('sort'); }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              phase === p ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {p === 'learn' ? '📏 Öğren' : '🎯 Sınıfla'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'learn' && (
          <motion.div
            key="learn"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-6"
          >
            <h3 className="text-lg font-bold text-emerald-800 mb-4 text-center">📏 Üç Çizgi Sistemi</h3>

            {/* Three-line visual */}
            <div className="relative bg-gray-50 rounded-xl p-4 mb-6">
              {/* Lines */}
              <div className="space-y-8 relative">
                {/* Sky line */}
                <div className="flex items-center gap-3">
                  <div className="w-24 text-xs text-blue-600 font-bold text-right">Üst Çizgi</div>
                  <div className="flex-1 border-t-2 border-blue-400 border-dashed relative">
                    <span className="absolute -top-3 left-4 text-lg text-blue-600 font-bold">b d h k l</span>
                  </div>
                </div>
                {/* Mid line */}
                <div className="flex items-center gap-3">
                  <div className="w-24 text-xs text-green-600 font-bold text-right">Orta Çizgi</div>
                  <div className="flex-1 border-t-2 border-green-400 border-dashed relative">
                    <span className="absolute -top-3 left-4 text-lg text-green-600 font-bold">a c e m n o</span>
                  </div>
                </div>
                {/* Base line */}
                <div className="flex items-center gap-3">
                  <div className="w-24 text-xs text-yellow-600 font-bold text-right">Taban Çizgisi</div>
                  <div className="flex-1 border-t-2 border-yellow-500 relative" />
                </div>
                {/* Descender */}
                <div className="flex items-center gap-3">
                  <div className="w-24 text-xs text-red-600 font-bold text-right">Kuyruk</div>
                  <div className="flex-1 border-t-2 border-red-400 border-dashed relative">
                    <span className="absolute -top-3 left-4 text-lg text-red-600 font-bold">g p y j q</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="bg-blue-50 p-2 rounded-lg text-center">
                <ArrowUp className="w-4 h-4 text-blue-500 mx-auto" />
                <span className="text-xs text-blue-700 font-bold">Uzun</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-center">
                <span className="text-green-500 text-lg">—</span>
                <span className="text-xs text-green-700 font-bold block">Kısa</span>
              </div>
              <div className="bg-red-50 p-2 rounded-lg text-center">
                <ArrowDown className="w-4 h-4 text-red-500 mx-auto" />
                <span className="text-xs text-red-700 font-bold">Kuyruklu</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPhase('sort')}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-5 h-5" /> Şimdi Sınıfla!
            </motion.button>
          </motion.div>
        )}

        {phase === 'sort' && (
          <motion.div
            key="sort"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-6"
          >
            <div className="text-center mb-6">
              <span className="text-sm text-gray-500">{sortIdx + 1} / {shuffledLetters.length}</span>
              <motion.div
                key={sortIdx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-7xl font-bold text-emerald-800 my-4"
              >
                {shuffledLetters[sortIdx]?.letter}
              </motion.div>
              <p className="text-gray-600">Bu harf hangi bölgeye ait?</p>
            </div>

            {/* Zone buttons */}
            <div className="space-y-3">
              {(['sky', 'mid', 'descender'] as Zone[]).map((zone) => (
                <motion.button
                  key={zone}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleZoneSelect(zone)}
                  disabled={!!feedback}
                  className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: ZONE_COLORS[zone] }}
                >
                  {zone === 'sky' && <ArrowUp className="w-5 h-5" />}
                  {zone === 'descender' && <ArrowDown className="w-5 h-5" />}
                  {ZONE_LABELS[zone]}
                </motion.button>
              ))}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-xl text-center font-bold ${
                    feedback.type === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {feedback.type === 'correct' ? '✅ ' : '❌ '}{feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
