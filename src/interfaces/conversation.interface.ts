import type { Conversation } from '../types';

export interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect?: (conversation: Conversation) => void;
  selectedConversationId?: string;
  currentUserId: string;
  loading?: boolean;
  error?: string;
}

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
  onClick?: () => void;
  currentUserId: string;
  showUnread?: boolean;
}
