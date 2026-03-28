/**
 * Participant entity type from backend
 * Represents a user's participation in a conversation with settings
 */
export interface Participant {
  _id: string;
  user_id: string;
  conversation_id: string;
  settings: {
    category_id?: string | null;
    is_pinned: boolean;
    pinned_at?: string | null;
    notification_status: 'on' | 'mute' | 'off';
    mute_until?: string | null;
  };
  last_read_message_id: string;
  last_read_at: string;
  deleted_msg_id: string;
  unread_count?: number;
  nickname?: string;
  joined_at: string;
  roles: 'admin' | 'user';
}

/**
 * User info in conversation
 * Display information for conversation participants
 */
export interface ConversationParticipant {
  _id: string;
  display_name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  role?: 'admin' | 'member' | 'owner';
  joined_at?: string;
}
