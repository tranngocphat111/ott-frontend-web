import type { LucideIcon } from "lucide-react";

export interface MessageContent {
  type: "text" | "link" | "image" | "file" | "video" | "audio";
  text?: string;
  url?: string;
  name?: string;
  size?: number;
}

export interface PollOption {
  id: string;
  name: string;
  voters: string[];
}

export interface Message {
  _id: string;
  msg_id?: string;
  content: MessageContent[];
  type:
    | "text"
    | "link"
    | "image"
    | "file"
    | "video"
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
    | "call_no_answer"
    | "poll"
    | "system_poll"
    | "system"
    | "system_group_dissolved";
  created_at: string;
  createdAt?: string; // For backwards compatibility
  sender_id: string;
  conversation_id?: string;
  size?: number;
  sender_name?: string;
  fileName?: string;
  reply_to_msg_id?: string | null;
  reply_to?: MessageReplyPreview | null;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  action?: string;
  system_meta?: MessageSystemMeta | null;
  is_deleted?: boolean;
  is_revoked?: boolean;
  // Pinned message fields
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  local_client_id?: string;
  local_status?: "uploading" | "success" | "error";
  local_error?: string;
  local_upload_progress?: number;
  local_preview_urls?: string[];
  local_retry?: () => void | Promise<void>;
  local_cancel?: () => void;
  // Poll fields
  poll_question?: string | null;
  poll_multiple_choice?: boolean;
  poll_options?: PollOption[];
  poll_locked?: boolean;
  poll_locked_at?: string | null;
  poll_locked_by?: string | null;
}

export interface MessageReaction {
  user_id: string;
  type: string;
}

export interface MessageReplyPreview {
  msg_id?: string;
  sender_id: string;
  sender_name?: string;
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
    | "call_no_answer"
    | "poll"
    | "system_poll";
  content: string;
  raw_content?: string;
  file_name?: string;
  url?: string;
  media_urls?: string[];
  media_count?: number;
  is_deleted?: boolean;
  is_revoked?: boolean;
  poll_question?: string | null;
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
  msgId?: string;
  conversationId?: string;
  sender_id?: string;
  sender_name?: string;
}

export interface ChatInputProps {
  conversationId: string;
  senderId: string;
  onSendSuccess: (
    sentMessage?: Message | null,
    meta?: { kind?: "text" | "link" | "file" | "video" | "audio" },
  ) => void | Promise<void>;
  onUploadStart?: (draft: Message) => void;
  onUploadProgress?: (clientMessageId: string, progress: number) => void;
  onUploadSuccess?: (payload: ImageSendSuccess) => void;
  onUploadError?: (payload: ImageSendError) => void;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
  conversationType?: string;
  onConversationCreated?: (newConversation: unknown) => void;
  smartReplies?: string[];
  smartReplyContextKey?: string;
  isSmartReplyLoading?: boolean;
  isSmartReplyOpen?: boolean;
  onSmartReplyToggle?: () => void;
  onSmartReplyClose?: () => void;
  onSmartReplySelect?: (reply: string) => void;
}

export interface MessageMediaWarning {
  index?: number;
  key?: string;
  source?: string;
  reason?: string;
  severity?: string;
  violation_id?: string;
  request_id?: string;
  detected_at?: string;
}

export interface MessageSystemMeta {
  media_policy_status?: "flagged" | "clean" | string;
  media_warnings?: MessageMediaWarning[];
  moderation_status?: "rejected" | "approved" | string;
  moderation_violation_id?: string;
  moderation_request_id?: string;
  moderation_severity?: string;
  moderation_violation_type?: string;
  moderation_matched_labels?: string[];
  moderation_detected_at?: string;
}

export interface ImageSendDraft {
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  files: File[];
  previewUrls: string[];
  replyToMessage?: Message | null;
  retry: () => Promise<void>;
}

export interface ImageSendSuccess {
  clientMessageId: string;
  sentMessage: Message;
}

export interface ImageSendError {
  clientMessageId: string;
  error: string;
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
