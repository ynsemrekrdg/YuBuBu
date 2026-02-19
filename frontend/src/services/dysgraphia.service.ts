import api from './api';
import type {
  SentenceCheckRequest,
  SentenceCheckResponse,
  SpellingHelpRequest,
  SpellingHelpResponse,
  StoryIdeasRequest,
  StoryIdeasResponse,
  CompositionFeedbackRequest,
  CompositionFeedbackResponse,
  WritingCoachRequest,
  WritingCoachResponse,
} from '../types';

const BASE = '/api/dysgraphia';

export const dysgraphiaService = {
  /** Check sentence for grammar, punctuation, spelling errors */
  async checkSentence(data: SentenceCheckRequest): Promise<SentenceCheckResponse> {
    const res = await api.post(`${BASE}/sentence/check`, data);
    return res.data;
  },

  /** Get spelling help for a word */
  async spellingHelp(data: SpellingHelpRequest): Promise<SpellingHelpResponse> {
    const res = await api.post(`${BASE}/spelling/help`, data);
    return res.data;
  },

  /** Generate story ideas based on theme */
  async getStoryIdeas(data: StoryIdeasRequest): Promise<StoryIdeasResponse> {
    const res = await api.post(`${BASE}/ai/story-ideas`, data);
    return res.data;
  },

  /** Get feedback on a composition */
  async getCompositionFeedback(data: CompositionFeedbackRequest): Promise<CompositionFeedbackResponse> {
    const res = await api.post(`${BASE}/composition/feedback`, data);
    return res.data;
  },

  /** Get writing coach advice */
  async getWritingCoach(data: WritingCoachRequest): Promise<WritingCoachResponse> {
    const res = await api.post(`${BASE}/ai/writing-coach`, data);
    return res.data;
  },
};
