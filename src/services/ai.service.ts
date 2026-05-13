import { apiClient } from './api/client';

export const AiService = {
  getSmartReplies: async (conversationId: string): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>(`/ai/smart-replies`, {
        params: { conversationId },
      });
      return (response as any).result || response;
    } catch (error) {
      console.error('Smart Reply Error:', error);
      return [];
    }
  },

  summarizeConversation: async (conversationId: string): Promise<string> => {
    try {
      const response = await apiClient.get<{ summary: string }>(`/ai/summarize`, {
        params: { conversationId },
      });
      return (response as any).result?.summary || (response as any).summary || '';
    } catch (error) {
      console.error('Summarization Error:', error);
      return 'Không thể tóm tắt hội thoại lúc này.';
    }
  },

  translateText: async (text: string, targetLang: string = 'Tiếng Việt'): Promise<string> => {
    try {
      const response = await apiClient.post<{ translatedText: string }>(`/ai/translate`, {
        text,
        targetLang,
      });
      return (response as any).result?.translatedText || (response as any).translatedText || text;
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
      return (response as any).result?.text || (response as any).text || '';
    } catch (error) {
      console.error('Transcription Error:', error);
      return '';
    }
  },
};
