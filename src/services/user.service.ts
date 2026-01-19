import type { User } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export class UserService {
  // Get all users from database
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map((user: any) => ({
        _id: user.user_id || user._id,
        display_name: user.name,
        avatar_url: user.avatar || undefined,
        status: user.is_online ? 'online' : 'offline',
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
}
