import { API_CHAT_SERVER_URL } from "../config/api.config";

export class MessageService {
  // Send message to database
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: string = "text",
  ) {
    try {
      const response = await fetch(`${API_CHAT_SERVER_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          conversationId,
          senderId,
          content,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Get messages from database
  static async getMessages(conversationId: string) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true", // <--- Thêm dòng này
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }
}
