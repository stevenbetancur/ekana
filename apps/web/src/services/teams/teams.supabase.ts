import { supabase } from '@/integrations/supabase/client';
import { mapTeam, mapTeamMember } from '@/lib/supabase-mapper';
import { TeamService, Team, TeamMember, CreateTeamPayload, UpdateTeamPayload } from './types';

/**
 * Supabase implementation of TeamService.
 * 
 * Fetches team data from Supabase using the team_members join table
 * to determine which teams a user belongs to.
 */
export const supabaseTeamService: TeamService = {
  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all teams that a user is a member of.
   * 
   * Query Pattern: Join through team_members to get team data.
   * Result shape: Array of { team_id, user_id, role, joined_at, team: {...} }
   */
  async fetchUserTeams(userId: string): Promise<Team[]> {
    console.log('🔍 [TeamsService] Fetching teams for user:', userId);

    const { data, error } = await supabase
      .from('team_members')
      .select('*, team:teams(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [TeamsService] Failed to fetch user teams:', error);
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [TeamsService] User has no teams');
      return [];
    }

    console.log('✅ [TeamsService] Raw team_members data:', data);

    // Extract and map the nested team objects
    const teams = data
      .filter((row) => row.team) // Filter out any rows where team is null
      .map((row) => mapTeam(row.team as Record<string, unknown>));

    console.log('✅ [TeamsService] Mapped teams:', teams.length);
    return teams;
  },

  /**
   * Fetch a single team by its ID.
   */
  async fetchTeam(teamId: string): Promise<Team | null> {
    console.log('🔍 [TeamsService] Fetching team:', teamId);

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) {
      // PGRST116 = "Row not found"
      if (error.code === 'PGRST116') {
        console.log('📭 [TeamsService] Team not found:', teamId);
        return null;
      }
      console.error('❌ [TeamsService] Failed to fetch team:', error);
      throw new Error(`Failed to fetch team: ${error.message}`);
    }

    console.log('✅ [TeamsService] Raw team data:', data);
    return mapTeam(data as Record<string, unknown>);
  },

  /**
   * Fetch all members of a team.
   */
  async fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
    console.log('🔍 [TeamsService] Fetching members for team:', teamId);

    // Debug: Check current auth session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('🔍 [TeamsService] Current auth session user:', session?.user?.id || 'NO SESSION');
    if (authError) {
      console.error('❌ [TeamsService] Auth session error:', authError);
    }

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    console.log('🔍 [TeamsService] Query result - data:', data, 'error:', error);

    if (error) {
      console.error('❌ [TeamsService] Failed to fetch team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [TeamsService] Team has no members (or RLS blocked them)');
      return [];
    }

    console.log('✅ [TeamsService] Raw team_members data:', data);
    const members = data.map((row) => mapTeamMember(row as Record<string, unknown>));
    console.log('✅ [TeamsService] Mapped members:', members.length, members);
    return members;
  },

  // ==================== WRITE OPERATIONS: team_members ====================

  /**
   * Add a user to a team.
   */
  async addMember(userId: string, teamId: string, role: 'admin' | 'member'): Promise<void> {
    console.log('➕ [TeamsService] Adding member to team:', { userId, teamId, role });

    const { error } = await supabase
      .from('team_members')
      .insert({
        user_id: userId,
        team_id: teamId,
        role: role,
      });

    if (error) {
      console.error('❌ [TeamsService] Failed to add member:', error);
      throw new Error(`Failed to add member: ${error.message}`);
    }

    console.log('✅ [TeamsService] Member added successfully');
  },

  /**
   * Remove a user from a team.
   */
  async removeMember(userId: string, teamId: string): Promise<void> {
    console.log('➖ [TeamsService] Removing member from team:', { userId, teamId });

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [TeamsService] Failed to remove member:', error);
      throw new Error(`Failed to remove member: ${error.message}`);
    }

    console.log('✅ [TeamsService] Member removed successfully');
  },

  /**
   * Update a team member's role.
   */
  async updateMemberRole(teamId: string, userId: string, newRole: 'admin' | 'member'): Promise<void> {
    console.log('🔄 [TeamsService] Updating member role:', { teamId, userId, newRole });

    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [TeamsService] Failed to update member role:', error);
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    console.log('✅ [TeamsService] Member role updated successfully');
  },

  // ==================== WRITE OPERATIONS: teams ====================

  /**
   * Create a new team.
   * 
   * Maps the Team interface to Supabase snake_case columns.
   */
  async createTeam(team: CreateTeamPayload): Promise<Team> {
    console.log('🆕 [TeamsService] Creating team:', team.name);

    // Map camelCase to snake_case for Supabase
    const dbPayload = {
      name: team.name,
      bio: team.bio,
      avatar: team.avatar,
      course: team.course,
      duration: team.duration,
      start_date: team.startDate instanceof Date ? team.startDate.toISOString() : team.startDate,
      max_members: team.maxMembers,
      activity: team.activity,
      last_active: team.lastActive,
      current_roadmap_id: team.currentRoadmapId || null,
      resource_links: team.resourceLinks || [],
      // Team settings
      subject: team.subject || 'aggregate',
      team_level: team.teamLevel || 'aggregate',
      languages: team.languages || 'aggregate',
      goals: team.goals || 'aggregate',
      time_commitments: team.timeCommitments || 'aggregate',
      communication_preferences: team.communicationPreferences || 'aggregate',
      duration_value: team.durationValue || 8,
      duration_type: team.durationType || 'weeks',
      archive_on_end: team.archiveOnEnd || false,
      only_admins_edit_goals: team.onlyAdminsEditGoals ?? true,
      only_admins_accept_requests: team.onlyAdminsAcceptRequests ?? true,
      only_admins_remove_members: team.onlyAdminsRemoveMembers ?? true,
      all_members_admins: team.allMembersAdmins || false,
      allow_search: team.allowSearch ?? true,
      show_team_stats: team.showTeamStats ?? true,
      show_member_list: team.showMemberList ?? true,
    };

    const { data, error } = await supabase
      .from('teams')
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error('❌ [TeamsService] Failed to create team:', error);
      throw new Error(`Failed to create team: ${error.message}`);
    }

    console.log('✅ [TeamsService] Team created:', data);
    return mapTeam(data as Record<string, unknown>);
  },

  /**
   * Update a team's properties.
   */
  async updateTeam(teamId: string, updates: UpdateTeamPayload): Promise<Team> {
    console.log('🔄 [TeamsService] Updating team:', teamId, updates);

    // Map camelCase to snake_case for Supabase
    // Only include fields that are explicitly provided (not undefined)
    const dbPayload: Record<string, unknown> = {};

    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.bio !== undefined) dbPayload.bio = updates.bio;
    if (updates.avatar !== undefined) dbPayload.avatar = updates.avatar;
    if (updates.course !== undefined) dbPayload.course = updates.course;
    if (updates.duration !== undefined) dbPayload.duration = updates.duration;
    if (updates.maxMembers !== undefined) dbPayload.max_members = updates.maxMembers;
    if (updates.activity !== undefined) dbPayload.activity = updates.activity;
    if (updates.lastActive !== undefined) dbPayload.last_active = updates.lastActive;
    if (updates.currentRoadmapId !== undefined) dbPayload.current_roadmap_id = updates.currentRoadmapId;
    if (updates.resourceLinks !== undefined) dbPayload.resource_links = updates.resourceLinks;
    if (updates.roadmapName !== undefined) dbPayload.roadmap_name = updates.roadmapName;
    
    // Team settings
    if (updates.subject !== undefined) dbPayload.subject = updates.subject;
    if (updates.teamLevel !== undefined) dbPayload.team_level = updates.teamLevel;
    if (updates.languages !== undefined) dbPayload.languages = updates.languages;
    if (updates.goals !== undefined) dbPayload.goals = updates.goals;
    if (updates.timeCommitments !== undefined) dbPayload.time_commitments = updates.timeCommitments;
    if (updates.communicationPreferences !== undefined) dbPayload.communication_preferences = updates.communicationPreferences;
    if (updates.durationValue !== undefined) dbPayload.duration_value = updates.durationValue;
    if (updates.durationType !== undefined) dbPayload.duration_type = updates.durationType;
    if (updates.archiveOnEnd !== undefined) dbPayload.archive_on_end = updates.archiveOnEnd;
    if (updates.onlyAdminsEditGoals !== undefined) dbPayload.only_admins_edit_goals = updates.onlyAdminsEditGoals;
    if (updates.onlyAdminsAcceptRequests !== undefined) dbPayload.only_admins_accept_requests = updates.onlyAdminsAcceptRequests;
    if (updates.onlyAdminsRemoveMembers !== undefined) dbPayload.only_admins_remove_members = updates.onlyAdminsRemoveMembers;
    if (updates.allMembersAdmins !== undefined) dbPayload.all_members_admins = updates.allMembersAdmins;
    if (updates.allowSearch !== undefined) dbPayload.allow_search = updates.allowSearch;
    if (updates.showTeamStats !== undefined) dbPayload.show_team_stats = updates.showTeamStats;
    if (updates.showMemberList !== undefined) dbPayload.show_member_list = updates.showMemberList;

    console.log('📦 [TeamsService] DB payload:', dbPayload);

    const { data, error } = await supabase
      .from('teams')
      .update(dbPayload)
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      console.error('❌ [TeamsService] Failed to update team:', error);
      throw new Error(`Failed to update team: ${error.message}`);
    }

    if (!data) {
      throw new Error('Update returned no data - team may not exist or RLS blocked the operation');
    }

    console.log('✅ [TeamsService] Team updated:', data);
    return mapTeam(data as Record<string, unknown>);
  },

  /**
   * Delete a team.
   * Note: team_members should cascade delete via FK constraint in Supabase.
   */
  async deleteTeam(teamId: string): Promise<void> {
    console.log('🗑️ [TeamsService] Deleting team:', teamId);

    // First delete all team members (in case cascade isn't set up)
    const { error: membersError } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);

    if (membersError) {
      console.error('❌ [TeamsService] Failed to delete team members:', membersError);
      throw new Error(`Failed to delete team members: ${membersError.message}`);
    }

    // Then delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      console.error('❌ [TeamsService] Failed to delete team:', error);
      throw new Error(`Failed to delete team: ${error.message}`);
    }

    console.log('✅ [TeamsService] Team deleted successfully');
  },
};
