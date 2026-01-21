import type { Conversation } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export class ConversationService {
  // Get user conversations from database
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/participants/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Map backend data to frontend format
      return data.map((conv: any) => ({
        _id: conv._id,
        name: conv.name || '',
        type: conv.type,
        avatar_url: conv.avatar || undefined,
        created_at: conv.createdAt,
        updated_at: conv.updatedAt,
        participants: conv.participants || [],
        is_pinned: conv.is_pinned || false,
        is_muted: conv.is_muted || false,
        last_message: conv.last_message,
      }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Create group with real data in database
  static async createGroup(
    creatorId: string, 
    name: string, 
    memberIds: string[], 
    avatar?: string
  ): Promise<Conversation> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          type: 'group',
          name,
          memberIds,
          avatar: avatar || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  // Create conversation
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
