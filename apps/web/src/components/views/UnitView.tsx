import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Copy, Lock, ChevronLeft, ChevronRight, FileText, ClipboardCheck, Dumbbell, ArrowLeft } from "lucide-react";
import { useRoadmap, useUserProgress, useUnit } from "@/hooks/useMockData";
import { useRoadmapPermissions } from "@/hooks/useRoadmapPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useProgressContext } from "@/contexts/ProgressContext";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import CopyRoadmapDialog from "@/components/CopyRoadmapDialog";
import ConfirmSubunitCompletionModal from "@/components/ConfirmSubunitCompletionModal";
import { toast } from "sonner";
import { TeamLayoutContext } from "@/layouts/TeamLayout";

interface UnitViewProps {
  context?: 'page' | 'team';
}

const UnitView = ({ context: propContext }: UnitViewProps = {}) => {
  const { roadmapId, unitId, teamId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const { toggleSubunitCompletion } = useProgressContext();
  const { copyRoadmapForUser } = useRoadmapsContext();
  
  // Detect context from outlet (TeamLayout) or use prop
  const outletContext = useOutletContext<TeamLayoutContext | null>();
  const isInTeamLayout = !!outletContext;
  const context = isInTeamLayout ? 'team' : (propContext || 'page');
  const currentUser = isInTeamLayout ? outletContext.user : authUser;
  
  // Fetch data
  const unit = useUnit(unitId);
  const { roadmap, units } = useRoadmap(roadmapId || '', teamId);
  const userProgress = useUserProgress(currentUser?.id || '', roadmapId || '', teamId);
  
  // Get permissions
  const permissions = useRoadmapPermissions({ 
    roadmap: roadmap || {
      ownerType: 'USER',
      ownerId: '',
      isPaid: false
    }, 
    user: currentUser || undefined
  });

  // State for copy dialog, selected subunit, and completion modal
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedSubunitId, setSelectedSubunitId] = useState<string | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    subunitId: string;
    subunitTitle: string;
    isCompleting: boolean;
  }>({
    isOpen: false,
    subunitId: '',
    subunitTitle: '',
    isCompleting: false,
  });

  // Initialize selected subunit on mount or when unit/query changes
  useEffect(() => {
    if (!unit || !unit.subunits || unit.subunits.length === 0) return;
    
    const subunitIdFromQuery = searchParams.get('subunit');
    if (subunitIdFromQuery && unit.subunits.some((s: any) => s.id === subunitIdFromQuery)) {
      setSelectedSubunitId(subunitIdFromQuery);
    } else {
      // Default to first incomplete subunit, or first subunit
      const firstIncomplete = unit.subunits.find((s: any) => !isSubunitCompleted(s.id));
      setSelectedSubunitId(firstIncomplete?.id || unit.subunits[0]?.id);
    }
  }, [unit, searchParams]);

  // Helper to check if subunit is completed
  const isSubunitCompleted = (subunitId: string) => {
    return userProgress.some(p => p.subunitId === subunitId && p.completedAt !== null);
  };

  // Helper to get icon for subunit type
  const getSubunitIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return FileText;
      case 'quiz': return ClipboardCheck;
      case 'exercise': return Dumbbell;
      default: return FileText;
    }
  };

  // Handle subunit toggle with confirmation
  const handleSubunitToggle = (subunitId: string, subunitTitle: string) => {
    if (!currentUser || !roadmap) return;
    const isCurrentlyCompleted = isSubunitCompleted(subunitId);
    
    setConfirmModalState({
      isOpen: true,
      subunitId,
      subunitTitle,
      isCompleting: !isCurrentlyCompleted,
    });
  };

  const confirmSubunitToggle = () => {
    if (!currentUser || !roadmap) return;
    toggleSubunitCompletion(currentUser.id, roadmap.id.toString(), confirmModalState.subunitId, teamId);
    setConfirmModalState({ isOpen: false, subunitId: '', subunitTitle: '', isCompleting: false });
  };

  // Handle navigation between subunits
  const handlePreviousSubunit = () => {
    if (!unit || !selectedSubunitId) return;
    const currentIndex = unit.subunits.findIndex((s: any) => s.id === selectedSubunitId);
    if (currentIndex > 0) {
      setSelectedSubunitId(unit.subunits[currentIndex - 1].id);
    }
  };

  const handleNextSubunit = () => {
    if (!unit || !selectedSubunitId) return;
    const currentIndex = unit.subunits.findIndex((s: any) => s.id === selectedSubunitId);
    if (currentIndex < unit.subunits.length - 1) {
      setSelectedSubunitId(unit.subunits[currentIndex + 1].id);
    } else {
      // Navigate to next unit if available
      const currentUnitIndex = units.findIndex((u: any) => u.id === unit.id);
      if (currentUnitIndex >= 0 && currentUnitIndex < units.length - 1) {
        const nextUnit = units[currentUnitIndex + 1];
        if (context === 'team' && teamId) {
          navigate(`/team/${teamId}/roadmap/${roadmapId}/unit/${nextUnit.id}`);
        } else {
          navigate(`/roadmap/${roadmapId}/unit/${nextUnit.id}`);
        }
      }
    }
  };

  // Handle copy roadmap
  const handleCopyRoadmap = async () => {
    console.log("🔵 UnitView handleCopyRoadmap called");
    
    if (!roadmap || !currentUser) {
      toast.error("Unable to copy roadmap. Please try again.");
      return;
    }
    
    try {
      console.log("🔵 UnitView: Calling copyRoadmapForUser...");
      const newRoadmapId = await copyRoadmapForUser(
        roadmap.id.toString(),
        currentUser.id,
        currentUser.name || 'User'
      );
      console.log("🔵 UnitView: copyRoadmapForUser returned:", newRoadmapId);
      
      // Navigate to Courses with state to trigger success modal
      // Navigate BEFORE closing dialog to prevent race conditions
      navigate('/courses', { 
        state: { 
          roadmapCopied: true, 
          roadmapId: newRoadmapId, 
          roadmapTitle: roadmap.title 
        } 
      });
      setShowCopyDialog(false);
    } catch (error) {
      console.error("🔵 UnitView: handleCopyRoadmap caught error:", error);
      // Error already toasted in context
      setShowCopyDialog(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (context === 'team' && teamId) {
      navigate(`/team/${teamId}/roadmap`);
    } else {
      navigate(`/roadmap/${roadmapId}`);
    }
  };

  // Loading state
  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Unit not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4 w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has access
  const hasAccess = permissions.hasUserAccess;

  // Get selected subunit data
  const selectedSubunit = unit?.subunits?.find((s: any) => s.id === selectedSubunitId);
  const currentIndex = unit?.subunits?.findIndex((s: any) => s.id === selectedSubunitId) ?? -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < (unit?.subunits?.length || 0) - 1;

  const content = (
    <>
      {/* Copy Roadmap Dialog */}
      <CopyRoadmapDialog
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        onConfirm={handleCopyRoadmap}
      />

      {/* Completion Confirmation Modal */}
      <ConfirmSubunitCompletionModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
        onConfirm={confirmSubunitToggle}
        subunitTitle={confirmModalState.subunitTitle}
        isCompleting={confirmModalState.isCompleting}
      />

      {/* Sticky header - context aware */}
      <div className={`border-b sticky top-0 z-10 flex items-center ${
        context === 'team' 
          ? 'bg-ekana-purple-dark px-4 h-[75px]' 
          : 'bg-ekana-purple-dark h-[60px] px-6'
      }`}>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-ekana-white hover:bg-ekana-purple-light p-1"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-ekana-white">
            {unit?.title}
          </h2>
        </div>
      </div>

      <div className={context === 'team' ? 'p-6' : 'max-w-6xl mx-auto px-6 py-6'}>
        {/* Locked State Banner */}
        {!hasAccess && (
          <Card className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 text-orange-900">
                    Premium Content Locked
                  </h3>
                  <p className="text-orange-800 mb-4">
                    This unit is part of a premium roadmap. Create your own copy to unlock full access and track your progress.
                  </p>
                  <Button 
                    size="lg"
                    disabled={!permissions.canCopy}
                    onClick={() => setShowCopyDialog(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Make a personal copy of this roadmap to get access
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Subunit List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unit.subunits?.map((subunit: any) => {
                  const isCompleted = isSubunitCompleted(subunit.id);
                  const isSelected = subunit.id === selectedSubunitId;
                  const SubunitIcon = getSubunitIcon(subunit.type);
                  
                  return (
                    <div
                      key={subunit.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedSubunitId(subunit.id)}
                    >
                      {hasAccess && (
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleSubunitToggle(subunit.id, subunit.title)}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0"
                        />
                      )}
                      <SubunitIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                          {subunit.title}
                        </p>
                        {subunit.duration && (
                          <p className="text-xs text-muted-foreground">{subunit.duration}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right: Content Player */}
          <div className="lg:col-span-2 space-y-4">
            {/* Unit Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{unit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{unit.description}</p>
              </CardContent>
            </Card>

            {/* Selected Subunit Content */}
            {selectedSubunit && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{selectedSubunit.title}</CardTitle>
                    {hasAccess && (
                      <Checkbox
                        checked={isSubunitCompleted(selectedSubunit.id)}
                        onCheckedChange={() => handleSubunitToggle(selectedSubunit.id, selectedSubunit.title)}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Content Player */}
                  <div className={`rounded-lg aspect-video flex items-center justify-center relative ${
                    !hasAccess ? 'bg-gray-200 opacity-50' : 'bg-gray-100'
                  }`}>
                    {!hasAccess && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm rounded-lg z-10">
                        <div className="text-center">
                          <Lock className="h-12 w-12 text-white mx-auto mb-3" />
                          <p className="text-white font-medium">Content Locked</p>
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      {selectedSubunit.type === 'video' ? (
                        <>
                          <Play className={`h-16 w-16 mx-auto mb-4 ${!hasAccess ? 'text-gray-300' : 'text-gray-400'}`} />
                          <p className={`text-lg ${!hasAccess ? 'text-gray-400' : 'text-gray-500'}`}>
                            Video content will be embedded here
                          </p>
                        </>
                      ) : (
                        <>
                          <FileText className={`h-16 w-16 mx-auto mb-4 ${!hasAccess ? 'text-gray-300' : 'text-gray-400'}`} />
                          <p className={`text-lg ${!hasAccess ? 'text-gray-400' : 'text-gray-500'}`}>
                            Article content will be displayed here
                          </p>
                        </>
                      )}
                      {selectedSubunit.contentUrl && hasAccess && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedSubunit.contentUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional locked message */}
                  {!hasAccess && (
                    <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        🔒 Copy this roadmap to unlock content and track your progress
                      </p>
                      <Button 
                        size="sm"
                        className="mt-3"
                        disabled={!permissions.canCopy}
                        onClick={() => setShowCopyDialog(true)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Roadmap
                      </Button>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePreviousSubunit}
                      disabled={!hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous Lesson
                    </Button>
                    <Button
                      onClick={handleNextSubunit}
                      disabled={!hasNext && currentIndex >= units.length - 1}
                    >
                      Next Lesson
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Always return content without Layout wrapper (parent route handles it)
  return content;
};

export default UnitView;
