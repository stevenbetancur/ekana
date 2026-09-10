import { Message, mockMessages } from '@/lib/mockData';
import { ChatService, SendMessageOptions } from './types';

const STORAGE_KEY = 'ekana-messages';
const STORAGE_VERSION = '1.0';

interface StorageEnvelope {
  version: string;
  lastUpdated: string;
  data: Message[];
}

const loadMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const envelope: StorageEnvelope = JSON.parse(stored);
      if (envelope.version === STORAGE_VERSION) {
        return envelope.data;
      }
    }
  } catch (error) {
    console.warn('Failed to load messages from localStorage:', error);
  }
  // Seed from mock data
  saveMessages(mockMessages);
  return mockMessages;
};

const saveMessages = (messages: Message[]): void => {
  try {
    const envelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      data: messages,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
};

/**
 * Detect handle in message text.
 */
const detectHandle = (text: string): Message['handle'] => {
  if (text.includes('@question')) return 'question';
  if (text.includes('@support')) return 'support';
  if (text.includes('@motivation')) return 'motivation';
  if (text.includes('@exercise')) return 'exercise';
  return null;
};

export const localChatService: ChatService = {
  fetchTeamMessages: async (teamId: string): Promise<Message[]> => {
    const all = loadMessages();
    return all
      .filter(msg => msg.teamId === teamId && !msg.threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  fetchDirectMessages: async (userAId: string, userBId: string): Promise<Message[]> => {
    const all = loadMessages();
    return all
      .filter(msg =>
        !msg.threadId &&
        msg.receiverId &&
        (
          (msg.userId === userAId && msg.receiverId === userBId) ||
          (msg.userId === userBId && msg.receiverId === userAId)
        )
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  fetchThreadMessages: async (threadId: string): Promise<Message[]> => {
    const all = loadMessages();
    return all
      .filter(msg => msg.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: async (options: SendMessageOptions): Promise<Message> => {
    const { userId, text, teamId, receiverId, threadId } = options;
    const handle = detectHandle(text);

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      teamId,
      userId,
      senderId: userId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      threadId,
      handle,
    };

    const all = loadMessages();
    const updated = [...all, newMessage];
    saveMessages(updated);

    console.log('✅ [ChatService] Message sent:', newMessage.id);
    return newMessage;
  },

  markBestResponse: async (parentMessageId: string, replyMessageId: string): Promise<void> => {
    const all = loadMessages();
    const updated = all.map(msg =>
      msg.id === parentMessageId
        ? { ...msg, bestResponseId: replyMessageId }
        : msg
    );
    saveMessages(updated);
    console.log('⭐ [ChatService] Marked best response:', { parentMessageId, replyMessageId });
  },

  editMessage: async (messageId: string, newText: string): Promise<void> => {
    const all = loadMessages();
    const updated = all.map(msg =>
      msg.id === messageId
        ? { ...msg, text: newText }
        : msg
    );
    saveMessages(updated);
    console.log('✏️ [ChatService] Message edited:', messageId);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    const all = loadMessages();
    const updated = all.filter(msg => msg.id !== messageId);
    saveMessages(updated);
    console.log('🗑️ [ChatService] Message deleted:', messageId);
  },
};




