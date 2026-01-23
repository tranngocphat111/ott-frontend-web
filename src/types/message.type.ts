export interface Message {
  _id: string;
  content: string[] | string;
  type: "text" | "image" | "file" | "video" | "audio";
  created_at: string;
  sender_id: String;
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
