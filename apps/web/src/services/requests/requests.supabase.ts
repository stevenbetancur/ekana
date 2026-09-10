import { supabase } from '@/integrations/supabase/client';
import { mapRequest } from '@/lib/supabase-mapper';
import { RequestService, Request, RequestType } from './types';

/**
 * Supabase implementation of RequestService.
 * 
 * Uses the requests table with proper enum types for:
 * - request_type: CREATE_TEAM, INVITE_TO_TEAM, REQUEST_TO_JOIN
 * - request_status: pending, accepted, rejected, expired
 */
export const supabaseRequestService: RequestService = {
  /**
   * Fetch all pending requests for a user (received requests).
   */
  async fetchUserRequests(userId: string): Promise<Request[]> {
    console.log('🔍 [RequestService] Fetching user requests:', userId);

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [RequestService] Failed to fetch user requests:', error);
      throw new Error(`Failed to fetch user requests: ${error.message}`);
    }

    console.log('✅ [RequestService] Fetched user requests:', data?.length || 0);
    return (data || []).map((row) => mapRequest(row as Record<string, unknown>));
  },

  /**
   * Fetch all requests sent by a user.
   */
  async fetchSentRequests(userId: string): Promise<Request[]> {
    console.log('🔍 [RequestService] Fetching sent requests:', userId);

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [RequestService] Failed to fetch sent requests:', error);
      throw new Error(`Failed to fetch sent requests: ${error.message}`);
    }

    console.log('✅ [RequestService] Fetched sent requests:', data?.length || 0);
    return (data || []).map((row) => mapRequest(row as Record<string, unknown>));
  },

  /**
   * Fetch a single request by ID.
   */
  async fetchRequest(requestId: string): Promise<Request | null> {
    console.log('🔍 [RequestService] Fetching request:', requestId);

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📭 [RequestService] Request not found:', requestId);
        return null;
      }
      console.error('❌ [RequestService] Failed to fetch request:', error);
      throw new Error(`Failed to fetch request: ${error.message}`);
    }

    console.log('✅ [RequestService] Fetched request:', data.id);
    return mapRequest(data as Record<string, unknown>);
  },

  /**
   * Create a new request.
   */
  async createRequest(
    requestData: Omit<Request, 'id' | 'status' | 'createdAt'>
  ): Promise<Request> {
    console.log('📤 [RequestService] Creating request:', requestData.type);

    const { data, error } = await supabase
      .from('requests')
      .insert({
        type: requestData.type,
        sender_id: requestData.senderId,
        recipient_id: requestData.recipientId,
        status: 'pending',
        message: requestData.message || null,
        team_id: requestData.teamId || null,
        roadmap_id: requestData.roadmapId || null,
        new_team_name: requestData.newTeamName || null,
        make_admin: requestData.makeAdmin || false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [RequestService] Failed to create request:', error);
      throw new Error(`Failed to create request: ${error.message}`);
    }

    console.log('✅ [RequestService] Request created:', data.id);
    return mapRequest(data as Record<string, unknown>);
  },

  /**
   * Accept a request.
   */
  async acceptRequest(requestId: string): Promise<void> {
    console.log('✅ [RequestService] Accepting request:', requestId);

    const { error } = await supabase
      .from('requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('❌ [RequestService] Failed to accept request:', error);
      throw new Error(`Failed to accept request: ${error.message}`);
    }

    console.log('✅ [RequestService] Request accepted');
  },

  /**
   * Reject a request.
   */
  async rejectRequest(requestId: string): Promise<void> {
    console.log('❌ [RequestService] Rejecting request:', requestId);

    const { error } = await supabase
      .from('requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('❌ [RequestService] Failed to reject request:', error);
      throw new Error(`Failed to reject request: ${error.message}`);
    }

    console.log('✅ [RequestService] Request rejected');
  },

  /**
   * Get a pending request between sender and recipient.
   */
  async getPendingRequest(
    senderId: string,
    recipientId: string,
    type?: RequestType
  ): Promise<Request | undefined> {
    console.log('🔍 [RequestService] Getting pending request:', { senderId, recipientId, type });

    let query = supabase
      .from('requests')
      .select('*')
      .eq('sender_id', senderId)
      .eq('status', 'pending');

    // For REQUEST_TO_JOIN, check teamId instead of recipientId
    if (type === 'REQUEST_TO_JOIN') {
      query = query.eq('team_id', recipientId);
    } else {
      query = query.eq('recipient_id', recipientId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('❌ [RequestService] Failed to get pending request:', error);
      throw new Error(`Failed to get pending request: ${error.message}`);
    }

    if (!data) {
      console.log('📭 [RequestService] No pending request found');
      return undefined;
    }

    console.log('✅ [RequestService] Found pending request:', data.id);
    return mapRequest(data as Record<string, unknown>);
  },

  /**
   * Subscribe to real-time request updates for a user.
   */
  subscribeToUserRequests(
    userId: string,
    onRequest: (request: Request) => void,
    onUpdate?: (request: Request) => void
  ): () => void {
    console.log('🔔 [RequestService] Subscribing to user requests:', userId);

    const channel = supabase
      .channel(`user-requests-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'requests',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📨 [RequestService] New request received:', payload.new);
          const request = mapRequest(payload.new as Record<string, unknown>);
          onRequest(request);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          if (onUpdate) {
            console.log('✏️ [RequestService] Request updated:', payload.new);
            onUpdate(mapRequest(payload.new as Record<string, unknown>));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 [RequestService] Unsubscribing from user requests:', userId);
      supabase.removeChannel(channel);
    };
  },
};




