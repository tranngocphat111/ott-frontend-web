import type { Conversation } from '../types';

export interface ChatLayoutProps {
  className?: string;
  initialConversationId?: string;
}

export interface ChatAreaProps {
  conversation: Conversation;
  className?: string;
}
