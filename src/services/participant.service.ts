import { API_CHAT_SERVER_URL } from "../config/api.config";
import type { Participant } from "../types";
import { authFetch } from "./api/fetchClient";

export class ParticipantService {
  /**
   * Update pin status for a conversation
   */
  static async updatePinStatus(
    conversationId: string,
    userId: string,
    isPinned: boolean,
  ): Promise<Participant> {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/participants/pin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          userId,
          isPinned,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update pin status");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating pin status:", error);
      throw error;
    }
  }

  /**
   * Update category for a conversation
   */
  static async updateConversationCategory(
    conversationId: string,
    userId: string,
    categoryId: string | null,
  ): Promise<void> {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/participants/category`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            userId,
            categoryId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  /**
   * Update notification settings (mute/unmute)
   */
  static async updateNotificationSettings(
    conversationId: string,
    userId: string,
    status: "on" | "mute" | "off",
    muteUntil?: Date | null,
  ): Promise<void> {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/participants/notification`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            userId,
            status,
            muteUntil,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update notification settings");
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      throw error;
    }
  }

  /**
   * Xóa cuộc hội thoại theo cơ chế soft-delete kiểu Zalo.
   * Backend tự động lấy last_message.msg_id và lưu vào deleted_msg_id.
   * Trả về participant đã được cập nhật để FE đồng bộ state local.
   */
  static async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<Participant> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/delete-conversation`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, userId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete conversation");
    }

    return await response.json();
  }

  /**
   * Đánh dấu đã đọc đến tin nhắn có msgId trong conversation.
   * Cập nhật last_read_message_id và last_read_at.
   */
  static async markAsRead(
    conversationId: string,
    userId: string,
    msgId: string,
  ): Promise<any> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/read`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, userId, msgId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to mark as read");
    }

    return await response.json();
  }

  /**
   * Fallback HTTP cho delivered_up_to. Luồng chính đi qua Socket.IO/RabbitMQ.
   */
  static async markAsDelivered(
    conversationId: string,
    userId: string,
    msgId: string,
  ): Promise<any> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/delivered`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, userId, msgId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to mark as delivered");
    }

    return await response.json();
  }

  /**
   * Get conversation members with user details
   */
  static async getConversationMembers(conversationId: string) {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/members/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to get members");
    }

    return await response.json();
  }

  // Alias for getConversationMembers
  static async getMembers(conversationId: string) {
    return this.getConversationMembers(conversationId);
  }

  /**
   * Leave a group conversation
   */
  static async leaveGroup(
    conversationId: string,
    userId: string,
  ): Promise<{ success: boolean; conversationId: string; userId: string }> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/leave/${conversationId}/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to leave group");
    }

    return await response.json();
  }

  /**
   * Remove a member from group (admin only)
   */
  static async removeMember(
    conversationId: string,
    userId: string,
    adminId: string,
  ): Promise<{ success: boolean; conversationId: string; userId: string }> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/remove/${conversationId}/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to remove member");
    }

    return await response.json();
  }

  /**
   * Update member role (admin only)
   */
  static async updateMemberRole(
    conversationId: string,
    userId: string,
    newRole: "admin" | "user",
    adminId: string,
  ): Promise<{ success: boolean; conversationId: string; userId: string; newRole: string }> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/role/${conversationId}/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId, newRole }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update member role");
    }

    return await response.json();
  }

  static async updateMemberNickname(
    conversationId: string,
    userId: string,
    requesterId: string,
    nickname: string,
  ): Promise<{ success: boolean; conversationId: string; userId: string; nickname: string }> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/nickname/${conversationId}/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requesterId, nickname }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update nickname");
    }

    return await response.json();
  }

  static async transferOwnership(
    conversationId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<{ success: boolean; conversationId: string; oldOwnerId: string; newOwnerId: string }> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/transfer-owner/${conversationId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentOwnerId, newOwnerId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to transfer ownership");
    }

    return await response.json();
  }

  /**
   * Chấp nhận lời mời tham gia nhóm
   */
  static async acceptGroupInvitation(conversationId: string, userId: string): Promise<void> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/accept-invitation`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, userId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to accept invitation");
    }
  }

  /**
   * Từ chối lời mời tham gia nhóm
   */
  static async rejectGroupInvitation(conversationId: string, userId: string): Promise<void> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/participants/reject-invitation`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, userId }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to reject invitation");
    }
  }
}
