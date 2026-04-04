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
}

export interface LinkData {
  _id: string;
  msg_id: string;
  links: string[];
  sender_id: string;
  createdAt: string;
}

export type ViewMode = "main" | "members" | "storage";
export type StorageTab = "media" | "files" | "links";

// Sidebar Sub-Component Props
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
  isOwner: boolean;
  onBack: () => void;
  onMemberRemoved: (userId: string) => void;
  onMemberRoleUpdated: (userId: string, newRole: "admin" | "user") => void;
  onAddMember: () => void;
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
  onLeaveSuccess: () => void;
}

export interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentMembers: ConversationMember[];
  onMembersAdded: (members: ConversationMember[]) => void;
}
