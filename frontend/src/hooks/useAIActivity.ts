/**
 * Aktivite AI Hook'ları
 * React Query mutation hook'ları — 3 katmanlı AI desteği
 */
import { useMutation } from '@tanstack/react-query';
import {
  activityAIService,
  type ActivityHintRequest,
  type EvaluateWorkRequest,
  type AdaptiveDifficultyRequest,
  type SessionAnalysisRequest,
  type NextStepsRequest,
  type PersonalizedPracticeRequest,
} from '../services/ai-activity.service';

/** Katman 1: Aktivite sırasında anlık ipucu */
export function useActivityHint() {
  return useMutation({
    mutationFn: (data: ActivityHintRequest) => activityAIService.getHint(data),
  });
}

/** Katman 1: Öğrenci çalışmasını değerlendir */
export function useEvaluateWork() {
  return useMutation({
    mutationFn: (data: EvaluateWorkRequest) => activityAIService.evaluateWork(data),
  });
}

/** Katman 1: Uyarlanabilir zorluk önerisi */
export function useAdaptiveDifficulty() {
  return useMutation({
    mutationFn: (data: AdaptiveDifficultyRequest) => activityAIService.suggestDifficulty(data),
  });
}

/** Katman 2: Oturum sonu analizi */
export function useSessionAnalysis() {
  return useMutation({
    mutationFn: (data: SessionAnalysisRequest) => activityAIService.analyzeSession(data),
  });
}

/** Katman 2: Sonraki adım önerisi */
export function useNextSteps() {
  return useMutation({
    mutationFn: (data: NextStepsRequest) => activityAIService.getNextSteps(data),
  });
}

/** Özel: Kişiselleştirilmiş pratik */
export function usePersonalizedPractice() {
  return useMutation({
    mutationFn: (data: PersonalizedPracticeRequest) => activityAIService.generatePractice(data),
  });
}
