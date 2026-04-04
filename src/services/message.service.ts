import { API_CHAT_SERVER_URL } from "../config/api.config";
import type { SearchEverythingResponse } from "../types";

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
  static async uploadFileToS3(
    uploadUrl: string,
    file: File,
    contentType?: string,
  ) {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT", // Bắt buộc là PUT cho S3 Presigned URL
        body: file,
        headers: {
          "Content-Type":
            contentType || file.type || "application/octet-stream", // Đảm bảo khớp với fileType lúc xin URL
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

  // Pin/Unpin message
  static async pinMessage(
    conversationId: string,
    msgId: string,
    userId: string,
    isPinned: boolean,
  ) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/pin`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ conversationId, userId, isPinned }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error pinning message:", error);
      throw error;
    }
  }

  // Toggle pin message (unpin if already pinned)
  static async togglePinMessage(msgId: string) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/toggle-pin`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error toggling pin message:", error);
      throw error;
    }
  }

  // Get pinned messages
  static async getPinnedMessages(conversationId: string) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}/pinned`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching pinned messages:", error);
      throw error;
    }
  }

  // Get media messages (images/videos)
  static async getMediaMessages(conversationId: string, limit = 20, skip = 0) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}/media?limit=${limit}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching media messages:", error);
      throw error;
    }
  }

  // Get file messages
  static async getFileMessages(conversationId: string, limit = 20, skip = 0) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}/files?limit=${limit}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching file messages:", error);
      throw error;
    }
  }

  // Get link messages
  static async getLinkMessages(conversationId: string, limit = 20, skip = 0) {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}/links?limit=${limit}&skip=${skip}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching link messages:", error);
      throw error;
    }
  }

  // Unified search: contacts/conversations/messages/files/media
  static async searchEverything(
    userId: string,
    keyword: string,
    options?: { limit?: number; senderId?: string },
  ): Promise<SearchEverythingResponse> {
    try {
      const params = new URLSearchParams();
      params.set("q", keyword);
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.senderId) params.set("senderId", options.senderId);

      const response = await fetch(
        `${API_CHAT_SERVER_URL}/search/${encodeURIComponent(userId)}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching chat data:", error);
      throw error;
    }
  }
}
