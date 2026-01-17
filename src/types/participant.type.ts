/**
 * Participant entity type
 * Represents a participant in a conversation
 */
export interface Participant {
  _id: string;
  display_name: string;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  role: 'admin' | 'member' | 'owner';
  joined_at?: string;
}
