import { useMemo } from 'react';
import { useProgressContext } from '@/contexts/ProgressContext';
import { useTeamContext } from '@/contexts/TeamContext';
import { useRoadmapsContext } from '@/contexts/RoadmapsContext';

export type OwnerType = 'USER' | 'TEAM' | 'THIRD_PARTY';

interface RoadmapPermissionsProps {
  roadmap: {
    ownerType: OwnerType;
    ownerId?: string;
    ownerName?: string;
    isPaid?: boolean;
    hasUserAccess?: boolean;
  } | null | undefined;
  user: {
    id: string;
    isAdmin?: boolean;
    isPremium?: boolean;
    hasActiveTeam?: boolean;
    teamId?: string;
  } | null;
}

export interface RoadmapPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canCopy: boolean;
  canMakePublic: boolean;
  canReport: boolean;
  canUnenroll: boolean;
  hasUserAccess: boolean;
  editTooltip?: string;
  deleteTooltip?: string;
  unenrollTooltip?: string;
  copyTooltip?: string;
  ownershipLabel: string;
  showPaidContentWarning: boolean;
}

export const useRoadmapPermissions = ({ 
  roadmap, 
  user 
}: RoadmapPermissionsProps): RoadmapPermissions => {
  const { activations } = useProgressContext();
  const { teamMembers } = useTeamContext();
  const { hasValidEntitlement } = useRoadmapsContext();
  
  return useMemo(() => {
    console.log('🎯 useRoadmapPermissions called with:', {
      roadmap: roadmap ? {
        id: (roadmap as any).id,
        title: (roadmap as any).title,
        ownerType: roadmap.ownerType,
        ownerId: roadmap.ownerId,
        ownerName: roadmap.ownerName
      } : null,
      user: user ? {
        id: user.id,
        name: (user as any).name,
        email: (user as any).email
      } : null
    });

    // Return safe defaults if roadmap is undefined/null
    if (!roadmap || !(roadmap as any).id) {
      return {
        canEdit: false,
        canDelete: false,
        canCopy: false,
        canMakePublic: false,
        canReport: false,
        canUnenroll: false,
        hasUserAccess: false,
        ownershipLabel: 'No Roadmap',
        showPaidContentWarning: false
      };
    }

    if (!user) {
      return {
        canEdit: false,
        canDelete: false,
        canCopy: false,
        canMakePublic: false,
        canReport: true,
        canUnenroll: false,
        hasUserAccess: false,
        ownershipLabel: 'Unknown Owner',
        showPaidContentWarning: false
      };
    }

    let canEdit = false;
    let canDelete = false;
    let canCopy = false;
    let canUnenroll = false;
    let hasUserAccess = false;
    let editTooltip: string | undefined;
    let deleteTooltip: string | undefined;
    let unenrollTooltip: string | undefined;
    let copyTooltip: string | undefined;
    let ownershipLabel = '';
    let showPaidContentWarning = false;

    // Check user's team membership and admin status from TeamContext (Supabase)
    // Get ALL team memberships for this user (they may be in multiple teams)
    const userTeamMemberships = teamMembers.filter(tm => tm.userId === user.id);
    
    // Find the membership for the team that owns THIS roadmap
    const relevantTeamMembership = userTeamMemberships.find(
      tm => tm.teamId === roadmap.ownerId
    );
    const isUserMemberOfOwningTeam = !!relevantTeamMembership;
    const isUserAdminOfOwningTeam = relevantTeamMembership?.role === 'admin';

    // Calculate hasUserAccess based on ownership, team membership, or entitlement
    
    // 1. Check direct ownership (USER roadmaps)
    if (roadmap.ownerId === user.id) {
      hasUserAccess = true;
      console.log('✅ Direct ownership - user owns this roadmap');
    }
    
    // 2. Check for team-based activation (any roadmap type used by a team)
    // This covers scenarios where a team adopts a USER-owned or other roadmap
    if (!hasUserAccess) {
      const hasTeamActivation = activations.some(
        act => act.userId === user.id && 
               act.roadmapId === (roadmap as any).id && 
               act.teamId // Has a teamId means it's a team-based activation
      );
      
      if (hasTeamActivation) {
        hasUserAccess = true;
        console.log('✅ Team activation - user has team-based activation for this roadmap');
      }
    }
    
    // 3. Check team membership (TEAM roadmaps - for display purposes)
    if (!hasUserAccess && roadmap.ownerType === 'TEAM') {
      console.log('🔍 Checking team membership for TEAM roadmap:', {
        roadmapOwnerId: roadmap.ownerId,
        userId: user.id,
        userTeamId: user.teamId
      });
      
      // Check if user is a member of the team that owns this roadmap
      if (isUserMemberOfOwningTeam) {
        hasUserAccess = true;
        console.log('✅ Team membership - user is member of team that owns roadmap');
      }
    }
    
    // 4. Check third-party roadmap access
    if (!hasUserAccess && roadmap.ownerType === 'THIRD_PARTY') {
      // Check if user has an activation for this roadmap
      const hasActivation = activations.some(
        act => act.userId === user.id && act.roadmapId === (roadmap as any).id
      );
      
      if (hasActivation) {
        // For paid roadmaps, also require entitlement (checked via RoadmapsContext/Supabase)
        if (roadmap.isPaid) {
          const hasEntitlement = hasValidEntitlement(user.id, (roadmap as any).id);
          
          if (hasEntitlement) {
            hasUserAccess = true;
            console.log('✅ Activation + Entitlement - user has purchased and activated this roadmap');
          }
        } else {
          // Free roadmaps only need activation
          hasUserAccess = true;
          console.log('✅ Activation - user has activated this free roadmap');
        }
      }
    }

    switch (roadmap.ownerType) {
      case 'USER':
        // User owns the roadmap
        if (roadmap.ownerId === user.id) {
          canEdit = true;
          canDelete = true;
          canCopy = false;
          ownershipLabel = 'Owned by You';
        } else {
          canEdit = false;
          canDelete = false;
          canCopy = true;
          ownershipLabel = `Owned by ${roadmap.ownerName || 'Unknown User'}`;
          editTooltip = 'You can only edit your own personal roadmaps';
          deleteTooltip = 'You can only delete your own personal roadmaps';
        }
        break;

      case 'TEAM':
        ownershipLabel = `Owned by ${roadmap.ownerName || 'Team'}`;
        
        if (isUserAdminOfOwningTeam) {
          // Team admin can edit/delete with warnings
          canEdit = true;
          canDelete = true;
          canCopy = true;
          editTooltip = 'Editing will affect all team members. Proceed with caution.';
          deleteTooltip = 'Deleting will remove this roadmap for all team members. This action cannot be undone.';
        } else if (isUserMemberOfOwningTeam) {
          // Team member can only copy
          canEdit = false;
          canDelete = false;
          canCopy = true;
          editTooltip = 'Only team admins can edit team roadmaps';
          deleteTooltip = 'Only team admins can delete team roadmaps';
        } else {
          // Not a team member
          canEdit = false;
          canDelete = false;
          canCopy = true;
          editTooltip = 'You must be a team member to edit this roadmap';
          deleteTooltip = 'You must be a team member to delete this roadmap';
        }
        break;

      case 'THIRD_PARTY':
        ownershipLabel = `Owned by ${roadmap.ownerName || 'Content Partner'}`;
        canEdit = false;
        canDelete = false;
        canCopy = false;
        canUnenroll = hasUserAccess; // User can unenroll if they have access
        editTooltip = 'This roadmap is managed by our content partner and cannot be edited';
        deleteTooltip = 'This roadmap is managed by our content partner and cannot be deleted';
        unenrollTooltip = 'Unenrolling will permanently remove all your progress for this course. This action cannot be undone.';
        copyTooltip = 'This is premium partner content and cannot be copied';
        
        // Handle paid content warning
        if (roadmap.isPaid && !hasUserAccess) {
          showPaidContentWarning = user.hasActiveTeam && !user.isPremium;
        }
        break;

      default:
        ownershipLabel = 'Unknown Owner';
        canEdit = false;
        canDelete = false;
        canCopy = false;
        canUnenroll = false;
        editTooltip = 'Permission denied';
        deleteTooltip = 'Permission denied';
        copyTooltip = 'Permission denied';
    }

    console.log('🎯 Final permissions:', {
      hasUserAccess,
      canEdit,
      canDelete,
      canCopy,
      ownershipLabel
    });

    return {
      canEdit,
      canDelete,
      canCopy,
      canMakePublic: canEdit,
      canReport: true, // Always enabled for content moderation
      canUnenroll,
      hasUserAccess,
      editTooltip,
      deleteTooltip,
      unenrollTooltip,
      copyTooltip,
      ownershipLabel,
      showPaidContentWarning
    };
  }, [roadmap, user, activations, teamMembers, hasValidEntitlement]);
};