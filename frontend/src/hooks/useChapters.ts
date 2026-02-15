import { useQuery } from '@tanstack/react-query';
import { chapterService } from '../services/chapter.service';
import type { LearningDifficulty } from '../types';

export function useChapters(difficultyType?: LearningDifficulty) {
  return useQuery({
    queryKey: ['chapters', difficultyType],
    queryFn: () => chapterService.list(difficultyType),
  });
}

export function useChapter(id: string) {
  return useQuery({
    queryKey: ['chapter', id],
    queryFn: () => chapterService.getById(id),
    enabled: !!id,
  });
}
