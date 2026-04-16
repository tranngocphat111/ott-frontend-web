import type { Conversation, ConversationWithParticipant } from "../types";
import { API_CHAT_SERVER_URL } from "../config/api.config";

export class ConversationService {
  // Get user conversations from database - returns conversation with participant settings
  static async getUserConversations(
    userId: string,
  ): Promise<ConversationWithParticipant[]> {
    try {
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/participants/${userId}`,
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
  ): Promise<Conversation> {
    try {
      const response = await fetch(`${API_CHAT_SERVER_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          creatorId,
          type: "group",
          name,
          memberIds,
          avatar: avatar || "",
        }),
      });

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
      const response = await fetch(`${API_CHAT_SERVER_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
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
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/conversations/${conversationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(updateData),
        },
      );

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
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/conversations/${conversationId}/dissolve/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
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
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/conversations/add-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
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
      const response = await fetch(
        `${API_CHAT_SERVER_URL}/conversations/add-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
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
}
