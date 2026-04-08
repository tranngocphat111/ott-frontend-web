import type { LucideIcon } from "lucide-react";

export interface MessageContent {
  type: "text" | "link" | "image" | "file" | "video" | "audio";
  text?: string;
  url?: string;
  name?: string;
  size?: number;
}

export interface Message {
  _id: string;
  msg_id?: string;
  content: MessageContent[];
  type: "text" | "link" | "image" | "file" | "video" | "audio" | "system_add";
  created_at: string;
  createdAt?: string; // For backwards compatibility
  sender_id: String;
  conversation_id?: string;
  size?: number;
  sender_name?: string;
  reply_to_msg_id?: string | null;
  reply_to?: MessageReplyPreview | null;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  is_deleted?: boolean;
  is_revoked?: boolean;
  // Pinned message fields
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
}

export interface MessageReaction {
  user_id: string;
  type: string;
}

export interface MessageReplyPreview {
  msg_id?: string;
  sender_id: string;
  sender_name?: string;
  type: "text" | "link" | "image" | "video" | "file" | "audio" | "system_add";
  content: string;
  raw_content?: string;
  file_name?: string;
  url?: string;
  media_urls?: string[];
  media_count?: number;
  is_deleted?: boolean;
  is_revoked?: boolean;
}

export interface MessageAttachment {
  id: string;
  type: "image" | "file" | "video" | "audio" | "link";
  url: string;
  name: string;
  size?: number;
}

export interface ChatNotificationProps {
  type: string;
  content: string;
}

export interface ChatInputProps {
  conversationId: string;
  senderId: string;
  onSendSuccess: () => void | Promise<void>;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
}

export interface FileMessageProps {
  url: string;
  fileName?: string;
  size?: number;
}

export interface FileTypeData {
  Icon: LucideIcon;
  color: string;
  bg: string;
}
