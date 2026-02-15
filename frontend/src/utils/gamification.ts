/**
 * Calculate stars from a score (0-100) → 0-3 stars
 */
export function getStars(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

/**
 * Calculate XP needed for next level
 */
export function xpForLevel(level: number): number {
  return level * 500;
}

/**
 * Calculate current level from total score
 */
export function levelFromScore(totalScore: number): number {
  let level = 1;
  let remaining = totalScore;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return level;
}

/**
 * Get progress percentage toward next level
 */
export function levelProgress(totalScore: number): number {
  let remaining = totalScore;
  let level = 1;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  return Math.round((remaining / xpForLevel(level)) * 100);
}

/**
 * Format seconds as mm:ss
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get encouragement message based on score
 */
export function getEncouragement(score: number): string {
  if (score >= 90) return 'Muhteşem! Süpersin! 🌟';
  if (score >= 70) return 'Harika gidiyorsun! 🎉';
  if (score >= 50) return 'İyi iş çıkardın! 👍';
  return 'Tekrar dene, yapabilirsin! 💪';
}

/**
 * Map badge type to display emoji
 */
export function getBadgeEmoji(type: string): string {
  const map: Record<string, string> = {
    first_chapter: '🎯',
    speed_demon: '⚡',
    perfect_score: '💯',
    streak_3: '🔥',
    streak_7: '🏆',
    chapter_master: '👑',
    social_butterfly: '🦋',
  };
  return map[type] || '🏅';
}
