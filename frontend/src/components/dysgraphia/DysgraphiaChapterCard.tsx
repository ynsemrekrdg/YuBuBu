import { motion } from 'framer-motion';
import { Play, Star, CheckSquare } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import type { Chapter, ProgressRecord } from '../../types';

const SECTION_EMOJI: Record<string, string> = {
  pre_writing: '✋',
  letter_formation: '✏️',
  spelling: '📝',
  sentences: '💬',
  composition: '📖',
};

interface DysgraphiaChapterCardProps {
  chapter: Chapter;
  progress?: ProgressRecord;
  onPlay: () => void;
  index: number;
}

export default function DysgraphiaChapterCard({ chapter, progress, onPlay, index }: DysgraphiaChapterCardProps) {
  const score = progress?.score || 0;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const isCompleted = progress?.completed;

  const config = chapter.content_config as Record<string, any> | undefined;
  const sectionColor: string = config?.section_color ?? '#10B981';
  const sectionTitle: string = config?.section_title ?? '';
  const section: string = config?.section ?? 'pre_writing';
  const emoji = SECTION_EMOJI[section] || '✏️';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-dysgraphia-card border-2 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow"
      style={{ borderColor: `${sectionColor}40` } as React.CSSProperties}
    >
      {/* Section badge */}
      {sectionTitle && (
        <div className="mb-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${sectionColor}15`, color: sectionColor } as React.CSSProperties}
          >
            {emoji} {sectionTitle}
          </span>
        </div>
      )}

      {/* Writing-themed layout */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: sectionColor } as React.CSSProperties}
        >
          {chapter.chapter_number}
        </div>
        <div className="flex-1">
          <h3 className="font-calm text-base font-bold text-dysgraphia-text">{chapter.title}</h3>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
              <CheckSquare className="w-3 h-3" /> Tamamlandı
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="font-calm text-sm text-gray-600 mb-3">{chapter.description}</p>

      {/* Writing line decoration */}
      <div className="mb-3 space-y-1">
        <div className="h-px w-full" style={{ backgroundColor: `${sectionColor}30` } as React.CSSProperties} />
        <div className="h-px w-full" style={{ backgroundColor: `${sectionColor}15` } as React.CSSProperties} />
        <div className="h-px w-full" style={{ backgroundColor: `${sectionColor}30` } as React.CSSProperties} />
      </div>

      {/* Progress bar */}
      <ProgressBar value={score} difficulty="dysgraphia" size="sm" showLabel className="mb-3" />

      {/* Stars & Play */}
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
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-bold"
          style={{ backgroundColor: sectionColor } as React.CSSProperties}
          aria-label={`${chapter.title} bölümünü başlat`}
        >
          <Play className="w-4 h-4" />
          {isCompleted ? 'Tekrar Oyna' : 'Başla'}
        </motion.button>
      </div>
    </motion.div>
  );
}
