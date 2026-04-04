/**
 * Chat Context Hook
 * Manages message state for React components
 * - Load initial messages (from Redis cache)
 * - Handle load older messages (scroll up)
 * - Real-time message updates via Socket.IO
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import io from 'socket.io-client';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState({}); // conversationId -> messages[]
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState({}); // conversationId -> hasMore flag

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_CHAT_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✓ Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  /**
   * Load message history when opening conversation
   * Uses Redis cache (last 20 messages)
   *
   * @param {string} conversationId
   */
  const loadMessages = useCallback(
    (conversationId) => {
      if (!socket) return;

      setLoading(true);

      // Emit to backend to load history
      socket.emit('tai_lich_su_tin_nhan', { conversationId });

      // Listen for response
      socket.once('lich_su_tin_nhan_da_tai', (data) => {
        if (data.success) {
          console.log(
            `✓ Loaded ${data.messageCount} messages (source: ${data.source})`
          );

          setMessages((prev) => ({
            ...prev,
            [conversationId]: data.messages,
          }));

          // Initialize hasMore flag based on message count
          setHasMore((prev) => ({
            ...prev,
            [conversationId]: data.messageCount === 20, // If 20 messages, likely more exist
          }));
        } else {
          console.error('Error loading messages:', data.error);
        }

        setLoading(false);
      });

      socket.once('loi_tai_tin_nhan', (error) => {
        console.error('Error:', error);
        setLoading(false);
      });
    },
    [socket]
  );

  /**
   * Load older messages (pagination)
   * Called when user scrolls to the top
   *
   * @param {string} conversationId
   */
  const loadOlderMessages = useCallback(
    async (conversationId) => {
      if (!socket) return;

      const currentMessages = messages[conversationId] || [];

      if (currentMessages.length === 0) {
        console.warn('No messages loaded yet');
        return;
      }

      // Get the oldest message timestamp
      const oldestMessage = currentMessages[0];
      const beforeTimestamp = new Date(oldestMessage.createdAt).getTime();

      console.log(
        `📥 Loading older messages before ${new Date(beforeTimestamp).toISOString()}`
      );

      try {
        // Fetch from REST API (MongoDB)
        const response = await fetch(
          `${process.env.REACT_APP_CHAT_API_URL}/conversations/${conversationId}/messages/older?before=${beforeTimestamp}&limit=20`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          console.log(`✓ Loaded ${data.messageCount} older messages`);

          // Prepend older messages to the beginning
          setMessages((prev) => ({
            ...prev,
            [conversationId]: [...data.messages, ...prev[conversationId]],
          }));

          // Update hasMore flag
          setHasMore((prev) => ({
            ...prev,
            [conversationId]: data.hasMore,
          }));
        } else {
          console.error('Error:', data.error);
        }
      } catch (error) {
        console.error('Error loading older messages:', error);
      }
    },
    [socket, messages]
  );

  /**
   * Send a new message
   *
   * @param {string} conversationId
   * @param {string} userId
   * @param {string} text
   */
  const sendMessage = useCallback(
    (conversationId, userId, text) => {
      if (!socket) return;

      socket.emit('gui_tin_nhan', {
        conversationId,
        userId,
        text,
        type: 'text',
      });
    },
    [socket]
  );

  /**
   * Edit a message
   *
   * @param {string} conversationId
   * @param {string} messageId
   * @param {string} newText
   */
  const editMessage = useCallback(
    (conversationId, messageId, newText) => {
      if (!socket) return;

      socket.emit('chinh_sua_tin_nhan', {
        conversationId,
        messageId,
        text: newText,
      });
    },
    [socket]
  );

  /**
   * Delete a message
   *
   * @param {string} conversationId
   * @param {string} messageId
   */
  const deleteMessage = useCallback(
    (conversationId, messageId) => {
      if (!socket) return;

      socket.emit('xoa_tin_nhan', {
        conversationId,
        messageId,
      });
    },
    [socket]
  );

  /**
   * Add reaction to a message
   *
   * @param {string} conversationId
   * @param {string} messageId
   * @param {string} userId
   * @param {string} emoji
   */
  const addReaction = useCallback(
    (conversationId, messageId, userId, emoji) => {
      if (!socket) return;

      socket.emit('them_reaction', {
        conversationId,
        messageId,
        userId,
        emoji,
      });
    },
    [socket]
  );

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket) return;

    // New message arrives
    const handleNewMessage = (data) => {
      if (data.success) {
        const { message } = data;

        console.log(`✓ New message received: ${message._id}`);

        setMessages((prev) => ({
          ...prev,
          [message.conversationId]: [
            ...(prev[message.conversationId] || []),
            message,
          ],
        }));
      }
    };

    // Message edited
    const handleEditMessage = (data) => {
      if (data.success) {
        const { messageId, text, editedAt, isEdited } = data;

        console.log(`✓ Message edited: ${messageId}`);

        setMessages((prev) => {
          const updated = { ...prev };

          for (const convId in updated) {
            updated[convId] = updated[convId].map((msg) =>
              msg._id === messageId
                ? { ...msg, text, editedAt, isEdited }
                : msg
            );
          }

          return updated;
        });
      }
    };

    // Message deleted
    const handleDeleteMessage = (data) => {
      if (data.success) {
        const { messageId } = data;

        console.log(`✓ Message deleted: ${messageId}`);

        setMessages((prev) => {
          const updated = { ...prev };

          for (const convId in updated) {
            updated[convId] = updated[convId].filter(
              (msg) => msg._id !== messageId
            );
          }

          return updated;
        });
      }
    };

    // Reaction added
    const handleReaction = (data) => {
      if (data.success) {
        const { messageId, emoji, reactions } = data;

        console.log(`✓ Reaction added: ${emoji}`);

        setMessages((prev) => {
          const updated = { ...prev };

          for (const convId in updated) {
            updated[convId] = updated[convId].map((msg) =>
              msg._id === messageId ? { ...msg, reactions } : msg
            );
          }

          return updated;
        });
      }
    };

    socket.on('nhan_tin_nhan_moi', handleNewMessage);
    socket.on('tin_nhan_da_chinh_sua', handleEditMessage);
    socket.on('tin_nhan_da_xoa', handleDeleteMessage);
    socket.on('reaction_da_them', handleReaction);

    return () => {
      socket.off('nhan_tin_nhan_moi', handleNewMessage);
      socket.off('tin_nhan_da_chinh_sua', handleEditMessage);
      socket.off('tin_nhan_da_xoa', handleDeleteMessage);
      socket.off('reaction_da_them', handleReaction);
    };
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        messages,
        loading,
        hasMore,
        loadMessages,
        loadOlderMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

/**
 * Hook to use chat context
 */
export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }

  return context;
};
