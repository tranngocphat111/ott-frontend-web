import { API_CHAT_SERVER_URL } from "../config/api.config";

export class MessageService {
  static async getPresignedUrl(fileName: string, fileType: string) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/presigned-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ fileName, fileType }),
        },
      );

      if (!response.ok) throw new Error("Không thể lấy Presigned URL");

      // Trả về { uploadUrl, fileUrl }
      return await response.json();
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      throw error;
    }
  }

  /**
   * 2. Upload trực tiếp file lên S3
   */
  static async uploadFileToS3(uploadUrl: string, file: File) {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT", // Bắt buộc là PUT cho S3 Presigned URL
        body: file,
        headers: {
          "Content-Type": file.type, // Đảm bảo khớp với fileType lúc xin URL
        },
      });

      if (!response.ok) throw new Error("Upload lên S3 thất bại");
      return true;
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  }
  // Send message to database
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string | string[],
    type: string = "text",
    size: number = 0,
    fileName?: string,
    replyToMsgId?: string,
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
          size,
          fileName,
          replyToMsgId,
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
  static async getMessages(conversationId: string, userId?: string) {
    try {
      const url = userId
        ? `${API_CHAT_SERVER_URL}/messages/${conversationId}?userId=${encodeURIComponent(userId)}`
        : `${API_CHAT_SERVER_URL}/messages/${conversationId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
  }

  static async reactToMessage(
    conversationId: string,
    msgId: string,
    userId: string,
    reactionType: string,
  ) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/reaction`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ conversationId, userId, reactionType }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error reacting to message:", error);
      throw error;
    }
  }
}
