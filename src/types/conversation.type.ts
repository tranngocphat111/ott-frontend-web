import type { Message } from './message.type';
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
  latestMessage?: Message;
  participants: Participant[];
  unread_count?: number;
  is_pinned?: boolean;
  is_muted?: boolean;
}
