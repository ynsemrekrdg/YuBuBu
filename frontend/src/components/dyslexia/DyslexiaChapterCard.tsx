import { motion } from 'framer-motion';
import { BookOpen, Star, Play, Volume2 } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import { speak } from '../../utils/accessibility';
import type { Chapter, ProgressRecord } from '../../types';

interface DyslexiaChapterCardProps {
  chapter: Chapter;
  progress?: ProgressRecord;
  onPlay: () => void;
  index: number;
}

export default function DyslexiaChapterCard({ chapter, progress, onPlay, index }: DyslexiaChapterCardProps) {
  const score = progress?.score || 0;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const isCompleted = progress?.completed;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring' }}
      className="chapter-card p-5 bg-[#FFF8E1] border-2 border-[#FF6B35] rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-dyslexia-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {chapter.chapter_number}
            </div>
            <h3 className="font-dyslexic text-lg font-bold text-dyslexia-text leading-relaxed">
              {chapter.title}
            </h3>
            <button
              onClick={(e) => { e.stopPropagation(); speak(chapter.title); }}
              className="p-1 text-dyslexia-primary hover:bg-orange-100 rounded-full"
              aria-label={`${chapter.title} başlığını sesli oku`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="font-dyslexic text-sm text-gray-600 mb-3 leading-relaxed">
            {chapter.description}
          </p>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${s <= stars ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
            {isCompleted && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                ✓ Tamamlandı
              </span>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <ProgressBar value={score} difficulty="dyslexia" size="sm" />
          )}
        </div>

        {/* Play Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onPlay}
          className="shrink-0 w-14 h-14 bg-dyslexia-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors"
          aria-label={`${chapter.title} bölümünü başlat`}
        >
          {isCompleted ? <BookOpen className="w-6 h-6" /> : <Play className="w-7 h-7 ml-0.5" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
