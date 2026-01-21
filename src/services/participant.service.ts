import { API_CHAT_SERVER_URL } from "../config/api.config";

export class ParticipantService {
  /**
   * Update pin status for a conversation
   */
  static async updatePinStatus(
    conversationId: string,
    userId: string,
    isPinned: boolean,
  ): Promise<void> {
    try {
      const response = await fetch(`${API_CHAT_SERVER_URL}/participants/pin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
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
      const response = await fetch(
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
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/participants/notification`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
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
}
