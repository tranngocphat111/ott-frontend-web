import type { User } from "../types";
import { API_CHAT_SERVER_URL, API_BASE_URL } from "../config/api.config";
import { authFetch } from "./api/fetchClient";

export class UserService {
  // 1. Get all users (Cũ)
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
      const response = await authFetch(`${API_CHAT_SERVER_URL}/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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

  static async getUserByPhone(phone: string): Promise<User | null> {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/users/phone/${phone}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = await response.json();

      return {
        _id: user._id,
        user_id: user.user_id,
        name: user.name,
        avatar: user.avatar || "",
        phone: user.phone,
        is_online: user.is_online,
        last_active_at: user.last_active_at,
      };
    } catch (error) {
      console.error(`Error fetching user by phone ${phone}:`, error);
      return null;
    }
  }

  static async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await authFetch(`${API_BASE_URL}/media/users/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // media-service returns an array directly, but just in case it's wrapped
      const usersList = Array.isArray(data) ? data : data.content || data.result || [];
      return usersList.map((user: any) => ({
        _id: user.id || user._id,
        user_id: user.id || user.user_id || '',
        name: user.displayName || user.fullName || user.name || user.username || '',
        display_name: user.displayName || user.fullName || user.name || user.username || '',
        avatar: user.avatarUrl || user.avatar || '',
        is_online: user.is_online || false,
        status: user.is_online ? "online" : "offline",
        avatar_url: user.avatarUrl || user.avatar || undefined,
        phone: user.phoneNumber || user.phone,
        email: user.email,
        relationshipStatus: user.relationshipStatus,
      }));
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }
}