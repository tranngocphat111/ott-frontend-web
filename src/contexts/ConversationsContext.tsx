import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Conversation, Category } from '../types';

interface ConversationsContextType {
  // State
  conversations: Conversation[];
  categories: Category[];
  loading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setCategories: (categories: Category[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Update methods (no reload needed)
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  addConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  removeCategory: (categoryId: string) => void;
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

interface ConversationsProviderProps {
  children: ReactNode;
}

export const ConversationsProvider: React.FC<ConversationsProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update specific conversation without reloading
  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, ...updates }
          : conv
      )
    );
  }, []);

  // Add new conversation
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  }, []);

  // Remove conversation
  const removeConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv._id !== conversationId));
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
    // Also remove category_id from conversations
    setConversations(prev =>
      prev.map(conv =>
        conv.category_id === categoryId
          ? { ...conv, category_id: undefined }
          : conv
      )
    );
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
    addConversation,
    removeConversation,
    addCategory,
    updateCategory,
    removeCategory,
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
