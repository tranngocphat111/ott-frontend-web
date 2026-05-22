import axios from "axios";
import { API_NOTIFICATION_SERVER_URL } from "../config/api.config";

export interface InAppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  type: string;
  content: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

class NotificationService {
  private getHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getNotifications(userId: string): Promise<InAppNotification[]> {
    try {
      const response = await axios.get(`${API_NOTIFICATION_SERVER_URL}/notifications/inapp/${userId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await axios.put(`${API_NOTIFICATION_SERVER_URL}/notifications/inapp/${notificationId}/read`, {}, {
        headers: this.getHeaders(),
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await axios.put(`${API_NOTIFICATION_SERVER_URL}/notifications/inapp/${userId}/read-all`, {}, {
        headers: this.getHeaders(),
      });
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await axios.delete(`${API_NOTIFICATION_SERVER_URL}/notifications/inapp/${notificationId}`, {
        headers: this.getHeaders(),
      });
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();

