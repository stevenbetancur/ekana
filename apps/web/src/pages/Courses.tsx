
import React, { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import { useProgressContext } from "@/contexts/ProgressContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CourseCard } from "@/components/cards/CourseCard";
import { useUserTeams } from "@/hooks/useMockData";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { CourseStartedModal } from "@/components/CourseStartedModal";
import { RoadmapCreationSuccessModal } from "@/components/RoadmapCreationSuccessModal";
import { CopySuccessModal } from "@/components/CopySuccessModal";

const Courses = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { roadmaps, getPersonalRoadmaps, getCommunityRoadmaps, getCatalogRoadmaps, updateRoadmapVisibility, deleteRoadmap, unenrollFromRoadmap } = useRoadmapsContext();
  const { progressTracking, activations } = useProgressContext();
  const { leaveTeam } = useTeamContext();
  const userTeams = useUserTeams(currentUser?.id || '');
  const [deletingRoadmapId, setDeletingRoadmapId] = useState<string | null>(null);
  const [showTeamWarning, setShowTeamWarning] = useState(false);
  const [teamWarningType, setTeamWarningType] = useState<'paid' | 'free' | null>(null);
  const [pendingRoadmapId, setPendingRoadmapId] = useState<string | null>(null);
  const [showCourseStartedModal, setShowCourseStartedModal] = useState(false);
  const [startedCourseName, setStartedCourseName] = useState("");
  const [showRoadmapSuccess, setShowRoadmapSuccess] = useState(false);
  const [createdRoadmapId, setCreatedRoadmapId] = useState<string | null>(null);
  const [createdRoadmapTitle, setCreatedRoadmapTitle] = useState("");
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [copiedRoadmapId, setCopiedRoadmapId] = useState<string | null>(null);
  const [copiedRoadmapTitle, setCopiedRoadmapTitle] = useState("");

  const PERSONAL_SECTION_TITLE = "My Roadmaps & Courses";
  
  // Handle roadmap creation success from navigation state
  useEffect(() => {
    const state = location.state as any;
    console.log("🟣 Courses useEffect - location.state:", state);
    
    if (state?.roadmapCreated && state?.roadmapId) {
      console.log("🟣 Courses: Showing roadmap creation success modal");
      setCreatedRoadmapId(state.roadmapId);
      setCreatedRoadmapTitle(state.roadmapTitle || "your roadmap");
      setShowRoadmapSuccess(true);
      
      // Clear the state to prevent showing modal on page refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
    
    // Handle roadmap copy success from navigation state
    if (state?.roadmapCopied && state?.roadmapId) {
      console.log("🟣 Courses: Showing copy success modal for:", state.roadmapId, state.roadmapTitle);
      setCopiedRoadmapId(state.roadmapId);
      setCopiedRoadmapTitle(state.roadmapTitle || "the roadmap");
      setShowCopySuccess(true);
      
      // Clear the state to prevent showing modal on page refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);
  
  // Use the context helper functions to get filtered roadmap lists
  const personalRoadmaps = useMemo(() => 
    currentUser ? getPersonalRoadmaps(currentUser) : [],
    [currentUser, roadmaps, progressTracking, activations]
  );

  const communityRoadmaps = useMemo(() => 
    currentUser ? getCommunityRoadmaps(currentUser) : [],
    [currentUser, roadmaps, progressTracking, activations]
  );

  const availableCourses = useMemo(() => 
    currentUser ? getCatalogRoadmaps(currentUser) : [],
    [currentUser, roadmaps, progressTracking, activations]
  );
  
  // Get active courses
  const activeCourses = currentUser?.activeCourse ? 
    personalRoadmaps.filter(item => item.title === currentUser.activeCourse) : [];

  const handleRoadmapAction = (action: string, roadmapId: string) => {
    const allRoadmaps = [...availableCourses, ...personalRoadmaps, ...communityRoadmaps];
    const roadmap = allRoadmaps.find(r => r.id === roadmapId);
    
    switch (action) {
      case 'course-started':
        if (roadmap) {
          setStartedCourseName(roadmap.title);
          setShowCourseStartedModal(true);
        }
        break;
      case 'edit':
        if (roadmap?.ownerType === 'TEAM') {
          navigate(`/team-roadmap/${roadmapId}/edit`);
        } else {
          navigate(`/roadmap/${roadmapId}/edit`);
        }
        break;
      case 'copy':
        // Copy action is handled by RoadmapView's dialog flow
        // This case is here for completeness but shouldn't be triggered from Courses page
        break;
      case 'delete':
        // Check if this is a third-party roadmap being used by user's team
        if (roadmap?.ownerType === 'THIRD_PARTY' && currentUser) {
          const teamUsingRoadmap = userTeams.find(team => 
            team.currentRoadmapId?.toString() === roadmap.id.toString()
          );
          
          if (teamUsingRoadmap) {
            // User is in a team using this roadmap - show team warning directly
            setPendingRoadmapId(roadmapId);
            setTeamWarningType(roadmap.isPaid ? 'paid' : 'free');
            setShowTeamWarning(true);
            return; // Skip the generic modal
          }
        }
        // Show generic confirmation modal
        setDeletingRoadmapId(roadmapId);
        break;
      case 'report':
        toast.success("Report submitted");
        break;
      case 'toggle-visibility':
        handleVisibilityToggle(roadmapId);
        break;
    }
  };

  const handleVisibilityToggle = (roadmapId: string) => {
    updateRoadmapVisibility(roadmapId);
    toast.success("Roadmap visibility updated");
  };

  const handleConfirmDelete = () => {
    if (!deletingRoadmapId || !currentUser) return;

    // Find the roadmap being deleted
    const allRoadmaps = [...availableCourses, ...personalRoadmaps, ...communityRoadmaps];
    const roadmap = allRoadmaps.find(r => r.id === deletingRoadmapId);

    if (!roadmap) return;

    // Handle based on owner type (team check already done in handleRoadmapAction)
    if (roadmap.ownerType === 'THIRD_PARTY') {
      unenrollFromRoadmap(currentUser.id, deletingRoadmapId);
      toast.success("Successfully unenrolled from course");
    } else {
      deleteRoadmap(deletingRoadmapId);
      toast.success("Roadmap deleted successfully");
    }

    setDeletingRoadmapId(null);
  };

  const handleTeamWarningConfirm = () => {
    if (!currentUser || !pendingRoadmapId) return;

    const allRoadmaps = [...availableCourses, ...personalRoadmaps, ...communityRoadmaps];
    const roadmap = allRoadmaps.find(r => r.id === pendingRoadmapId);
    if (!roadmap) return;

    const teamUsingRoadmap = userTeams.find(team => 
      team.currentRoadmapId?.toString() === roadmap.id.toString()
    );
    if (!teamUsingRoadmap) return;

    // Unenroll from roadmap
    unenrollFromRoadmap(currentUser.id, pendingRoadmapId);

    // Leave team if paid course
    if (teamWarningType === 'paid') {
      leaveTeam(currentUser.id, teamUsingRoadmap.id);
      toast.success("Unenrolled from course and left team");
    } else {
      toast.success("Successfully unenrolled from course");
    }

    setShowTeamWarning(false);
    setTeamWarningType(null);
    setPendingRoadmapId(null);
  };

  // Navigation is now handled directly by CourseCard component
  // This function is kept for any remaining legacy usage but CourseCard handles clicks internally

  return (
    <Layout>
      {/* Roadmap Creation Success Modal */}
      <RoadmapCreationSuccessModal
        roadmapId={createdRoadmapId}
        roadmapTitle={createdRoadmapTitle}
        onClose={() => {
          setShowRoadmapSuccess(false);
          setCreatedRoadmapId(null);
        }}
      />

      {/* Copy Success Modal */}
      <CopySuccessModal
        isOpen={showCopySuccess}
        roadmapId={copiedRoadmapId}
        roadmapTitle={copiedRoadmapTitle}
        onClose={() => {
          setShowCopySuccess(false);
          setCopiedRoadmapId(null);
        }}
      />

      <div className="space-y-8 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
            Your Learning Journey
            <img 
              src="/lovable-uploads/6ddb4dea-dafd-4694-970d-ffcd6ff47472.png" 
              alt="magnifier with graduation hat" 
              className="h-6 w-6"
            />
          </h1>
          <p className="text-gray-600">Continue your progress or explore new courses</p>
        </div>

        {/* Set up your own roadmap button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate('/roadmap/new')}
          >
            <Plus className="h-5 w-5 mr-2" />
            Set up your own roadmap
          </Button>
        </div>

        {/* Available Courses */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Courses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={course} 
                variant="catalog" 
                onAction={handleRoadmapAction}
              />
            ))}
          </div>
        </div>

        {/* My Roadmaps & Courses */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Roadmaps & Courses</h2>
          {activeCourses.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Continue Learning</h3>
              <div className="grid gap-6">
                {activeCourses.map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    variant="active" 
                    onAction={handleRoadmapAction}
                  />
                ))}
              </div>
            </div>
          )}
          {personalRoadmaps.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalRoadmaps.map(roadmap => (
                <CourseCard 
                  key={roadmap.id} 
                  course={roadmap} 
                  variant="active" 
                  onAction={handleRoadmapAction}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <div className="space-y-4">
                  <div className="text-4xl">📚</div>
                  <h3 className="text-lg font-semibold">No personal roadmaps yet</h3>
                  <p className="text-gray-600">Create your first personalized learning roadmap to get started</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/roadmap/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first roadmap
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Community Roadmaps */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Community Roadmaps</h2>
          {communityRoadmaps.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityRoadmaps.map(roadmap => (
                <CourseCard 
                  key={roadmap.id} 
                  course={roadmap} 
                  variant="community" 
                  onAction={handleRoadmapAction}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center p-8">
              <CardContent>
                <div className="space-y-4">
                  <div className="text-4xl">🌟</div>
                  <h3 className="text-lg font-semibold">No Community Roadmaps Yet</h3>
                  <p className="text-gray-600">Discover and learn from roadmaps created by our community</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: "Web Development", count: 25, icon: "💻" },
              { name: "Data Science", count: 18, icon: "📊" },
              { name: "Design", count: 15, icon: "🎨" },
              { name: "Mobile Development", count: 12, icon: "📱" }
            ].map(category => (
              <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.count} courses</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingRoadmapId}
        onClose={() => setDeletingRoadmapId(null)}
        onConfirm={handleConfirmDelete}
        title={(() => {
          if (!deletingRoadmapId) return "Delete Roadmap?";
          const allRoadmaps = [...availableCourses, ...personalRoadmaps, ...communityRoadmaps];
          const roadmap = allRoadmaps.find(r => r.id === deletingRoadmapId);
          if (!roadmap) return "Delete Roadmap?";
          
          if (roadmap.ownerType === 'TEAM') return "Delete Team Roadmap?";
          if (roadmap.ownerType === 'THIRD_PARTY') return "Unenroll from Course?";
          return "Delete Roadmap?";
        })()}
        description={(() => {
          if (!deletingRoadmapId) return "This will permanently delete this roadmap and all its units. This action cannot be undone.";
          const allRoadmaps = [...availableCourses, ...personalRoadmaps, ...communityRoadmaps];
          const roadmap = allRoadmaps.find(r => r.id === deletingRoadmapId);
          if (!roadmap) return "This will permanently delete this roadmap and all its units. This action cannot be undone.";
          
          if (roadmap.ownerType === 'TEAM') {
            return "This action cannot be undone. This roadmap will be permanently deleted for all team members.";
          }
          if (roadmap.ownerType === 'THIRD_PARTY') {
            return "You will lose progress tracking for this course. You can re-enroll later from the Available Courses section.";
          }
          return "This will permanently delete this roadmap and all its units. This action cannot be undone.";
        })()}
        confirmButtonText={(() => {
          if (!deletingRoadmapId) return undefined;
          const allRoadmaps = [...availableCourses, ...personalRoadmaps, ...communityRoadmaps];
          const roadmap = allRoadmaps.find(r => r.id === deletingRoadmapId);
          if (roadmap?.ownerType === 'THIRD_PARTY') return "Unenroll";
          return undefined;
        })()}
      />

      <DeleteConfirmationModal
        isOpen={showTeamWarning}
        onClose={() => {
          setShowTeamWarning(false);
          setTeamWarningType(null);
          setPendingRoadmapId(null);
        }}
        onConfirm={handleTeamWarningConfirm}
        title={teamWarningType === 'paid' ? "Unenroll and Leave Team?" : "Unenroll from Course?"}
        description={teamWarningType === 'paid'
          ? "Unenrolling from this paid course will also remove you from your current team. Are you sure?"
          : "Unenrolling may affect collaboration in your team. Are you sure?"
        }
        confirmButtonText="Unenroll"
      />

      <CourseStartedModal
        isOpen={showCourseStartedModal}
        onClose={() => setShowCourseStartedModal(false)}
        courseName={startedCourseName}
        sectionTitle={PERSONAL_SECTION_TITLE}
      />
    </Layout>
  );
};

export default Courses;
