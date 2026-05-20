import { apiClient } from './api/client';
import { API_AI_SERVER_URL, API_CHAT_SERVER_URL } from '../config/api.config';

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
  meta?: {
    source?: string;
    messageCount?: number;
    hasImportantContent?: boolean;
    [key: string]: unknown;
  };
}

interface AiTranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  targetLanguage?: string;
}

interface AiSmartReplyOptions {
  conversationType?: 'private' | 'group' | string;
  limit?: number;
}

interface AiSummaryOptions {
  limit?: number;
}

const unwrapApiPayload = <T>(response: unknown): T => {
  const payload = response as any;
  return (payload?.result ?? payload) as T;
};

const AI_API_BASE_URLS = Array.from(
  new Set([API_AI_SERVER_URL, `${API_CHAT_SERVER_URL}/ai`]),
);

const isNotFoundError = (error: unknown): boolean => {
  const payload = error as any;
  return payload?.code === 404 || payload?.status === 404 || payload?.response?.status === 404;
};

const requestAiEndpoint = async <T>(
  path: string,
  request: (url: string) => Promise<unknown>,
): Promise<T> => {
  let lastError: unknown;

  for (const baseUrl of AI_API_BASE_URLS) {
    try {
      return (await request(`${baseUrl}${path}`)) as T;
    } catch (error) {
      lastError = error;
      if (!isNotFoundError(error)) throw error;
    }
  }

  throw lastError;
};

const EMPTY_SUMMARY_TEXTS = new Set([
  'Cuộc hội thoại hiện chưa có đủ nội dung rõ ràng để tóm tắt.',
  'Cuộc hội thoại hiện chưa có nội dung quan trọng để tóm tắt.',
]);

const isEmptySummaryText = (summary: string): boolean =>
  EMPTY_SUMMARY_TEXTS.has(summary.trim());

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
    const hasImportantContent = !isEmptySummaryText(data);
    return {
      summary: data,
      highlights: [],
      actionItems: [],
      questions: [],
      sentiment: 'neutral',
      meta: { hasImportantContent },
    };
  }

  const summary = data?.summary || 'Không thể tóm tắt hội thoại lúc này.';
  const hasImportantContent =
    data?.meta?.hasImportantContent !== false && !isEmptySummaryText(summary);

  return {
    summary,
    highlights: hasImportantContent && Array.isArray(data?.highlights) ? data.highlights.filter(Boolean) : [],
    actionItems: hasImportantContent && Array.isArray(data?.actionItems) ? data.actionItems.filter((item: any) => item?.task) : [],
    questions: hasImportantContent && Array.isArray(data?.questions) ? data.questions.filter(Boolean) : [],
    sentiment: data?.sentiment || 'neutral',
    meta: { ...(data?.meta || {}), hasImportantContent },
  };
};

export const AiService = {
  getSmartReplies: async (
    conversationId: string,
    userId?: string,
    options: AiSmartReplyOptions = {},
  ): Promise<string[]> => {
    try {
      const response = await requestAiEndpoint<unknown>('/smart-replies', (url) =>
        apiClient.get<unknown>(url, {
          params: {
            conversationId,
            userId,
            conversationType: options.conversationType,
            limit: options.limit,
            detailed: true,
          },
        }),
      );
      return normalizeSmartReplies(response);
    } catch (error) {
      console.error('Smart Reply Error:', error);
      return [];
    }
  },

  summarizeConversation: async (
    conversationId: string,
    userId?: string,
    options: AiSummaryOptions = {},
  ): Promise<AiSummaryResult> => {
    try {
      const response = await requestAiEndpoint<unknown>('/summarize', (url) =>
        apiClient.get<unknown>(url, {
          params: { conversationId, userId, limit: options.limit },
        }),
      );
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
      const response = await requestAiEndpoint<AiTranslationResponse>('/translate', (url) =>
        apiClient.post<AiTranslationResponse>(url, {
          text,
          targetLang,
        }),
      );
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

      const response = await requestAiEndpoint<{ text: string }>('/transcribe', (url) =>
        apiClient.post<{ text: string }>(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }),
      );
      const data = unwrapApiPayload<{ text: string }>(response);
      return data?.text || '';
    } catch (error) {
      console.error('Transcription Error:', error);
      return '';
    }
  },
};
