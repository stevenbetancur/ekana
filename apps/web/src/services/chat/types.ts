import { Message } from '@/lib/mockData';

/**
 * Chat Service Interface
 * 
 * Defines the contract for chat/messaging operations.
 * Implementations exist for both localStorage (local) and Supabase backends.
 */

export interface SendMessageOptions {
  userId: string;
  text: string;
  teamId?: string;
  receiverId?: string;
  threadId?: string;
}

export interface ChatService {
  /**
   * Fetch all messages for a specific team (top-level only, no threads).
   */
  fetchTeamMessages(teamId: string): Promise<Message[]>;

  /**
   * Fetch all direct messages between two users.
   */
  fetchDirectMessages(userAId: string, userBId: string): Promise<Message[]>;

  /**
   * Fetch all replies to a specific thread.
   */
  fetchThreadMessages(threadId: string): Promise<Message[]>;

  /**
   * Send a new message (team message, direct message, or thread reply).
   */
  sendMessage(options: SendMessageOptions): Promise<Message>;

  /**
   * Mark a reply as the best response for a thread.
   */
  markBestResponse(parentMessageId: string, replyMessageId: string): Promise<void>;

  /**
   * Edit an existing message.
   */
  editMessage(messageId: string, newText: string): Promise<void>;

  /**
   * Delete a message (soft delete).
   */
  deleteMessage(messageId: string): Promise<void>;

  /**
   * Subscribe to real-time message updates for a team.
   * Returns an unsubscribe function.
   */
  subscribeToTeamMessages?(
    teamId: string,
    onMessage: (message: Message) => void,
    onUpdate?: (message: Message) => void,
    onDelete?: (messageId: string) => void
  ): () => void;

  /**
   * Subscribe to real-time direct message updates.
   * Returns an unsubscribe function.
   */
  subscribeToDirectMessages?(
    userAId: string,
    userBId: string,
    onMessage: (message: Message) => void
  ): () => void;
}

export type { Message };




