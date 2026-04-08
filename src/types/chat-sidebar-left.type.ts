import type { ReactNode, RefObject } from "react";
import type {
  SearchContactItem,
  SearchConversationItem,
  SearchEverythingResponse,
  SearchFileItem,
  SearchMessageItem,
} from "./search.type";
import type { Category } from "./category.type";
import type { ConversationWithParticipant } from "./conversation.type";

export type FilterMode = "all" | "unread" | "category";
export type SearchTab = "all" | "contacts" | "messages" | "files";

export interface SenderOption {
  id: string;
  name: string;
}

export interface ConversationMeta {
  name: string;
  avatar: string;
  senderNameById?: Record<string, string>;
}

export interface RecentSearchListProps {
  historyConversations: ConversationWithParticipant[];
  normalizedUserId?: string;
  onOpenConversation: (conversationId: string) => void;
  onRemoveHistoryItem: (conversationId: string) => void;
  onClearAllHistory: () => void;
}

export interface SearchMessageRowProps {
  msg: SearchMessageItem;
  conversationMetaMap: Map<string, ConversationMeta>;
  onOpenConversation: (conversationId: string, messageId?: string) => void;
  highlightKeyword: (text: string) => ReactNode;
}

export interface SenderFilterDropdownProps {
  senderDropdownRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  selectedSenderName: string;
  senderSearchText: string;
  filteredSenderOptions: SenderOption[];
  onToggle: () => void;
  onSearchTextChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectSender: (senderId: string) => void;
}

export interface SearchContactsSectionProps {
  contacts: SearchContactItem[];
  searchTab: SearchTab;
  onOpenConversation: (conversationId: string) => void;
}

export interface SearchConversationsSectionProps {
  conversations: SearchConversationItem[];
  searchTab: SearchTab;
  onOpenConversation: (conversationId: string) => void;
  highlightKeyword: (text: string) => ReactNode;
}

export interface SearchMessagesSectionProps {
  messages: SearchMessageItem[];
  searchTab: SearchTab;
  conversationMetaMap: Map<string, ConversationMeta>;
  onOpenConversation: (conversationId: string, messageId?: string) => void;
  highlightKeyword: (text: string) => ReactNode;
}

export interface SearchFilesSectionProps {
  files: SearchFileItem[];
  searchTab: SearchTab;
  conversationMetaMap: Map<string, ConversationMeta>;
  onOpenConversation: (conversationId: string, messageId?: string) => void;
  highlightKeyword: (text: string) => ReactNode;
}

export interface SearchResultsPanelProps {
  isSearchPanelOpen: boolean;
  keyword: string;
  isSearching: boolean;
  searchResults: SearchEverythingResponse | null;
  searchTab: SearchTab;
  setSearchTab: (tab: SearchTab) => void;
  senderOptions: SenderOption[];
  isSenderDropdownOpen: boolean;
  senderDropdownRef: RefObject<HTMLDivElement | null>;
  selectedSenderName: string;
  senderSearchText: string;
  filteredSenderOptions: SenderOption[];
  onToggleSenderDropdown: () => void;
  onSenderSearchTextChange: (value: string) => void;
  onSelectAllSender: () => void;
  onSelectSender: (senderId: string) => void;
  filteredSearchMessages: SearchMessageItem[];
  conversationResultsByName: SearchConversationItem[];
  conversationMetaMap: Map<string, ConversationMeta>;
  highlightKeyword: (text: string) => ReactNode;
  onOpenConversation: (conversationId: string, messageId?: string) => void;
  historyConversations: ConversationWithParticipant[];
  normalizedUserId?: string;
  onRemoveHistoryItem: (conversationId: string) => void;
  onClearAllHistory: () => void;
}

export interface SidebarHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  isSearchPanelOpen: boolean;
  onCloseSearchPanel: () => void;
  onOpenCreateGroup: () => void;
  loading: boolean;
  error: string | null;
  filteredConversationCount: number;
  categories: Category[];
  selectedCategoryIds: string[];
  onSelectCategories: (categoryIds: string[]) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  onManageCategories: () => void;
}
