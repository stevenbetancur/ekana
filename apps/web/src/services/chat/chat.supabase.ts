import { supabase } from '@/integrations/supabase/client';
import { mapMessage } from '@/lib/supabase-mapper';
import { ChatService, SendMessageOptions, Message } from './types';

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

/**
 * Supabase implementation of ChatService.
 * 
 * Uses the messages table with support for:
 * - Team messages (team_id set, no receiver_id)
 * - Direct messages (receiver_id set, no team_id)
 * - Thread replies (thread_id references parent message)
 * - Real-time subscriptions
 */
export const supabaseChatService: ChatService = {
  /**
   * Fetch all top-level messages for a team (no thread_id).
   */
  async fetchTeamMessages(teamId: string): Promise<Message[]> {
    console.log('🔍 [ChatService] Fetching team messages:', teamId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('team_id', teamId)
      .is('thread_id', null)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [ChatService] Failed to fetch team messages:', error);
      throw new Error(`Failed to fetch team messages: ${error.message}`);
    }

    console.log('✅ [ChatService] Fetched team messages:', data?.length || 0);
    return (data || []).map((row) => mapMessage(row as Record<string, unknown>));
  },

  /**
   * Fetch all direct messages between two users.
   * Uses OR filter to get messages in both directions.
   */
  async fetchDirectMessages(userAId: string, userBId: string): Promise<Message[]> {
    console.log('🔍 [ChatService] Fetching DMs between:', userAId, userBId);

    // Supabase doesn't have direct OR support, so we make two queries
    const { data: sentData, error: sentError } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userAId)
      .eq('is_deleted', false)
      .is('thread_id', null)
      .not('team_id', 'is', null); // This is wrong - we want DMs without team_id

    // Actually, let's use a different approach with .or()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .is('thread_id', null)
      .eq('is_deleted', false)
      .is('team_id', null) // DMs don't have team_id
      .or(`and(user_id.eq.${userAId}),and(user_id.eq.${userBId})`);

    if (error) {
      console.error('❌ [ChatService] Failed to fetch direct messages:', error);
      throw new Error(`Failed to fetch direct messages: ${error.message}`);
    }

    // Filter in JS to ensure correct pairing (Supabase OR is tricky)
    const filtered = (data || []).filter((msg) => {
      const isAToB = msg.user_id === userAId && msg.receiver_id === userBId;
      const isBToA = msg.user_id === userBId && msg.receiver_id === userAId;
      return isAToB || isBToA;
    });

    console.log('✅ [ChatService] Fetched DMs:', filtered.length);
    return filtered
      .map((row) => mapMessage(row as Record<string, unknown>))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  /**
   * Fetch all replies to a specific thread.
   */
  async fetchThreadMessages(threadId: string): Promise<Message[]> {
    console.log('🔍 [ChatService] Fetching thread messages:', threadId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ [ChatService] Failed to fetch thread messages:', error);
      throw new Error(`Failed to fetch thread messages: ${error.message}`);
    }

    console.log('✅ [ChatService] Fetched thread messages:', data?.length || 0);
    return (data || []).map((row) => mapMessage(row as Record<string, unknown>));
  },

  /**
   * Send a new message.
   */
  async sendMessage(options: SendMessageOptions): Promise<Message> {
    const { userId, text, teamId, receiverId, threadId } = options;
    const handle = detectHandle(text);

    console.log('📤 [ChatService] Sending message:', { userId, teamId, receiverId, threadId });

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        text,
        team_id: teamId || null,
        thread_id: threadId || null,
        handle: handle || null,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [ChatService] Failed to send message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }

    console.log('✅ [ChatService] Message sent:', data.id);

    // Map and add receiverId (not stored in DB for DMs - handle differently)
    const message = mapMessage(data as Record<string, unknown>);
    if (receiverId) {
      message.receiverId = receiverId;
    }

    return message;
  },

  /**
   * Mark a reply as the best response for a thread.
   */
  async markBestResponse(parentMessageId: string, replyMessageId: string): Promise<void> {
    console.log('⭐ [ChatService] Marking best response:', { parentMessageId, replyMessageId });

    const { error } = await supabase
      .from('messages')
      .update({ best_response_id: replyMessageId })
      .eq('id', parentMessageId);

    if (error) {
      console.error('❌ [ChatService] Failed to mark best response:', error);
      throw new Error(`Failed to mark best response: ${error.message}`);
    }

    console.log('✅ [ChatService] Best response marked');
  },

  /**
   * Edit an existing message.
   */
  async editMessage(messageId: string, newText: string): Promise<void> {
    console.log('✏️ [ChatService] Editing message:', messageId);

    const { error } = await supabase
      .from('messages')
      .update({ text: newText, updated_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) {
      console.error('❌ [ChatService] Failed to edit message:', error);
      throw new Error(`Failed to edit message: ${error.message}`);
    }

    console.log('✅ [ChatService] Message edited');
  },

  /**
   * Delete a message (soft delete).
   */
  async deleteMessage(messageId: string): Promise<void> {
    console.log('🗑️ [ChatService] Deleting message:', messageId);

    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    if (error) {
      console.error('❌ [ChatService] Failed to delete message:', error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }

    console.log('✅ [ChatService] Message deleted (soft)');
  },

  /**
   * Subscribe to real-time message updates for a team.
   */
  subscribeToTeamMessages(
    teamId: string,
    onMessage: (message: Message) => void,
    onUpdate?: (message: Message) => void,
    onDelete?: (messageId: string) => void
  ): () => void {
    console.log('🔔 [ChatService] Subscribing to team messages:', teamId);

    const channel = supabase
      .channel(`team-messages-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log('📨 [ChatService] New message received:', payload.new);
          const message = mapMessage(payload.new as Record<string, unknown>);
          onMessage(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.is_deleted && onDelete) {
            console.log('🗑️ [ChatService] Message deleted:', updated.id);
            onDelete(updated.id as string);
          } else if (onUpdate) {
            console.log('✏️ [ChatService] Message updated:', updated.id);
            onUpdate(mapMessage(updated));
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      console.log('🔕 [ChatService] Unsubscribing from team messages:', teamId);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to real-time direct message updates.
   */
  subscribeToDirectMessages(
    userAId: string,
    userBId: string,
    onMessage: (message: Message) => void
  ): () => void {
    console.log('🔔 [ChatService] Subscribing to DMs:', userAId, userBId);

    const channel = supabase
      .channel(`dm-${userAId}-${userBId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Record<string, unknown>;
          // Filter for DMs between these two users
          const isRelevant =
            (newMsg.user_id === userAId || newMsg.user_id === userBId) &&
            !newMsg.team_id &&
            !newMsg.thread_id;

          if (isRelevant) {
            console.log('📨 [ChatService] New DM received:', newMsg);
            onMessage(mapMessage(newMsg));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 [ChatService] Unsubscribing from DMs');
      supabase.removeChannel(channel);
    };
  },
};




