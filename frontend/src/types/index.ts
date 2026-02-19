/* ─── TypeScript Interfaces for YuBuBu ─── */

// ─── Enums ──────────────────────────────────────────────────

export type UserRole = 'student' | 'parent' | 'teacher' | 'admin';
export type LearningDifficulty = 'dyslexia' | 'dysgraphia' | 'dyscalculia';
export type DifficultyType = LearningDifficulty;
export type ActivityType = 'letter_matching' | 'word_building' | 'number_line' | 'counting' | 'pattern_matching' | 'sequence_ordering' | 'quick_match' | 'focus_timer' | 'reading' | 'visual_schedule';

// ─── Dysgraphia Section Types ───────────────────────────────

export type DysgraphiaSection = 'pre_writing' | 'letter_formation' | 'spelling' | 'sentences' | 'composition';

export interface DysgraphiaSectionMeta {
  key: DysgraphiaSection;
  title: string;
  color: string;
  emoji: string;
  chapterRange: [number, number]; // start, end chapter numbers
}

export const DYSGRAPHIA_SECTIONS: DysgraphiaSectionMeta[] = [
  { key: 'pre_writing', title: 'Ön-Yazma Becerileri', color: '#10B981', emoji: '✋', chapterRange: [1, 4] },
  { key: 'letter_formation', title: 'Harf Oluşturma', color: '#3B82F6', emoji: '✏️', chapterRange: [5, 8] },
  { key: 'spelling', title: 'Yazım Becerileri', color: '#8B5CF6', emoji: '🔤', chapterRange: [9, 12] },
  { key: 'sentences', title: 'Cümle Yazma', color: '#F59E0B', emoji: '📝', chapterRange: [13, 16] },
  { key: 'composition', title: 'Kompozisyon', color: '#EF4444', emoji: '📖', chapterRange: [17, 20] },
];

// ─── Dysgraphia AI Request/Response Types ───────────────────

export interface SentenceCheckRequest {
  sentence: string;
  student_age?: number;
  context?: string;
}

export interface SentenceCheckResponse {
  original: string;
  corrected: string;
  is_correct: boolean;
  errors: SentenceError[];
  encouragement: string;
  score: number;
}

export interface SentenceError {
  type: string;
  position: number;
  original: string;
  correction: string;
  explanation: string;
}

export interface SpellingHelpRequest {
  word: string;
  context?: string;
}

export interface SpellingHelpResponse {
  word: string;
  is_correct: boolean;
  correct_spelling: string;
  syllables: string[];
  memory_tip: string;
  similar_words: string[];
  practice_sentence: string;
}

export interface StoryIdeasRequest {
  theme?: string;
  student_age?: number;
  difficulty_level?: number;
}

export interface StoryIdeasResponse {
  ideas: StoryIdea[];
  writing_tips: string[];
}

export interface StoryIdea {
  title: string;
  starter: string;
  characters: string[];
  setting: string;
  conflict: string;
}

export interface CompositionFeedbackRequest {
  text: string;
  writing_type?: string;
  student_age?: number;
}

export interface CompositionFeedbackResponse {
  overall_score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  encouragement: string;
}

export interface WritingCoachRequest {
  current_text: string;
  writing_stage: string;
  help_type: string;
}

export interface WritingCoachResponse {
  advice: string;
  examples: string[];
  next_steps: string[];
  encouragement: string;
}

// ─── Auth ───────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  role: UserRole;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

// ─── Student ────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  user_id: string;
  age: number;
  learning_difficulty: LearningDifficulty;
  current_level: number;
  total_score: number;
  preferences: StudentPreferences;
  streak_days: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentPreferences {
  font_family?: string;
  font_size?: number;
  high_contrast?: boolean;
  audio_feedback?: boolean;
  animation_speed?: string;
  color_theme?: string;
}

export interface CreateStudentProfileRequest {
  age: number;
  learning_difficulty: LearningDifficulty;
  preferences?: StudentPreferences;
}

export interface UpdateStudentProfileRequest {
  age?: number;
  learning_difficulty?: LearningDifficulty;
  preferences?: StudentPreferences;
}

export interface StudentProgressSummary {
  total_chapters_completed: number;
  total_score: number;
  average_score: number;
  streak_days: number;
  current_level: number;
  badges_count: number;
}

// ─── Chapter ────────────────────────────────────────────────

export interface Chapter {
  id: string;
  difficulty_type: LearningDifficulty;
  chapter_number: number;
  title: string;
  description: string;
  content_config: ContentConfig;
  activity_type: string;
  min_score_to_pass: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface ContentConfig {
  font?: string;
  font_size?: number;
  background_color?: string;
  text_color?: string;
  line_spacing?: number;
  activity?: ActivityConfig;
  [key: string]: unknown;
}

export interface ActivityConfig {
  type: string;
  instructions: string;
  items?: ActivityItem[];
  letters?: ActivityItem[];
  pairs_count?: number;
  time_limit?: number;
  games?: string[];
  [key: string]: unknown;
}

export interface ActivityItem {
  letter?: string;
  word?: string;
  image?: string;
  match_id?: number;
  label?: string;
  icon?: string;
  order?: number;
  value?: number;
  [key: string]: unknown;
}

export interface ChapterListResponse {
  chapters: Chapter[];
  total: number;
}

// ─── Progress ───────────────────────────────────────────────

export interface ProgressRecord {
  id: string;
  student_id: string;
  chapter_id: string;
  completed: boolean;
  score: number;
  attempts: number;
  time_spent_seconds: number;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CompleteChapterRequest {
  student_id: string;
  chapter_id: string;
  score: number;
  time_spent_seconds: number;
}

export interface CompletionResult {
  progress: ProgressRecord;
  score_earned: number;
  speed_bonus: number;
  total_points: number;
  new_badges: Badge[];
  level_up: boolean;
  new_level: number;
  streak_days: number;
}

export interface ProgressListResponse {
  progress: ProgressRecord[];
  total: number;
}

export interface AnalyticsResponse {
  student_id: string;
  total_chapters_attempted: number;
  total_chapters_completed: number;
  completion_rate: number;
  average_score: number;
  best_score: number;
  total_time_spent_seconds: number;
  total_time_spent_minutes: number;
  total_attempts: number;
  score_earned: number;
  badges_earned: Badge[];
  level: number;
  streak_days: number;
}

// ─── AI ─────────────────────────────────────────────────────

export interface AIChatRequest {
  message: string;
  role_context?: string;
  chapter_id?: string;
}

export interface AIChatResponse {
  id: string;
  message: string;
  response: string;
  role_context: string;
  tokens_used: number;
  timestamp: string;
}

export interface AIHintRequest {
  student_id?: string;
  difficulty_level?: number;
}

export interface AIHintResponse {
  chapter_id: string;
  hint: string;
  hint_level: number;
  encouragement: string;
}

export interface AIAnalysisResponse {
  student_id: string;
  learning_difficulty: LearningDifficulty;
  analysis: string;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  encouragement_message: string;
}

// ─── Gamification ───────────────────────────────────────────

export interface Badge {
  id?: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earned_at?: string;
}

// ─── Game Props ─────────────────────────────────────────────

export interface GameProps {
  onComplete: (score: number, timeSpent?: number) => void;
  difficulty?: DifficultyType;
}

export interface FullGameProps {
  chapter: Chapter;
  studentProfile: StudentProfile;
  onComplete: (score: number, timeSpent?: number) => void;
  onRequestHint: () => Promise<AIHintResponse | null>;
}

// ─── Chat Message ───────────────────────────────────────────

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

// ─── Difficulty Theme ───────────────────────────────────────

export interface DifficultyTheme {
  bg: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  card: string;
  font: string;
  label: string;
  emoji: string;
}

export const DIFFICULTY_THEMES: Record<LearningDifficulty, DifficultyTheme> = {
  dyslexia: {
    bg: 'bg-dyslexia-bg',
    text: 'text-dyslexia-text',
    primary: 'bg-dyslexia-primary',
    secondary: 'bg-dyslexia-secondary',
    accent: 'bg-dyslexia-accent',
    card: 'bg-[#FFF8E1]',
    font: 'font-dyslexic',
    label: 'Disleksi',
    emoji: '📖',
  },
  dysgraphia: {
    bg: 'bg-dysgraphia-bg',
    text: 'text-dysgraphia-text',
    primary: 'bg-dysgraphia-primary',
    secondary: 'bg-dysgraphia-secondary',
    accent: 'bg-dysgraphia-accent',
    card: 'bg-dysgraphia-card',
    font: 'font-calm',
    label: 'Disgrafi',
    emoji: '✍️',
  },
  dyscalculia: {
    bg: 'bg-dyscalculia-bg',
    text: 'text-dyscalculia-text',
    primary: 'bg-dyscalculia-primary',
    secondary: 'bg-dyscalculia-secondary',
    accent: 'bg-dyscalculia-accent',
    card: 'bg-dyscalculia-card',
    font: 'font-body',
    label: 'Diskalkuli',
    emoji: '🔢',
  },
};
