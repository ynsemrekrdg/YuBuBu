import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RotateCcw, ChevronRight } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import type { GameProps } from '../../types';

interface MazeCell { x: number; y: number; walls: boolean[] /* top, right, bottom, left */ }
interface DotPoint { x: number; y: number; label: number }

// Simple maze data (5x5 grid)
const MAZE_PATH = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 },
  { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 },
];

// Dot-to-dot: simple star shape
const DOT_POINTS: DotPoint[] = [
  { x: 150, y: 30, label: 1 },
  { x: 190, y: 110, label: 2 },
  { x: 280, y: 110, label: 3 },
  { x: 210, y: 170, label: 4 },
  { x: 230, y: 260, label: 5 },
  { x: 150, y: 210, label: 6 },
  { x: 70, y: 260, label: 7 },
  { x: 90, y: 170, label: 8 },
  { x: 20, y: 110, label: 9 },
  { x: 110, y: 110, label: 10 },
];

type MiniGame = 'maze' | 'dotConnect' | 'targetTrace';

const MINI_GAMES: { type: MiniGame; title: string; instructions: string; icon: string }[] = [
  { type: 'maze', title: 'Labirent', instructions: 'Yeşil noktadan kırmızı noktaya yol bul!', icon: '🏰' },
  { type: 'dotConnect', title: 'Nokta Birleştir', instructions: 'Numaralı noktaları sırayla birleştir!', icon: '⭐' },
  { type: 'targetTrace', title: 'Hedef Takibi', instructions: 'Hareketli hedefi parmağınla takip et!', icon: '🎯' },
];

export default function EyeHandCoordinationGame({ onComplete }: GameProps) {
  const [gameIdx, setGameIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [dotIdx, setDotIdx] = useState(0);
  const [connectedDots, setConnectedDots] = useState<number[]>([]);
  const [mazeVisited, setMazeVisited] = useState<number[]>([0]);
  const [targetHits, setTargetHits] = useState(0);

  const miniGame = MINI_GAMES[gameIdx];

  const handleMiniGameComplete = useCallback((miniScore: number) => {
    playSound('correct');
    const newScore = score + Math.round(miniScore / MINI_GAMES.length);
    setScore(newScore);

    if (gameIdx < MINI_GAMES.length - 1) {
      setTimeout(() => {
        setGameIdx(prev => prev + 1);
        setDotIdx(0);
        setConnectedDots([]);
        setMazeVisited([0]);
        setTargetHits(0);
      }, 800);
    } else {
      setTimeout(() => onComplete(Math.min(100, newScore)), 500);
    }
  }, [gameIdx, score, onComplete]);

  const handleMazeCellClick = (cellIdx: number) => {
    const lastVisited = mazeVisited[mazeVisited.length - 1];
    const pathIdx = MAZE_PATH.findIndex(p => p.x * 5 + p.y === cellIdx);
    const lastPathIdx = MAZE_PATH.findIndex(p => p.x * 5 + p.y === (MAZE_PATH[lastVisited]?.x ?? 0) * 5 + (MAZE_PATH[lastVisited]?.y ?? 0));

    // Simple adjacency check
    if (pathIdx >= 0 && Math.abs(pathIdx - mazeVisited.length) <= 1 && !mazeVisited.includes(pathIdx)) {
      setMazeVisited(prev => [...prev, pathIdx]);
      playSound('click');
      if (pathIdx === MAZE_PATH.length - 1) {
        handleMiniGameComplete(90);
      }
    }
  };

  const handleDotClick = (label: number) => {
    if (label === dotIdx + 1) {
      setDotIdx(label);
      setConnectedDots(prev => [...prev, label]);
      playSound('click');
      if (label === DOT_POINTS.length) {
        handleMiniGameComplete(95);
      }
    }
  };

  const handleTargetClick = () => {
    const newHits = targetHits + 1;
    setTargetHits(newHits);
    playSound('click');
    if (newHits >= 8) {
      handleMiniGameComplete(85);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex justify-center gap-3 mb-4">
        {MINI_GAMES.map((g, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              i < gameIdx ? 'bg-green-100 text-green-700' : i === gameIdx ? 'bg-emerald-200 text-emerald-800 font-bold' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <span>{g.icon}</span>
            <span className="hidden sm:inline">{g.title}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={gameIdx}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 overflow-hidden"
        >
          <div className="p-4 bg-emerald-50 border-b border-emerald-100">
            <h3 className="font-bold text-emerald-800 text-lg">{miniGame.icon} {miniGame.title}</h3>
            <p className="text-emerald-600 text-sm">{miniGame.instructions}</p>
          </div>

          <div className="p-4">
            {miniGame.type === 'maze' && (
              <div className="grid grid-cols-5 gap-1 max-w-[280px] mx-auto">
                {Array.from({ length: 25 }, (_, i) => {
                  const row = Math.floor(i / 5);
                  const col = i % 5;
                  const pathIdx = MAZE_PATH.findIndex(p => p.x === col && p.y === row);
                  const isPath = pathIdx >= 0;
                  const isVisited = mazeVisited.includes(pathIdx);
                  const isStart = col === 0 && row === 0;
                  const isEnd = col === 4 && row === 4;

                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMazeCellClick(i)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                        isStart ? 'bg-green-400 text-white' :
                        isEnd ? 'bg-red-400 text-white' :
                        isVisited ? 'bg-emerald-300 text-white' :
                        isPath ? 'bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100' :
                        'bg-gray-200'
                      }`}
                      disabled={!isPath}
                    >
                      {isStart ? '🟢' : isEnd ? '🔴' : isVisited ? '✓' : isPath ? '·' : ''}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {miniGame.type === 'dotConnect' && (
              <svg viewBox="0 0 300 300" className="w-full max-w-[280px] mx-auto aspect-square">
                {/* Connected lines */}
                {connectedDots.length > 1 && connectedDots.slice(0, -1).map((d, i) => {
                  const from = DOT_POINTS[d - 1];
                  const to = DOT_POINTS[connectedDots[i + 1] - 1];
                  return from && to ? (
                    <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#10B981" strokeWidth={3} />
                  ) : null;
                })}
                {/* Close shape if complete */}
                {connectedDots.length === DOT_POINTS.length && (
                  <line x1={DOT_POINTS[DOT_POINTS.length - 1].x} y1={DOT_POINTS[DOT_POINTS.length - 1].y} x2={DOT_POINTS[0].x} y2={DOT_POINTS[0].y} stroke="#10B981" strokeWidth={3} />
                )}
                {/* Dots */}
                {DOT_POINTS.map((pt) => (
                  <g key={pt.label} onClick={() => handleDotClick(pt.label)} className="cursor-pointer">
                    <circle
                      cx={pt.x} cy={pt.y} r={connectedDots.includes(pt.label) ? 12 : 15}
                      fill={connectedDots.includes(pt.label) ? '#10B981' : pt.label === dotIdx + 1 ? '#F59E0B' : '#E5E7EB'}
                      stroke={pt.label === dotIdx + 1 ? '#F59E0B' : '#9CA3AF'}
                      strokeWidth={pt.label === dotIdx + 1 ? 3 : 1}
                    />
                    <text x={pt.x} y={pt.y + 5} textAnchor="middle" fontSize={12} fontWeight="bold"
                      fill={connectedDots.includes(pt.label) ? 'white' : '#374151'}
                    >
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            )}

            {miniGame.type === 'targetTrace' && (
              <div className="relative w-full h-64 bg-gray-50 rounded-xl overflow-hidden">
                <motion.button
                  animate={{
                    x: [0, 120, 60, 200, 40, 160, 0],
                    y: [0, 80, 160, 40, 120, 180, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={handleTargetClick}
                  className="absolute w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Target className="w-8 h-8 text-white" />
                </motion.button>
                <div className="absolute bottom-3 left-3 text-sm text-gray-500">
                  Tıklama: <span className="font-bold text-emerald-600">{targetHits}</span> / 8
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="text-center mt-4 text-sm text-gray-500">
        Puan: <span className="font-bold text-emerald-600">{score}</span>
      </div>
    </div>
  );
}
