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
  last_delivered_message_id: string;
  last_delivered_at?: string | null;
  last_read_message_id: string;
  last_read_at: string;
  deleted_msg_id: string;
  unread_count?: number;
  nickname?: string;
  joined_at: string;
  roles: 'admin' | 'user';
  status?: 'joined' | 'invited';
}

/**
 * User info in conversation
 * Display information for conversation participants
 */
export interface ConversationParticipant {
  _id: string;
  user_id?: string;
  display_name: string;
  name?: string;
  nickname?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  membership_status?: 'joined' | 'invited';
  role?: 'admin' | 'member' | 'owner';
  joined_at?: string;
  last_delivered_message_id?: string;
  last_delivered_at?: string | null;
  last_read_message_id?: string;
  last_read_at?: string | null;
}
