import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TeamMember, Team, mockGoals, TeamGoal } from '@/lib/mockData';
import { useAuth } from './AuthContext';
import { useProgressContext } from './ProgressContext';
import { teamService } from '@/services/teams';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/services/userProfile';
import { mapProfile } from '@/lib/supabase-mapper';
import { toast } from 'sonner';

const GOALS_STORAGE_KEY = 'ekana-team-goals';

interface CreateTeamOptions {
  newTeamName?: string;
  roadmapId?: string;
  maxMembers?: number;
  duration?: string;
  teamId?: string;
}

// Type safety for team updates - prevent modification of immutable fields
type ImmutableFields = 'id' | 'startDate' | 'members' | 'progress';
type TeamUpdatePayload = Partial<Omit<Team, ImmutableFields>>;

interface TeamContextType {
  teams: Team[];
  teamMembers: TeamMember[];
  memberProfiles: UserProfile[];
  goals: TeamGoal[];
  isLoading: boolean;
  leaveTeam: (userId: string, teamId: string) => Promise<void>;
  removeMember: (userId: string, teamId: string) => Promise<void>;
  addTeamMember: (userId: string, teamId: string, role?: 'admin' | 'member') => Promise<void>;
  createTeam: (senderId: string, recipientId: string, options: CreateTeamOptions) => Promise<Team>;
  getUserTeams: (userId: string) => Team[];
  getTeamAdmins: (teamId: string) => string[];
  getTeamMemberProfiles: (teamId: string) => UserProfile[];
  getTeamMembersWithRoles: (teamId: string) => { userId: string; role: 'admin' | 'member'; profile: UserProfile | undefined }[];
  getTeamGoals: (teamId: string) => TeamGoal[];
  getCurrentTeamGoal: (teamId: string) => TeamGoal | null;
  addGoal: (newGoalData: Omit<TeamGoal, 'id'>) => void;
  deleteGoal: (goalId: string) => void;
  getTeamTimeLeft: (teamId: string) => { weeksLeft: number; weeksSinceStart: number; displayText: string } | null;
  updateTeam: (teamId: string, updates: TeamUpdatePayload) => Promise<void>;
  promoteAllMembersToAdmin: (teamId: string) => Promise<void>;
  updateMemberRole: (teamId: string, userId: string, newRole: 'admin' | 'member') => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  // Initialize teams from Supabase (empty until fetched)
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize goals from localStorage or use mock data (goals still local for now)
  const [goals, setGoals] = useState<TeamGoal[]>(() => {
    try {
      const stored = localStorage.getItem(GOALS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Loaded goals from localStorage:', parsed.length, 'goals');
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to load goals from localStorage:', error);
    }
    console.log('📦 Using mock goals data');
    return mockGoals;
  });

  const { updateUser, user } = useAuth();
  const { createActivation } = useProgressContext();

  // Helper function to refetch all team data
  const refetchTeamsData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userTeams = await teamService.fetchUserTeams(user.id);
      setTeams(userTeams);

      if (userTeams.length > 0) {
        const teamIds = userTeams.map(t => t.id);
        const membersPromises = teamIds.map(id => teamService.fetchTeamMembers(id));
        const membersArrays = await Promise.all(membersPromises);
        const allMembers = membersArrays.flat();
        setTeamMembers(allMembers);

        const uniqueUserIds = [...new Set(allMembers.map(m => m.userId))];
        if (uniqueUserIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', uniqueUserIds);

          if (profilesData) {
            const profiles = profilesData.map(row => mapProfile(row as Record<string, unknown>));
            setMemberProfiles(profiles);
          }
        }
      } else {
        setTeamMembers([]);
        setMemberProfiles([]);
      }
    } catch (error) {
      console.error('❌ [TeamContext] Failed to refetch teams:', error);
    }
  }, [user?.id]);

  // Fetch teams and members from Supabase when user is available
  useEffect(() => {
    const fetchTeamsData = async () => {
      if (!user?.id) {
        console.log('🔍 [TeamContext] No user ID, skipping fetch');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log('🔍 [TeamContext] Fetching teams for user:', user.id);

      try {
        // Fetch user's teams via the team service
        const userTeams = await teamService.fetchUserTeams(user.id);
        console.log('✅ [TeamContext] Fetched teams:', userTeams.length, userTeams.map(t => ({ id: t.id, name: t.name })));
        setTeams(userTeams);

        // Fetch all team members for those teams
        if (userTeams.length > 0) {
          const teamIds = userTeams.map(t => t.id);
          console.log('🔍 [TeamContext] Fetching members for team IDs:', teamIds);
          
          const membersPromises = teamIds.map(id => teamService.fetchTeamMembers(id));
          const membersArrays = await Promise.all(membersPromises);
          
          // Debug: Log members per team
          teamIds.forEach((id, index) => {
            console.log(`🔍 [TeamContext] Team ${id} has ${membersArrays[index].length} members:`, membersArrays[index]);
          });
          
          const allMembers = membersArrays.flat();
          console.log('✅ [TeamContext] Total fetched team members:', allMembers.length, allMembers);
          setTeamMembers(allMembers);

          // Fetch profiles for all unique member user IDs
          const uniqueUserIds = [...new Set(allMembers.map(m => m.userId))];
          
          if (uniqueUserIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', uniqueUserIds);

            if (profilesError) {
              console.error('❌ [TeamContext] Failed to fetch member profiles:', profilesError);
            } else if (profilesData) {
              const profiles = profilesData.map(row => mapProfile(row as Record<string, unknown>));
              setMemberProfiles(profiles);
            }
          }
        } else {
          setTeamMembers([]);
          setMemberProfiles([]);
        }
      } catch (error) {
        console.error('❌ [TeamContext] Failed to fetch teams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamsData();
  }, [user?.id]);

  // Subscribe to realtime changes for team_members table
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          console.log('🔄 [TeamContext] Realtime team_members change:', payload);
          // Refetch teams data when membership changes
          refetchTeamsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchTeamsData]);

  // Persist goals to localStorage (goals still local for now)
  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
      console.log('💾 Saved goals to localStorage:', goals.length, 'goals');
    } catch (error) {
      console.error('❌ Failed to save goals to localStorage:', error);
    }
  }, [goals]);

  // ==================== WRITE OPERATIONS WITH OPTIMISTIC UPDATES ====================

  const createTeam = async (senderId: string, recipientId: string, options: CreateTeamOptions): Promise<Team> => {
    const now = new Date();
    
    // Parse duration to get value and type
    let durationValue = 8;
    let durationType = 'weeks';
    if (options.duration) {
      const match = options.duration.match(/(\d+)\s*(\w+)/);
      if (match) {
        durationValue = parseInt(match[1]);
        durationType = match[2];
      }
    }
    
    const teamPayload = {
      name: options.newTeamName || 'New Team',
      bio: 'A collaborative learning team',
      avatar: options.newTeamName?.substring(0, 2).toUpperCase() || 'NT',
      course: 'Team Learning',
      duration: options.duration || '8 weeks',
      startDate: now,
      maxMembers: options.maxMembers || 6,
      activity: 'Active',
      lastActive: 'Just now',
      currentRoadmapId: options.roadmapId,
      resourceLinks: [
        { name: 'Google Drive', url: 'Insert Google Drive URL', description: 'You can store your Google Drive link here' },
        { name: 'Customize Tool 2', url: '', description: '' }
      ],
      subject: 'aggregate',
      teamLevel: 'aggregate',
      languages: 'aggregate',
      goals: 'aggregate',
      timeCommitments: 'aggregate',
      communicationPreferences: 'aggregate',
      durationValue,
      durationType,
      archiveOnEnd: false,
      onlyAdminsEditGoals: true,
      onlyAdminsAcceptRequests: true,
      onlyAdminsRemoveMembers: true,
      allMembersAdmins: false,
      allowSearch: true,
      showTeamStats: true,
      showMemberList: true,
    };

    try {
      // 1. Create team in database
      const newTeam = await teamService.createTeam(teamPayload);
      console.log('✅ [TeamContext] Team created in DB:', newTeam.id);

      // 2. Add both users as team members (BOTH as admins for new teams)
      await teamService.addMember(senderId, newTeam.id, 'admin');
      await teamService.addMember(recipientId, newTeam.id, 'admin');
      console.log('👥 [TeamContext] Added team members with admin roles');

      // 3. Update local state
      setTeams(prevTeams => [...prevTeams, newTeam]);
      setTeamMembers(prevMembers => [
        ...prevMembers,
        { teamId: newTeam.id, userId: senderId, role: 'admin' as const },
        { teamId: newTeam.id, userId: recipientId, role: 'admin' as const }
      ]);

      // 4. Create activations for both users if roadmap exists
      if (options.roadmapId) {
        createActivation(senderId, options.roadmapId, newTeam.id);
        createActivation(recipientId, options.roadmapId, newTeam.id);
      }

      console.log('✅ [TeamContext] Team created successfully:', newTeam.id);
      return newTeam;
    } catch (error) {
      console.error('❌ [TeamContext] Failed to create team:', error);
      toast.error('Failed to create team. Please try again.');
      throw error;
    }
  };

  const addTeamMember = async (userId: string, teamId: string, role: 'admin' | 'member' = 'member'): Promise<void> => {
    // Check if user is already a member
    const existingMember = teamMembers.find(
      member => member.userId === userId && member.teamId === teamId
    );
    
    if (existingMember) {
      console.log('⚠️ User is already a member of this team', { userId, teamId });
      return;
    }

    // Store previous state for rollback
    const previousMembers = [...teamMembers];

    // 1. Optimistic update
    setTeamMembers(prevMembers => [
      ...prevMembers,
      { teamId, userId, role }
    ]);
    console.log('🟢 [TeamContext] Optimistic add member');

    try {
      // 2. Service call
      await teamService.addMember(userId, teamId, role);
      console.log('✅ [TeamContext] Member added to DB:', { userId, teamId, role });

      // 3. Auto-activate team's roadmap if it exists
      const team = teams.find(t => t.id === teamId);
      if (team?.currentRoadmapId) {
        createActivation(userId, team.currentRoadmapId, teamId);
        console.log('📚 Created activation for team roadmap', {
          userId,
          teamId,
          roadmapId: team.currentRoadmapId
        });
      }
    } catch (error) {
      // 4. Rollback on error
      console.error('❌ [TeamContext] Failed to add member:', error);
      setTeamMembers(previousMembers);
      toast.error('Failed to add member. Please try again.');
      throw error;
    }
  };

  const removeMember = async (userId: string, teamId: string): Promise<void> => {
    // Store previous state for rollback
    const previousMembers = [...teamMembers];

    // 1. Optimistic update
    setTeamMembers(prevMembers => 
      prevMembers.filter(member => !(member.userId === userId && member.teamId === teamId))
    );
    console.log('🟢 [TeamContext] Optimistic remove member');

    try {
      // 2. Service call
      await teamService.removeMember(userId, teamId);
      console.log('✅ [TeamContext] Member removed from DB:', { userId, teamId });
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [TeamContext] Failed to remove member:', error);
      setTeamMembers(previousMembers);
      toast.error('Failed to remove member. Please try again.');
      throw error;
    }
  };

  const leaveTeam = async (userId: string, teamId: string): Promise<void> => {
    // Store previous state for rollback
    const previousMembers = [...teamMembers];

    // 1. Optimistic update
    setTeamMembers(prevMembers => 
      prevMembers.filter(member => !(member.userId === userId && member.teamId === teamId))
    );
    console.log('🟢 [TeamContext] Optimistic leave team');

    try {
      // 2. Service call (same as removeMember)
      await teamService.removeMember(userId, teamId);
      console.log('✅ [TeamContext] Left team in DB:', { userId, teamId });

      // 3. Update the user's team status if they're leaving their current active team
      const userWithTeam = user as { id?: string; teamId?: string };
      if (userWithTeam?.id === userId && userWithTeam?.teamId === teamId) {
        updateUser({
          ...user,
          hasActiveTeam: false
        } as Parameters<typeof updateUser>[0]);
      }
    } catch (error) {
      // 4. Rollback on error
      console.error('❌ [TeamContext] Failed to leave team:', error);
      setTeamMembers(previousMembers);
      toast.error('Failed to leave team. Please try again.');
      throw error;
    }
  };

  const updateMemberRole = async (teamId: string, userId: string, newRole: 'admin' | 'member'): Promise<void> => {
    // Store previous state for rollback
    const previousMembers = [...teamMembers];

    // 1. Optimistic update
    setTeamMembers(prev =>
      prev.map(member =>
        member.teamId === teamId && member.userId === userId
          ? { ...member, role: newRole }
          : member
      )
    );
    console.log('🟢 [TeamContext] Optimistic role update');

    try {
      // 2. Service call
      await teamService.updateMemberRole(teamId, userId, newRole);
      console.log('✅ [TeamContext] Member role updated in DB:', { teamId, userId, newRole });
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [TeamContext] Failed to update member role:', error);
      setTeamMembers(previousMembers);
      toast.error('Failed to update member role. Please try again.');
      throw error;
    }
  };

  const promoteAllMembersToAdmin = async (teamId: string): Promise<void> => {
    // Get all non-admin members for this team
    const membersToPromote = teamMembers.filter(
      m => m.teamId === teamId && m.role !== 'admin'
    );

    if (membersToPromote.length === 0) {
      console.log('ℹ️ [TeamContext] All members are already admins');
      return;
    }

    // Store previous state for rollback
    const previousMembers = [...teamMembers];

    // 1. Optimistic update
    setTeamMembers(prev => 
      prev.map(member => 
        member.teamId === teamId 
          ? { ...member, role: 'admin' }
          : member
      )
    );
    console.log('🟢 [TeamContext] Optimistic promote all');

    try {
      // 2. Service calls for each member
      await Promise.all(
        membersToPromote.map(m => teamService.updateMemberRole(teamId, m.userId, 'admin'))
      );
      console.log('✅ [TeamContext] All members promoted to admin in DB');
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [TeamContext] Failed to promote all members:', error);
      setTeamMembers(previousMembers);
      toast.error('Failed to promote all members. Please try again.');
      throw error;
    }
  };

  const updateTeam = async (teamId: string, updates: TeamUpdatePayload): Promise<void> => {
    // Store previous state for rollback
    const previousTeams = [...teams];

    // 1. Optimistic update
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
    console.log('🟢 [TeamContext] Optimistic team update');

    try {
      // 2. Service call
      await teamService.updateTeam(teamId, updates);
      console.log('✅ [TeamContext] Team updated in DB:', teamId, updates);
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [TeamContext] Failed to update team:', error);
      setTeams(previousTeams);
      toast.error('Failed to update team. Please try again.');
      throw error;
    }
  };

  const deleteTeam = async (teamId: string): Promise<void> => {
    // Store previous state for rollback
    const previousTeams = [...teams];
    const previousMembers = [...teamMembers];

    // 1. Optimistic update
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setTeamMembers(prev => prev.filter(member => member.teamId !== teamId));
    console.log('🟢 [TeamContext] Optimistic team delete');

    try {
      // 2. Service call
      await teamService.deleteTeam(teamId);
      console.log('✅ [TeamContext] Team deleted from DB:', teamId);
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [TeamContext] Failed to delete team:', error);
      setTeams(previousTeams);
      setTeamMembers(previousMembers);
      toast.error('Failed to delete team. Please try again.');
      throw error;
    }
  };

  // ==================== READ OPERATIONS (unchanged) ====================

  const getUserTeams = (userId: string): Team[] => {
    // Since we fetch teams for the current authenticated user, 
    // the teams state already contains only their teams.
    // The userId param is kept for API compatibility.
    return teams;
  };

  const getTeamAdmins = (teamId: string): string[] => {
    // Find all admin members for this team
    return teamMembers
      .filter(member => member.teamId === teamId && member.role === 'admin')
      .map(member => member.userId);
  };

  const getTeamMemberProfiles = (teamId: string): UserProfile[] => {
    // Get user IDs for this team's members
    const teamMemberIds = teamMembers
      .filter(member => member.teamId === teamId)
      .map(member => member.userId);
    
    console.log('🔍 [TeamContext] getTeamMemberProfiles for team:', teamId);
    console.log('🔍 [TeamContext] All teamMembers state:', teamMembers);
    console.log('🔍 [TeamContext] Filtered teamMemberIds:', teamMemberIds);
    console.log('🔍 [TeamContext] All memberProfiles state:', memberProfiles.map(p => ({ id: p.id, name: p.name })));
    
    // Return profiles for those members
    const result = memberProfiles.filter(profile => teamMemberIds.includes(profile.id));
    console.log('🔍 [TeamContext] Resulting profiles:', result.map(p => ({ id: p.id, name: p.name })));
    
    return result;
  };

  const getTeamMembersWithRoles = (teamId: string): { userId: string; role: 'admin' | 'member'; profile: UserProfile | undefined }[] => {
    // Get all membership records for this team
    const teamMemberRelations = teamMembers.filter(tm => tm.teamId === teamId);
    
    // Map each relation to include the profile
    return teamMemberRelations.map(relation => ({
      userId: relation.userId,
      role: relation.role,
      profile: memberProfiles.find(p => p.id === relation.userId)
    }));
  };

  const getTeamGoals = (teamId: string): TeamGoal[] => {
    return goals.filter(goal => goal.teamId === teamId);
  };

  const getCurrentTeamGoal = (teamId: string): TeamGoal | null => {
    const teamGoals = getTeamGoals(teamId);
    if (teamGoals.length === 0) return null;
    
    // Return the most recent goal by creation (most recent startDate)
    return teamGoals.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0];
  };

  const addGoal = (newGoalData: Omit<TeamGoal, 'id'>): void => {
    const newGoal: TeamGoal = {
      ...newGoalData,
      id: `goal-${Date.now()}`
    };
    setGoals(prevGoals => [...prevGoals, newGoal]);
    console.log('✅ Goal added', newGoal);
  };

  const deleteGoal = (goalId: string): void => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
    console.log('✅ Goal deleted', goalId);
  };

  const getTeamTimeLeft = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return null;

    const startDate = new Date(team.startDate);
    const now = new Date();
    
    console.log('⏰ getTeamTimeLeft Debug:', {
      teamId,
      teamName: team.name,
      rawStartDate: team.startDate,
      parsedStartDate: startDate.toISOString(),
      currentDate: now.toISOString(),
      duration: team.duration
    });
    
    // Parse duration string (e.g., "8 weeks")
    const durationMatch = team.duration.match(/(\d+)\s*(\w+)/);
    if (!durationMatch) return null;
    
    const durationValue = parseInt(durationMatch[1]);
    const durationType = durationMatch[2].toLowerCase();
    
    // Convert duration to days
    let totalDurationDays = 0;
    if (durationType.includes('week')) {
      totalDurationDays = durationValue * 7;
    } else if (durationType.includes('month')) {
      totalDurationDays = durationValue * 30;
    } else if (durationType.includes('day')) {
      totalDurationDays = durationValue;
    }
    
    // Calculate elapsed days since start
    const timeSinceStart = now.getTime() - startDate.getTime();
    const daysSinceStart = Math.floor(timeSinceStart / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    
    // Calculate remaining days
    const daysLeft = totalDurationDays - daysSinceStart;
    
    console.log('⏰ Time Calculation:', {
      totalDurationDays,
      daysSinceStart,
      daysLeft,
      weeksSinceStart
    });
    
    // Convert to weeks with rounding logic
    let weeksLeft = 0;
    let displayText = '';
    
    if (daysLeft < 7) {
      weeksLeft = 0;
      displayText = daysLeft > 0 ? '< 1 week' : '0 weeks';
    } else {
      // Round upwards from 4 days (e.g., 2w4d becomes 3w)
      const fullWeeks = Math.floor(daysLeft / 7);
      const remainingDays = daysLeft % 7;
      weeksLeft = remainingDays >= 4 ? fullWeeks + 1 : fullWeeks;
      displayText = `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''}`;
    }
    
    return {
      weeksLeft,
      weeksSinceStart: weeksSinceStart > 0 ? weeksSinceStart : 0,
      displayText
    };
  };

  return (
    <TeamContext.Provider value={{ 
      teams, 
      teamMembers,
      memberProfiles,
      goals,
      isLoading,
      leaveTeam,
      removeMember,
      addTeamMember, 
      createTeam, 
      getUserTeams,
      getTeamAdmins,
      getTeamMemberProfiles,
      getTeamMembersWithRoles,
      getTeamGoals,
      getCurrentTeamGoal,
      addGoal,
      deleteGoal,
      getTeamTimeLeft,
      updateTeam,
      promoteAllMembersToAdmin,
      updateMemberRole,
      deleteTeam
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeamContext = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
};
