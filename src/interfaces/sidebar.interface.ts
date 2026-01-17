import type { Conversation } from '../types';

export interface SidebarProps {
  onConversationSelect?: (conversation: Conversation) => void;
  selectedConversationId?: string;
  className?: string;
}
