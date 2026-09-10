import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Team } from '@/lib/mockData';
import { requestService, Request, RequestStats } from '@/services/requests';
import { useTeamContext } from './TeamContext';
import { useAuth } from './AuthContext';
import { useRoadmapsContext } from './RoadmapsContext';
import { MAX_FREE_REQUESTS } from '@/lib/constants';

const dataMode = import.meta.env.VITE_DATA_MODE || 'local';

interface RequestContextType {
  requests: Request[];
  isLoading: boolean;
  createRequest: (requestData: Omit<Request, 'id' | 'status' | 'createdAt'>) => Promise<boolean>;
  acceptRequest: (requestId: string) => Promise<{ teamId: string; team?: Team } | null>;
  rejectRequest: (requestId: string) => Promise<void>;
  getUserRequests: (userId: string) => Request[];
  getSentRequests: (userId: string) => Request[];
  getPendingRequest: (senderId: string, recipientId: string, type?: Request['type']) => Request | undefined;
  getRequestStats: (userId: string) => RequestStats;
  refreshRequests: () => Promise<void>;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export const RequestProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Call hooks at top level (React rule)
  const teamContext = useTeamContext();
  const authContext = useAuth();
  const roadmapsContext = useRoadmapsContext();

  const { user: currentUser } = authContext;

  // Initial fetch
  const refreshRequests = useCallback(async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const [userRequests, sentRequests] = await Promise.all([
        requestService.fetchUserRequests(currentUser.id),
        requestService.fetchSentRequests(currentUser.id),
      ]);

      // Combine and deduplicate
      const combined = [...userRequests, ...sentRequests];
      const unique = new Map(combined.map((r) => [r.id, r]));
      setRequests(Array.from(unique.values()));
    } catch (error) {
      console.error('❌ Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  // Fetch on mount and when user changes
  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  // Subscribe to real-time updates for Supabase mode
  useEffect(() => {
    if (dataMode !== 'supabase' || !currentUser?.id || !requestService.subscribeToUserRequests) {
      return;
    }

    const unsubscribe = requestService.subscribeToUserRequests(
      currentUser.id,
      // On new request
      (request) => {
        setRequests((prev) => [...prev, request]);
      },
      // On request update
      (request) => {
        setRequests((prev) =>
          prev.map((r) => (r.id === request.id ? request : r))
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id]);

  const getRequestStats = useCallback((userId: string): RequestStats => {
    const sentRequests = requests.filter((req) => req.senderId === userId);
    const count = sentRequests.length;

    // Premium users have unlimited requests
    if (currentUser?.isPremium) {
      return { count, remaining: Infinity, isLimitReached: false };
    }

    // Free users have a limit
    const remaining = Math.max(0, MAX_FREE_REQUESTS - count);
    return {
      count,
      remaining,
      isLimitReached: count >= MAX_FREE_REQUESTS,
    };
  }, [requests, currentUser?.isPremium]);

  const createRequest = useCallback(async (
    requestData: Omit<Request, 'id' | 'status' | 'createdAt'>
  ): Promise<boolean> => {
    // Check limit for free users
    const stats = getRequestStats(requestData.senderId);
    if (stats.isLimitReached) {
      console.warn('⚠️ Request limit reached for user:', requestData.senderId);
      return false;
    }

    try {
      const newRequest = await requestService.createRequest(requestData);
      setRequests((prev) => [...prev, newRequest]);
      console.log('✅ Request created:', newRequest.id);
      return true;
    } catch (error) {
      console.error('❌ Failed to create request:', error);
      return false;
    }
  }, [getRequestStats]);

  const acceptRequest = useCallback(async (
    requestId: string
  ): Promise<{ teamId: string; team?: Team } | null> => {
    const { createTeam, addTeamMember } = teamContext;
    const { roadmaps, copyRoadmapForTeam } = roadmapsContext;

    const request = requests.find((req) => req.id === requestId);

    if (!request || request.status !== 'pending') {
      console.warn('⚠️ Request not found or not pending:', requestId);
      return null;
    }

    let teamId: string | null = null;
    let createdTeam: Team | undefined = undefined;

    try {
      // Handle different request types
      switch (request.type) {
        case 'CREATE_TEAM': {
          // Form new team
          let roadmapToUse = request.roadmapId;

          // Check if we need to copy the roadmap
          if (request.roadmapId) {
            const originalRoadmap = roadmaps.find((r) => r.id.toString() === request.roadmapId);

            if (originalRoadmap && originalRoadmap.ownerType === 'USER') {
              // Generate team ID before copying (needed for roadmap ownership)
              const potentialNewTeamId = `team-${Date.now()}`;

              console.log('🔄 Copying USER roadmap for new team:', {
                originalId: originalRoadmap.id,
                originalOwner: originalRoadmap.ownerId,
                newTeamId: potentialNewTeamId,
              });

              // Copy the roadmap and get the new ID
              const newRoadmapId = copyRoadmapForTeam(
                originalRoadmap.id.toString(),
                potentialNewTeamId,
                request.newTeamName!
              );

              roadmapToUse = newRoadmapId;
              console.log('✅ Roadmap copied for team:', newRoadmapId);

              // Create team with the pre-generated ID and copied roadmap
              createdTeam = await createTeam(request.senderId, request.recipientId, {
                newTeamName: request.newTeamName!,
                roadmapId: roadmapToUse,
                maxMembers: request.maxMembers,
                duration: request.duration,
                teamId: potentialNewTeamId,
              });
              teamId = createdTeam.id;
            } else {
              // Use original roadmap ID (TEAM or THIRD_PARTY owned)
              createdTeam = await createTeam(request.senderId, request.recipientId, {
                newTeamName: request.newTeamName!,
                roadmapId: roadmapToUse,
                maxMembers: request.maxMembers,
                duration: request.duration,
              });
              teamId = createdTeam.id;
            }
          } else {
            // No roadmap selected
            createdTeam = await createTeam(request.senderId, request.recipientId, {
              newTeamName: request.newTeamName!,
              roadmapId: roadmapToUse,
              maxMembers: request.maxMembers,
              duration: request.duration,
            });
            teamId = createdTeam.id;
          }

          console.log('✅ New team created:', teamId);
          break;
        }

        case 'INVITE_TO_TEAM':
          // Invite to existing team
          await addTeamMember(
            request.recipientId,
            request.teamId!,
            request.makeAdmin ? 'admin' : 'member'
          );
          teamId = request.teamId!;
          console.log('✅ User added to existing team:', teamId);
          break;

        case 'REQUEST_TO_JOIN':
          // User requesting to join team (teamId is in request.teamId)
          if (!request.teamId) {
            console.warn('⚠️ REQUEST_TO_JOIN missing teamId');
            return null;
          }
          await addTeamMember(request.senderId, request.teamId, 'member');
          teamId = request.teamId;
          console.log('✅ User joined team:', teamId);
          break;

        default:
          console.warn('⚠️ Unknown request type:', request.type);
          return null;
      }

      // Update request status in service
      await requestService.acceptRequest(requestId);

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: 'accepted' as const } : req
        )
      );

      console.log('✅ Request accepted and processed:', requestId);
      return { teamId: teamId!, team: createdTeam };
    } catch (error) {
      console.error('❌ Failed to accept request:', error);
      return null;
    }
  }, [requests, teamContext, roadmapsContext]);

  const rejectRequest = useCallback(async (requestId: string): Promise<void> => {
    try {
      await requestService.rejectRequest(requestId);
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status: 'rejected' as const } : request
        )
      );
      console.log('❌ Request rejected:', requestId);
    } catch (error) {
      console.error('❌ Failed to reject request:', error);
    }
  }, []);

  const getUserRequests = useCallback((userId: string): Request[] => {
    return requests.filter(
      (request) =>
        (request.recipientId === userId || request.recipientIds?.includes(userId)) &&
        request.status === 'pending'
    );
  }, [requests]);

  const getSentRequests = useCallback((userId: string): Request[] => {
    return requests.filter(
      (request) => request.senderId === userId && request.status === 'pending'
    );
  }, [requests]);

  const getPendingRequest = useCallback((
    senderId: string,
    recipientId: string,
    type?: Request['type']
  ): Request | undefined => {
    return requests.find((request) => {
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
  }, [requests]);

  return (
    <RequestContext.Provider
      value={{
        requests,
        isLoading,
        createRequest,
        acceptRequest,
        rejectRequest,
        getUserRequests,
        getSentRequests,
        getPendingRequest,
        getRequestStats,
        refreshRequests,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export const useRequestContext = () => {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error('useRequestContext must be used within a RequestProvider');
  }
  return context;
};

// Re-export types for convenience
export type { Request, RequestStats };
