import type { ConversationParticipant } from "./participant.type";

/**
 * Conversation entity type from backend
 * Matches MongoDB Conversation schema exactly
 */
export interface Conversation {
  _id: string;
  type: "private" | "group";
  name: string;
  avatar: string;
  created_by: string;
  member_count: number;
  last_message?: {
    msg_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    type:
      | "text"
      | "link"
      | "image"
      | "video"
      | "file"
      | "audio"
      | "system_add"
      | "system_block"
      | "system_leave"
      | "system_pin"
      | "system_unpin"
      | "call_start"
      | "call_join"
      | "call_end"
      | "call_missed"
      | "call_cancel"
      | "call_no_answer";
    createdAt: string;
  };
  is_deleted: boolean;
  is_self_conversation?: boolean;
  self_owner_id?: string | null;
  status?: string;
  is_dissolved?: boolean;
  background: string;
  is_calling?: boolean;
  call_participant_count?: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  // Virtual field populated from backend
  participants?: ConversationParticipant[];
}

/**
 * Conversation with participant settings
 * Combined data from API response
 */
export interface ConversationWithParticipant {
  conversation: Conversation;
  participant: import("./participant.type").Participant;
}
