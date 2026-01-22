/**
 * Message entity type
 * Represents a single message in a conversation
 */
export interface Message {
  _id: string;
  content: string;
  type: "text" | "image" | "file" | "video" | "audio";
  created_at: string;
  sender_id: String;
  attachments?: MessageAttachment[];
}

/**
 * Message attachment type
 */
export interface MessageAttachment {
  id: string;
  type: "image" | "file" | "video" | "audio";
  url: string;
  name: string;
  size?: number;
}

export interface ChatNotificationProps {
  type: string;
  content: string;
}
