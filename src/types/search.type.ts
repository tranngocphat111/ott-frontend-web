export interface SearchContactItem {
  user_id: string;
  name: string;
  avatar?: string;
  phone?: string;
  conversation_ids: string[];
}

export interface SearchConversationItem {
  conversation_id: string;
  type: "private" | "group";
  name: string;
  avatar?: string;
  member_count?: number;
  updatedAt?: string;
  last_message?: {
    msg_id?: string;
    sender_id?: string;
    sender_name?: string;
    content?: string;
    type?: string;
    createdAt?: string;
  } | null;
}

export interface SearchMessageItem {
  _id: string;
  msg_id?: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  type: string;
  preview: string;
  createdAt?: string;
}

export interface SearchFileItem {
  _id: string;
  msg_id?: string;
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  key: string;
  file_name: string;
  createdAt?: string;
}

export interface SearchMediaItem {
  _id: string;
  msg_id?: string;
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  key: string;
  media_type: "image" | "video" | string;
  createdAt?: string;
}

export interface SearchEverythingResponse {
  contacts: SearchContactItem[];
  conversations: SearchConversationItem[];
  messages: SearchMessageItem[];
  files: SearchFileItem[];
  media: SearchMediaItem[];
  total: number;
}
