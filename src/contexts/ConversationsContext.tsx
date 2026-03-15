import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, ConversationWithParticipant, Category } from '../types';
import { ConversationService } from '../services';
import type { Participant } from '../types';

interface ConversationsContextType {
  // State
  conversations: ConversationWithParticipant[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: ConversationWithParticipant[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Update methods (no reload needed)
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  updateParticipant: (conversationId: string, updates: Partial<Participant>) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  removeCategory: (categoryId: string) => void;
  
  // Refresh from API
  refreshConversations: (userId: string) => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider: React.FC<ConversationsProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update specific conversation without reloading
  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(item => 
        item.conversation._id === conversationId 
          ? { ...item, conversation: { ...item.conversation, ...updates } }
          : item
      )
    );
  }, []);

  // Update participant settings
  const updateParticipant = useCallback((conversationId: string, updates: Partial<Participant>) => {
    setConversations(prev => 
      prev.map(item => 
        item.conversation._id === conversationId 
          ? { ...item, participant: { ...item.participant, ...updates } }
          : item
      )
    );
  }, []);

  // Add new conversation
  const addConversation = useCallback((conversation: Conversation) => {
    // When adding new conversation, we don't have participant data yet
    // Will be loaded on refresh
    const newItem: ConversationWithParticipant = {
      conversation,
      participant: {
        _id: '',
        user_id: '',
        conversation_id: conversation._id,
        settings: {
          is_pinned: false,
          notification_status: 'on',
        },
        last_read_message_id: '0',
        last_read_at: new Date().toISOString(),
        deleted_msg_id: "0",
        joined_at: new Date().toISOString(),
        roles: 'user',
      },
    };
    setConversations(prev => [newItem, ...prev]);
  }, []);

  // Remove conversation
  const removeConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(item => item.conversation._id !== conversationId));
  }, []);

  // Add new category
  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category]);
  }, []);

  // Update category
  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    setCategories(prev =>
      prev.map(cat =>
        cat._id === categoryId
          ? { ...cat, ...updates }
          : cat
      )
    );
  }, []);

  // Remove category
  const removeCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat._id !== categoryId));
    // Also remove category_id from participant settings
    setConversations(prev =>
      prev.map(item =>
        item.participant.settings.category_id === categoryId
          ? { 
              ...item, 
              participant: { 
                ...item.participant, 
                settings: { ...item.participant.settings, category_id: null } 
              } 
            }
          : item
      )
    );
  }, []);

  // Refresh conversations from API
  const refreshConversations = useCallback(async (userId: string) => {
    try {
      const loadedConversations = await ConversationService.getUserConversations(userId);
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  }, []);

  const value: ConversationsContextType = {
    conversations,
    categories,
    loading,
    error,
    setConversations,
    setCategories,
    setLoading,
    setError,
    updateConversation,
    updateParticipant,
    addConversation,
    removeConversation,
    addCategory,
    updateCategory,
    removeCategory,
    refreshConversations,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = (): ConversationsContextType => {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used within ConversationsProvider');
  }
  return context;
};
