import { mockRequests } from '@/lib/mockData';
import { RequestService, Request, RequestType } from './types';

const STORAGE_KEY = 'ekana-requests';
const STORAGE_VERSION = '1.0';

interface StorageEnvelope {
  version: string;
  lastUpdated: string;
  data: Request[];
}

const loadRequests = (): Request[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const envelope: StorageEnvelope = JSON.parse(stored);
      if (envelope.version === STORAGE_VERSION) {
        return envelope.data;
      }
    }
  } catch (error) {
    console.warn('Failed to load requests from localStorage:', error);
  }
  // Seed from mock data - need to cast since mockRequests uses the context-defined type
  const requests = mockRequests as unknown as Request[];
  saveRequests(requests);
  return requests;
};

const saveRequests = (requests: Request[]): void => {
  try {
    const envelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      data: requests,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (error) {
    console.error('Failed to save requests to localStorage:', error);
  }
};

export const localRequestService: RequestService = {
  fetchUserRequests: async (userId: string): Promise<Request[]> => {
    const all = loadRequests();
    return all.filter(
      (request) =>
        (request.recipientId === userId || request.recipientIds?.includes(userId)) &&
        request.status === 'pending'
    );
  },

  fetchSentRequests: async (userId: string): Promise<Request[]> => {
    const all = loadRequests();
    return all.filter(
      (request) => request.senderId === userId && request.status === 'pending'
    );
  },

  fetchRequest: async (requestId: string): Promise<Request | null> => {
    const all = loadRequests();
    return all.find((r) => r.id === requestId) || null;
  },

  createRequest: async (
    requestData: Omit<Request, 'id' | 'status' | 'createdAt'>
  ): Promise<Request> => {
    const newRequest: Request = {
      ...requestData,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const all = loadRequests();
    const updated = [...all, newRequest];
    saveRequests(updated);

    console.log('✅ [RequestService] Request created:', newRequest.id);
    return newRequest;
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    const all = loadRequests();
    const updated = all.map((request) =>
      request.id === requestId ? { ...request, status: 'accepted' as const } : request
    );
    saveRequests(updated);
    console.log('✅ [RequestService] Request accepted:', requestId);
  },

  rejectRequest: async (requestId: string): Promise<void> => {
    const all = loadRequests();
    const updated = all.map((request) =>
      request.id === requestId ? { ...request, status: 'rejected' as const } : request
    );
    saveRequests(updated);
    console.log('❌ [RequestService] Request rejected:', requestId);
  },

  getPendingRequest: async (
    senderId: string,
    recipientId: string,
    type?: RequestType
  ): Promise<Request | undefined> => {
    const all = loadRequests();
    return all.find((request) => {
      // For REQUEST_TO_JOIN, check teamId instead of recipientId
      const recipientMatch =
        type === 'REQUEST_TO_JOIN'
          ? request.teamId === recipientId
          : request.recipientId === recipientId;

      return (
        request.senderId === senderId &&
        recipientMatch &&
        request.status === 'pending' &&
        (type ? request.type === type : true)
      );
    });
  },
};




