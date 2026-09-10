import { Team, TeamMember } from '@/lib/mockData';

/**
 * Payload for creating a new team.
 * Omits 'id' as it will be generated.
 */
export type CreateTeamPayload = Omit<Team, 'id'>;

/**
 * Payload for updating a team.
 * All fields optional except immutable ones are excluded.
 */
export type UpdateTeamPayload = Partial<Omit<Team, 'id' | 'startDate'>>;

/**
 * Team Service Interface
 * 
 * Defines the contract for team data operations.
 * Implementations exist for both localStorage (local) and Supabase backends.
 */
export interface TeamService {
  // ==================== READ OPERATIONS ====================
  
  /**
   * Fetch all teams that a user is a member of.
   * 
   * @param userId - The user's ID
   * @returns Array of teams the user belongs to
   */
  fetchUserTeams(userId: string): Promise<Team[]>;

  /**
   * Fetch a single team by its ID.
   * 
   * @param teamId - The team's ID
   * @returns The team object or null if not found
   */
  fetchTeam(teamId: string): Promise<Team | null>;

  /**
   * Fetch all members of a team.
   * 
   * @param teamId - The team's ID
   * @returns Array of team members
   */
  fetchTeamMembers(teamId: string): Promise<TeamMember[]>;

  // ==================== WRITE OPERATIONS: team_members ====================

  /**
   * Add a user to a team.
   * 
   * @param userId - The user's ID to add
   * @param teamId - The team's ID
   * @param role - The role to assign ('admin' or 'member')
   */
  addMember(userId: string, teamId: string, role: 'admin' | 'member'): Promise<void>;

  /**
   * Remove a user from a team.
   * Used by both admin removal and self-leave operations.
   * 
   * @param userId - The user's ID to remove
   * @param teamId - The team's ID
   */
  removeMember(userId: string, teamId: string): Promise<void>;

  /**
   * Update a team member's role.
   * 
   * @param teamId - The team's ID
   * @param userId - The user's ID whose role to update
   * @param newRole - The new role ('admin' or 'member')
   */
  updateMemberRole(teamId: string, userId: string, newRole: 'admin' | 'member'): Promise<void>;

  // ==================== WRITE OPERATIONS: teams ====================

  /**
   * Create a new team.
   * 
   * @param team - The team data (without ID)
   * @returns The created team with generated ID
   */
  createTeam(team: CreateTeamPayload): Promise<Team>;

  /**
   * Update a team's properties.
   * 
   * @param teamId - The team's ID
   * @param updates - Partial team object with fields to update
   * @returns The updated team
   */
  updateTeam(teamId: string, updates: UpdateTeamPayload): Promise<Team>;

  /**
   * Delete a team and all its memberships.
   * 
   * @param teamId - The team's ID to delete
   */
  deleteTeam(teamId: string): Promise<void>;
}

export type { Team, TeamMember };