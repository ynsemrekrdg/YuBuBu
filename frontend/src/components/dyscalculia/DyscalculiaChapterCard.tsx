import { motion } from 'framer-motion';
import { Play, Star, Calculator } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import type { Chapter, ProgressRecord } from '../../types';

interface DyscalculiaChapterCardProps {
  chapter: Chapter;
  progress?: ProgressRecord;
  onPlay: () => void;
  index: number;
}

export default function DyscalculiaChapterCard({ chapter, progress, onPlay, index }: DyscalculiaChapterCardProps) {
  const score = progress?.score || 0;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const isCompleted = progress?.completed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.12 }}
      className="bg-dyscalculia-card border-2 border-dyscalculia-primary/30 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all hover:border-dyscalculia-primary"
    >
      <div className="flex items-start gap-4">
        {/* Number badge */}
        <div className="w-12 h-12 bg-gradient-to-br from-dyscalculia-primary to-dyscalculia-secondary rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
          {chapter.chapter_number}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dyscalculia-text text-base mb-1">{chapter.title}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{chapter.description}</p>

          <ProgressBar value={score} difficulty="dyscalculia" size="sm" className="mb-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= stars ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
              {isCompleted && (
                <span className="ml-2 text-xs text-green-600 font-bold flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Tamam
                </span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dyscalculia-primary text-white rounded-lg text-sm font-bold hover:bg-violet-700"
            >
              <Play className="w-4 h-4" />
              {isCompleted ? 'Tekrar' : 'Başla'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
