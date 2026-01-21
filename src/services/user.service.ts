import type { User } from "../types";
import { API_CHAT_SERVER_URL } from "../config/api.config";

export class UserService {
  // Get all users from database
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_CHAT_SERVER_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // <--- Dòng quan trọng để qua mặt Ngrok
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map((user: any) => ({
        _id: user.user_id || user._id,
        display_name: user.name,
        avatar_url: user.avatar || undefined,
        status: user.is_online ? "online" : "offline",
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }
}
