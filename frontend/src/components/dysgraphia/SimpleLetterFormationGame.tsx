import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Eye, RotateCcw, ArrowRight } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface LetterData {
  letter: string;
  strokes: StrokeGuide[];
  difficulty: number;
}

interface StrokeGuide {
  path: string;
  direction: string;
  label: string;
}

const SIMPLE_LETTERS: LetterData[] = [
  {
    letter: 'I',
    strokes: [{ path: 'M 150 40 L 150 260', direction: 'top_down', label: 'Yukarıdan aşağı' }],
    difficulty: 1,
  },
  {
    letter: 'L',
    strokes: [
      { path: 'M 80 40 L 80 260', direction: 'top_down', label: 'Yukarıdan aşağı' },
      { path: 'M 80 260 L 220 260', direction: 'left_right', label: 'Soldan sağa' },
    ],
    difficulty: 1,
  },
  {
    letter: 'T',
    strokes: [
      { path: 'M 60 40 L 240 40', direction: 'left_right', label: 'Soldan sağa (üst)' },
      { path: 'M 150 40 L 150 260', direction: 'top_down', label: 'Yukarıdan aşağı' },
    ],
    difficulty: 1,
  },
  {
    letter: 'E',
    strokes: [
      { path: 'M 80 40 L 80 260', direction: 'top_down', label: 'Yukarıdan aşağı' },
      { path: 'M 80 40 L 220 40', direction: 'left_right', label: 'Üst çizgi' },
      { path: 'M 80 150 L 200 150', direction: 'left_right', label: 'Orta çizgi' },
      { path: 'M 80 260 L 220 260', direction: 'left_right', label: 'Alt çizgi' },
    ],
    difficulty: 2,
  },
  {
    letter: 'F',
    strokes: [
      { path: 'M 80 40 L 80 260', direction: 'top_down', label: 'Yukarıdan aşağı' },
      { path: 'M 80 40 L 220 40', direction: 'left_right', label: 'Üst çizgi' },
      { path: 'M 80 150 L 200 150', direction: 'left_right', label: 'Orta çizgi' },
    ],
    difficulty: 2,
  },
  {
    letter: 'H',
    strokes: [
      { path: 'M 80 40 L 80 260', direction: 'top_down', label: 'Sol dikey' },
      { path: 'M 220 40 L 220 260', direction: 'top_down', label: 'Sağ dikey' },
      { path: 'M 80 150 L 220 150', direction: 'left_right', label: 'Orta yatay' },
    ],
    difficulty: 2,
  },
];

type Phase = 'watch' | 'trace' | 'write';

export default function SimpleLetterFormationGame({ onComplete }: GameProps) {
  const [letterIdx, setLetterIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('watch');
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [userPaths, setUserPaths] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<SVGSVGElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const letter = SIMPLE_LETTERS[letterIdx];
  const totalLetters = SIMPLE_LETTERS.length;

  // Auto-animate strokes in watch phase
  useEffect(() => {
    if (phase === 'watch') {
      setAnimating(true);
      setStrokeIdx(0);
      const interval = setInterval(() => {
        setStrokeIdx(prev => {
          if (prev >= letter.strokes.length - 1) {
            clearInterval(interval);
            setTimeout(() => setAnimating(false), 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [phase, letterIdx, letter.strokes.length]);

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

  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (phase === 'watch') return;
    setIsDrawing(true);
    const pt = getPoint(e);
    if (pt) {
      pointsRef.current = [pt];
      setUserPaths(prev => [...prev, `M ${pt.x} ${pt.y}`]);
    }
  };

  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || phase === 'watch') return;
    const pt = getPoint(e);
    if (pt) {
      pointsRef.current.push(pt);
      setUserPaths(prev => {
        const copy = [...prev];
        copy[copy.length - 1] += ` L ${pt.x} ${pt.y}`;
        return copy;
      });
    }
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  const handleNextPhaseOrLetter = useCallback(() => {
    if (phase === 'watch') {
      setPhase('trace');
      setUserPaths([]);
      setStrokeIdx(letter.strokes.length - 1);
    } else if (phase === 'trace') {
      setPhase('write');
      setUserPaths([]);
    } else {
      // Score and move to next letter
      const letterScore = userPaths.length > 0 ? Math.round(85 / totalLetters) : Math.round(50 / totalLetters);
      setScore(prev => prev + letterScore);
      playSound('correct');

      if (letterIdx < totalLetters - 1) {
        setTimeout(() => {
          setLetterIdx(prev => prev + 1);
          setPhase('watch');
          setUserPaths([]);
          setStrokeIdx(0);
        }, 500);
      } else {
        setTimeout(() => onComplete(Math.min(100, score + letterScore)), 500);
      }
    }
  }, [phase, letterIdx, totalLetters, score, onComplete, letter.strokes.length, userPaths.length]);

  const phaseLabel = phase === 'watch' ? '👀 İzle' : phase === 'trace' ? '✏️ İzle ve Çiz' : '📝 Kendin Yaz';

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {SIMPLE_LETTERS.map((l, i) => (
            <div key={i} className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
              i < letterIdx ? 'bg-blue-500 text-white' : i === letterIdx ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-400'
            }`}>
              {l.letter}
            </div>
          ))}
        </div>
        <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{phaseLabel}</span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-800 text-2xl">{letter.letter} Harfi</h3>
            <p className="text-blue-600 text-sm">
              {phase === 'watch' ? 'Yazılışını izle' : phase === 'trace' ? 'Rehber üzerinde çiz' : 'Kendi başına yaz!'}
            </p>
          </div>
          {phase !== 'watch' && (
            <button onClick={() => { setUserPaths([]); pointsRef.current = []; }} className="p-2 bg-white rounded-lg shadow-sm hover:bg-blue-50">
              <RotateCcw className="w-4 h-4 text-blue-600" />
            </button>
          )}
        </div>

        {/* Canvas */}
        <svg
          ref={canvasRef}
          viewBox="0 0 300 300"
          className="w-full aspect-square touch-none cursor-crosshair"
          style={{ background: 'linear-gradient(to bottom, #DBEAFE 0%, #EFF6FF 50%, #DBEAFE 100%)' }}
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onMouseLeave={handleDrawEnd}
          onTouchStart={handleDrawStart}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleDrawEnd}
        >
          {/* Three-line guides */}
          <line x1="0" y1="40" x2="300" y2="40" stroke="#93C5FD" strokeWidth={1} strokeDasharray="4 2" />
          <line x1="0" y1="150" x2="300" y2="150" stroke="#93C5FD" strokeWidth={1} strokeDasharray="4 2" />
          <line x1="0" y1="260" x2="300" y2="260" stroke="#3B82F6" strokeWidth={2} />

          {/* Guide strokes */}
          {(phase === 'watch' || phase === 'trace') && letter.strokes.map((stroke, i) => (
            <g key={i}>
              <path
                d={stroke.path}
                fill="none"
                stroke={i <= strokeIdx ? '#3B82F6' : '#CBD5E1'}
                strokeWidth={phase === 'trace' ? 2 : 4}
                strokeDasharray={phase === 'trace' ? '6 3' : '0'}
                strokeLinecap="round"
                opacity={i <= strokeIdx ? (phase === 'watch' ? 0.8 : 0.4) : 0.15}
              >
                {phase === 'watch' && i === strokeIdx && (
                  <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.8s" fill="freeze" />
                )}
              </path>
              {/* Stroke number */}
              {i <= strokeIdx && (
                <text x={parseInt(stroke.path.split(' ')[1]) + 10} y={parseInt(stroke.path.split(' ')[2]) - 5}
                  fontSize={14} fill="#3B82F6" fontWeight="bold"
                >
                  {i + 1}
                </text>
              )}
            </g>
          ))}

          {/* User drawn paths */}
          {userPaths.map((p, i) => (
            <path key={i} d={p} fill="none" stroke="#1D4ED8" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>

        {/* Stroke labels */}
        {phase === 'watch' && (
          <div className="p-3 bg-blue-50 border-t">
            <div className="text-sm text-blue-700">
              <span className="font-bold">Adım {strokeIdx + 1}:</span> {letter.strokes[strokeIdx]?.label}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="p-4 border-t">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNextPhaseOrLetter}
            disabled={phase === 'watch' && animating}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {phase === 'watch' ? (
              <><ArrowRight className="w-5 h-5" /> Şimdi Çizmeye Başla</>
            ) : phase === 'trace' ? (
              <><ArrowRight className="w-5 h-5" /> Kendin Yaz</>
            ) : (
              <><ChevronRight className="w-5 h-5" /> {letterIdx < totalLetters - 1 ? 'Sonraki Harf' : 'Tamamla!'}</>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
