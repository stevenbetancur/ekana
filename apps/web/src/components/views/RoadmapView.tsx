import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoadmapsContext } from '@/contexts/RoadmapsContext';
import { useProgressContext } from '@/contexts/ProgressContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle, BookOpen, Clock, Target, Settings, AlertTriangle, Users, Award, Play, FileText, ClipboardCheck, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { useRoadmap, useUserProgress } from '@/hooks/useMockData';
import { useAuth } from '@/contexts/AuthContext';
import { useRoadmapPermissions } from '@/hooks/useRoadmapPermissions';
import { useCheckForExistingCopy } from '@/hooks/useCheckForExistingCopy';
import CopyRoadmapDialog from '@/components/CopyRoadmapDialog';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { RoadmapActionsDropdown } from '@/components/RoadmapActionsDropdown';
import ConfirmSubunitCompletionModal from '@/components/ConfirmSubunitCompletionModal';

interface RoadmapViewProps {
  roadmap?: any;
  units?: any[];
  permissions?: any;
  currentUser?: any;
  userProgress?: any[];
  context?: 'page' | 'team';
  teamId?: string;
  onRoadmapAction?: (action: string) => void;
}

const RoadmapView = ({ 
  roadmap: propRoadmap, 
  units: propUnits, 
  permissions: propPermissions,
  currentUser: propCurrentUser,
  userProgress: propUserProgress,
  context = 'page',
  teamId,
  onRoadmapAction: propOnRoadmapAction
}: RoadmapViewProps = {}) => {
  // 1. Core React hooks
  const navigate = useNavigate();
  const { roadmapId } = useParams<{ roadmapId: string }>();
  
  // 2. All State hooks (must be at top, before any conditional logic)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
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
  
  // 3. All Context and Data hooks
  const { user: authUser } = useAuth();
  const { roadmaps, updateRoadmapVisibility, deleteRoadmap, unenrollFromRoadmap, copyRoadmapForUser } = useRoadmapsContext();
  const { toggleSubunitCompletion } = useProgressContext();
  
  // Fetch data using hooks (only if props not provided)
  const hookData = useRoadmap(roadmapId || '');
  const hookUserProgress = useUserProgress(authUser?.id || '', roadmapId || '');
  
  // Get roadmap from context if not provided as prop
  const contextRoadmap = roadmapId ? roadmaps.find(r => r.id === roadmapId) : null;
  
  console.log("DEBUG: Checking permissions for Roadmap:", hookData.roadmap?.id, "User:", authUser);
  const hookPermissions = useRoadmapPermissions({
    roadmap: hookData.roadmap || {
      ownerType: 'USER',
      ownerId: '',
      isPaid: false
    }, 
    user: authUser ? {
      id: authUser.id,
      isAdmin: (authUser as any).isAdmin,
      isPremium: authUser.isPremium,
      hasActiveTeam: authUser.hasActiveTeam,
      teamId: (authUser as any).teamId
    } : null
  });

  // Use props if provided, otherwise use hook data
  const roadmap = propRoadmap || hookData.roadmap;
  const units = propUnits || hookData.units;
  const currentUser = propCurrentUser || authUser;
  const userProgress = propUserProgress || hookUserProgress;
  const permissions = propPermissions || hookPermissions;
  const hasExistingCopy = useCheckForExistingCopy(currentUser, roadmap);

  console.log("DEBUG: RoadmapView received roadmap:", roadmap, "Units:", units);
  console.log("DEBUG: UserProgress array:", userProgress);
  console.log("DEBUG: Current user ID:", currentUser?.id);

  // Loading and error states
  if (!roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Roadmap not found</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Please log in to view this roadmap</p>
      </div>
    );
  }

  // Determine if user can view content
  const canViewContent = permissions.hasUserAccess;

  // Helper to check if subunit is completed
  const isSubunitCompleted = (subunitId: string) => {
    return userProgress.some(p => p.subunitId === subunitId && p.completedAt !== null);
  };

  // Helper to get completion count for a unit
  const getUnitCompletionCount = (unit: any) => {
    const completed = unit.subunits?.filter((sub: any) => isSubunitCompleted(sub.id)).length || 0;
    const total = unit.subunits?.length || 0;
    return { completed, total };
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

  const handleBackNavigation = () => {
    if (context === 'team' && teamId) {
      navigate(`/team/${teamId}`);
    } else {
      navigate('/courses');
    }
  };

  const handleSubunitNavigation = (unitId: string, subunitId: string) => {
    // Navigate to unit based on context
    if (context === 'team' && teamId) {
      navigate(`/team/${teamId}/roadmap/${roadmap.id}/unit/${unitId}?subunit=${subunitId}`);
    } else {
      navigate(`/roadmap/${roadmap.id}/unit/${unitId}?subunit=${subunitId}`);
    }
  };

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


  const handleRoadmapAction = (action: string) => {
    // Handle 'copy' action locally - RoadmapView manages the copy dialog flow
    if (action === 'copy') {
      if (permissions.canCopy) {
        setShowCopyDialog(true);
      }
      return;
    }

    // If parent provided an action handler, use it (for state management)
    if (propOnRoadmapAction) {
      propOnRoadmapAction(action);
      return;
    }

    // Otherwise, use default local behavior with context updates
    switch (action) {
      case 'edit':
        if (permissions.canEdit) {
          // Navigate based on context
          if (context === 'team' && teamId) {
            navigate(`/team/${teamId}/roadmap/${roadmap.id}/edit`);
          } else {
            navigate(`/roadmap/${roadmap.id}/edit`);
          }
        }
        break;
      case 'toggle-visibility':
        if (roadmap.id) {
          updateRoadmapVisibility(roadmap.id);
          toast.success(roadmap.isPublic ? "Roadmap is now private" : "Roadmap is now public");
        }
        break;
      case 'report':
        toast.success("Report submitted. Thank you for helping us maintain quality content.");
        break;
      case 'delete':
        if (permissions.canDelete) {
          setDeleteModalOpen(true);
        }
        break;
    }
  };

  const handleCopyRoadmap = async () => {
    console.log("🔵 handleCopyRoadmap called");
    console.log("🔵 roadmap:", roadmap ? { id: roadmap.id, title: roadmap.title } : null);
    console.log("🔵 currentUser:", currentUser ? { id: currentUser.id, name: currentUser.name } : null);
    
    if (!roadmap || !currentUser) {
      console.error("🔵 Missing roadmap or currentUser");
      toast.error("Unable to copy roadmap. Please try again.");
      return;
    }
    
    try {
      console.log("🔵 Calling copyRoadmapForUser...");
      const newRoadmapId = await copyRoadmapForUser(
        roadmap.id.toString(),
        currentUser.id,
        currentUser.name || 'User'
      );
      console.log("🔵 copyRoadmapForUser returned:", newRoadmapId);
      
      console.log("🔵 Navigating to /courses with state...");
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
      console.error("🔵 handleCopyRoadmap caught error:", error);
      // Error already toasted in context
      setShowCopyDialog(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!roadmap.id || !currentUser) return;
    
    if (roadmap.ownerType === 'THIRD_PARTY') {
      // Unenroll from third-party course
      unenrollFromRoadmap(currentUser.id, roadmap.id.toString());
      toast.success("Successfully unenrolled from course");
    } else {
      // Delete user-owned or team roadmap
      deleteRoadmap(roadmap.id.toString());
      toast.success("Roadmap deleted successfully");
    }
    
    navigate('/courses');
    setDeleteModalOpen(false);
  };

  return (
    <TooltipProvider>

      {/* Completion Confirmation Modal */}
      <ConfirmSubunitCompletionModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
        onConfirm={confirmSubunitToggle}
        subunitTitle={confirmModalState.subunitTitle}
        isCompleting={confirmModalState.isCompleting}
      />

      {/* Copy Roadmap Dialog */}
      <CopyRoadmapDialog
        isOpen={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        onConfirm={handleCopyRoadmap}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          roadmap.ownerType === 'TEAM'
            ? "Delete Team Roadmap?"
            : roadmap.ownerType === 'THIRD_PARTY'
            ? "Unenroll from Course?"
            : "Delete Roadmap?"
        }
        description={
          roadmap.ownerType === 'TEAM'
            ? "This action cannot be undone. This roadmap will be permanently deleted for all team members."
            : roadmap.ownerType === 'THIRD_PARTY'
            ? "You will lose progress tracking for this course. You can re-enroll later from the Available Courses section."
            : "This action cannot be undone. All units and progress associated with this roadmap will be permanently deleted."
        }
      />

      <div className={context === 'team' ? 'bg-background' : 'min-h-screen bg-background'}>
        {/* Header - Conditional based on context */}
        {context === 'team' ? (
          <div className="bg-ekana-purple-dark border-b px-4 h-[75px] sticky top-0 z-10 flex items-center">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-ekana-white hover:bg-ekana-purple-light p-1"
                onClick={handleBackNavigation}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold text-ekana-white">Team Roadmap</h2>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={handleBackNavigation}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                {roadmap.ownerType === 'TEAM' ? 'Team Roadmap' : 'Personal Roadmap'}
              </h1>
              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                {permissions.ownershipLabel}
              </Badge>
              {roadmap.ownerType === 'TEAM' ? (
                <Users className="h-6 w-6 text-primary" />
              ) : (
                <Target className="h-6 w-6 text-primary" />
              )}
            </div>
          </div>
        )}

        {/* Roadmap Info Section */}
        <div className={context === 'team' ? 'px-6 pt-6' : 'max-w-6xl mx-auto px-6'}>
          <Card className="mb-6 bg-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">
                      {roadmap.title}
                    </h1>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <RoadmapActionsDropdown 
                        roadmap={roadmap} 
                        permissions={permissions}
                        existingCopy={hasExistingCopy}
                        onAction={handleRoadmapAction}
                      />
                    </DropdownMenu>
                  </div>
                  <p className="text-gray-600 mb-4">{roadmap.description}</p>

                  {/* Paid Content Warning */}
                  {permissions.showPaidContentWarning && (
                    <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        Your access to this premium content has been revoked. Leave your current team to resolve this conflict.
                      </p>
                    </div>
                  )}
                  
                  {/* Stats based on ownerType */}
                  {roadmap.ownerType === 'THIRD_PARTY' ? (
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{roadmap.totalUnits || 0} units</span>
                      </div>
                      {roadmap.estimatedTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{roadmap.estimatedTime}</span>
                        </div>
                      )}
                      {roadmap.level && (
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4" />
                          <span>{roadmap.level}</span>
                        </div>
                      )}
                      {roadmap.students && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{roadmap.students} students</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{roadmap.completedUnits || 0}/{roadmap.totalUnits || 0} units completed</span>
                      </div>
                      {roadmap.createdAt && (
                        <span>Created {new Date(roadmap.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-600">{roadmap.progress || 0}%</span>
                    </div>
                    <Progress value={roadmap.progress || 0} className="h-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Access Gate */}
        {!canViewContent && (
          <div className={context === 'team' ? 'px-6 mb-6' : 'max-w-6xl mx-auto mb-6 px-6'}>
            <Card className="bg-gradient-to-r from-primary/10 to-purple-100 border-2 border-primary/20">
              <CardContent className="p-6 text-center">
                {hasExistingCopy.hasCopy ? (
                  <>
                    <Button 
                      size="lg"
                      onClick={() => navigate(`/roadmap/${hasExistingCopy.copyId}`)}
                    >
                      View Your Personal Copy
                    </Button>
                    <p className="text-muted-foreground mt-4">
                      You already have a personal copy of this roadmap.
                    </p>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg"
                      disabled={!permissions.canCopy}
                      onClick={() => handleRoadmapAction('copy')}
                    >
                      Create Your Own Copy
                    </Button>
                    <p className="text-muted-foreground mt-4">
                      Create your own copy of this roadmap to track your progress.
                    </p>
                    {!permissions.canCopy && permissions.copyTooltip && (
                      <p className="text-sm text-muted-foreground mt-2">{permissions.copyTooltip}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Roadmap Content - Accordion UI */}
        <div className={context === 'team' ? 'px-6 pb-6' : 'max-w-6xl mx-auto pb-6 px-6'}>
          <Accordion type="multiple" className="space-y-4">
            {units.map((unit) => {
              const { completed, total } = getUnitCompletionCount(unit);
              const isFullyComplete = completed === total && total > 0;
              
              return (
                <AccordionItem key={unit.id} value={unit.id} className="border rounded-lg bg-white shadow-sm">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                        {unit.sequence_order}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-800">{unit.title}</h3>
                          {isFullyComplete && (
                            <CheckCircle className="h-5 w-5 text-green-600 fill-green-100" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{unit.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{completed}/{total} completed</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 ml-11">
                      {unit.subunits?.map((subunit: any) => {
                        const isCompleted = isSubunitCompleted(subunit.id);
                        const SubunitIcon = getSubunitIcon(subunit.type);
                        
                        return (
                          <div 
                            key={subunit.id} 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              {canViewContent && (
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleSubunitToggle(subunit.id, subunit.title)}
                                  className="shrink-0"
                                />
                              )}
                              <SubunitIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{subunit.title}</p>
                                {subunit.duration && (
                                  <p className="text-xs text-muted-foreground">{subunit.duration}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:bg-primary/10"
                              onClick={() => handleSubunitNavigation(unit.id, subunit.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {canViewContent ? "Start" : "Preview"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RoadmapView;
