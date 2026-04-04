import type { ConversationWithParticipant } from '../types';

export interface ConversationListProps {
  conversations: ConversationWithParticipant[];
  onConversationSelect?: (item: ConversationWithParticipant) => void;
  selectedConversationId?: string;
  loading?: boolean;
  error?: string;
  currentUserId?: string;
}

export interface ConversationItemProps {
  item: ConversationWithParticipant;
  isSelected?: boolean;
  onClick?: () => void;
  showUnread?: boolean;
  currentUserId?: string;
}
