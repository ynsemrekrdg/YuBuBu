import api from './api';
import type {
  AIChatRequest,
  AIChatResponse,
  AIHintRequest,
  AIHintResponse,
  AIAnalysisResponse,
} from '../types';

export const aiService = {
  async chat(data: AIChatRequest): Promise<AIChatResponse> {
    const res = await api.post<AIChatResponse>('/api/ai/chat', data);
    return res.data;
  },

  async getHint(chapterId: string, data?: AIHintRequest): Promise<AIHintResponse> {
    const res = await api.post<AIHintResponse>(`/api/ai/hint/${chapterId}`, data || {});
    return res.data;
  },

  async getAnalysis(studentId: string): Promise<AIAnalysisResponse> {
    const res = await api.get<AIAnalysisResponse>(`/api/ai/analysis/${studentId}`);
    return res.data;
  },
};
