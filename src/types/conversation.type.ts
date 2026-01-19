import type { Participant } from './participant.type';

/**
 * Conversation entity type
 * Represents a chat conversation (private or group)
 */
export interface Conversation {
  _id: string;
  name?: string;
  type: 'private' | 'group';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  unread_count?: number;
  is_pinned?: boolean;
  is_muted?: boolean;
  category_id?: string;
  // Backend field: last_message từ MongoDB
  last_message?: {
    msg_id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'file';
    createdAt: string;
  };
}
