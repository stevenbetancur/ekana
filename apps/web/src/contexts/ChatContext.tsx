import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Message } from '@/lib/mockData';
import { chatService, SendMessageOptions } from '@/services/chat';
import { useGamificationContext } from './GamificationContext';
import { useAuth } from './AuthContext';

const LAST_READ_KEY = 'ekana-last-read';
const dataMode = import.meta.env.VITE_DATA_MODE || 'local';

interface ChatContextType {
  messages: Message[];
  getTeamMessages: (teamId: string) => Message[];
  sendMessage: (options: SendMessageOptions) => void;
  getDirectMessages: (userAId: string, userBId: string) => Message[];
  getThreadMessages: (threadId: string) => Message[];
  markBestResponse: (parentMessageId: string, replyMessageId: string) => void;
  getUnreadCount: (conversationId: string, currentUserId: string) => number;
  markAsRead: (conversationId: string) => void;
  editMessage: (messageId: string, newText: string) => void;
  deleteMessage: (messageId: string) => void;
  isLoading: boolean;
  refreshTeamMessages: (teamId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { awardPoints } = useGamificationContext();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // Track last read timestamps for conversations
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(LAST_READ_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Failed to load last read timestamps:', error);
    }
    return {};
  });

  // Persist last read timestamps
  useEffect(() => {
    try {
      localStorage.setItem(LAST_READ_KEY, JSON.stringify(lastReadTimestamps));
    } catch (error) {
      console.error('❌ Failed to save last read timestamps:', error);
    }
  }, [lastReadTimestamps]);

  // Fetch team messages (with caching)
  const refreshTeamMessages = useCallback(async (teamId: string) => {
    setIsLoading(true);
    try {
      const teamMessages = await chatService.fetchTeamMessages(teamId);
      setMessages((prev) => {
        // Merge with existing messages (replace team messages, keep others)
        const otherMessages = prev.filter((m) => m.teamId !== teamId || m.threadId);
        return [...otherMessages, ...teamMessages];
      });
      setActiveTeamId(teamId);
    } catch (error) {
      console.error('❌ Failed to fetch team messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to real-time updates for Supabase mode
  useEffect(() => {
    if (dataMode !== 'supabase' || !activeTeamId || !chatService.subscribeToTeamMessages) {
      return;
    }

    const unsubscribe = chatService.subscribeToTeamMessages(
      activeTeamId,
      // On new message
      (message) => {
        setMessages((prev) => [...prev, message]);
      },
      // On message update
      (message) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      },
      // On message delete
      (messageId) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTeamId]);

  // Get all top-level messages for a team (no threadId)
  const getTeamMessages = useCallback((teamId: string): Message[] => {
    // Trigger fetch if not already loaded
    if (teamId !== activeTeamId) {
      refreshTeamMessages(teamId);
    }
    return messages
      .filter((msg) => msg.teamId === teamId && !msg.threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, activeTeamId, refreshTeamMessages]);

  // Get all direct messages between two users
  const getDirectMessages = useCallback((userAId: string, userBId: string): Message[] => {
    // For Supabase mode, we might need to fetch these separately
    // For now, filter from loaded messages
    return messages
      .filter(
        (msg) =>
          !msg.threadId &&
          msg.receiverId &&
          ((msg.userId === userAId && msg.receiverId === userBId) ||
            (msg.userId === userBId && msg.receiverId === userAId))
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // Get all replies to a specific thread
  const getThreadMessages = useCallback((threadId: string): Message[] => {
    return messages
      .filter((msg) => msg.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages]);

  // Fetch thread messages when needed
  const fetchThreadMessages = useCallback(async (threadId: string) => {
    try {
      const threadMessages = await chatService.fetchThreadMessages(threadId);
      setMessages((prev) => {
        const existingThreadIds = new Set(prev.filter((m) => m.threadId === threadId).map((m) => m.id));
        const newMessages = threadMessages.filter((m) => !existingThreadIds.has(m.id));
        return [...prev, ...newMessages];
      });
    } catch (error) {
      console.error('❌ Failed to fetch thread messages:', error);
    }
  }, []);

  // Send a new message (top-level, reply, or direct message)
  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    const { userId, text, teamId, receiverId, threadId } = options;

    try {
      const newMessage = await chatService.sendMessage(options);

      // Add to local state immediately
      setMessages((prev) => [...prev, newMessage]);
      console.log('✅ Message sent:', newMessage);

      // Award points for handle-based messages
      if (newMessage.handle && teamId) {
        if (!threadId) {
          // Starting a new @handle thread
          console.log('DEBUG: @handle detected', newMessage.handle, 'in new message:', newMessage);
          awardPoints(
            userId,
            5,
            'Started a @handle thread',
            teamId,
            `msg-handle-${newMessage.id}`
          );
        } else {
          // Replying to a thread - check if parent has a handle
          const parentMessage = messages.find((msg) => msg.id === threadId);
          if (parentMessage?.handle) {
            console.log('DEBUG: Reply to @handle thread detected. Triggering awardPoints.', {
              userId,
              threadId,
              teamId,
            });
            awardPoints(userId, 5, 'Replied to @handle thread', teamId, `reply-to-${threadId}-${userId}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }, [messages, awardPoints]);

  // Mark a reply as the best response for a thread
  const markBestResponse = useCallback(async (parentMessageId: string, replyMessageId: string) => {
    try {
      await chatService.markBestResponse(parentMessageId, replyMessageId);

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === parentMessageId ? { ...msg, bestResponseId: replyMessageId } : msg
        )
      );
      console.log('⭐ Marked best response:', { parentMessageId, replyMessageId });

      // Award points to the person who wrote the best response
      const replyMessage = messages.find((msg) => msg.id === replyMessageId);
      if (replyMessage) {
        console.log(
          'DEBUG: Mark best response triggered. Triggering awardPoints for user:',
          replyMessage.userId
        );
        awardPoints(
          replyMessage.userId,
          50,
          'Best response in @handle thread',
          replyMessage.teamId,
          `best-reply-${replyMessageId}`
        );
      }
    } catch (error) {
      console.error('❌ Failed to mark best response:', error);
    }
  }, [messages, awardPoints]);

  // Get unread count for a conversation
  const getUnreadCount = useCallback((conversationId: string, currentUserId: string): number => {
    const lastRead = lastReadTimestamps[conversationId];
    if (!lastRead) {
      // If never read, count all messages from others
      return messages.filter((msg) => {
        // For team channels
        if (msg.teamId === conversationId && !msg.threadId && msg.userId !== currentUserId) {
          return true;
        }
        // For DMs (conversationId format: "dm-{userId}")
        if (conversationId.startsWith('dm-')) {
          const otherUserId = conversationId.replace('dm-', '');
          if (
            msg.receiverId &&
            !msg.threadId &&
            ((msg.userId === otherUserId && msg.receiverId === currentUserId) ||
              (msg.userId === currentUserId && msg.receiverId === otherUserId))
          ) {
            return msg.userId !== currentUserId;
          }
        }
        return false;
      }).length;
    }

    // Count messages newer than lastRead from others
    const lastReadTime = new Date(lastRead).getTime();
    return messages.filter((msg) => {
      const msgTime = new Date(msg.timestamp).getTime();
      if (msgTime <= lastReadTime || msg.userId === currentUserId) return false;

      // For team channels
      if (msg.teamId === conversationId && !msg.threadId) {
        return true;
      }
      // For DMs
      if (conversationId.startsWith('dm-')) {
        const otherUserId = conversationId.replace('dm-', '');
        if (
          msg.receiverId &&
          !msg.threadId &&
          ((msg.userId === otherUserId && msg.receiverId === currentUserId) ||
            (msg.userId === currentUserId && msg.receiverId === otherUserId))
        ) {
          return true;
        }
      }
      return false;
    }).length;
  }, [messages, lastReadTimestamps]);

  // Mark a conversation as read
  const markAsRead = useCallback((conversationId: string) => {
    // Find the latest message timestamp for this conversation
    let latestTimestamp = '';

    if (conversationId.startsWith('dm-')) {
      const otherUserId = conversationId.replace('dm-', '');
      const dmMessages = messages.filter(
        (msg) =>
          msg.receiverId &&
          !msg.threadId &&
          (msg.userId === otherUserId || msg.receiverId === otherUserId)
      );
      if (dmMessages.length > 0) {
        latestTimestamp = dmMessages[dmMessages.length - 1].timestamp;
      }
    } else {
      // Team channel
      const teamMessages = messages.filter((msg) => msg.teamId === conversationId && !msg.threadId);
      if (teamMessages.length > 0) {
        latestTimestamp = teamMessages[teamMessages.length - 1].timestamp;
      }
    }

    if (latestTimestamp) {
      setLastReadTimestamps((prev) => ({
        ...prev,
        [conversationId]: latestTimestamp,
      }));
    }
  }, [messages]);

  // Edit a message
  const editMessage = useCallback(async (messageId: string, newText: string) => {
    try {
      await chatService.editMessage(messageId, newText);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, text: newText } : msg))
      );
      console.log('✏️ Message edited:', messageId);
    } catch (error) {
      console.error('❌ Failed to edit message:', error);
    }
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      console.log('🗑️ Message deleted:', messageId);
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        getTeamMessages,
        sendMessage,
        getDirectMessages,
        getThreadMessages,
        markBestResponse,
        getUnreadCount,
        markAsRead,
        editMessage,
        deleteMessage,
        isLoading,
        refreshTeamMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
