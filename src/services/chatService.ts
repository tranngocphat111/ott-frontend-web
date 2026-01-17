import { Conversation } from '../types/chat';
import { mockConversations } from '../data/mockData';

const API_BASE_URL = 'http://localhost:3000/api';
const USE_MOCK_DATA = true; // Đặt false khi backend đã sẵn sàng

export class ChatService {
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return mockConversations;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/conversations/user/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to mock data if API fails
      return mockConversations;
    }
  }

  static async createConversation(creatorId: string, type: 'private' | 'group') {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creatorId, type }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }
}