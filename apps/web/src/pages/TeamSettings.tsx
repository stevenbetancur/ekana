import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Edit2, 
  MoreVertical, 
  UserPlus, 
  Copy, 
  ExternalLink,
  AlertTriangle,
  Shield,
  ShieldOff,
  Users,
  Mail,
  Target,
  Languages,
  Clock,
  User,
  Calendar,
  BookOpen,
  Settings,
  Eye,
  Camera,
  X,
  Search
} from "lucide-react";
import { toast } from "sonner";
import TeamGoalModal from "@/components/TeamGoalModal";
import { AVAILABLE_LANGUAGES, GOALS, LEVELS, COMMUNICATION_OPTIONS } from '@/lib/constants';
import { useTeamContext } from "@/contexts/TeamContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TeamSettings = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditBioModal, setShowEditBioModal] = useState(false);
  const [showEditAvatarModal, setShowEditAvatarModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showEditDurationModal, setShowEditDurationModal] = useState(false);
  const [showEditMaxMembersModal, setShowEditMaxMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'makeAdmin' | 'demoteMember' | 'removeMember' | 'leaveTeam' | 'deleteTeam';
    target?: any;
    message: string;
  } | null>(null);

  // Form states
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [courseOption, setCourseOption] = useState("current");
  const [customCourse, setCustomCourse] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Team settings states
  const [teamLevel, setTeamLevel] = useState("aggregate");
  const [languages, setLanguages] = useState("aggregate");
  const [goals, setGoals] = useState("aggregate");
  const [timeCommitments, setTimeCommitments] = useState("aggregate");
  const [editingTeamLevel, setEditingTeamLevel] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingTimeCommitments, setEditingTimeCommitments] = useState(false);
  const [customTeamLevel, setCustomTeamLevel] = useState("beginner");
  const [customLanguagesList, setCustomLanguagesList] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState("");
  const [customTimeCommitment, setCustomTimeCommitment] = useState(10);
  
  // Communication preferences state
  const [communicationPreferences, setCommunicationPreferences] = useState("aggregate");
  const [editingCommunicationPreferences, setEditingCommunicationPreferences] = useState(false);
  const [customCommunicationPreferences, setCustomCommunicationPreferences] = useState<string[]>([]);
  const [maxMembers, setMaxMembers] = useState(6);
  const [duration, setDuration] = useState("ongoing");
  const [durationValue, setDurationValue] = useState(8);
  const [durationType, setDurationType] = useState("weeks");
  const [languageSearch, setLanguageSearch] = useState("");
  const [archiveOnEnd, setArchiveOnEnd] = useState(false);
  const [onlyAdminsEditGoals, setOnlyAdminsEditGoals] = useState(true);
  const [onlyAdminsAcceptRequests, setOnlyAdminsAcceptRequests] = useState(true);
  const [onlyAdminsRemoveMembers, setOnlyAdminsRemoveMembers] = useState(true);
  const [allMembersAdmins, setAllMembersAdmins] = useState(false);
  const [allowSearch, setAllowSearch] = useState(true);
  const [showTeamStats, setShowTeamStats] = useState(true);
  const [showMemberList, setShowMemberList] = useState(true);

  // Add temporary state for modal editing
  const [tempMaxMembers, setTempMaxMembers] = useState(6);
  const [tempDurationValue, setTempDurationValue] = useState(8);
  const [tempDurationType, setTempDurationType] = useState("weeks");

  // Get team and members from TeamContext
  const { teams, getTeamMembersWithRoles, updateTeam, promoteAllMembersToAdmin, updateMemberRole, deleteTeam, leaveTeam, removeMember } = useTeamContext();
  
  // Try to get team from outlet context (TeamLayout)
  const outletContext = useOutletContext<{ team: any } | undefined>();
  const teamFromOutlet = outletContext?.team;
  
  // Find the specific team (prioritize outlet context, fallback to direct lookup)
  const teamFromContext = teamFromOutlet || teams.find(t => t.id === teamId);
  
  // Get members with roles directly from context (eliminates manual lookup)
  const membersWithRoles = getTeamMembersWithRoles(teamId || '');
  
  // Transform team members for compatibility - using getTeamMembersWithRoles (direct access to userId, role, profile)
  const transformedMembers = membersWithRoles.map((memberWithRole, index) => {
    const { userId, role, profile } = memberWithRole;
    return {
      id: index + 1,
      userId: userId, // Include actual user ID for proper comparison
      name: profile?.name || 'Unknown',
      avatar: (profile?.name || 'U').split(' ').map(n => n[0]).join(''),
      isAdmin: role === 'admin',
      online: Math.random() > 0.3,
      currentUnit: Math.floor(Math.random() * 3) + 1,
      goalCompleted: Math.random() > 0.5
    };
  });
  
  const [members, setMembers] = useState(transformedMembers);

  // Sync members state when transformedMembers changes (e.g., when profiles load from Supabase)
  useEffect(() => {
    if (transformedMembers.length > 0) {
      // Only update if we have actual member data and names are not all "Unknown"
      const hasRealNames = transformedMembers.some(m => m.name !== 'Unknown');
      if (hasRealNames) {
        setMembers(transformedMembers);
      }
    }
  }, [membersWithRoles]); // Depend on membersWithRoles which changes when profiles load

  const team = teamFromContext ? {
    ...teamFromContext,
    members,
    resourceLinks: teamFromContext.resourceLinks
  } : null;

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Team not found</p>
      </div>
    );
  }

  // Use user ID comparison instead of name comparison for reliable admin check
  const isCurrentUserAdmin = team.members.find(m => m.userId === user?.id)?.isAdmin || false;
  const isLastAdmin = team.members.filter(m => m.isAdmin).length === 1 && isCurrentUserAdmin;

  // Initialize state from team data
  useEffect(() => {
    if (teamFromContext) {
      const teamLevelValue = typeof teamFromContext.teamLevel === 'string' ? teamFromContext.teamLevel : 'aggregate';
      const languagesValue = typeof teamFromContext.languages === 'string' ? teamFromContext.languages : 'aggregate';
      const goalsValue = typeof teamFromContext.goals === 'string' ? teamFromContext.goals : 'aggregate';
      const timeCommitmentsValue = typeof teamFromContext.timeCommitments === 'string' ? teamFromContext.timeCommitments : 'aggregate';
      const commPrefsValue = typeof teamFromContext.communicationPreferences === 'string' ? teamFromContext.communicationPreferences : 'aggregate';
      
      setTeamLevel(teamLevelValue);
      setLanguages(languagesValue);
      setGoals(goalsValue);
      setTimeCommitments(timeCommitmentsValue);
      setCommunicationPreferences(commPrefsValue);
      
      // Initialize custom value states from saved data
      if (teamLevelValue !== 'aggregate') {
        setCustomTeamLevel(teamLevelValue);
      }
      if (goalsValue !== 'aggregate') {
        setCustomGoals(goalsValue);
      }
      if (languagesValue !== 'aggregate') {
        // Parse comma-separated languages string into array
        setCustomLanguagesList(languagesValue.split(',').map(l => l.trim()).filter(Boolean));
      }
      if (timeCommitmentsValue !== 'aggregate') {
        // Extract numeric value from "X hours/week" format
        const match = timeCommitmentsValue.match(/(\d+)/);
        if (match) {
          setCustomTimeCommitment(parseInt(match[1]));
        }
      }
      if (commPrefsValue !== 'aggregate') {
        // Parse comma-separated communication preferences string into array
        setCustomCommunicationPreferences(commPrefsValue.split(',').map(p => p.trim()).filter(Boolean));
      }
      
      setMaxMembers(teamFromContext.maxMembers || 6);
      setDurationValue(teamFromContext.durationValue || 8);
      setDurationType(teamFromContext.durationType || "weeks");
      setArchiveOnEnd(teamFromContext.archiveOnEnd || false);
      setOnlyAdminsEditGoals(teamFromContext.onlyAdminsEditGoals ?? true);
      setOnlyAdminsAcceptRequests(teamFromContext.onlyAdminsAcceptRequests ?? true);
      setOnlyAdminsRemoveMembers(teamFromContext.onlyAdminsRemoveMembers ?? true);
      setAllMembersAdmins(teamFromContext.allMembersAdmins || false);
      setAllowSearch(teamFromContext.allowSearch ?? true);
      setShowTeamStats(teamFromContext.showTeamStats ?? true);
      setShowMemberList(teamFromContext.showMemberList ?? true);
    }
  }, [teamFromContext]);

  const handleAIAccess = () => {
    navigate(`/team/${teamId}/ekky-ai`);
  };

  const handleRoadmap = () => {
    navigate(`/team/${teamId}/roadmap`);
  };

  const handleLeaderboard = () => {
    navigate(`/team/${teamId}/leaderboard`);
  };

  const handleEditName = () => {
    setEditName(team.name);
    setShowEditNameModal(true);
  };

  const handleEditBio = () => {
    setEditBio(team.bio);
    setShowEditBioModal(true);
  };

  const handleEditAvatar = () => {
    setEditAvatar(team.avatar);
    setShowEditAvatarModal(true);
  };

  const handleEditCourse = () => {
    setEditCourse(team.course);
    setCourseOption("current");
    setCustomCourse("");
    setShowEditCourseModal(true);
  };

  const handleEditDuration = () => {
    setTempDurationValue(durationValue);
    setTempDurationType(durationType);
    setEditDuration(`${team.durationValue} ${team.durationType}`);
    setShowEditDurationModal(true);
  };

  const handleEditMaxMembers = () => {
    setTempMaxMembers(maxMembers);
    setShowEditMaxMembersModal(true);
  };

  const handleSaveName = () => {
    if (!teamId) return;
    updateTeam(teamId, { name: editName });
    toast.success("Team name updated!");
    setShowEditNameModal(false);
  };

  const handleSaveBio = () => {
    if (!teamId) return;
    updateTeam(teamId, { bio: editBio });
    toast.success("Team bio updated!");
    setShowEditBioModal(false);
  };

  const handleSaveAvatar = () => {
    if (!teamId) return;
    updateTeam(teamId, { avatar: editAvatar });
    toast.success("Team avatar updated!");
    setShowEditAvatarModal(false);
  };

  const handleSaveCourse = () => {
    if (!teamId) return;
    const newCourse = courseOption === "custom" ? customCourse : editCourse;
    updateTeam(teamId, { course: newCourse });
    toast.success("Course updated!");
    setShowEditCourseModal(false);
  };

  const handleSaveDuration = () => {
    // Show confirmation modal before saving
    setConfirmAction({
      type: 'leaveTeam', // Reuse the confirmation modal
      message: "Are you sure you want to change the team duration? This action cannot be undone and may affect team goals and milestones."
    });
    setShowConfirmModal(true);
  };

  const handleSaveMaxMembers = () => {
    // Show confirmation modal before saving
    setConfirmAction({
      type: 'makeAdmin', // Reuse the confirmation modal
      message: "Are you sure you want to change the maximum members? This may affect team dynamics and member management."
    });
    setShowConfirmModal(true);
  };

  // Calculate remaining time
  const calculateRemainingTime = () => {
    // Mock calculation - in real app, this would calculate based on actual dates
    return "3 weeks remaining";
  };


  // Language handling functions
  const addLanguage = (language: string) => {
    if (customLanguagesList.length < 3 && !customLanguagesList.includes(language)) {
      setCustomLanguagesList([...customLanguagesList, language]);
      setLanguageSearch("");
    } else if (customLanguagesList.length >= 3) {
      toast.error("You can only select up to 3 languages.");
    }
  };

  const removeLanguage = (language: string) => {
    setCustomLanguagesList(customLanguagesList.filter(l => l !== language));
  };

  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang => 
    lang.toLowerCase().includes(languageSearch.toLowerCase()) &&
    !customLanguagesList.includes(lang)
  );

  const handleMakeAdmin = (member: any) => {
    setConfirmAction({
      type: 'makeAdmin',
      target: member,
      message: `Are you sure you want to make ${member.name} an admin? They will have full control over team settings.`
    });
    setShowConfirmModal(true);
  };

  const handleDemoteMember = (member: any) => {
    setConfirmAction({
      type: 'demoteMember',
      target: member,
      message: `Are you sure you want to demote ${member.name} to member? They will lose admin privileges.`
    });
    setShowConfirmModal(true);
  };

  const handleRemoveMember = (member: any) => {
    setConfirmAction({
      type: 'removeMember',
      target: member,
      message: `Are you sure you want to remove ${member.name} from the team? This action cannot be undone.`
    });
    setShowConfirmModal(true);
  };

  const handleLeaveTeam = () => {
    setConfirmAction({
      type: 'leaveTeam',
      message: "Are you sure you want to leave this team? You will lose access to all team resources and conversations."
    });
    setShowConfirmModal(true);
  };

  const handleDeleteTeam = () => {
    setConfirmAction({
      type: 'deleteTeam',
      message: "⚠️ WARNING: This will permanently delete the team and all its data. This action cannot be undone. All members will lose access immediately."
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case 'makeAdmin':
        // Check if this is actually a max members change confirmation
        if (confirmAction.message.includes("maximum members")) {
          if (teamId) {
            updateTeam(teamId, { maxMembers: tempMaxMembers });
          }
          setMaxMembers(tempMaxMembers);
          setShowEditMaxMembersModal(false);
          toast.success("Max members updated!");
        } else if (confirmAction.target) {
          if (confirmAction.target.userId && teamId) {
            try {
              await updateMemberRole(teamId, confirmAction.target.userId, 'admin');
              // Only update local state and show success if the DB operation succeeded
              setMembers(prevMembers => 
                prevMembers.map(member => 
                  member.id === confirmAction.target.id 
                    ? { ...member, isAdmin: true }
                    : member
                )
              );
              toast.success(`${confirmAction.target.name} has been made an admin!`);
            } catch (error) {
              // Error toast is already shown by TeamContext.updateMemberRole
            }
          }
        }
        break;
      case 'demoteMember':
        if (confirmAction.target) {
          if (confirmAction.target.userId && teamId) {
            try {
              await updateMemberRole(teamId, confirmAction.target.userId, 'member');
              // Only update local state and show success if the DB operation succeeded
              setMembers(prevMembers => 
                prevMembers.map(member => 
                  member.id === confirmAction.target.id 
                    ? { ...member, isAdmin: false }
                    : member
                )
              );
              toast.success(`${confirmAction.target.name} has been demoted to member.`);
            } catch (error) {
              // Error toast is already shown by TeamContext.updateMemberRole
            }
          }
        }
        break;
      case 'removeMember':
        if (confirmAction.target) {
          if (confirmAction.target.userId && teamId) {
            try {
              await removeMember(confirmAction.target.userId, teamId);
              // Only update local state and show success if the DB operation succeeded
              setMembers(prevMembers => 
                prevMembers.filter(member => member.id !== confirmAction.target.id)
              );
              toast.success(`${confirmAction.target.name} has been removed from the team.`);
            } catch (error) {
              // Error toast is already shown by TeamContext.removeMember
              // No need to update local state since the operation failed
            }
          }
        }
        break;
      case 'leaveTeam':
        // Check if this is actually a duration change confirmation
        if (confirmAction.message.includes("duration")) {
          if (teamId) {
            updateTeam(teamId, { 
              durationValue: tempDurationValue,
              durationType: tempDurationType,
              duration: `${tempDurationValue} ${tempDurationType}`
            });
          }
          setDurationValue(tempDurationValue);
          setDurationType(tempDurationType);
          setShowEditDurationModal(false);
          toast.success("Team duration updated!");
        } else {
          // Actually leave the team
          if (user && teamId) {
            leaveTeam(user.id, teamId);
          }
          toast.success("You have left the team.");
          navigate('/teams');
        }
        break;
      case 'deleteTeam':
        if (teamId) {
          deleteTeam(teamId);
        }
        toast.success("Team has been deleted.");
        navigate('/teams');
        break;
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleInviteMember = () => {
    if (inviteEmail) {
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
    }
    setShowInviteModal(false);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/team/${teamId}/join`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  const handleAllMembersAdminsToggle = (checked: boolean) => {
    if (checked) {
      // Promote all members to admin
      if (teamId) {
        promoteAllMembersToAdmin(teamId);
      }
      setMembers(prevMembers => 
        prevMembers.map(member => ({ ...member, isAdmin: true }))
      );
      toast.success("All team members have been promoted to admin!");
    } else {
      // Show toast message instead of mass-demoting
      toast.info("To demote admins, please change their roles individually in the Member list.");
    }
  };

  // Check if all members are admins for toggle visual state
  const areAllMembersAdmins = members.every(m => m.isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Edit Name Modal */}
      <Dialog open={showEditNameModal} onOpenChange={setShowEditNameModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Team name"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditNameModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveName}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bio Modal */}
      <Dialog open={showEditBioModal} onOpenChange={setShowEditBioModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Bio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Team bio"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditBioModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBio}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Picture Modal */}
      <Dialog open={showEditAvatarModal} onOpenChange={setShowEditAvatarModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Team Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Click to upload a team picture
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditAvatarModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("File picker would open here");
                setShowEditAvatarModal(false);
              }}>
                Choose File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Modal */}
      <Dialog open={showEditCourseModal} onOpenChange={setShowEditCourseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Edit Course/Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <RadioGroup 
                value={courseOption} 
                onValueChange={setCourseOption}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="current" id="current-course" />
                  <Label htmlFor="current-course" className="flex-1 font-medium">{team.course}</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="custom" id="custom-course" />
                  <Label htmlFor="custom-course" className="flex-1 font-medium">Custom</Label>
                </div>
              </RadioGroup>
              
              {courseOption === "custom" && (
                <div className="mt-4 pl-6">
                  <Input
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    placeholder="Enter custom course/topic"
                    className="w-full"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditCourseModal(false)} className="px-6">
                Cancel
              </Button>
              <Button onClick={handleSaveCourse} className="px-6">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Duration Modal */}
      <Dialog open={showEditDurationModal} onOpenChange={setShowEditDurationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duration Type</Label>
              <Select value={tempDurationType} onValueChange={(value) => {
                setTempDurationType(value);
                if (value === "months" && tempDurationValue > 6) {
                  setTempDurationValue(2);
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration Value</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (tempDurationType === "weeks" && tempDurationValue > 1) {
                      setTempDurationValue(tempDurationValue - 1);
                    } else if (tempDurationType === "months" && tempDurationValue > 2) {
                      setTempDurationValue(tempDurationValue - 1);
                    }
                  }}
                >
                  -
                </Button>
                <Input
                  value={tempDurationValue}
                  onChange={(e) => setTempDurationValue(parseInt(e.target.value) || 1)}
                  className="w-20 text-center"
                  type="number"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (tempDurationType === "weeks" && tempDurationValue < 7) {
                      setTempDurationValue(tempDurationValue + 1);
                    } else if (tempDurationType === "months" && tempDurationValue < 6) {
                      setTempDurationValue(tempDurationValue + 1);
                    }
                  }}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                {tempDurationType === "weeks" ? "1-7 weeks" : "2-6 months"}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDurationModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDuration}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Max Members Modal */}
      <Dialog open={showEditMaxMembersModal} onOpenChange={setShowEditMaxMembersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Max Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Maximum Number of Members</Label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => tempMaxMembers > 2 && setTempMaxMembers(tempMaxMembers - 1)}
                >
                  -
                </Button>
                <Input
                  value={tempMaxMembers}
                  onChange={(e) => setTempMaxMembers(parseInt(e.target.value) || 2)}
                  className="w-20 text-center"
                  type="number"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => tempMaxMembers < 6 && setTempMaxMembers(tempMaxMembers + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-gray-500">2-6 members allowed</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditMaxMembersModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMaxMembers}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Member Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-3"
                placeholder="member@example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={copyInviteLink} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember} disabled={!inviteEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Confirm Action</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {confirmAction?.message}
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmAction}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Goal Modal */}
      <TeamGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        teamId={teamId || ''}
      />

      <div className="flex-1">
          {/* Header */}
          <div className="bg-ekana-purple-dark border-b p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ekana-white hover:bg-ekana-purple-light p-1"
                  onClick={() => navigate(`/team/${teamId}`)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-ekana-white">Team Settings</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-ekana-white/80">{team.course}</span>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="p-6 space-y-6 max-w-4xl">
            {/* 1. Team Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>Team Information</CardTitle>
                  <img src="/lovable-uploads/c443a1b0-92e9-46ad-8ab1-4d37ecd4279c.png" alt="Team Information" className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg font-semibold">{team.avatar}</AvatarFallback>
                    </Avatar>
                    {isCurrentUserAdmin && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleEditAvatar}
                        className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{team.name}</h3>
                      {isCurrentUserAdmin && (
                        <Button variant="ghost" size="sm" onClick={handleEditName}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-start space-x-2">
                      <p className="text-sm text-gray-600 flex-1">{team.bio}</p>
                      {isCurrentUserAdmin && (
                        <Button variant="ghost" size="sm" onClick={handleEditBio}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <BookOpen className="h-4 w-4 text-gray-500" />
                     <Label htmlFor="course" className="text-sm font-medium">Course/Topic</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className="flex-1">
                       <p className="text-sm text-gray-700">{team.course}</p>
                     </div>
                     {isCurrentUserAdmin && (
                       <Button variant="ghost" size="sm" onClick={handleEditCourse}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                     )}
                   </div>
                 </div>

                 {/* Team Level */}
                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <User className="h-4 w-4 text-gray-500" />
                     <Label className="text-sm font-medium">Team Level</Label>
                   </div>
                   {teamLevel === "aggregate" ? (
                     <RadioGroup value={teamLevel} onValueChange={(value) => {
                       setTeamLevel(value);
                       if (value === "custom") setEditingTeamLevel(true);
                     }} className="space-y-3">
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="aggregate" id="level-aggregate" />
                         <Label htmlFor="level-aggregate" className="text-sm leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="custom" id="level-custom" />
                         <Label htmlFor="level-custom" className="text-sm leading-relaxed flex-1 font-normal">Set custom value</Label>
                       </div>
                     </RadioGroup>
                   ) : !editingTeamLevel ? (
                     <Card className="bg-gray-50 border-gray-200">
                       <CardContent className="p-4 flex items-center justify-between">
                         <span className="font-medium text-sm">{customTeamLevel.charAt(0).toUpperCase() + customTeamLevel.slice(1)}</span>
                         <Button variant="ghost" size="sm" onClick={() => setEditingTeamLevel(true)}>
                           <Edit2 className="h-4 w-4" />
                         </Button>
                       </CardContent>
                     </Card>
                   ) : (
                     <div className="space-y-3">
                       <RadioGroup 
                         value={teamLevel === "aggregate" ? "aggregate" : "custom"} 
                         onValueChange={(value) => value === "aggregate" && setTeamLevel("aggregate")}
                         className="space-y-3"
                       >
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="aggregate" id="edit-level-aggregate" />
                           <Label htmlFor="edit-level-aggregate" className="text-sm leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="custom" id="edit-level-custom" />
                           <Label htmlFor="edit-level-custom" className="text-sm leading-relaxed flex-1 font-normal">Custom value</Label>
                         </div>
                       </RadioGroup>
                       
                       {teamLevel !== "aggregate" && (
                         <Select value={customTeamLevel} onValueChange={setCustomTeamLevel}>
                           <SelectTrigger className="mt-3">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {LEVELS.map(level => (
                               <SelectItem key={level.name.toLowerCase()} value={level.name.toLowerCase()}>
                                 {level.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       )}
                       
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingTeamLevel(false)}>
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (teamId) {
                                updateTeam(teamId, { 
                                  teamLevel: teamLevel === 'aggregate' ? 'aggregate' : customTeamLevel 
                                });
                              }
                              setEditingTeamLevel(false);
                            }}
                            disabled={teamLevel !== "aggregate" && !customTeamLevel}
                          >
                            Save
                          </Button>
                        </div>
                     </div>
                   )}
                 </div>

                 {/* Goals */}
                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <Target className="h-4 w-4 text-gray-500" />
                     <Label className="text-sm font-medium">Goals</Label>
                   </div>
                   {goals === "aggregate" ? (
                     <RadioGroup value={goals} onValueChange={(value) => {
                       setGoals(value);
                       if (value === "custom") setEditingGoals(true);
                     }} className="space-y-3">
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="aggregate" id="goals-aggregate" />
                         <Label htmlFor="goals-aggregate" className="text-sm leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="custom" id="goals-custom" />
                         <Label htmlFor="goals-custom" className="text-sm leading-relaxed flex-1 font-normal">Set custom value</Label>
                       </div>
                     </RadioGroup>
                   ) : !editingGoals ? (
                     <Card className="bg-gray-50 border-gray-200">
                       <CardContent className="p-4 flex items-center justify-between">
                         <span className="font-medium text-sm">{customGoals}</span>
                         <Button variant="ghost" size="sm" onClick={() => setEditingGoals(true)}>
                           <Edit2 className="h-4 w-4" />
                         </Button>
                       </CardContent>
                     </Card>
                   ) : (
                     <div className="space-y-3">
                       <RadioGroup 
                         value={goals === "aggregate" ? "aggregate" : "custom"} 
                         onValueChange={(value) => value === "aggregate" && setGoals("aggregate")}
                         className="space-y-3"
                       >
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="aggregate" id="edit-goals-aggregate" />
                           <Label htmlFor="edit-goals-aggregate" className="text-sm leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="custom" id="edit-goals-custom" />
                           <Label htmlFor="edit-goals-custom" className="text-sm leading-relaxed flex-1 font-normal">Custom value</Label>
                         </div>
                       </RadioGroup>
                       
                       {goals !== "aggregate" && (
                         <Select value={customGoals} onValueChange={setCustomGoals}>
                           <SelectTrigger className="mt-3">
                             <SelectValue placeholder="Select a goal" />
                           </SelectTrigger>
                           <SelectContent>
                             {GOALS.map(goal => (
                               <SelectItem key={goal.name} value={goal.name}>{goal.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       )}
                       
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingGoals(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (teamId) {
                                updateTeam(teamId, { 
                                  goals: goals === 'aggregate' ? 'aggregate' : customGoals 
                                });
                              }
                              setEditingGoals(false);
                            }} 
                            size="sm"
                            disabled={goals !== "aggregate" && !customGoals}
                          >
                            Save
                          </Button>
                        </div>
                     </div>
                   )}
                 </div>
              </CardContent>
            </Card>

            {/* 2. Learning Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle>Learning Preferences</CardTitle>
                  <img src="/lovable-uploads/a4c78adb-6833-4172-bcbf-dd0683a75f9e.png" alt="Learning Preferences" className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">Tell the world how you like to learn.</p>
              </CardHeader>
              <CardContent className="space-y-8">
                 {/* Communication Preferences */}
                 <div className="space-y-4">
                   <div className="flex items-center space-x-2">
                     <Mail className="h-4 w-4 text-gray-500" />
                     <Label className="text-lg font-bold">Communication Preferences</Label>
                   </div>
                   {communicationPreferences === "aggregate" ? (
                     <RadioGroup value={communicationPreferences} onValueChange={(value) => {
                       setCommunicationPreferences(value);
                       if (value === "custom") setEditingCommunicationPreferences(true);
                     }} className="space-y-3">
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="aggregate" id="comm-aggregate" />
                         <Label htmlFor="comm-aggregate" className="text-lg leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="custom" id="comm-custom" />
                         <Label htmlFor="comm-custom" className="text-lg leading-relaxed flex-1 font-normal">Set custom value</Label>
                       </div>
                     </RadioGroup>
                   ) : !editingCommunicationPreferences ? (
                     <Card className="bg-gray-50 border-gray-200">
                       <CardContent className="p-4 flex items-center justify-between">
                         <div className="flex flex-wrap gap-2">
                           {customCommunicationPreferences.map(preference => (
                             <Badge key={preference} variant="secondary">
                               {preference}
                             </Badge>
                           ))}
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => setEditingCommunicationPreferences(true)}>
                           <Edit2 className="h-4 w-4" />
                         </Button>
                       </CardContent>
                     </Card>
                   ) : (
                     <div className="space-y-3">
                       <RadioGroup 
                         value={communicationPreferences === "aggregate" ? "aggregate" : "custom"} 
                         onValueChange={(value) => value === "aggregate" && setCommunicationPreferences("aggregate")}
                         className="space-y-3"
                       >
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="aggregate" id="edit-comm-aggregate" />
                           <Label htmlFor="edit-comm-aggregate" className="text-lg leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="custom" id="edit-comm-custom" />
                           <Label htmlFor="edit-comm-custom" className="text-lg leading-relaxed flex-1 font-normal">Custom value</Label>
                         </div>
                       </RadioGroup>
                       
                       {communicationPreferences !== "aggregate" && (
                         <div className="space-y-2">
                           <Label className="text-sm text-muted-foreground">Select your preferred communication methods:</Label>
                           <div className="grid grid-cols-2 gap-2">
                             {COMMUNICATION_OPTIONS.map(option => (
                               <div key={option.name} className="flex items-center space-x-2">
                                 <input
                                   type="checkbox"
                                   id={`comm-${option.name}`}
                                   checked={customCommunicationPreferences.includes(option.name)}
                                   onChange={(e) => {
                                     if (e.target.checked) {
                                       setCustomCommunicationPreferences([...customCommunicationPreferences, option.name]);
                                     } else {
                                       setCustomCommunicationPreferences(customCommunicationPreferences.filter(p => p !== option.name));
                                     }
                                   }}
                                   className="h-4 w-4"
                                 />
                                 <Label htmlFor={`comm-${option.name}`} className="text-sm">{option.name}</Label>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                       
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingCommunicationPreferences(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (teamId) {
                                updateTeam(teamId, { 
                                  communicationPreferences: communicationPreferences === 'aggregate' 
                                    ? 'aggregate' 
                                    : customCommunicationPreferences.join(', ')
                                });
                              }
                              setEditingCommunicationPreferences(false);
                            }} 
                            size="sm"
                            disabled={communicationPreferences !== "aggregate" && customCommunicationPreferences.length === 0}
                          >
                            Save
                          </Button>
                        </div>
                     </div>
                   )}
                 </div>

                 {/* Languages */}
                 <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Languages className="h-4 w-4 text-gray-500" />
                      <Label className="text-lg font-bold">Languages</Label>
                    </div>
                     {languages === "aggregate" ? (
                       <RadioGroup value={languages} onValueChange={(value) => {
                         setLanguages(value);
                         if (value === "custom") setEditingLanguages(true);
                       }} className="space-y-3">
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="aggregate" id="lang-aggregate" />
                           <Label htmlFor="lang-aggregate" className="text-lg leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="custom" id="lang-custom" />
                           <Label htmlFor="lang-custom" className="text-lg leading-relaxed flex-1 font-normal">Set custom value</Label>
                         </div>
                       </RadioGroup>
                     ) : !editingLanguages ? (
                       <Card className="bg-gray-50 border-gray-200">
                         <CardContent className="p-4 flex items-center justify-between">
                           <div className="flex flex-wrap gap-2">
                             {customLanguagesList.map(language => (
                               <Badge key={language} variant="secondary">
                                 {language}
                               </Badge>
                             ))}
                           </div>
                           <Button variant="ghost" size="sm" onClick={() => setEditingLanguages(true)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                         </CardContent>
                       </Card>
                     ) : (
                      <div className="space-y-3">
                        <RadioGroup 
                          value={languages === "aggregate" ? "aggregate" : "custom"} 
                          onValueChange={(value) => value === "aggregate" && setLanguages("aggregate")}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="aggregate" id="edit-lang-aggregate" />
                            <Label htmlFor="edit-lang-aggregate" className="text-lg leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="edit-lang-custom" />
                            <Label htmlFor="edit-lang-custom" className="text-lg leading-relaxed flex-1 font-normal">Custom value</Label>
                          </div>
                        </RadioGroup>
                        
                        {languages !== "aggregate" && (
                          <>
                            {/* Language Search */}
                            {customLanguagesList.length < 3 && (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search languages..."
                                    value={languageSearch}
                                    onChange={(e) => setLanguageSearch(e.target.value)}
                                    className="mt-3 pl-9"
                                  />
                                </div>
                                
                                {languageSearch && filteredLanguages.length > 0 && (
                                  <div className="border rounded-md max-h-32 overflow-y-auto">
                                    {filteredLanguages.map(language => (
                                      <button
                                        key={language}
                                        onClick={() => addLanguage(language)}
                                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                      >
                                        {language}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Selected Languages */}
                            {customLanguagesList.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Selected languages:</Label>
                                <div className="flex flex-wrap gap-2">
                                  {customLanguagesList.map(language => (
                                    <Badge key={language} variant="secondary" className="flex items-center gap-1">
                                      {language}
                                      <button
                                        onClick={() => removeLanguage(language)}
                                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {customLanguagesList.length >= 3 && (
                              <p className="text-xs text-muted-foreground">Maximum 3 languages selected</p>
                            )}
                          </>
                        )}
                        
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingLanguages(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => {
                                if (teamId) {
                                  updateTeam(teamId, { 
                                    languages: languages === 'aggregate' 
                                      ? 'aggregate' 
                                      : customLanguagesList.join(', ')
                                  });
                                }
                                setEditingLanguages(false);
                              }} 
                              size="sm"
                              disabled={languages !== "aggregate" && customLanguagesList.length === 0}
                            >
                              Save
                            </Button>
                          </div>
                      </div>
                   )}
                 </div>

                 {/* Time Commitments */}
                 <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Label className="text-lg font-bold">Time commitments</Label>
                    </div>
                     {timeCommitments === "aggregate" ? (
                       <RadioGroup value={timeCommitments} onValueChange={(value) => {
                         setTimeCommitments(value);
                         if (value === "custom") setEditingTimeCommitments(true);
                       }} className="space-y-3">
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="aggregate" id="time-aggregate" />
                           <Label htmlFor="time-aggregate" className="text-lg leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <RadioGroupItem value="custom" id="time-custom" />
                           <Label htmlFor="time-custom" className="text-lg leading-relaxed flex-1 font-normal">Set custom value</Label>
                         </div>
                       </RadioGroup>
                     ) : !editingTimeCommitments ? (
                       <Card className="bg-gray-50 border-gray-200">
                         <CardContent className="p-4 flex items-center justify-between">
                           <span className="font-medium">{customTimeCommitment} hours/week</span>
                           <Button variant="ghost" size="sm" onClick={() => setEditingTimeCommitments(true)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                         </CardContent>
                       </Card>
                     ) : (
                        <div className="mt-3 space-y-2">
                          <RadioGroup 
                            value={timeCommitments === "aggregate" ? "aggregate" : "custom"} 
                            onValueChange={(value) => value === "aggregate" && setTimeCommitments("aggregate")}
                            className="space-y-3"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="aggregate" id="edit-time-aggregate" />
                              <Label htmlFor="edit-time-aggregate" className="text-lg leading-relaxed flex-1 font-normal">Aggregate from members</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="custom" id="edit-time-custom" />
                              <Label htmlFor="edit-time-custom" className="text-lg leading-relaxed flex-1 font-normal">Custom value</Label>
                            </div>
                          </RadioGroup>
                          
                          {timeCommitments !== "aggregate" && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => customTimeCommitment > 2 && setCustomTimeCommitment(customTimeCommitment - 1)}
                                >
                                  -
                                </Button>
                                <Input
                                  value={customTimeCommitment}
                                  onChange={(e) => setCustomTimeCommitment(parseInt(e.target.value) || 10)}
                                  className="w-20 text-center"
                                  type="number"
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => customTimeCommitment < 40 && setCustomTimeCommitment(customTimeCommitment + 1)}
                                >
                                  +
                                </Button>
                                <span className="text-sm text-gray-600">hours/week</span>
                              </div>
                              <p className="text-sm text-gray-500">2-40 hours per week</p>
                            </>
                          )}
                          
                           <div className="flex justify-end space-x-2">
                             <Button variant="outline" size="sm" onClick={() => setEditingTimeCommitments(false)}>
                               Cancel
                             </Button>
                             <Button 
                               onClick={() => {
                                 if (teamId) {
                                   updateTeam(teamId, { 
                                     timeCommitments: timeCommitments === 'aggregate' 
                                       ? 'aggregate' 
                                       : `${customTimeCommitment} hours/week`
                                   });
                                 }
                                 setEditingTimeCommitments(false);
                               }} 
                               size="sm"
                               disabled={timeCommitments !== "aggregate" && !customTimeCommitment}
                             >
                               Save
                             </Button>
                           </div>
                        </div>
                     )}
                 </div>
              </CardContent>
            </Card>

            {/* 3. General Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle>General Settings</CardTitle>
                  <img src="/lovable-uploads/ca90ec06-e68e-4262-9ec9-0ab7c2c560bc.png" alt="General Settings" className="h-6 w-6" />
                </div>
                <p className="text-sm text-gray-600">How your team is set up.</p>
              </CardHeader>
               <CardContent className="space-y-6">
                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <Users className="h-4 w-4 text-gray-500" />
                     <Label className="text-sm font-medium">Max Members</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center w-20">
                       <span className="text-purple-600 font-medium">{maxMembers}</span>
                     </div>
                     {isCurrentUserAdmin && (
                       <Button variant="ghost" size="sm" onClick={handleEditMaxMembers}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                     )}
                   </div>
                   <p className="text-sm text-gray-600">Only admins can modify.</p>
                 </div>
                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <Calendar className="h-4 w-4 text-gray-500" />
                     <Label className="text-sm font-medium">Duration</Label>
                   </div>
                   <div className="flex items-center space-x-2">
                     <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                       <span className="text-purple-600 font-medium">
                         {durationValue} {durationType} ({calculateRemainingTime()})
                       </span>
                     </div>
                     {isCurrentUserAdmin && (
                       <Button variant="ghost" size="sm" onClick={handleEditDuration}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                     )}
                   </div>
                    <p className="text-sm text-gray-600">
                      This group was created on {format(team.startDate, "MMMM d, yyyy")}
                    </p>
                 </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="archive"
                      checked={archiveOnEnd}
                      onCheckedChange={(checked) => {
                        if (teamId) {
                          updateTeam(teamId, { archiveOnEnd: checked });
                        }
                        setArchiveOnEnd(checked);
                      }}
                      disabled={!isCurrentUserAdmin}
                    />
                    <Label htmlFor="archive" className="text-lg leading-relaxed flex-1 font-normal">Archive team when its duration ends.</Label>
                  </div>
              </CardContent>
            </Card>

            {/* 4. Member & Invitation Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CardTitle>Member & Invitation Management</CardTitle>
                  <img src="/lovable-uploads/1fe55a44-d2a8-4b24-897b-bd5b3cb5f13c.png" alt="Member Management" className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {team.members
                    .sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0))
                    .map((member) => (
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
                            {member.isAdmin && <Badge variant="secondary" className="text-xs bg-ekana-green-light text-white border-ekana-green-light hover:bg-ekana-green">Admin</Badge>}
                          </div>
                        </div>
                        {isCurrentUserAdmin && member.name !== (user?.name || "You") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!member.isAdmin && (
                                <DropdownMenuItem onClick={() => handleMakeAdmin(member)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              {member.isAdmin && (
                                <DropdownMenuItem onClick={() => handleDemoteMember(member)}>
                                  <ShieldOff className="h-4 w-4 mr-2" />
                                  Demote to Member
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(member)}
                                className="text-red-600"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Remove from Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))
                  }
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/inbox')}
                  >
                    View Pending Requests (2)
                  </Button>
                  {isCurrentUserAdmin ? (
                    <Button onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-block">
                            <Button 
                              disabled
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Only admins are able to invite people to the team</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 5. Role Settings - Admin Only */}
             {isCurrentUserAdmin && (
               <Card>
                 <CardHeader>
                   <div className="flex items-center gap-3">
                     <CardTitle>Role Settings</CardTitle>
                     <img src="/lovable-uploads/3951f0f1-e6c9-45ba-a410-b9b1d6eab027.png" alt="Role Settings" className="h-6 w-6" />
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="flex items-center justify-between">
                     <Label htmlFor="allAdmins" className="text-lg leading-relaxed flex-1 font-normal">Make all team members admins.</Label>
                     <div style={{ marginLeft: '70px' }}>
                       <Switch
                         id="allAdmins"
                         checked={areAllMembersAdmins}
                         onCheckedChange={handleAllMembersAdminsToggle}
                       />
                     </div>
                   </div>
                 </CardContent>
              </Card>
            )}

             {/* 6. Team Privacy */}
             <Card>
               <CardHeader>
                 <div className="flex items-center gap-3">
                   <CardTitle>Team Privacy</CardTitle>
                   <img src="/lovable-uploads/b2375d3d-3b42-48f2-9773-153c24a45e05.png" alt="Team Privacy" className="h-6 w-6" />
                 </div>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowSearch" className="text-lg leading-relaxed flex-1 font-normal">Allow other learners to find this team in search results (if not full).</Label>
                    <div style={{ marginLeft: '70px' }}>
                      <Switch
                        id="allowSearch"
                        checked={allowSearch}
                        onCheckedChange={(checked) => {
                          if (teamId) {
                            updateTeam(teamId, { allowSearch: checked });
                          }
                          setAllowSearch(checked);
                        }}
                        disabled={!isCurrentUserAdmin}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showMembers" className="text-lg leading-relaxed flex-1 font-normal">Allow others to see the list of team members (subject to each member's personal privacy settings).</Label>
                    <div style={{ marginLeft: '70px' }}>
                      <Switch
                        id="showMembers"
                        checked={showMemberList}
                        onCheckedChange={(checked) => {
                          if (teamId) {
                            updateTeam(teamId, { showMemberList: checked });
                          }
                          setShowMemberList(checked);
                        }}
                        disabled={!isCurrentUserAdmin}
                      />
                    </div>
                  </div>
                </CardContent>
            </Card>

             {/* 7. Data Management */}
             <Card>
               <CardHeader>
                 <div className="flex items-center gap-3">
                   <CardTitle>Data Management</CardTitle>
                   <img src="/lovable-uploads/eb0dd30c-67fe-4c52-91c5-adcaa4000a98.png" alt="Data Management" className="h-6 w-6" />
                 </div>
               </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  This team's data usage is based on the unanimous consent of its members. Each member controls their own data permissions in their personal{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => navigate('/settings')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    User Settings
                  </Button>
                  .
                </p>
              </CardContent>
            </Card>

            {/* 8. Danger Zone */}
            <Card className="border-red-200">
              <CardContent className="space-y-4 pt-6">
                <Button
                  variant="destructive"
                  onClick={handleLeaveTeam}
                  className="w-full"
                >
                  Leave Team
                </Button>
              </CardContent>
            </Card>
            
            {/* Delete Team - Outside card, smaller, highlighted text */}
            {isCurrentUserAdmin && (
              <div className="flex justify-center">
                <Button
                  variant="link"
                  onClick={handleDeleteTeam}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Delete Team
                </Button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default TeamSettings;
