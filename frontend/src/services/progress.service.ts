import api from './api';
import type {
  CompleteChapterRequest,
  CompletionResult,
  ProgressListResponse,
  AnalyticsResponse,
} from '../types';

export const progressService = {
  async complete(data: CompleteChapterRequest): Promise<CompletionResult> {
    const res = await api.post<CompletionResult>('/api/progress/complete', data);
    return res.data;
  },

  async getStudentProgress(studentId: string, skip = 0, limit = 100): Promise<ProgressListResponse> {
    const res = await api.get<ProgressListResponse>(`/api/progress/student/${studentId}`, {
      params: { skip, limit },
    });
    return res.data;
  },

  async getAnalytics(studentId: string): Promise<AnalyticsResponse> {
    const res = await api.get<AnalyticsResponse>(`/api/progress/analytics/${studentId}`);
    return res.data;
  },
};
