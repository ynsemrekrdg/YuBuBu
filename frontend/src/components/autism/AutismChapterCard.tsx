import { motion } from 'framer-motion';
import { Play, Star, CheckSquare } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import type { Chapter, ProgressRecord } from '../../types';

interface AutismChapterCardProps {
  chapter: Chapter;
  progress?: ProgressRecord;
  onPlay: () => void;
  index: number;
}

export default function AutismChapterCard({ chapter, progress, onPlay, index }: AutismChapterCardProps) {
  const score = progress?.score || 0;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const isCompleted = progress?.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-autism-card border-2 border-autism-primary/30 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow"
    >
      {/* Predictable, structured layout */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-autism-primary rounded-lg flex items-center justify-center text-white font-bold">
          {chapter.chapter_number}
        </div>
        <div className="flex-1">
          <h3 className="font-calm text-base font-bold text-autism-text">{chapter.title}</h3>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
              <CheckSquare className="w-3 h-3" /> Tamamlandı
            </span>
          )}
        </div>
      </div>

      {/* Description with icon */}
      <p className="font-calm text-sm text-gray-600 mb-3">{chapter.description}</p>

      {/* Progress bar - always visible */}
      <ProgressBar value={score} difficulty="autism" size="sm" showLabel className="mb-3" />

      {/* Stars */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-5 h-5 ${s <= stars ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlay}
          className="flex items-center gap-2 px-4 py-2 bg-autism-primary text-white rounded-lg text-sm font-bold hover:bg-teal-700"
          aria-label={`${chapter.title} bölümünü başlat`}
        >
          <Play className="w-4 h-4" />
          {isCompleted ? 'Tekrar Oyna' : 'Başla'}
        </motion.button>
      </div>
    </motion.div>
  );
}
