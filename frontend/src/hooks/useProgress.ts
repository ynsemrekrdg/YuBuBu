import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressService } from '../services/progress.service';
import type { CompleteChapterRequest } from '../types';

export function useStudentProgress(studentId: string | undefined) {
  return useQuery({
    queryKey: ['progress', studentId],
    queryFn: () => progressService.getStudentProgress(studentId!),
    enabled: !!studentId,
  });
}

export function useAnalytics(studentId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', studentId],
    queryFn: () => progressService.getAnalytics(studentId!),
    enabled: !!studentId,
  });
}

export function useCompleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteChapterRequest) => progressService.complete(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progress', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });
}
