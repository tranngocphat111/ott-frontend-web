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
  attachments?: MessageAttachment[];
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
