import { useMutation } from '@tanstack/react-query';
import { dysgraphiaService } from '../services/dysgraphia.service';
import type {
  SentenceCheckRequest,
  SpellingHelpRequest,
  StoryIdeasRequest,
  CompositionFeedbackRequest,
  WritingCoachRequest,
} from '../types';

/** Check a sentence for errors */
export function useSentenceCheck() {
  return useMutation({
    mutationFn: (data: SentenceCheckRequest) => dysgraphiaService.checkSentence(data),
  });
}

/** Get spelling help for a word */
export function useSpellingHelp() {
  return useMutation({
    mutationFn: (data: SpellingHelpRequest) => dysgraphiaService.spellingHelp(data),
  });
}

/** Generate story ideas */
export function useStoryIdeas() {
  return useMutation({
    mutationFn: (data: StoryIdeasRequest) => dysgraphiaService.getStoryIdeas(data),
  });
}

/** Get composition feedback */
export function useCompositionFeedback() {
  return useMutation({
    mutationFn: (data: CompositionFeedbackRequest) => dysgraphiaService.getCompositionFeedback(data),
  });
}

/** Get writing coach advice */
export function useWritingCoach() {
  return useMutation({
    mutationFn: (data: WritingCoachRequest) => dysgraphiaService.getWritingCoach(data),
  });
}
