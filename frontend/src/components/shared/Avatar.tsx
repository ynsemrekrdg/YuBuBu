import type { LearningDifficulty } from '../../types';

interface AvatarProps {
  name: string;
  difficulty?: LearningDifficulty;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const bgColors: Record<string, string> = {
  dyslexia: 'bg-dyslexia-primary',
  autism: 'bg-autism-primary',
  dyscalculia: 'bg-dyscalculia-primary',
  adhd: 'bg-adhd-primary',
  default: 'bg-yub-500',
};

const sizeMap: Record<string, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
  xl: 'w-20 h-20 text-3xl',
};

const emojis: Record<string, string> = {
  dyslexia: '📖',
  autism: '🧩',
  dyscalculia: '🔢',
  adhd: '⚡',
};

export default function Avatar({ name, difficulty, size = 'md', className = '' }: AvatarProps) {
  const bg = difficulty ? bgColors[difficulty] : bgColors.default;
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        ${bg} ${sizeMap[size]} 
        rounded-full flex items-center justify-center 
        text-white font-bold shadow-md
        ${className}
      `}
      aria-label={name}
      title={difficulty ? `${name} - ${emojis[difficulty]}` : name}
    >
      {difficulty && size !== 'sm' ? emojis[difficulty] : initials}
    </div>
  );
}
