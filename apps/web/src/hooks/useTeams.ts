import { useQuery } from '@tanstack/react-query';
import { teamService, Team, TeamMember } from '@/services/teams';

/**
 * React Query hook to fetch all teams a user belongs to.
 * 
 * @param userId - The user's ID (undefined while auth is loading)
 * @returns Query result with teams array, loading, and error states
 * 
 * @example
 * const { data: teams, isLoading, error } = useUserTeams(user?.id);
 */
export function useUserTeams(userId: string | undefined) {
  return useQuery<Team[], Error>({
    queryKey: ['teams', userId],
    queryFn: () => teamService.fetchUserTeams(userId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!userId, // Don't query until userId is available
  });
}

/**
 * React Query hook to fetch a single team by ID.
 * 
 * @param teamId - The team's ID (undefined to disable query)
 * @returns Query result with team object or null
 * 
 * @example
 * const { data: team, isLoading } = useTeam(teamId);
 */
export function useTeam(teamId: string | undefined) {
  return useQuery<Team | null, Error>({
    queryKey: ['team', teamId],
    queryFn: () => teamService.fetchTeam(teamId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!teamId,
  });
}

/**
 * React Query hook to fetch all members of a team.
 * 
 * @param teamId - The team's ID (undefined to disable query)
 * @returns Query result with team members array
 * 
 * @example
 * const { data: members, isLoading } = useTeamMembers(teamId);
 */
export function useTeamMembers(teamId: string | undefined) {
  return useQuery<TeamMember[], Error>({
    queryKey: ['team-members', teamId],
    queryFn: () => teamService.fetchTeamMembers(teamId!),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!teamId,
  });
}








