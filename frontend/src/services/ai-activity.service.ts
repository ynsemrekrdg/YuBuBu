/**
 * Aktivite-içi AI Servisi
 * 3 katmanlı AI desteği için API çağrıları
 */
import api from './api';

// ─── Tip Tanımları ──────────────────────────────────────────

export interface ActivityHintRequest {
  chapter_id: string;
  activity_type: string;
  problem: {
    question: string;
    correct_answer?: string;
    [key: string]: unknown;
  };
  student_attempt: {
    answer: string;
    attempt_number: number;
  };
  context?: {
    error_type?: string;
    chapter_title?: string;
    learning_difficulty?: string;
    [key: string]: unknown;
  };
}

export interface ActivityHintResponse {
  hint: string;
  hint_level: number;
  should_show_answer: boolean;
  visual_aid: string;
  encouragement: string;
}

export interface EvaluateWorkRequest {
  activity_type: string;
  work_type: 'handwriting' | 'reading' | 'math' | 'writing';
  work_data: {
    content: unknown;
    target?: string;
    activity_description?: string;
    [key: string]: unknown;
  };
}

export interface EvaluateWorkResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  error_analysis: {
    error_type: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high';
  };
}

export interface AdaptiveDifficultyRequest {
  recent_performance: {
    score: number;
    hints_used: number;
    time_seconds: number;
    errors: number;
  }[];
}

export interface AdaptiveDifficultyResponse {
  action: 'increase' | 'decrease' | 'maintain';
  reason: string;
  confidence: number;
  next_difficulty: string;
  specific_adjustments: string[];
}

export interface SessionAnalysisRequest {
  session_data: {
    chapter_id: string;
    chapter_title: string;
    activity_type: string;
    activities_completed: number;
    time_spent: number;
    hints_used: number;
    errors: { type: string; count: number }[];
    scores: number[];
  };
}

export interface SessionAnalysisResponse {
  dominant_error: string;
  error_frequency: number;
  severity: 'low' | 'medium' | 'high';
  intervention_needed: boolean;
  intervention_type: string | null;
  teacher_note: string;
  parent_note: string;
  positive_observations: string[];
  session_summary: string;
}

export interface NextStepsRequest {
  current_chapter_id: string;
  performance_summary: {
    chapter_title: string;
    average_score: number;
    dominant_error: string;
    severity: string;
    intervention_needed: boolean;
  };
}

export interface NextStepsResponse {
  next_action: 'continue' | 'review' | 'advance' | 'intervene';
  reason: string;
  next_chapter_id: string | null;
  review_activities: string[];
  intervention_module: string | null;
  encouragement: string;
}

export interface PersonalizedPracticeRequest {
  weak_skill: string;
  count?: number;
}

export interface PracticeItem {
  id: number;
  question: string;
  correct_answer: string;
  options: string[];
  hint: string;
  difficulty: string;
  skill_focus: string;
}

export interface PersonalizedPracticeResponse {
  problems: PracticeItem[];
  skill: string;
  total: number;
}

// ─── API Çağrıları ──────────────────────────────────────────

export const activityAIService = {
  // KATMAN 1: Gerçek zamanlı ipucu
  async getHint(data: ActivityHintRequest): Promise<ActivityHintResponse> {
    const res = await api.post<ActivityHintResponse>('/api/ai/activity/hint', data);
    return res.data;
  },

  // KATMAN 1: Çalışma değerlendirme
  async evaluateWork(data: EvaluateWorkRequest): Promise<EvaluateWorkResponse> {
    const res = await api.post<EvaluateWorkResponse>('/api/ai/activity/evaluate', data);
    return res.data;
  },

  // KATMAN 1: Zorluk önerisi
  async suggestDifficulty(data: AdaptiveDifficultyRequest): Promise<AdaptiveDifficultyResponse> {
    const res = await api.post<AdaptiveDifficultyResponse>('/api/ai/activity/difficulty', data);
    return res.data;
  },

  // KATMAN 2: Oturum analizi
  async analyzeSession(data: SessionAnalysisRequest): Promise<SessionAnalysisResponse> {
    const res = await api.post<SessionAnalysisResponse>('/api/ai/activity/session-analysis', data);
    return res.data;
  },

  // KATMAN 2: Sonraki adım
  async getNextSteps(data: NextStepsRequest): Promise<NextStepsResponse> {
    const res = await api.post<NextStepsResponse>('/api/ai/activity/next-steps', data);
    return res.data;
  },

  // ÖZEL: Kişiselleştirilmiş pratik
  async generatePractice(data: PersonalizedPracticeRequest): Promise<PersonalizedPracticeResponse> {
    const res = await api.post<PersonalizedPracticeResponse>('/api/ai/activity/practice', data);
    return res.data;
  },
};
