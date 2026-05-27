import { API_CHAT_SERVER_URL } from "../config/api.config";
import type { SearchEverythingResponse } from "../types";
import { authFetch } from "./api/fetchClient";

const S3_MEDIA_VIOLATION_MESSAGE =
  "Ảnh hoặc video này có thể vi phạm chính sách lưu trữ, vui lòng chọn tệp khác.";
const S3_CACHE_CONTROL = "public, max-age=31536000, immutable";

const sanitizeS3FileName = (fileName: string) => {
  const baseName =
    String(fileName || "file")
      .split(/[\\/]/)
      .pop()
      ?.normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "file";

  return baseName.slice(0, 160) || "file";
};

const resolveUploadContentDisposition = (contentType: string, fileName: string) => {
  const disposition = /^(image|video|audio)\//i.test(contentType)
    ? "inline"
    : "attachment";
  return `${disposition}; filename="${sanitizeS3FileName(fileName)}"`;
};

const extractXmlTagValue = (xml: string, tagName: string) => {
  const match = xml.match(
    new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match?.[1]?.trim() || "";
};

const isLikelyS3Violation = (status: number, bodyText: string) => {
  const normalized = bodyText.toLowerCase();
  return (
    status === 403 ||
    normalized.includes("accessdenied") ||
    normalized.includes("explicit deny") ||
    normalized.includes("policy") ||
    normalized.includes("malware") ||
    normalized.includes("virus") ||
    normalized.includes("unsafe") ||
    normalized.includes("moderation") ||
    normalized.includes("violation")
  );
};

export class MessageService {
  static getChatApiUrl() {
    return API_CHAT_SERVER_URL;
  }

  static async getPresignedUrl(
    fileName: string,
    fileType: string,
    signal?: AbortSignal,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/presigned-url`,
        {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ fileName, fileType }),
        },
      );

      if (!response.ok) throw new Error("Không thể lấy Presigned URL");

      // Trả về { uploadUrl, fileUrl }
      const data = await response.json();
      
      // Fallback: Nếu backend cũ chưa trả về fileUrl, tự build trên FE
      if (!data.fileUrl && data.key) {
        const { URL_S3 } = await import("../config/api.config");
        data.fileUrl = `${URL_S3}${data.key}`;
      }
      
      console.log("Presigned URL result (with FE fallback):", data);
      return data;
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
    signal?: AbortSignal,
  ) {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT", // Bắt buộc là PUT cho S3 Presigned URL
        signal,
        body: file,
        headers: {
          "Content-Type":
            contentType || file.type || "application/octet-stream", // Đảm bảo khớp với fileType lúc xin URL
          "Cache-Control": S3_CACHE_CONTROL,
          "Content-Disposition": resolveUploadContentDisposition(
            contentType || file.type || "application/octet-stream",
            file.name,
          ),
        },
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        if (isLikelyS3Violation(response.status, bodyText)) {
          throw new Error(S3_MEDIA_VIOLATION_MESSAGE);
        }

        const s3Message =
          extractXmlTagValue(bodyText, "Message") ||
          extractXmlTagValue(bodyText, "Code");
        throw new Error(s3Message || "Upload lên S3 thất bại");
      }
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
    pollQuestion?: string,
    pollMultipleChoice?: boolean,
    pollOptions?: { id: string; name: string; voters: string[] }[],
    signal?: AbortSignal,
  ) {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/messages`, {
        method: "POST",
        signal,
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
          pollQuestion,
          pollMultipleChoice,
          pollOptions,
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

  static async forwardMessage(
    originalMsgId: string,
    conversationId: string,
    targetConversationIds: string[],
    senderId: string,
    signal?: AbortSignal,
  ) {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/messages/forward`, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          originalMsgId,
          conversationId,
          targetConversationIds,
          senderId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch {
          // Keep fallback status message when body is not JSON.
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Error forwarding message:", error);
      throw error;
    }
  }

  // Get messages from database
  static async getMessages(conversationId: string, userId?: string) {
    try {
      const url = userId
        ? `${API_CHAT_SERVER_URL}/messages/${conversationId}?userId=${encodeURIComponent(userId)}`
        : `${API_CHAT_SERVER_URL}/messages/${conversationId}`;
      const response = await authFetch(url, {
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

  static async getMessageContext(
    conversationId: string,
    messageId: string,
    userId?: string,
    before: number = 20,
    after: number = 20,
  ) {
    try {
      const params = new URLSearchParams();
      params.set("messageId", messageId);
      params.set("before", String(before));
      params.set("after", String(after));
      if (userId) {
        params.set("userId", userId);
      }

      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/conversations/${conversationId}/messages/around?${params.toString()}`,
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
      console.error("Error fetching message context:", error);
      throw error;
    }
  }

  static async getOlderMessages(
    conversationId: string,
    beforeMsgId: string,
    limit: number = 50,
    userId?: string,
  ) {
    try {
      const params = new URLSearchParams();
      params.set("before", String(beforeMsgId));
      params.set("limit", String(limit));
      if (userId) {
        params.set("userId", userId);
      }

      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/conversations/${conversationId}/messages/older?${params.toString()}`,
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
      console.error("Error fetching older messages:", error);
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
      const response = await authFetch(
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

  static async votePoll(
    conversationId: string,
    msgId: string,
    userId: string,
    optionIds: string[],
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/vote`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ conversationId, userId, optionIds }),
        },
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch {
          // Keep fallback status message when body is not JSON.
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Error voting poll:", error);
      throw error;
    }
  }

  static async lockPoll(
    conversationId: string,
    msgId: string,
    userId: string,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/poll-lock`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ conversationId, userId }),
        },
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch {
          // Keep fallback status message when body is not JSON.
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Error locking poll:", error);
      throw error;
    }
  }

  static async revokeMessage(
    conversationId: string,
    msgId: string,
    userId: string,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/revoke`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ conversationId, userId }),
        },
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorData?.details ||
            errorMessage;
        } catch {
          // Keep fallback status message when body is not JSON.
        }
        throw new Error(String(errorMessage));
      }

      return await response.json();
    } catch (error) {
      console.error("Error revoking message:", error);
      throw error;
    }
  }

  static async deleteMessage(
    conversationId: string,
    msgId: string,
    userId: string,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/${msgId}/delete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ conversationId, userId }),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting message:", error);
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
      const response = await authFetch(
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
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep fallback status message when body is not JSON.
        }
        throw new Error(errorMessage);
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
      const response = await authFetch(
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
  static async getPinnedMessages(conversationId: string, userId?: string) {
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.set("userId", userId);
      }

      const query = params.toString();
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}/pinned${query ? `?${query}` : ""}`,
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

  // Get poll messages (filtered from latest messages)
  static async getPollMessages(conversationId: string, userId?: string) {
    try {
      const messages = await this.getMessages(conversationId, userId);
      return messages.filter((msg: { type?: string }) => msg.type === "poll");
    } catch (error) {
      console.error("Error fetching poll messages:", error);
      throw error;
    }
  }

  // Get media messages (images/videos)
  static async getMediaMessages(conversationId: string, limit = 20, skip = 0) {
    try {
      const response = await authFetch(
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

  // Get media messages around a target message (_id or msg_id)
  static async getMediaAroundTarget(
    conversationId: string,
    messageId: string,
    before = 10,
    after = 10,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/messages/${conversationId}/media-around?messageId=${encodeURIComponent(messageId)}&before=${before}&after=${after}`,
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
      console.error("Error fetching media around target:", error);
      throw error;
    }
  }

  // Get file messages
  static async getFileMessages(conversationId: string, limit = 20, skip = 0) {
    try {
      const response = await authFetch(
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

      const fileMessages = await response.json();

      if (skip > 0) {
        return fileMessages;
      }

      const latestMessages = await this.getMessages(conversationId).catch(
        () => [],
      );
      const audioMessages = (latestMessages || []).filter(
        (message: any) => String(message?.type || "").toLowerCase() === "audio",
      );
      const byId = new Map<string, any>();

      [...(Array.isArray(fileMessages) ? fileMessages : []), ...audioMessages]
        .filter(Boolean)
        .forEach((message: any) => {
          const id = String(message?.msg_id || message?._id || "").trim();
          if (!id) return;
          byId.set(id, message);
        });

      return Array.from(byId.values())
        .sort((left: any, right: any) => {
          const leftTime = new Date(
            left?.createdAt || left?.created_at || 0,
          ).getTime();
          const rightTime = new Date(
            right?.createdAt || right?.created_at || 0,
          ).getTime();
          return rightTime - leftTime;
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching file messages:", error);
      throw error;
    }
  }

  // Get link messages
  static async getLinkMessages(conversationId: string, limit = 20, skip = 0) {
    try {
      const response = await authFetch(
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
    options?: { limit?: number; senderId?: string; scope?: string[] },
  ): Promise<SearchEverythingResponse> {
    try {
      const params = new URLSearchParams();
      params.set("q", keyword);
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.senderId) params.set("senderId", options.senderId);
      if (options?.scope) params.set("scope", options.scope.join(","));

      const response = await authFetch(
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
