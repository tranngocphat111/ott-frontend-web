import type { Conversation } from '../types';

export interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect?: (conversation: Conversation) => void;
  selectedConversationId?: string;
  loading?: boolean;
  error?: string;
  currentUserId?: string;
}

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
  onClick?: () => void;
  showUnread?: boolean;
  currentUserId?: string;
}
