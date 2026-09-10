import { useState, useMemo } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useGamificationContext } from "@/contexts/GamificationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TeamSidebar from "@/components/TeamSidebar";
import TeamGoalModal from "@/components/TeamGoalModal";
import PointsAwardedModal from "@/components/PointsAwardedModal";
import { useRoadmap } from "@/hooks/useMockData";

export interface TeamLayoutContext {
  team: any;
  user: any;
  setShowPointsModal: (show: boolean) => void;
  setPointsAwarded: (points: number) => void;
}

const TeamLayout = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teams, teamMembers, getTeamMembersWithRoles } = useTeamContext();
  const { getTeamUserPoints } = useGamificationContext();
  
  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  // Get team data
  const teamData = teams.find(t => t.id === teamId);
  
  // Get the team's current roadmap for progress data - MUST be called before any returns
  const teamRoadmapId = teamData?.currentRoadmapId;
  const { roadmap } = useRoadmap(teamRoadmapId || '');
  
  // Get members with roles directly from context (eliminates manual lookup)
  const membersWithRoles = getTeamMembersWithRoles(teamId || '');
  
  console.log('🔍 [TeamLayout] teamId:', teamId);
  console.log('🔍 [TeamLayout] membersWithRoles:', membersWithRoles);
  
  // Transform team members for TeamSidebar - memoized for stability
  const team = useMemo(() => {
    if (!teamData) return null;
    
    console.log('🔍 [TeamLayout] useMemo - transforming members');
    console.log('🔍 [TeamLayout] useMemo - membersWithRoles count:', membersWithRoles.length);
    
    // Transform team members using getTeamMembersWithRoles (direct access to userId, role, profile)
    const transformedMembers = membersWithRoles.map((memberWithRole, index) => {
      const { userId, role, profile } = memberWithRole;
      console.log(`🔍 [TeamLayout] Transforming member ${userId} (${profile?.name}), role: ${role}`);
      return {
        id: index + 1,
        userId: userId,
        name: profile?.name || 'Unknown',
        avatar: (profile?.name || 'U').split(' ').map(n => n[0]).join(''),
        isAdmin: role === 'admin',
        online: false, // Will need realtime presence for accurate status
        currentUnit: 1,
        goalCompleted: false,
        points: teamId ? getTeamUserPoints(userId, teamId) : 0
      };
    });
    
    console.log('🔍 [TeamLayout] transformedMembers:', transformedMembers);
    
    return {
      ...teamData,
      course: teamData.course || roadmap?.title || 'Team Learning',
      members: transformedMembers,
      progress: roadmap?.progress || 0
    };
  }, [teamId, membersWithRoles, teamData, roadmap?.title, roadmap?.progress, getTeamUserPoints]);

  // Security check: redirect if team doesn't exist or user is not a member
  // Must be AFTER all hooks are called
  const isMember = user && teamMembers.some(tm => tm.teamId === teamId && tm.userId === user.id);
  
  if (!teamData || !user) {
    navigate('/dashboard');
    return null;
  }

  if (!isMember) {
    navigate('/dashboard');
    return null;
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Team not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Premium Modal */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">✨ Premium Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
              <img 
                src="/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png" 
                alt="Ekky AI" 
                className="h-12 w-12 mx-auto mb-4"
              />
              <h3 className="font-semibold mb-2">Turbo charge your learning with AI</h3>
              <p className="text-sm text-gray-600 mb-4">Use Ekky AI to coach your learning</p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Personalized learning guidance</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Generate practice tests</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Team collaboration tips</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Progress insights</span>
                </li>
              </ul>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/premium')}>
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Goal Modal */}
      <TeamGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        teamId={teamId || ''}
      />

      {/* Points Awarded Modal */}
      <PointsAwardedModal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        points={pointsAwarded}
      />

      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Team Sidebar */}
        <TeamSidebar
          team={team}
          user={user}
          onGoalModal={() => setShowGoalModal(true)}
          onPremiumModal={() => setShowPremiumModal(true)}
        />

        {/* Main Content Area - margin for fixed sidebars */}
        <div className="flex-1 ml-96 overflow-y-auto">
          <Outlet context={{ team, user, setShowPointsModal, setPointsAwarded }} />
        </div>
      </div>
    </>
  );
};

export default TeamLayout;
