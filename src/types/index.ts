// ===== Existing exports =====
export * from "./enums";
export * from "./request";
export * from "./response";
export * from "./entities";
export * from "./adminRole.type";

// ===== User types =====
export type { User } from "./user.type";

// ===== Message types =====
export type {
  Message,
  MessageContent,
  MessageAttachment,
} from "./message.type";

// ===== Participant types =====
export type { Participant, ConversationParticipant } from "./participant.type";

// ===== Conversation types =====
export type {
  Conversation,
  ConversationWithParticipant,
} from "./conversation.type";

// ===== Category types =====
export type { Category } from "./category.type";

// ===== Search types =====
export type {
  SearchEverythingResponse,
  SearchContactItem,
  SearchConversationItem,
  SearchMessageItem,
  SearchFileItem,
  SearchMediaItem,
} from "./search.type";

// ===== Chat sidebar left types =====
export type {
  FilterMode,
  SearchTab,
  SenderOption,
  ConversationMeta,
  RecentSearchListProps,
  SearchMessageRowProps,
  SenderFilterDropdownProps,
  SearchContactsSectionProps,
  SearchConversationsSectionProps,
  SearchMessagesSectionProps,
  SearchFilesSectionProps,
  SearchResultsPanelProps,
  SidebarHeaderProps,
} from "./chat-sidebar-left.type";
