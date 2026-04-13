import type { User } from "../types";
import { API_CHAT_SERVER_URL } from "../config/api.config";

export class UserService {
  // 1. Get all users (Cũ)
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_CHAT_SERVER_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Mapping dữ liệu từ Backend về Frontend
      return data.map((user: any) => ({
        _id: user.user_id || user._id,
        user_id: user.user_id || '',
        name: user.name || '',
        display_name: user.name || '',
        avatar: user.avatar || '',
        is_online: user.is_online || false,
        last_active_at: user.last_active_at || '',
        status: user.is_online ? "online" : "offline",
        avatar_url: user.avatar || undefined,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  // 2. Get Single User by ID (Mới thêm) 👇
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_CHAT_SERVER_URL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Quan trọng cho ngrok
        },
      });

      if (!response.ok) {
        // Nếu không tìm thấy user (404) thì trả về null hoặc throw error tùy bạn
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = await response.json();

      // Mapping dữ liệu cho khớp với type User ở frontend
      return {
        _id: user._id,
        user_id: user.user_id, // Bắt buộc phải có
        name: user.name, // Bắt buộc phải có (thay vì display_name)
        avatar: user.avatar || "",
        is_online: user.is_online, // Bắt buộc phải có (thay vì status)
        last_active_at: user.last_active_at,
      };
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  }
}