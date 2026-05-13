import type { Conversation, ConversationWithParticipant, Message, Participant } from '../types';

export interface SidebarProps {
  onConversationSelect?: (item: ConversationWithParticipant) => void;
  selectedConversationId?: string;
  className?: string;
}

// Chat Sidebar Right Types
export interface ChatSidebarRightProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

export interface ConversationMember {
  _id: string;
  user_id: string;
  role: "admin" | "user";
  name: string;
  avatar: string;
  joined_at: string;
  added_by?: string;
  nickname?: string;
  status?: "joined" | "invited" | "rejected" | "left";
}

export interface LinkData {
  _id: string;
  msg_id: string;
  links: string[];
  sender_id: string;
  createdAt: string;
}

export type ViewMode = "main" | "members" | "storage" | "bulletin";
export type StorageTab = "media" | "files" | "links";
export type BulletinTab = "pinned" | "polls";

// Sidebar Sub-Component Props
export interface GroupBulletinBoardProps {
  conversationId: string;
  currentUserId: string;
  pinnedMessages: Message[];
  pollMessages: Message[];
  activeTab?: BulletinTab;
  onUnpin: (msgId: string) => void;
  onBack: () => void;
  conversationType?: string;
}
export interface GroupInfoHeaderProps {
  conversation: Conversation;
  memberCount: number;
  onUpdate: (updates: Partial<Conversation>) => void;
  isAdmin: boolean;
  currentUserId?: string;
}

export interface GroupActionButtonsProps {
  conversation: Conversation;
  participant?: Participant;
  currentUserId: string;
  onAddMember: () => void;
  onCreateGroup?: () => void;
  onParticipantUpdated?: (updates: Partial<Participant>) => void;
}

export interface MembersFullViewProps {
  members: ConversationMember[];
  ownerId: string;
  currentUserId: string;
  isManager: boolean;
  friendIds: Set<string>;
  onBack: () => void;
  onMemberRemoved: (userId: string) => void;
  onMemberRoleUpdated: (userId: string, newRole: "admin" | "user") => void;
  onTransferOwnership?: (userId: string) => void;
  onAddMember: () => void;
  onAddFriend: (userId: string) => void;
  pendingFriendRequestIds?: Set<string>;
  sentFriendRequestIds?: Set<string>;
  onFriendAccepted?: (userId: string) => Promise<void>;
  onMemberBlocked?: (userId: string) => void;
  conversationId: string;
}

export interface StorageViewProps {
  conversationId: string;
  initialTab: StorageTab;
  onBack: () => void;
  messages: Message[];
  linkMessages?: LinkData[];
  members?: ConversationMember[];
  onMediaClick: (messageId: string, imageIndex: number) => void;
}

export interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  badge?: number;
  onClick?: () => void;
  showIndicator?: boolean;
}

export interface PinnedMessagesProps {
  messages: Message[];
  conversationId: string;
  currentUserId: string;
  onUnpin: (msgId: string) => void;
}

export interface GroupActionsProps {
  conversation: Conversation;
  currentUserId: string;
  isOwner?: boolean;
  isDissolved?: boolean;
  relationship?: any;
  onUnfriend?: () => void;
  onLeaveSuccess: () => void;
  onActionSuccess?: () => Promise<void> | void;
  onRelationshipChange?: (rel: any) => void;
}

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentMembers: ConversationMember[];
  onMembersAdded: (members: ConversationMember[]) => void;
}
