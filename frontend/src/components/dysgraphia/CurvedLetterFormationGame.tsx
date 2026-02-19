import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RotateCcw, Eye } from 'lucide-react';
import { playSound } from '../../utils/accessibility';
import AIHintButton from '../shared/AIHintButton';
import type { GameProps } from '../../types';

interface CurvedLetter {
  letter: string;
  path: string;
  guidePath: string;
  difficulty: number;
  hint: string;
}

const CURVED_LETTERS: CurvedLetter[] = [
  { letter: 'C', path: 'M 220 80 C 100 30 40 150 100 240 C 140 280 200 260 220 220', guidePath: 'M 220 80 C 100 30 40 150 100 240', difficulty: 1, hint: 'Saat yönünün tersine yarım daire' },
  { letter: 'O', path: 'M 150 60 C 60 60 40 150 60 200 C 80 260 200 280 240 200 C 260 150 240 60 150 60', guidePath: 'M 150 60 C 60 60 40 150 60 200 C 80 260 200 280 240 200 C 260 150 240 60 150 60', difficulty: 1, hint: 'Tam bir yuvarlak çiz' },
  { letter: 'S', path: 'M 200 80 C 160 40 80 50 80 100 C 80 150 200 150 200 200 C 200 260 100 270 80 230', guidePath: 'M 200 80 C 160 40 80 50 80 100 C 80 150 200 150 200 200 C 200 260 100 270 80 230', difficulty: 2, hint: 'Yılan gibi S şekli' },
  { letter: 'U', path: 'M 80 60 L 80 200 C 80 270 220 270 220 200 L 220 60', guidePath: 'M 80 60 L 80 200 C 80 270 220 270 220 200 L 220 60', difficulty: 2, hint: 'Aşağı in, kıvrıl, yukarı çık' },
  { letter: 'D', path: 'M 80 60 L 80 260 M 80 60 C 250 60 250 260 80 260', guidePath: 'M 80 60 L 80 260 M 80 60 C 250 60 250 260 80 260', difficulty: 3, hint: 'Dikey çizgi çek, sonra sağa yay çiz' },
  { letter: 'B', path: 'M 80 60 L 80 260 M 80 60 C 220 60 220 160 80 160 C 230 160 230 260 80 260', guidePath: 'M 80 60 L 80 260 M 80 60 C 220 60 220 160 80 160 C 230 160 230 260 80 260', difficulty: 3, hint: 'Dikey çizgi, iki göbek' },
  { letter: 'P', path: 'M 80 60 L 80 260 M 80 60 C 240 60 240 160 80 160', guidePath: 'M 80 60 L 80 260 M 80 60 C 240 60 240 160 80 160', difficulty: 3, hint: 'Dikey çizgi, üst göbek' },
  { letter: 'R', path: 'M 80 60 L 80 260 M 80 60 C 230 60 230 160 80 160 L 220 260', guidePath: 'M 80 60 L 80 260 M 80 60 C 230 60 230 160 80 160 L 220 260', difficulty: 3, hint: 'P gibi yap, sonra çapraz bacak ekle' },
];

type Phase = 'guide' | 'trace' | 'free';

export default function CurvedLetterFormationGame({ onComplete }: GameProps) {
  const [letterIdx, setLetterIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('guide');
  const [userPaths, setUserPaths] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<SVGSVGElement>(null);

  const letter = CURVED_LETTERS[letterIdx];

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
    if (phase === 'guide') return;
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
    if (phase === 'guide') {
      setPhase('trace');
      setUserPaths([]);
    } else if (phase === 'trace') {
      setPhase('free');
      setUserPaths([]);
    } else {
      const letterScore = Math.round(100 / CURVED_LETTERS.length);
      const newScore = score + letterScore;
      setScore(newScore);
      playSound('correct');

      if (letterIdx < CURVED_LETTERS.length - 1) {
        setTimeout(() => {
          setLetterIdx(prev => prev + 1);
          setPhase('guide');
          setUserPaths([]);
        }, 500);
      } else {
        setTimeout(() => onComplete(Math.min(100, newScore)), 500);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Letter progress */}
      <div className="flex gap-1 justify-center mb-4 flex-wrap">
        {CURVED_LETTERS.map((l, i) => (
          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            i < letterIdx ? 'bg-blue-500 text-white' : i === letterIdx ? 'bg-blue-200 text-blue-800 ring-2 ring-blue-400' : 'bg-gray-100 text-gray-400'
          }`}>
            {l.letter}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
        <div className="p-4 bg-blue-50 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-800 text-xl">✏️ {letter.letter} Harfi</h3>
            <p className="text-blue-600 text-sm">{letter.hint}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            phase === 'guide' ? 'bg-yellow-100 text-yellow-700' :
            phase === 'trace' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {phase === 'guide' ? '👀 İzle' : phase === 'trace' ? '✏️ İzle' : '📝 Yaz'}
          </span>
        </div>

        <svg
          ref={canvasRef}
          viewBox="0 0 300 300"
          className="w-full aspect-square touch-none cursor-crosshair"
          style={{ background: 'linear-gradient(to bottom, #DBEAFE 0%, #EFF6FF 50%, #DBEAFE 100%)' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {/* Three lines */}
          <line x1="0" y1="60" x2="300" y2="60" stroke="#93C5FD" strokeWidth={1} strokeDasharray="4 2" />
          <line x1="0" y1="160" x2="300" y2="160" stroke="#93C5FD" strokeWidth={1} strokeDasharray="4 2" />
          <line x1="0" y1="260" x2="300" y2="260" stroke="#3B82F6" strokeWidth={2} />

          {/* Guide path */}
          {(phase === 'guide' || phase === 'trace') && (
            <path
              d={letter.guidePath}
              fill="none"
              stroke={phase === 'guide' ? '#3B82F6' : '#93C5FD'}
              strokeWidth={phase === 'guide' ? 4 : 2}
              strokeDasharray={phase === 'trace' ? '6 3' : '0'}
              strokeLinecap="round"
              opacity={phase === 'guide' ? 0.8 : 0.4}
            />
          )}

          {/* Start point indicator */}
          {phase !== 'free' && (
            <circle cx={parseInt(letter.path.split(' ')[1])} cy={parseInt(letter.path.split(' ')[2])} r={8} fill="#3B82F6" opacity={0.6}>
              <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* User paths */}
          {userPaths.map((p, i) => (
            <path key={i} d={p} fill="none" stroke="#1D4ED8" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>

        <div className="p-4 border-t flex gap-2">
          {/* AI İpucu butonu */}
          <AIHintButton
            chapterId="curved-letter"
            activityType="letter_formation"
            problem={{ question: `${letter.letter} harfini yaz`, correct_answer: letter.letter }}
            studentAnswer={userPaths.length > 0 ? 'çizim yapıldı' : ''}
            attemptNumber={userPaths.length}
            chapterTitle="Eğri Çizgi Harfler"
            learningDifficulty="dysgraphia"
            errorType={phase === 'free' ? 'motor' : ''}
            autoHintDelay={8000}
            compact
            variant="blue"
          />
          {phase !== 'guide' && (
            <button
              onClick={() => setUserPaths([])}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-5 h-5" />
            {phase === 'guide' ? 'Çizmeye Başla' : phase === 'trace' ? 'Kendin Yaz' : letterIdx < CURVED_LETTERS.length - 1 ? 'Sonraki' : 'Tamamla!'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
