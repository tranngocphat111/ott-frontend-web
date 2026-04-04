/**
 * User entity type from backend
 * Matches MongoDB User schema exactly
 */
export interface User {
  _id?: string;
  user_id: string;
  name: string;
  avatar: string;
  is_online: boolean;
  last_active_at: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  // Computed fields for display
  display_name?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}
