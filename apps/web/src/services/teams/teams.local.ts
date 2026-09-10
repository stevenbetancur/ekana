import { mockTeams, mockTeamMembers } from '@/lib/mockData';
import { TeamService, Team, TeamMember, CreateTeamPayload, UpdateTeamPayload } from './types';

const TEAMS_STORAGE_KEY = 'ekana-teams';
const TEAM_MEMBERS_STORAGE_KEY = 'ekana-team-members';

/**
 * Helper to get teams from localStorage or fallback to mock data.
 */
function getTeams(): Team[] {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [...mockTeams];
  } catch {
    return [...mockTeams];
  }
}

/**
 * Helper to get team members from localStorage or fallback to mock data.
 */
function getTeamMembers(): TeamMember[] {
  try {
    const stored = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [...mockTeamMembers];
  } catch {
    return [...mockTeamMembers];
  }
}

/**
 * Helper to persist teams to localStorage.
 */
function saveTeams(teams: Team[]): void {
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
}

/**
 * Helper to persist team members to localStorage.
 */
function saveTeamMembers(members: TeamMember[]): void {
  localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

/**
 * Local (localStorage) implementation of TeamService.
 * 
 * Uses localStorage for persistence, falling back to mock data.
 * This maintains compatibility with the existing TeamContext behavior.
 */
export const localTeamService: TeamService = {
  // ==================== READ OPERATIONS ====================

  async fetchUserTeams(userId: string): Promise<Team[]> {
    try {
      const teams = getTeams();
      const members = getTeamMembers();

      // Find all team IDs where user is a member
      const userTeamIds = members
        .filter((m) => m.userId === userId)
        .map((m) => m.teamId);

      // Return teams that match
      return teams.filter((t) => userTeamIds.includes(t.id));
    } catch (error) {
      console.error('Failed to fetch user teams from localStorage:', error);
      return [];
    }
  },

  async fetchTeam(teamId: string): Promise<Team | null> {
    try {
      const teams = getTeams();
      return teams.find((t) => t.id === teamId) || null;
    } catch (error) {
      console.error('Failed to fetch team from localStorage:', error);
      return null;
    }
  },

  async fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const members = getTeamMembers();
      return members.filter((m) => m.teamId === teamId);
    } catch (error) {
      console.error('Failed to fetch team members from localStorage:', error);
      return [];
    }
  },

  // ==================== WRITE OPERATIONS: team_members ====================

  async addMember(userId: string, teamId: string, role: 'admin' | 'member'): Promise<void> {
    console.log('➕ [LocalTeamsService] Adding member to team:', { userId, teamId, role });

    const members = getTeamMembers();
    
    // Check if already a member
    const exists = members.some(m => m.userId === userId && m.teamId === teamId);
    if (exists) {
      console.warn('⚠️ [LocalTeamsService] User is already a member');
      return;
    }

    members.push({ userId, teamId, role });
    saveTeamMembers(members);

    console.log('✅ [LocalTeamsService] Member added successfully');
  },

  async removeMember(userId: string, teamId: string): Promise<void> {
    console.log('➖ [LocalTeamsService] Removing member from team:', { userId, teamId });

    const members = getTeamMembers();
    const filtered = members.filter(m => !(m.userId === userId && m.teamId === teamId));
    saveTeamMembers(filtered);

    console.log('✅ [LocalTeamsService] Member removed successfully');
  },

  async updateMemberRole(teamId: string, userId: string, newRole: 'admin' | 'member'): Promise<void> {
    console.log('🔄 [LocalTeamsService] Updating member role:', { teamId, userId, newRole });

    const members = getTeamMembers();
    const updated = members.map(m => 
      (m.teamId === teamId && m.userId === userId) 
        ? { ...m, role: newRole } 
        : m
    );
    saveTeamMembers(updated);

    console.log('✅ [LocalTeamsService] Member role updated successfully');
  },

  // ==================== WRITE OPERATIONS: teams ====================

  async createTeam(team: CreateTeamPayload): Promise<Team> {
    console.log('🆕 [LocalTeamsService] Creating team:', team.name);

    const teams = getTeams();
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`,
    };

    teams.push(newTeam);
    saveTeams(teams);

    console.log('✅ [LocalTeamsService] Team created:', newTeam.id);
    return newTeam;
  },

  async updateTeam(teamId: string, updates: UpdateTeamPayload): Promise<Team> {
    console.log('🔄 [LocalTeamsService] Updating team:', teamId, updates);

    const teams = getTeams();
    const index = teams.findIndex(t => t.id === teamId);

    if (index === -1) {
      throw new Error(`Team not found: ${teamId}`);
    }

    teams[index] = { ...teams[index], ...updates };
    saveTeams(teams);

    console.log('✅ [LocalTeamsService] Team updated:', teams[index]);
    return teams[index];
  },

  async deleteTeam(teamId: string): Promise<void> {
    console.log('🗑️ [LocalTeamsService] Deleting team:', teamId);

    // Delete team members first
    const members = getTeamMembers();
    const filteredMembers = members.filter(m => m.teamId !== teamId);
    saveTeamMembers(filteredMembers);    // Delete the team
    const teams = getTeams();
    const filteredTeams = teams.filter(t => t.id !== teamId);
    saveTeams(filteredTeams);    console.log('✅ [LocalTeamsService] Team deleted successfully');
  },
};
