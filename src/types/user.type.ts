/**
 * User entity type
 * Represents a user in the chat application
 */
export interface User {
  _id: string;
  display_name: string;
  avatar_url?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}
