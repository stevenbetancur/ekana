import { useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import { useProgressContext } from "@/contexts/ProgressContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import RoadmapView from "@/components/views/RoadmapView";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import EmptyStateNoRoadmap from "@/components/EmptyStateNoRoadmap";
import EmptyStateNotEnrolled from "@/components/EmptyStateNotEnrolled";
import { useRoadmapPermissions } from "@/hooks/useRoadmapPermissions";
import { useRoadmap, useTeamGoals, useUserProgress, useTeamMembersWithRoles } from "@/hooks/useMockData";
import { TeamLayoutContext } from "@/layouts/TeamLayout";

const TeamRoadmap = () => {
  const { teamId } = useParams();
  const { user, team } = useOutletContext<TeamLayoutContext>();
  const navigate = useNavigate();
  const { toggleSubunitCompletion } = useProgressContext();
  const { leaveTeam } = useTeamContext();
  const [showEncourageModal, setShowEncourageModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
  const [teamMembersOpen, setTeamMembersOpen] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [deletingRoadmapId, setDeletingRoadmapId] = useState<string | null>(null);
  const [showTeamWarning, setShowTeamWarning] = useState(false);
  const [teamWarningType, setTeamWarningType] = useState<'paid' | 'free' | null>(null);
  const [showPaidLeaveModal, setShowPaidLeaveModal] = useState(false);

  // Get roadmap ID from team data
  const roadmapId = team?.currentRoadmapId || null;
  
  // Get team's roadmap from context
  const { updateRoadmapVisibility, unenrollFromRoadmap, deleteRoadmap } = useRoadmapsContext();
  const { activations } = useProgressContext();
  
  // Use the context-aware hook for reactive progress with team context
  const { roadmap: centralizedRoadmap, units: roadmapUnits } = useRoadmap(roadmapId || '', teamId);

  // Fetch team goals
  const teamGoals = useTeamGoals(teamId);
  const primaryGoal = teamGoals.length > 0 ? teamGoals[0] : null;
  const goalDescription = primaryGoal?.description || "No active goal";
  
  // Get user progress for this roadmap with team context
  const userProgress = useUserProgress(user?.id || '', roadmapId || '', teamId);

  // Use complete roadmap object directly from RoadmapsContext
  const roadmap = centralizedRoadmap;
  const courseUnits = roadmapUnits;

  // Get permissions for this roadmap
  const permissions = useRoadmapPermissions({ 
    roadmap, 
    user: user ? {
      id: user.id,
      isAdmin: team.members.find(m => m.name === user.name)?.isAdmin || false,
      isPremium: user.isPremium,
      hasActiveTeam: user.hasActiveTeam,
      teamId: teamId
    } : null
  });


  const getMembersAtUnit = (unitId: number) => {
    return team.members.filter(member => member.currentUnit === unitId);
  };

  const handleAvatarClick = (unitId: number) => {
    const members = getMembersAtUnit(unitId);
    setSelectedMembers(members);
    setShowEncourageModal(true);
  };

  const handleSendEncouragement = (memberName: string) => {
    toast.success(`Encouragement message sent to ${memberName}!`);
    setShowEncourageModal(false);
  };

  const handleUnitComplete = (unitId: number) => {
    setSelectedUnitId(unitId);
    setShowCompletionDialog(true);
  };

  const confirmUnitCompletion = () => {
    if (selectedUnitId && user && roadmapId) {
      toggleSubunitCompletion(user.id, roadmapId, selectedUnitId.toString(), teamId);
      toast.success("Unit completion updated!");
    }
    setShowCompletionDialog(false);
    setSelectedUnitId(null);
  };

  const cancelUnitCompletion = () => {
    setShowCompletionDialog(false);
    setSelectedUnitId(null);
  };

  const handleRoadmapAction = (action: string) => {
    switch (action) {
      case 'edit':
        if (permissions.canEdit) {
          navigate(`/team/${teamId}/roadmap/${roadmap.id}/edit`);
        }
        break;
      case 'delete':
        // For third-party roadmaps, check canUnenroll; for others, check canDelete
        const hasPermission = roadmap.ownerType === 'THIRD_PARTY' 
          ? permissions.canUnenroll 
          : permissions.canDelete;
          
        if (hasPermission) {
          // Check if this is a third-party roadmap
          if (roadmap.ownerType === 'THIRD_PARTY') {
            // Show team warning directly (skip generic modal)
            setTeamWarningType(roadmap.isPaid ? 'paid' : 'free');
            setShowTeamWarning(true);
            return;
          }
          // Show generic confirmation modal for non-third-party roadmaps
          setDeletingRoadmapId(roadmap.id);
        }
        break;
      case 'copy':
        // Let RoadmapView handle the copy action with its dialog flow
        // Don't handle here - just pass through
        break;
      case 'report':
        toast.success("Report submitted");
        break;
      case 'toggle-visibility':
        if (roadmap.id) {
          updateRoadmapVisibility(roadmap.id);
          toast.success("Roadmap visibility updated");
        }
        break;
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingRoadmapId || !user || !teamId || !roadmap) return;

    // Check for Paid Third-Party + Team: Leave team scenario
    if (roadmap.ownerType === 'THIRD_PARTY' && roadmap.isPaid) {
      leaveTeam(user.id, teamId);
      setDeletingRoadmapId(null);
      setShowPaidLeaveModal(true);
      // Navigation will happen after user dismisses the paid leave modal
      return;
    }

    // Handle Unenroll (Free Third-Party)
    if (roadmap.ownerType === 'THIRD_PARTY') {
      unenrollFromRoadmap(user.id, roadmap.id);
      toast.success("Successfully unenrolled from course");
      setDeletingRoadmapId(null);
      // Don't navigate - stay on page to show empty state
      return;
    }

    // Handle Delete (User/Team Owned)
    deleteRoadmap(roadmap.id);
    toast.success("Team roadmap deleted successfully");
    setDeletingRoadmapId(null);
    // Don't navigate - stay on page
  };

  const handleTeamWarningConfirm = () => {
    if (!user || !roadmap || !teamId) return;

    // Unenroll from roadmap
    unenrollFromRoadmap(user.id, roadmap.id);

    // Leave team if paid course
    if (teamWarningType === 'paid') {
      leaveTeam(user.id, teamId);
      setShowTeamWarning(false);
      setTeamWarningType(null);
      setShowPaidLeaveModal(true);
      // Navigation will happen after user dismisses the paid leave modal
    } else {
      toast.success("Successfully unenrolled from course");
      setShowTeamWarning(false);
      setTeamWarningType(null);
      // Don't navigate - stay on page to show empty state
    }
  };

  const handlePaidLeaveModalClose = () => {
    setShowPaidLeaveModal(false);
    navigate('/teams');
  };

  // Check if user is admin of the team
  const teamMembersWithRoles = useTeamMembersWithRoles(teamId || '');
  const currentUserMembership = teamMembersWithRoles.find(tm => tm.userId === user?.id);
  const isUserAdmin = currentUserMembership?.role === 'admin';

  // Check for activation (user enrollment)
  const userActivation = activations.find(
    act => act.userId === user?.id && act.roadmapId === roadmapId
  );

  // Debug logging for permissions
  console.log('🎯 TeamRoadmap - Permissions calculated:', {
    currentUser: user ? {
      id: user.id,
      name: user.name,
      teamId: teamId
    } : null,
    roadmap: roadmap ? {
      id: roadmap.id,
      title: roadmap.title,
      ownerType: roadmap.ownerType,
      ownerId: roadmap.ownerId
    } : null,
    permissions: {
      hasUserAccess: permissions.hasUserAccess,
      canEdit: permissions.canEdit,
      canDelete: permissions.canDelete,
      canCopy: permissions.canCopy
    },
    userActivation: userActivation ? {
      id: userActivation.id,
      userId: userActivation.userId,
      roadmapId: userActivation.roadmapId,
      teamId: userActivation.teamId
    } : null
  });

  // Determine if we should show empty states
  const shouldShowNoRoadmapState = !roadmapId;
  const shouldShowRoadmapDeletedState = roadmapId && !roadmap; // Roadmap was deleted/removed
  const shouldShowNotEnrolledState = roadmapId && roadmap && 
    roadmap.ownerType === 'THIRD_PARTY' && !userActivation;

  return (
    <>
      {/* Paid Leave Team Modal */}
      <Dialog open={showPaidLeaveModal} onOpenChange={handlePaidLeaveModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Removed from Team</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-muted-foreground">
              You have been removed from this team, as you no longer have access to the paid roadmap associated with it.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handlePaidLeaveModalClose} className="w-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encouragement Modal */}
      <Dialog open={showEncourageModal} onOpenChange={setShowEncourageModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center space-x-2">
              <span>🙌</span>
              <span>Encourage your teammates</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{member.avatar}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </div>
                <Button
                  size="sm"
                  className="bg-ekana-purple-dark hover:bg-ekana-purple-light text-white"
                  onClick={() => handleSendEncouragement(member.name)}
                >
                  →
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Details Modal */}
      <Dialog open={showGoalDetailsModal} onOpenChange={setShowGoalDetailsModal}>
        <DialogContent className="max-w-lg bg-ekana-white-bg">
          <DialogHeader>
            <DialogTitle className="text-center">Weekly Goal Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Progress Card */}
            <Card className="bg-ekana-green-dark border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/lovable-uploads/67f86ffa-a0b8-4847-b4e0-0b4f2d5904bd.png" 
                      alt="team goal" 
                      className="h-6 w-6"
                    />
                    <p className="text-lg text-ekana-white font-semibold">{goalDescription}</p>
                  </div>
                </div>
                <div className="w-full bg-ekana-green-light/30 rounded-full h-4 mb-2">
                  <div className="bg-ekana-white h-4 rounded-full transition-all duration-300" style={{ width: `${team.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-ekana-white/90">
                  <span className="text-sm">{team.progress}% complete</span>
                  <span className="text-sm">{Math.round((team.progress / 100) * 5)} / 5 units</span>
                </div>
              </CardContent>
            </Card>

            {/* Team Members Progress */}
            <Collapsible open={teamMembersOpen} onOpenChange={setTeamMembersOpen}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">Team Progress</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 p-1">
                    {teamMembersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="space-y-2">
                  {team.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.avatar}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 ${member.online ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium">{member.name}</p>
                          {member.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {member.goalCompleted ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Completed</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">In progress</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1">
        {shouldShowNoRoadmapState || shouldShowRoadmapDeletedState ? (
          <EmptyStateNoRoadmap 
            isAdmin={isUserAdmin}
          />
        ) : shouldShowNotEnrolledState ? (
          <EmptyStateNotEnrolled roadmapTitle={roadmap?.title || 'this course'} />
        ) : (
          <RoadmapView 
            roadmap={roadmap}
            units={courseUnits}
            permissions={permissions}
            currentUser={user}
            userProgress={userProgress}
            context="team"
            teamId={teamId}
            onRoadmapAction={handleRoadmapAction}
          />
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingRoadmapId}
        onClose={() => setDeletingRoadmapId(null)}
        onConfirm={handleConfirmDelete}
        title={roadmap?.ownerType === 'THIRD_PARTY' ? "Unenroll from Course?" : "Delete Team Roadmap?"}
        description={roadmap?.ownerType === 'THIRD_PARTY' 
          ? "You will lose progress tracking for this course. You can re-enroll later from the Available Courses section."
          : "This action cannot be undone. This roadmap will be permanently deleted for all team members."
        }
      />

      <DeleteConfirmationModal
        isOpen={showTeamWarning}
        onClose={() => {
          setShowTeamWarning(false);
          setTeamWarningType(null);
          setDeletingRoadmapId(null);
        }}
        onConfirm={handleTeamWarningConfirm}
        title={teamWarningType === 'paid' ? "Unenroll and Leave Team?" : "Unenroll from Course?"}
        description={teamWarningType === 'paid'
          ? "Unenrolling from this paid course will also remove you from your current team. Are you sure?"
          : "Unenrolling may affect collaboration in your team. Are you sure?"
        }
        confirmButtonText="Unenroll"
      />
    </>
  );
};

export default TeamRoadmap;
