import type { User } from './user.type';

/**
 * Message entity type
 * Represents a single message in a conversation
 */
export interface Message {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio';
  created_at: string;
  sender: User;
  attachments?: MessageAttachment[];
}

/**
 * Message attachment type
 */
export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  name: string;
  size?: number;
}
