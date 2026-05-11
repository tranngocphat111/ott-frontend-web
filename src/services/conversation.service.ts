import type { Conversation, ConversationWithParticipant } from "../types";
import { API_CHAT_SERVER_URL } from "../config/api.config";
import { authFetch } from "./api/fetchClient";

export class ConversationService {
  // Get user conversations from database - returns conversation with participant settings
  static async getUserConversations(
    userId: string,
  ): Promise<ConversationWithParticipant[]> {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/participants/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }
  }

  // Create group with real data in database
  static async createGroup(
    creatorId: string,
    name: string,
    memberIds: string[],
    avatar?: string,
    memberNames?: string[],
  ): Promise<Conversation> {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId,
          type: "group",
          name,
          memberIds,
          memberNames,
          avatar: avatar || "",
        }),
      });
      console.log("createGroup payload sent:", { name, memberCount: memberIds.length, avatar: avatar || "" });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  // Create conversation
  static async createConversation(
    creatorId: string,
    type: "private" | "group",
  ) {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creatorId, type }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  // Update conversation (name, avatar)
  static async updateConversation(
    conversationId: string,
    updateData: {
      name?: string;
      avatar?: string;
      background?: string;
      requesterId?: string;
    },
  ): Promise<Conversation> {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/conversations/${conversationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );
      console.log("updateConversation payload sent:", updateData);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update conversation");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }
  }

  static async dissolveGroup(
    conversationId: string,
    userId: string,
  ): Promise<{ success: boolean; conversationId: string }> {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/conversations/${conversationId}/dissolve/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to dissolve group");
      }

      return await response.json();
    } catch (error) {
      console.error("Error dissolving group:", error);
      throw error;
    }
  }

  // Add member to conversation
  static async addMember(
    conversationId: string,
    userId: string,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/conversations/add-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversationId, userId }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add member");
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }

  // Add multiple members to conversation
  static async addMembers(
    conversationId: string,
    userIds: string[],
    addedBy: string,
  ) {
    try {
      const response = await authFetch(
        `${API_CHAT_SERVER_URL}/conversations/add-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ conversationId, userIds, addedBy }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add members");
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding members:", error);
      throw error;
    }
  }
  static async getOrCreatePrivateConversation(
    creatorId: string,
    targetUserId: string,
  ): Promise<ConversationWithParticipant> {
    try {
      const response = await authFetch(`${API_CHAT_SERVER_URL}/conversations/private`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ creatorId, targetUserId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error get/create private conversation:", error);
      throw error;
    }
  }

  /**
   * Lấy invite link của nhóm (tạo mới nếu chưa có)
   */
  static async getInviteLink(conversationId: string, requesterId: string): Promise<string> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/conversations/${conversationId}/invite-link`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to get invite link");
    }
    const data = await response.json();
    // Backend trả về { inviteLink } hoặc { invite_link }
    return data.inviteLink || data.invite_link || "";
  }

  /**
   * Tham gia nhóm bằng invite link/token
   */
  static async joinByInviteLink(token: string, userId: string): Promise<Conversation> {
    const response = await authFetch(
      `${API_CHAT_SERVER_URL}/conversations/join-by-link`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId }),
      }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to join group");
    }
    return await response.json();
  }
}
