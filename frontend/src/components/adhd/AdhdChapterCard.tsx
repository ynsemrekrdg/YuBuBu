import { motion } from 'framer-motion';
import { Play, Star, Zap, Trophy } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import type { Chapter, ProgressRecord } from '../../types';

interface AdhdChapterCardProps {
  chapter: Chapter;
  progress?: ProgressRecord;
  onPlay: () => void;
  index: number;
}

export default function AdhdChapterCard({ chapter, progress, onPlay, index }: AdhdChapterCardProps) {
  const score = progress?.score || 0;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  const isCompleted = progress?.completed;

  const cardColors = [
    'border-adhd-primary bg-gradient-to-br from-orange-50 to-amber-50',
    'border-adhd-secondary bg-gradient-to-br from-green-50 to-emerald-50',
    'border-adhd-accent bg-gradient-to-br from-blue-50 to-indigo-50',
    'border-purple-500 bg-gradient-to-br from-purple-50 to-fuchsia-50',
    'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`rounded-2xl border-2 p-4 shadow-lg cursor-pointer ${cardColors[index % cardColors.length]}`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPlay()}
      aria-label={`${chapter.title} bölümünü oyna`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: index * 0.3 }}
            className="text-2xl"
          >
            {index % 4 === 0 ? '⚡' : index % 4 === 1 ? '🎮' : index % 4 === 2 ? '🎯' : '🏆'}
          </motion.div>
          <span className="bg-white/80 px-2 py-0.5 rounded-full text-xs font-bold text-gray-600">
            #{chapter.chapter_number}
          </span>
        </div>
        {isCompleted && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
            <Trophy className="w-3 h-3 text-green-600" />
            <span className="text-xs font-bold text-green-600">Tamam!</span>
          </motion.div>
        )}
      </div>

      <h3 className="font-fun text-lg font-bold text-adhd-text mb-1 leading-tight">{chapter.title}</h3>
      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{chapter.description}</p>

      {/* Progress + Stars */}
      <ProgressBar value={score} difficulty="adhd" size="sm" className="mb-2" />
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {[1, 2, 3].map((s) => (
            <Star key={s} className={`w-4 h-4 ${s <= stars ? 'text-yellow-500 fill-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
        <motion.div
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.8 }}
          className="w-10 h-10 bg-adhd-primary rounded-xl flex items-center justify-center text-white shadow-md"
        >
          <Play className="w-5 h-5 ml-0.5" />
        </motion.div>
      </div>
    </motion.div>
  );
}
