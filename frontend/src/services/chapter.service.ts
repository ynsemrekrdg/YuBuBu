import api from './api';
import type { Chapter, ChapterListResponse, LearningDifficulty } from '../types';

export const chapterService = {
  async list(difficultyType?: LearningDifficulty, skip = 0, limit = 100): Promise<ChapterListResponse> {
    const params: Record<string, string | number> = { skip, limit };
    if (difficultyType) params.difficulty_type = difficultyType;
    const res = await api.get<ChapterListResponse>('/api/chapters', { params });
    return res.data;
  },

  async getById(id: string): Promise<Chapter> {
    const res = await api.get<Chapter>(`/api/chapters/${id}`);
    return res.data;
  },
};
