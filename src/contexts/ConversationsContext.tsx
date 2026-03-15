import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, ConversationWithParticipant, Category } from '../types';
import { ConversationService, socketService } from '../services';
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

  // Cập nhật conversation list khi có tin nhắn mới từ socket (real-time)
  const handleIncomingMessage = useCallback((message: any) => {
    const convId = message.conversation_id?.toString();
    if (!convId) return;

    setConversations(prev => {
      const targetIndex = prev.findIndex(item => item.conversation._id === convId);
      if (targetIndex === -1) return prev;

      const rawContent: string = Array.isArray(message.content)
        ? message.content[0] || ""
        : message.content || "";

      let displayContent = "";
      switch (message.type) {
        case "image": displayContent = "[Hình ảnh]"; break;
        case "video": displayContent = "[Video]"; break;
        case "file":  displayContent = "[Tệp tin]"; break;
        default:
          displayContent = rawContent.length > 50
            ? rawContent.substring(0, 50) + "..."
            : rawContent;
      }

      const existing = prev[targetIndex];
      const updated: ConversationWithParticipant = {
        ...existing,
        conversation: {
          ...existing.conversation,
          last_message: {
            msg_id:      message.msg_id,
            sender_id:   message.sender_id,
            sender_name: message.sender_name || "",
            content:     displayContent,
            type:        message.type,
            createdAt:   message.createdAt || new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
      };

      // Lấy conversation ra đặt lên đầu, sort tiếp theo sẽ giữ đúng thứ tự pinned/unpinned
      const newList = [...prev];
      newList.splice(targetIndex, 1);
      newList.unshift(updated);
      return newList;
    });
  }, []);

  // Kết nối socket và đăng ký lắng nghe tin nhắn mới để cập nhật conversation list
  useEffect(() => {
    socketService.connect();
    socketService.onNewMessage(handleIncomingMessage);
    return () => {
      socketService.offNewMessage(handleIncomingMessage);
    };
  }, [handleIncomingMessage]);

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
      setConversations(prev => {
        return loadedConversations.map(newItem => {
          const convId = newItem.conversation._id;
          const dbId = newItem.participant.last_read_message_id || "0";

          // Lấy giá trị in-memory (optimistic update trong session hiện tại)
          const existing = prev.find(p => p.conversation._id === convId);
          const inMemId = existing?.participant.last_read_message_id || "0";

          // Lấy giá trị từ localStorage (fallback khi API lỗi hoặc sau F5)
          const lsId = localStorage.getItem(`read_${convId}_${userId}`) || "0";

          // Dùng giá trị lớn nhất trong 3 nguồn
          const candidates = [dbId, inMemId, lsId].filter(id => id !== "0");
          if (candidates.length === 0) return newItem;

          const bestId = candidates.reduce((max, id) =>
            BigInt(id) > BigInt(max) ? id : max
          );

          return BigInt(bestId) > BigInt(dbId)
            ? { ...newItem, participant: { ...newItem.participant, last_read_message_id: bestId } }
            : newItem;
        });
      });
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
