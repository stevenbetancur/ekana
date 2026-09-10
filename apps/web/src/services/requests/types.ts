import { Team } from '@/lib/mockData';

/**
 * Request Service Interface
 * 
 * Defines the contract for request operations (team invitations, join requests).
 * Implementations exist for both localStorage (local) and Supabase backends.
 */

export type RequestType = 'CREATE_TEAM' | 'INVITE_TO_TEAM' | 'REQUEST_TO_JOIN';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Request {
  id: string;
  type: RequestType;
  senderId: string;
  recipientId: string;
  recipientIds?: string[]; // For multi-recipient requests (e.g., REQUEST_TO_JOIN sent to all admins)
  status: RequestStatus;
  message?: string;
  createdAt: string;
  teamId?: string;
  roadmapId?: string;
  newTeamName?: string;
  makeAdmin?: boolean;
  maxMembers?: number;
  duration?: string;
}

export interface RequestStats {
  count: number;
  remaining: number;
  isLimitReached: boolean;
}

export interface RequestService {
  /**
   * Fetch all requests for a user (received requests).
   */
  fetchUserRequests(userId: string): Promise<Request[]>;

  /**
   * Fetch all requests sent by a user.
   */
  fetchSentRequests(userId: string): Promise<Request[]>;

  /**
   * Fetch a single request by ID.
   */
  fetchRequest(requestId: string): Promise<Request | null>;

  /**
   * Create a new request.
   */
  createRequest(requestData: Omit<Request, 'id' | 'status' | 'createdAt'>): Promise<Request>;

  /**
   * Accept a request (updates status to 'accepted').
   */
  acceptRequest(requestId: string): Promise<void>;

  /**
   * Reject a request (updates status to 'rejected').
   */
  rejectRequest(requestId: string): Promise<void>;

  /**
   * Get a pending request between sender and recipient.
   */
  getPendingRequest(
    senderId: string,
    recipientId: string,
    type?: RequestType
  ): Promise<Request | undefined>;

  /**
   * Subscribe to real-time request updates for a user.
   * Returns an unsubscribe function.
   */
  subscribeToUserRequests?(
    userId: string,
    onRequest: (request: Request) => void,
    onUpdate?: (request: Request) => void
  ): () => void;
}

export type { Team };




