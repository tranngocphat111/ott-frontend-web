import { apiClient } from './api/client';

export interface AiSmartReplySuggestion {
  text: string;
  intent?: string;
  tone?: string;
}

export interface AiSummaryActionItem {
  owner: string;
  task: string;
  due?: string;
}

export interface AiSummaryResult {
  summary: string;
  highlights: string[];
  actionItems: AiSummaryActionItem[];
  questions: string[];
  sentiment?: string;
}

interface AiTranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage?: string;
}

const unwrapApiPayload = <T>(response: unknown): T => {
  const payload = response as any;
  return (payload?.result ?? payload) as T;
};

const normalizeSmartReplies = (payload: unknown): string[] => {
  const data = unwrapApiPayload<any>(payload);
  const rawReplies = Array.isArray(data)
    ? data
    : Array.isArray(data?.replies)
      ? data.replies
      : Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];

  return rawReplies
    .map((reply: string | AiSmartReplySuggestion) =>
      typeof reply === 'string' ? reply : reply?.text,
    )
    .filter((reply: unknown): reply is string => typeof reply === 'string' && reply.trim().length > 0)
    .map((reply: string) => reply.trim())
    .slice(0, 5);
};

const normalizeSummary = (payload: unknown): AiSummaryResult => {
  const data = unwrapApiPayload<any>(payload);

  if (typeof data === 'string') {
    return {
      summary: data,
      highlights: [],
      actionItems: [],
      questions: [],
      sentiment: 'neutral',
    };
  }

  return {
    summary: data?.summary || 'Không thể tóm tắt hội thoại lúc này.',
    highlights: Array.isArray(data?.highlights) ? data.highlights.filter(Boolean) : [],
    actionItems: Array.isArray(data?.actionItems) ? data.actionItems.filter((item: any) => item?.task) : [],
    questions: Array.isArray(data?.questions) ? data.questions.filter(Boolean) : [],
    sentiment: data?.sentiment || 'neutral',
  };
};

export const AiService = {
  getSmartReplies: async (conversationId: string, userId?: string): Promise<string[]> => {
    try {
      const response = await apiClient.get<unknown>(`/ai/smart-replies`, {
        params: {
          conversationId,
          userId,
          detailed: true,
        },
      });
      return normalizeSmartReplies(response);
    } catch (error) {
      console.error('Smart Reply Error:', error);
      return [];
    }
  },

  summarizeConversation: async (
    conversationId: string,
    userId?: string,
  ): Promise<AiSummaryResult> => {
    try {
      const response = await apiClient.get<unknown>(`/ai/summarize`, {
        params: { conversationId, userId },
      });
      return normalizeSummary(response);
    } catch (error) {
      console.error('Summarization Error:', error);
      return {
        summary: 'Không thể tóm tắt hội thoại lúc này.',
        highlights: [],
        actionItems: [],
        questions: [],
        sentiment: 'neutral',
      };
    }
  },

  translateText: async (text: string, targetLang: string = 'Tiếng Việt'): Promise<string> => {
    try {
      const response = await apiClient.post<AiTranslationResponse>(`/ai/translate`, {
        text,
        targetLang,
      });
      const data = unwrapApiPayload<AiTranslationResponse>(response);
      return data?.translatedText || text;
    } catch (error) {
      console.error('Translation Error:', error);
      return text;
    }
  },

  transcribeVoice: async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice.webm');

      const response = await apiClient.post<{ text: string }>(`/ai/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = unwrapApiPayload<{ text: string }>(response);
      return data?.text || '';
    } catch (error) {
      console.error('Transcription Error:', error);
      return '';
    }
  },
};
