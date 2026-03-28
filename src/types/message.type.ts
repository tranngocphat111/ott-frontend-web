import type { LucideIcon } from "lucide-react";

export interface Message {
  _id: string;
  msg_id?: string;
  content: string[] | string;
  type: "text" | "image" | "file" | "video" | "audio" | "system_add";
  createdAt: string;
  sender_id: String;
  conversation_id?: string;
  size?: number;
  sender_name?: string;
  reply_to_msg_id?: string | null;
  reply_to?: MessageReplyPreview | null;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
}

export interface MessageReaction {
  user_id: string;
  type: string;
}

export interface MessageReplyPreview {
  msg_id?: string;
  sender_id: string;
  type: "text" | "image" | "video" | "file" | "audio" | "system_add";
  content: string;
  is_deleted?: boolean;
  is_revoked?: boolean;
}

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

export interface ChatInputProps {
  conversationId: string;
  senderId: string;
  onSendSuccess: () => void;
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
