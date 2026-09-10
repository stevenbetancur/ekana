import { useMemo } from 'react';
import { 
  mockUsers, 
  mockTeams, 
  mockRoadmaps, 
  mockUnits, 
  mockTeamMembers, 
  mockActivations, 
  mockUserEntitlements,
  mockGoals,
  mockPointEvents,
  mockBadgeEvents,
  User,
  Team,
  TeamGoal,
  CourseRoadmap,
  Unit
} from '../lib/mockData';
import { 
  aggregateTopics, 
  aggregateLevels, 
  aggregateWeeklyTime, 
  aggregateLanguages, 
  aggregateCommPreferences, 
  aggregateLocations, 
  aggregateGoals,
  aggregateSubjects
} from '../lib/utils';
import { useRoadmapsContext } from '../contexts/RoadmapsContext';
import { useProgressContext } from '../contexts/ProgressContext';
import { useAuth } from '../contexts/AuthContext';
import { useTeamContext } from '../contexts/TeamContext';
import { useUserProfile } from '../contexts/UserProfileContext';

export const useTeam = (teamId: string) => {
  const { teams, teamMembers } = useTeamContext();
  const allUsers = useAllUsers();
  const team = teams.find(t => t.id === teamId);
  
  if (!team) {
    return { team: null, members: [] };
  }

  const teamMemberIds = teamMembers
    .filter(tm => tm.teamId === teamId)
    .map(tm => tm.userId);
  
  const members = allUsers.filter(user => teamMemberIds.includes(user.id));
  
  return { team, members };
};

export const useTeamMembersWithRoles = (teamId: string) => {
  const { teamMembers } = useTeamContext();
  const allUsers = useAllUsers();
  const teamMemberRelations = teamMembers.filter(tm => tm.teamId === teamId);
  
  return teamMemberRelations.map(relation => {
    const user = allUsers.find(u => u.id === relation.userId);
    return {
      userId: relation.userId,
      role: relation.role,
      user
    };
  });
};

export const useRoadmap = (roadmapId: string, teamId?: string) => {
  const { roadmaps, units: contextUnits, enrichRoadmapWithProgress } = useRoadmapsContext();
  const { progressTracking } = useProgressContext();
  const { user } = useAuth();
  
  // Step 1: Find and enrich the roadmap with progress data (using team context if provided)
  const roadmap = useMemo(() => {
    const baseRoadmap = roadmaps.find(r => r.id.toString() === roadmapId);
    if (!baseRoadmap || !user) return baseRoadmap;
    
    return enrichRoadmapWithProgress(baseRoadmap, user, teamId);
  }, [roadmapId, roadmaps, user, progressTracking, enrichRoadmapWithProgress, teamId]);
  
  // Step 2: Memoize the units calculation
  const units = useMemo(() => {
    if (!roadmap) return [];
    
    return contextUnits
      .filter(unit => unit.roadmapId.toString() === roadmapId.toString())
      .sort((a, b) => a.sequence_order - b.sequence_order);
  }, [roadmapId, roadmap, contextUnits]);
  
  // Step 3: Memoize the returned object
  return useMemo(() => ({ roadmap, units }), [roadmap, units]);
};

export const useAllTeams = () => {
  const { teams } = useTeamContext();
  return teams;
};


export const useUserTeams = (userId: string) => {
  const { teams, teamMembers } = useTeamContext();
  const userTeamIds = teamMembers
    .filter(tm => tm.userId === userId)
    .map(tm => tm.teamId);
  
  return teams.filter(team => userTeamIds.includes(team.id));
};

export const useUserProgress = (userId: string, roadmapId: string, teamId?: string) => {
  const { progressTracking, activations } = useProgressContext();
  
  console.log("🔍 useUserProgress called with:", { userId, roadmapId, teamId });
  
  // Find the activation for this user and roadmap from state
  // When teamId is provided, match on it to ensure correct team context
  const activation = activations.find(
    act => act.userId === userId && act.roadmapId === roadmapId &&
    (teamId ? act.teamId === teamId : true)
  );
  
  console.log("🔍 Found activation:", activation);
  
  // If no activation exists, return empty array
  if (!activation) {
    console.log("❌ No activation found, returning empty array");
    return [];
  }
  
  // Return progress tracking for this activation from context state
  const progress = progressTracking.filter(
    progress => progress.activationId === activation.id
  );
  
  console.log("✅ Returning progress:", progress);
  return progress;
};

export const useUnit = (unitId: string | undefined) => {
  const { units } = useRoadmapsContext();
  
  if (!unitId) return null;
  
  const unit = units.find(u => u.id === unitId);
  return unit || null;
};

export const useSubunit = (subunitId: string | undefined) => {
  const { units } = useRoadmapsContext();
  
  if (!subunitId) return null;
  
  for (const unit of units) {
    const subunit = unit.subunits.find(s => s.id === subunitId);
    if (subunit) return { unit, subunit };
  }
  return null;
};

export const useTeamGoals = (teamId: string | undefined): TeamGoal[] => {
  if (!teamId) return [];
  
  return mockGoals.filter(goal => goal.teamId === teamId);
};

// Merges User identity (from mockUsers) with UserProfile data (from context)
// UserProfile is the source of truth for updatable fields like name, avatar, bio, etc.
export const useAllUsers = (): User[] => {
  const { getAllVisibleProfiles } = useUserProfile();
  
  return useMemo(() => {
    const profiles = getAllVisibleProfiles();
    console.log('👥 useAllUsers - profiles loaded:', profiles.length, profiles.map(p => ({ id: p.id, name: p.name })));
    
    // Merge mockUsers base data with profile data (profile is source of truth)
    return mockUsers.map(user => {
      const profile = profiles.find(p => p.id === user.id);
      if (profile) {
        const mergedName = profile.name || user.name;
        console.log(`👤 User ${user.id}: profile.name="${profile.name}", mockUser.name="${user.name}", using="${mergedName}"`);
        return {
          ...user,
          // Profile is source of truth for these updatable fields
          name: mergedName,
          avatar: profile.avatar || user.avatar,
          bio: profile.bio,
          location: profile.location,
          birthDate: profile.birthDate || user.birthDate,
          subject: profile.subject,
          goal: profile.goal as User['goal'],
          level: profile.level as User['level'],
          weeklyHours: profile.weeklyHours,
          communicationMethods: profile.communicationMethods,
          languages: profile.languages,
          interests: profile.interests,
          schedule: profile.schedule,
        };
      }
      return user;
    });
  }, [getAllVisibleProfiles]);
};

export const useAllUsersLoading = () => {
  const { isLoading } = useUserProfile();
  return isLoading;
};

export const useAggregatedTeamData = (team: Team) => {
  const membersWithRoles = useTeamMembersWithRoles(team.id);
  const members = membersWithRoles.map(m => m.user).filter((u): u is User => u !== undefined);
  
  // Create a display-ready copy of the team
  const displayTeam = { ...team };
  
  // Aggregate subject if set to 'aggregate'
  if (displayTeam.subject === 'aggregate') {
    displayTeam.subject = aggregateSubjects(members) || "Not specified";
  }
  
  // Aggregate teamLevel if set to 'aggregate'
  if (displayTeam.teamLevel === 'aggregate') {
    const levels = aggregateLevels(members);
    displayTeam.teamLevel = levels.join(", ") || "Not specified";
  }
  
  // Aggregate goals if set to 'aggregate'
  if (displayTeam.goals === 'aggregate') {
    const goals = aggregateGoals(members);
    displayTeam.goals = goals.join(", ") || "Not specified";
  }
  
  // Aggregate timeCommitments if set to 'aggregate'
  if (displayTeam.timeCommitments === 'aggregate') {
    displayTeam.timeCommitments = aggregateWeeklyTime(members);
  }
  
  // Aggregate languages if set to 'aggregate'
  if (displayTeam.languages === 'aggregate') {
    const languages = aggregateLanguages(members);
    displayTeam.languages = languages.join(", ") || "Not specified";
  }
  
  // Aggregate communicationPreferences if set to 'aggregate'
  if (displayTeam.communicationPreferences === 'aggregate') {
    const preferences = aggregateCommPreferences(members);
    displayTeam.communicationPreferences = preferences.join(", ") || "Not specified";
  }
  
  // Calculate aggregated location for display
  const location = aggregateLocations(members);
  
  return { ...displayTeam, location };
};

// Merges User identity (from mockUsers) with UserProfile data (from context)
// UserProfile is the source of truth for updatable fields like name, avatar, bio, etc.
export const useUser = (userId: string): User | null => {
  const { getUserProfile } = useUserProfile();
  
  const baseUser = mockUsers.find(user => user.id === userId);
  if (!baseUser) return null;
  
  const profile = getUserProfile(userId);
  if (profile) {
    return {
      ...baseUser,
      // Profile is source of truth for these updatable fields
      name: profile.name || baseUser.name,
      avatar: profile.avatar || baseUser.avatar,
      bio: profile.bio,
      location: profile.location,
      birthDate: profile.birthDate || baseUser.birthDate,
      subject: profile.subject,
      goal: profile.goal as User['goal'],
      level: profile.level as User['level'],
      weeklyHours: profile.weeklyHours,
      communicationMethods: profile.communicationMethods,
      languages: profile.languages,
      interests: profile.interests,
      schedule: profile.schedule,
    };
  }
  return baseUser;
};

export const useUserCompletedUnits = (userId: string): number => {
  const { progressTracking, activations } = useProgressContext();
  
  // Find all activations for this user from state
  const userActivations = activations.filter(act => act.userId === userId);
  
  // Count all completed units across all activations
  const completedCount = userActivations.reduce((total, activation) => {
    const completedInActivation = progressTracking.filter(
      progress => progress.activationId === activation.id && progress.completedAt !== null
    ).length;
    return total + completedInActivation;
  }, 0);
  
  return completedCount;
};

export const useCheckUserEntitlement = (userId: string, roadmapId: string): boolean => {
  return mockUserEntitlements.some(
    entitlement => 
      entitlement.userId === userId && 
      entitlement.roadmapId === roadmapId && 
      entitlement.isActive
  );
};

export const useUserPoints = (userId: string): number => {
  return mockPointEvents
    .filter(event => event.userId === userId)
    .reduce((total, event) => total + event.points, 0);
};

export const useTeamPoints = (teamId: string): number => {
  return mockPointEvents
    .filter(event => event.teamId === teamId)
    .reduce((total, event) => total + event.points, 0);
};

export const useUserBadges = (userId: string): number => {
  return mockBadgeEvents.filter(event => event.userId === userId).length;
};

export const useTeamBadges = (teamId: string): number => {
  return mockBadgeEvents.filter(event => event.teamId === teamId).length;
};

export const useTeamCompletedUnits = (teamId: string): number => {
  const { progressTracking, activations } = useProgressContext();
  
  // Step 1: Find the team and get its currentRoadmapId
  const team = mockTeams.find(t => t.id === teamId);
  if (!team || !team.currentRoadmapId) {
    return 0;
  }
  
  // Step 2: Find all userIds for this team
  const teamMemberIds = mockTeamMembers
    .filter(tm => tm.teamId === teamId)
    .map(tm => tm.userId);
  
  // Step 3: Find all activations for these users and this roadmap from state
  const teamActivations = activations.filter(
    act => teamMemberIds.includes(act.userId) && act.roadmapId === team.currentRoadmapId
  );
  
  // Step 4: Get all subunitIds from progress tracking for these activations
  const activationIds = teamActivations.map(act => act.id);
  const completedSubunitIds = progressTracking
    .filter(progress => activationIds.includes(progress.activationId) && progress.completedAt !== null)
    .map(progress => progress.subunitId);
  
  // Step 5: Use Set to get unique subunits and return the count
  const uniqueSubunitIds = new Set(completedSubunitIds);
  return uniqueSubunitIds.size;
};