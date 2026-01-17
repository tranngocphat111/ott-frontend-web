// Conversation related interfaces
export type {
  ConversationListProps,
  ConversationItemProps,
} from './conversation.interface';

// Chat related interfaces
export type {
  ChatLayoutProps,
  ChatAreaProps,
} from './chat.interface';

// Sidebar interfaces
export type { SidebarProps } from './sidebar.interface';

// Navigation interfaces
export type {
  NavigationSidebarProps,
  NavigationItem,
} from './navigation.interface';

// Common component interfaces
export type {
  AvatarProps,
  LoadingSkeletonProps,
  ErrorStateProps,
} from './common.interface';

// Service interfaces
export type {
  LoadingState,
  ChatServiceResponse,
} from './service.interface';

// Re-export types
export type { Conversation, Message, Participant, User, MessageAttachment } from '../types';