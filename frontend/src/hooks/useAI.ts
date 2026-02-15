import { useMutation, useQuery } from '@tanstack/react-query';
import { aiService } from '../services/ai.service';
import type { AIChatRequest } from '../types';

export function useAIChat() {
  return useMutation({
    mutationFn: (data: AIChatRequest) => aiService.chat(data),
  });
}

export function useAIHint(chapterId: string) {
  return useMutation({
    mutationFn: (difficultyLevel?: number) =>
      aiService.getHint(chapterId, { difficulty_level: difficultyLevel || 1 }),
  });
}

export function useAIAnalysis(studentId: string | undefined) {
  return useQuery({
    queryKey: ['ai-analysis', studentId],
    queryFn: () => aiService.getAnalysis(studentId!),
    enabled: !!studentId,
  });
}
