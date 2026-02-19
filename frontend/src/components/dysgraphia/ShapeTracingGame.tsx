import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronRight, Eye } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface Shape {
  type: string;
  label: string;
  difficulty: number;
  path: string; // SVG path
}

const SHAPES: Shape[] = [
  { type: 'horizontal_line', label: 'Düz Çizgi', difficulty: 1, path: 'M 30 100 L 270 100' },
  { type: 'vertical_line', label: 'Dikey Çizgi', difficulty: 1, path: 'M 150 30 L 150 270' },
  { type: 'circle', label: 'Daire', difficulty: 2, path: 'M 150 50 A 100 100 0 1 1 149.99 50' },
  { type: 'square', label: 'Kare', difficulty: 2, path: 'M 60 60 L 240 60 L 240 240 L 60 240 Z' },
  { type: 'triangle', label: 'Üçgen', difficulty: 3, path: 'M 150 40 L 260 240 L 40 240 Z' },
  { type: 'zigzag', label: 'Zikzak', difficulty: 3, path: 'M 30 200 L 90 60 L 150 200 L 210 60 L 270 200' },
  { type: 'wave', label: 'Dalgalı Çizgi', difficulty: 4, path: 'M 30 150 Q 90 50 150 150 Q 210 250 270 150' },
  { type: 'spiral', label: 'Spiral', difficulty: 4, path: 'M 150 150 Q 150 120 170 120 Q 200 120 200 150 Q 200 190 160 190 Q 110 190 110 150 Q 110 100 160 100 Q 220 100 220 160' },
];

export default function ShapeTracingGame({ onComplete }: GameProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPath, setDrawnPath] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [completedShapes, setCompletedShapes] = useState<number>(0);
  const canvasRef = useRef<SVGSVGElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const shape = SHAPES[currentIdx];
  const totalShapes = SHAPES.length;

  // Auto-hide guide after 2s
  useEffect(() => {
    setShowGuide(true);
    const t = setTimeout(() => setShowGuide(false), 2500);
    return () => clearTimeout(t);
  }, [currentIdx]);

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
    setIsDrawing(true);
    const pt = getPoint(e);
    if (pt) {
      pointsRef.current = [pt];
      setDrawnPath([`M ${pt.x} ${pt.y}`]);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pt = getPoint(e);
    if (pt) {
      pointsRef.current.push(pt);
      setDrawnPath(prev => [...prev, `L ${pt.x} ${pt.y}`]);
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Score based on number of points drawn (rough accuracy proxy)
    const points = pointsRef.current.length;
    const shapeScore = points > 30 ? 100 : points > 15 ? 80 : points > 5 ? 60 : 30;
    const weightedScore = Math.round(shapeScore / totalShapes);
    setScore(prev => prev + weightedScore);
    setCompletedShapes(prev => prev + 1);
    playSound('correct');

    if (currentIdx < totalShapes - 1) {
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
        setDrawnPath([]);
        pointsRef.current = [];
      }, 800);
    } else {
      const finalScore = Math.min(100, score + weightedScore);
      setTimeout(() => onComplete(finalScore), 500);
    }
  };

  const handleReset = () => {
    setDrawnPath([]);
    pointsRef.current = [];
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {completedShapes + 1} / {totalShapes}
        </span>
        <div className="flex gap-1">
          {SHAPES.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < completedShapes ? 'bg-green-500' : i === completedShapes ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 overflow-hidden"
        >
          {/* Title */}
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-emerald-800 text-lg">{shape.label}</h3>
              <p className="text-emerald-600 text-sm">Parmağınla şekli çiz!</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowGuide(true)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-emerald-50">
                <Eye className="w-4 h-4 text-emerald-600" />
              </button>
              <button onClick={handleReset} className="p-2 bg-white rounded-lg shadow-sm hover:bg-emerald-50">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative">
            <svg
              ref={canvasRef}
              viewBox="0 0 300 300"
              className="w-full aspect-square bg-[repeating-linear-gradient(0deg,transparent,transparent_29px,#e5e7eb_29px,#e5e7eb_30px),repeating-linear-gradient(90deg,transparent,transparent_29px,#e5e7eb_29px,#e5e7eb_30px)] cursor-crosshair touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            >
              {/* Guide path */}
              <path
                d={shape.path}
                fill="none"
                stroke={showGuide ? '#10B981' : '#D1FAE5'}
                strokeWidth={showGuide ? 3 : 2}
                strokeDasharray={showGuide ? '0' : '8 4'}
                strokeLinecap="round"
                opacity={showGuide ? 0.8 : 0.4}
              />

              {/* Direction arrows for guide */}
              {showGuide && (
                <circle cx="30" cy={shape.type.includes('line') ? '100' : '50'} r="6" fill="#10B981">
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                </circle>
              )}

              {/* User drawn path */}
              {drawnPath.length > 0 && (
                <path
                  d={drawnPath.join(' ')}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>

          {/* Next button (shown after drawing) */}
          {drawnPath.length > 10 && (
            <div className="p-4 border-t">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnd}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <ChevronRight className="w-5 h-5" />
                {currentIdx < totalShapes - 1 ? 'Sonraki Şekil' : 'Tamamla!'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
