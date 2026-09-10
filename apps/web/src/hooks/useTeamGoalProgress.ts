import { useMemo } from 'react';
import { useTeamContext } from '@/contexts/TeamContext';
import { useGamificationContext } from '@/contexts/GamificationContext';
import { useProgressContext } from '@/contexts/ProgressContext';
import { TeamGoal, mockUsers } from '@/lib/mockData';

interface MemberProgress {
  member: {
    userId: string;
    name: string;
  };
  status: 'Completed' | 'In progress';
  actualPoints?: number;
  completedUnits?: number;
}

interface TeamGoalProgress {
  totalProgress: number;
  isComplete: boolean;
  sortedMembersProgress: MemberProgress[];
  minimumPoints?: number;
  allMembersMetMinimum: boolean;
  goalStatus: 'COMPLETED' | 'MINIMUMS_NOT_MET' | 'EXPIRED' | 'IN_PROGRESS';
}

/**
 * Smart hook to calculate team goal progress.
 * Centralizes all business logic for goal progress calculation.
 */
export const useTeamGoalProgress = (teamId: string, currentGoal: TeamGoal | null): TeamGoalProgress => {
  const { teamMembers } = useTeamContext();
  const { getTeamUserPoints } = useGamificationContext();
  const { activations, progressTracking } = useProgressContext();

  return useMemo(() => {
    // Default state when no goal or no members
    if (!currentGoal || !teamMembers || teamMembers.length === 0) {
      return {
        totalProgress: 0,
        isComplete: false,
        sortedMembersProgress: [],
        minimumPoints: undefined,
        allMembersMetMinimum: true,
        goalStatus: 'IN_PROGRESS'
      };
    }

    // Filter members for this specific team
    const relevantMembers = teamMembers.filter(tm => tm.teamId === teamId);
    const memberCount = relevantMembers.length;

    if (memberCount === 0) {
      return {
        totalProgress: 0,
        isComplete: false,
        sortedMembersProgress: [],
        minimumPoints: undefined,
        allMembersMetMinimum: true,
        goalStatus: 'IN_PROGRESS'
      };
    }

    let totalProgress = 0;
    let allMembersMetMinimum = true;
    const membersProgress: MemberProgress[] = [];

    if (currentGoal.type === 'units') {
      // Units-based goal calculation
      const maxMemberContribution = 100 / memberCount;

      relevantMembers.forEach(member => {
        // Find the user's actual name from mockUsers
        const user = mockUsers.find(u => u.id === member.userId);
        const userName = user?.name || member.userId;

        // Find their team-specific activation
        const activation = activations.find(
          act => act.userId === member.userId && act.teamId === teamId
        );

        if (!activation) {
          membersProgress.push({
            member: { userId: member.userId, name: userName },
            status: 'In progress',
            completedUnits: 0
          });
          allMembersMetMinimum = false;
          return;
        }

        // Count completed subunits for this activation (only after goal start date)
        const completedUnits = progressTracking.filter(
          pt => pt.userId === member.userId && 
                pt.activationId === activation.id &&
                pt.completedAt !== null &&
                new Date(pt.completedAt) >= new Date(currentGoal.startDate)
        ).length;

        // Calculate individual progress (0 to 1)
        const individualProgress = completedUnits / currentGoal.amount;
        
        // Cap at 1.0 (100%)
        const contributionPercent = Math.min(individualProgress, 1.0) * maxMemberContribution;
        totalProgress += contributionPercent;

        membersProgress.push({
          member: { userId: member.userId, name: userName },
          status: individualProgress >= 1 ? 'Completed' : 'In progress',
          completedUnits
        });

        if (completedUnits < currentGoal.amount) {
          allMembersMetMinimum = false;
        }
      });
    } else {
      // Points-based goal calculation
      const basePointsShare = currentGoal.amount / memberCount;
      const minimumPoints = basePointsShare * 0.5;
      const contributionCap = basePointsShare * 1.5;
      let totalContributionPoints = 0;

      relevantMembers.forEach(member => {
        // Find the user's actual name from mockUsers
        const user = mockUsers.find(u => u.id === member.userId);
        const userName = user?.name || member.userId;

        const actualPoints = getTeamUserPoints(member.userId, teamId, currentGoal.startDate);

        // Check minimum requirement
        if (actualPoints < minimumPoints) {
          allMembersMetMinimum = false;
        }

        // Cap contribution at 150% of fair share
        const contributionPoints = Math.min(actualPoints, contributionCap);
        totalContributionPoints += contributionPoints;

        membersProgress.push({
          member: { userId: member.userId, name: userName },
          status: actualPoints >= basePointsShare ? 'Completed' : 'In progress',
          actualPoints
        });
      });

      totalProgress = (totalContributionPoints / currentGoal.amount) * 100;
    }

    // Goal is complete if 100% progress AND all members met minimum
    const isComplete = totalProgress >= 100 && allMembersMetMinimum;

    // Sort: Completed first, then alphabetically by name
    const sortedMembersProgress = membersProgress.sort((a, b) => {
      if (a.status === b.status) {
        return a.member.name.localeCompare(b.member.name);
      }
      return a.status === 'Completed' ? -1 : 1;
    });

    // Calculate minimum points for display (only for points-based goals)
    const minimumPointsForDisplay = currentGoal.type === 'points'
      ? (currentGoal.amount / memberCount) * 0.5
      : undefined;

    // Determine goal status
    let goalStatus: 'COMPLETED' | 'MINIMUMS_NOT_MET' | 'EXPIRED' | 'IN_PROGRESS';
    
    // Check if goal has expired
    const startDate = new Date(currentGoal.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (currentGoal.weeks * 7));
    const now = new Date();
    const isExpired = now > endDate;

    if (totalProgress >= 100 && allMembersMetMinimum) {
      goalStatus = 'COMPLETED';
    } else if (totalProgress >= 97 && !allMembersMetMinimum) {
      goalStatus = 'MINIMUMS_NOT_MET';
    } else if (isExpired && !isComplete) {
      goalStatus = 'EXPIRED';
    } else {
      goalStatus = 'IN_PROGRESS';
    }

    return {
      totalProgress: Math.min(totalProgress, 100), // Cap at 100%
      isComplete,
      sortedMembersProgress,
      minimumPoints: minimumPointsForDisplay,
      allMembersMetMinimum,
      goalStatus
    };
  }, [teamId, currentGoal, teamMembers, getTeamUserPoints, activations, progressTracking]);
};
