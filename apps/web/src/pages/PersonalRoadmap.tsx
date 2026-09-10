import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProgressContext } from "@/contexts/ProgressContext";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import RoadmapView from "@/components/views/RoadmapView";
import { useRoadmapPermissions } from "@/hooks/useRoadmapPermissions";
import { useRoadmap, useUserProgress, useUserTeams } from "@/hooks/useMockData";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

const PersonalRoadmap = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteRoadmap, updateRoadmapVisibility, unenrollFromRoadmap } = useRoadmapsContext();
  const { toggleSubunitCompletion } = useProgressContext();
  const { leaveTeam } = useTeamContext();
  const userTeams = useUserTeams(user?.id || '');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [deletingRoadmapId, setDeletingRoadmapId] = useState<string | null>(null);
  const [showTeamWarning, setShowTeamWarning] = useState(false);
  const [teamWarningType, setTeamWarningType] = useState<'paid' | 'free' | null>(null);

  // Get roadmap and its units using the hook
  const { roadmap: centralizedRoadmap, units: courseUnits } = useRoadmap(roadmapId || '');
  
  // Get user progress for this roadmap
  const userProgress = useUserProgress(user?.id || '', roadmapId || '');

  // Get permissions for this roadmap - MUST be called before any early returns
  const permissions = useRoadmapPermissions({ 
    roadmap: centralizedRoadmap, 
    user: user ? {
      id: user.id,
      isAdmin: user.hasActiveTeam,
      isPremium: user.isPremium,
      hasActiveTeam: user.hasActiveTeam,
      teamId: user.hasActiveTeam ? "team-1" : undefined
    } : null
  });

  // If no roadmap found, show not found message
  if (!centralizedRoadmap) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Roadmap not found</h1>
            <p className="text-gray-600">The roadmap you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Use complete roadmap object directly from RoadmapsContext
  const roadmap = centralizedRoadmap;

  const handleRoadmapAction = (action: string) => {
    switch (action) {
      case 'edit':
        if (permissions.canEdit) {
          navigate(`/roadmap/${roadmapId}/edit`);
        }
        break;
      case 'delete':
        // For third-party roadmaps, check canUnenroll; otherwise check canDelete
        const canProceed = roadmap.ownerType === 'THIRD_PARTY' ? permissions.canUnenroll : permissions.canDelete;
        if (canProceed) {
          // Check if this is a third-party roadmap being used by user's team
          if (roadmap.ownerType === 'THIRD_PARTY' && user) {
            const teamUsingRoadmap = userTeams.find(team => 
              team.currentRoadmapId?.toString() === roadmap.id.toString()
            );
            
            if (teamUsingRoadmap) {
              // User is in a team using this roadmap - show team warning directly
              setTeamWarningType(roadmap.isPaid ? 'paid' : 'free');
              setShowTeamWarning(true);
              return; // Skip the generic modal
            }
          }
          // Show generic confirmation modal
          setDeletingRoadmapId(roadmapId || null);
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
        if (roadmapId) {
          updateRoadmapVisibility(roadmapId);
          toast.success("Roadmap visibility updated");
        }
        break;
    }
  };

  const handleUnitComplete = (unitId: number, newState: boolean) => {
    setSelectedUnitId(unitId);
    setShowCompletionDialog(true);
  };

  const confirmUnitCompletion = () => {
    if (selectedUnitId && user && roadmapId) {
      toggleSubunitCompletion(user.id, roadmapId, selectedUnitId.toString());
      toast.success("Unit completion updated!");
    }
    setShowCompletionDialog(false);
    setSelectedUnitId(null);
  };

  const cancelUnitCompletion = () => {
    setShowCompletionDialog(false);
    setSelectedUnitId(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRoadmapId || !user) return;

    // Handle based on owner type (team check already done in handleRoadmapAction)
    if (roadmap.ownerType === 'THIRD_PARTY') {
      unenrollFromRoadmap(user.id, deletingRoadmapId);
      toast.success("Successfully unenrolled from course");
    } else {
      deleteRoadmap(deletingRoadmapId);
      toast.success("Roadmap deleted successfully");
    }
    
    setDeletingRoadmapId(null);
    navigate('/courses');
  };

  const handleTeamWarningConfirm = () => {
    if (!user || !roadmap) return;

    const teamUsingRoadmap = userTeams.find(team => 
      team.currentRoadmapId?.toString() === roadmap.id.toString()
    );
    if (!teamUsingRoadmap) return;

    // Unenroll from roadmap
    unenrollFromRoadmap(user.id, roadmap.id);

    // Leave team if paid course
    if (teamWarningType === 'paid') {
      leaveTeam(user.id, teamUsingRoadmap.id);
      toast.success("Unenrolled from course and left team");
    } else {
      toast.success("Successfully unenrolled from course");
    }

    setShowTeamWarning(false);
    setTeamWarningType(null);
    navigate('/courses');
  };

  return (
    <Layout>
      <RoadmapView 
        roadmap={roadmap}
        units={courseUnits}
        permissions={permissions}
        currentUser={user}
        userProgress={userProgress}
        context="page"
        onRoadmapAction={handleRoadmapAction}
      />
      
      <DeleteConfirmationModal
        isOpen={!!deletingRoadmapId}
        onClose={() => setDeletingRoadmapId(null)}
        onConfirm={handleConfirmDelete}
        title={roadmap.ownerType === 'THIRD_PARTY' ? "Unenroll from Course?" : "Delete Roadmap?"}
        description={roadmap.ownerType === 'THIRD_PARTY' 
          ? "You will lose progress tracking for this course. You can re-enroll later from the Available Courses section."
          : "This will permanently delete this roadmap and all its units. This action cannot be undone."
        }
        confirmButtonText={roadmap.ownerType === 'THIRD_PARTY' ? "Unenroll" : "Delete"}
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
    </Layout>
  );
};

export default PersonalRoadmap;