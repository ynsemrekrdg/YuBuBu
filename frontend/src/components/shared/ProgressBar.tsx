import { motion } from 'framer-motion';
import type { LearningDifficulty } from '../../types';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  difficulty?: LearningDifficulty;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorMap: Record<string, string> = {
  dyslexia: 'bg-dyslexia-primary',
  dysgraphia: 'bg-dysgraphia-primary',
  dyscalculia: 'bg-dyscalculia-primary',
  default: 'bg-yub-500',
};

const sizeMap: Record<string, string> = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-5',
};

export default function ProgressBar({
  value,
  max = 100,
  difficulty,
  showLabel = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);
  const bgColor = difficulty ? colorMap[difficulty] : colorMap.default;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1 text-sm font-medium">
          <span>İlerleme</span>
          <span>{percent}%</span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeMap[size]}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`İlerleme: %${percent}`}
      >
        <motion.div
          className={`${bgColor} ${sizeMap[size]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
