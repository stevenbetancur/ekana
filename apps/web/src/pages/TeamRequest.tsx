import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useUser, useCheckUserEntitlement, useAllUsers } from "@/hooks/useMockData";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useRequestContext } from "@/contexts/RequestContext";
import { displayAge } from "@/lib/utils";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Info, Crown, CheckCircle, BookOpen, Copy, Lock, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import RequestLimitModal from "@/components/modals/RequestLimitModal";

const TeamRequest = () => {
  const navigate = useNavigate();
  const { receiverId } = useParams<{ receiverId: string }>();
  const [searchParams] = useSearchParams();
  const recipientTeamId = searchParams.get('recipientTeamId');
  
  const { user: currentUser } = useAuth();
  const { profile } = useUserProfile();
  const receiverUser = useUser(receiverId || '');
  const { teamMembers, teams, getTeamTimeLeft, getTeamAdmins } = useTeamContext();
  const { createRequest, getRequestStats } = useRequestContext();
  const { getPersonalRoadmaps, roadmaps } = useRoadmapsContext();
  const checkReceiverEntitlement = useCheckUserEntitlement;

  // Determine which flow we're in
  const isUserToTeamFlow = !!recipientTeamId;
  const isUserToUserFlow = !!receiverId;

  // Get target team for USER_TO_TEAM flow
  const targetTeam = isUserToTeamFlow ? teams.find(t => t.id === recipientTeamId) : null;
  
  // Get roadmap title from context instead of hardcoded roadmapName
  const targetTeamRoadmap = targetTeam?.currentRoadmapId 
    ? roadmaps.find(r => r.id === targetTeam.currentRoadmapId) 
    : null;
  const targetTeamRoadmapTitle = targetTeamRoadmap?.title || targetTeam?.roadmapName || 'together';
  
  // Calculate team stats for USER_TO_TEAM flow
  const teamMemberCount = targetTeam ? teamMembers.filter(tm => tm.teamId === targetTeam.id).length : 0;
  const spotsLeft = targetTeam ? (targetTeam.maxMembers - teamMemberCount) : 0;

  const [message, setMessage] = useState("");
  const [teamOption, setTeamOption] = useState("existing");
  const [maxDuration, setMaxDuration] = useState("6-weeks");
  const [maxPeople, setMaxPeople] = useState("5");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState("");
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [showNoRoadmapDialog, setShowNoRoadmapDialog] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<'success' | 'limit_reached'>('success');
  const [remainingRequests, setRemainingRequests] = useState(0);

  // Get request stats for the current user
  const requestStats = currentUser ? getRequestStats(currentUser.id) : { count: 0, remaining: 10, isLimitReached: false };

  // Auto-populate team settings when selecting an existing team
  useEffect(() => {
    if (teamOption !== "new" && teamOption !== "existing") {
      const selectedTeam = teams.find(t => t.id === teamOption);
      if (selectedTeam) {
        setMaxDuration(selectedTeam.duration || "6-weeks");
        setMaxPeople(selectedTeam.maxMembers.toString());
      }
    }
  }, [teamOption, teams]);
  
  // Fetch personal roadmaps using context
  const personalRoadmaps = currentUser ? getPersonalRoadmaps(currentUser) : [];

  // Get user's teams with spots left calculation (for USER_TO_USER flow)
  // Filter out teams where the receiver is already a member
  const userTeams = currentUser ? teams.filter(team => 
    teamMembers.some(member => member.userId === currentUser.id && member.teamId === team.id) &&
    !teamMembers.some(member => member.userId === receiverId && member.teamId === team.id)
  ).map(team => {
    const currentMembers = teamMembers.filter(member => member.teamId === team.id).length;
    const spotsLeft = team.maxMembers - currentMembers;
    return { ...team, spotsLeft };
  }) : [];

  const handleSendRequest = () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }

    if (!currentUser) {
      toast.error("Missing user information");
      return;
    }

    // Check if limit reached before proceeding
    if (requestStats.isLimitReached) {
      setLimitModalType('limit_reached');
      setShowLimitModal(true);
      return;
    }

    // USER_TO_TEAM flow - send request to all team admins
    if (isUserToTeamFlow && recipientTeamId) {
      const adminIds = getTeamAdmins(recipientTeamId);
      
      if (adminIds.length === 0) {
        toast.error("This team has no admins");
        return;
      }

      // Create a single request with multiple recipients
      const requestData = {
        type: 'REQUEST_TO_JOIN' as const,
        senderId: currentUser.id,
        recipientId: adminIds[0], // First admin for backward compatibility
        recipientIds: adminIds, // All admins
        teamId: recipientTeamId,
        message: message.trim(),
      };

      const success = createRequest(requestData);
      if (success) {
        setRemainingRequests(requestStats.remaining - 1);
        setLimitModalType('success');
        setShowLimitModal(true);
      } else {
        setLimitModalType('limit_reached');
        setShowLimitModal(true);
      }
      return;
    }

    // USER_TO_USER flow
    if (!receiverId) {
      toast.error("Missing user information");
      return;
    }

    if (teamOption === "new" && !teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    // Prepare request data based on team option
    const requestData: any = {
      type: teamOption === "new" ? 'CREATE_TEAM' : 'INVITE_TO_TEAM',
      senderId: currentUser.id,
      recipientId: receiverId,
      message: message.trim(),
    };

    // If creating a new team
    if (teamOption === "new") {
      requestData.newTeamName = teamName.trim();
      requestData.maxMembers = parseInt(maxPeople);
      requestData.duration = maxDuration;
      
      // Include roadmap if selected (and not "no-roadmap")
      if (selectedRoadmap && selectedRoadmap !== "no-roadmap") {
        requestData.roadmapId = selectedRoadmap;
      }
    } else {
      // Inviting to existing team
      const selectedTeam = teams.find(t => t.id === teamOption);
      requestData.teamId = teamOption;
      requestData.makeAdmin = makeAdmin;
      // Include team's duration and maxMembers for preview
      if (selectedTeam) {
        requestData.duration = selectedTeam.duration;
        requestData.maxMembers = selectedTeam.maxMembers;
      }
    }

    // Create the request
    const success = createRequest(requestData);
    if (success) {
      setRemainingRequests(requestStats.remaining - 1);
      setLimitModalType('success');
      setShowLimitModal(true);
    } else {
      setLimitModalType('limit_reached');
      setShowLimitModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/connect");
  };

  const handleLimitModalClose = () => {
    setShowLimitModal(false);
    if (limitModalType === 'success') {
      navigate("/connect");
    }
  };

  const durationOptions = [
    { value: "2-weeks", label: "2 weeks" },
    { value: "4-weeks", label: "4 weeks" },
    { value: "6-weeks", label: "6 weeks" },
    { value: "2-months", label: "2 months" },
    { value: "3-months", label: "3 months" },
    { value: "6-months", label: "6 months" },
    { value: "unlimited", label: "Unlimited", premium: true }
  ];

  const peopleOptions = [
    { value: "2", label: "2 people" },
    { value: "3", label: "3 people" },
    { value: "4", label: "4 people" },
    { value: "5", label: "5 people" },
    { value: "6", label: "6 people" }
  ];

  const handleRoadmapSelect = (value: string) => {
    if (value === 'no-roadmap') {
      setShowNoRoadmapDialog(true);
    } else {
      const roadmap = personalRoadmaps.find(r => r.id.toString() === value);
      if (roadmap && roadmap.ownerType === 'USER') {
        setShowForkDialog(true);
      }
    }
    setSelectedRoadmap(value);
  };

  const handleForkConfirm = () => {
    setShowForkDialog(false);
    toast.success("Roadmap will be copied for the team");
  };

  const handleForkCancel = () => {
    setShowForkDialog(false);
    setSelectedRoadmap("");
  };

  const handleNoRoadmapConfirm = () => {
    setShowNoRoadmapDialog(false);
    toast.success("Team will be created without a roadmap");
  };

  const handleNoRoadmapCancel = () => {
    setShowNoRoadmapDialog(false);
    setSelectedRoadmap("");
  };

  // Calculate time left for target team (USER_TO_TEAM flow)
  const teamTimeInfo = targetTeam ? getTeamTimeLeft(targetTeam.id) : null;

  // USER_TO_TEAM Flow Rendering
  if (isUserToTeamFlow && targetTeam) {
    return (
      <Layout>
        {/* Request Limit Modal */}
        <RequestLimitModal
          isOpen={showLimitModal}
          onClose={handleLimitModalClose}
          type={limitModalType}
          remaining={remainingRequests}
          recipientName={targetTeam.name}
        />

        <div className="bg-ekana-white-bg min-h-screen">
          {/* Header */}
          <div className="flex items-center space-x-4 p-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              Request to join team
            </h1>
          </div>
          
          <div className="max-w-2xl mx-auto px-6 space-y-8 pb-8">

            {/* Header Card with User and Team */}
            <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-16 mb-4">
                  <div className="text-center">
                    {/* Current User */}
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                        {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">
                      {profile?.name || 'User'}
                      {displayAge(currentUser) !== null && `, ${displayAge(currentUser)}`}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    {/* Team - Cascading Avatars */}
                    <div className="flex -space-x-3 justify-center mb-2">
                      {teamMembers
                        .filter(tm => tm.teamId === targetTeam.id)
                        .slice(0, 3)
                        .map((member, index) => (
                          <Avatar key={member.userId} className="w-16 h-16 border-2 border-white">
                            <AvatarFallback className="bg-purple-600 text-white font-semibold text-sm">
                              {member.userId.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                    </div>
                    <p className="text-sm font-medium">
                      {targetTeam.name}, {teamMemberCount} members
                    </p>
                  </div>
                </div>

                {/* Summary Info */}
                <Card className="bg-white/10 border-white/20 mt-4">
                  <CardContent className="p-4">
                    <p className="text-sm text-white/90">
                      You are requesting to join the team <span className="font-bold">{targetTeam.name}</span> to learn <span className="font-bold">{targetTeamRoadmapTitle}</span>.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Message Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tell {targetTeam.name} who you are, why you'd like to join them:
              </h3>
              
              <div className="space-y-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Tell ${targetTeam.name} about yourself and why you want to join their team...`}
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Max. 500 characters</span>
                  <span>{500 - message.length} left</span>
                </div>
              </div>
            </div>

            {/* Team Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Team details</h3>
              
              <Card className="bg-ekana-white">
                <CardContent className="p-6 space-y-6">
                  {/* Roadmap */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-medium text-gray-900">Roadmap</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                      <span className="text-purple-600 font-medium">
                        {targetTeamRoadmapTitle === 'together' ? 'No roadmap set' : targetTeamRoadmapTitle}
                      </span>
                    </div>
                  </div>

                  {/* Time left */}
                  {teamTimeInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-medium text-gray-900">Time left for this team</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                        <span className="text-purple-600 font-medium">
                          {teamTimeInfo.weeksLeft}w left (started {teamTimeInfo.weeksSinceStart}w ago)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Maximum members */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-medium text-gray-900">Maximum members</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                      <span className="text-purple-600 font-medium">
                        {targetTeam.maxMembers} people ({spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Send Button */}
            <Button 
              onClick={handleSendRequest}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={requestStats.isLimitReached}
            >
              {requestStats.isLimitReached ? 'Request Limit Reached' : 'Send request +'}
            </Button>
            {!currentUser?.isPremium && (
              <p className="text-xs text-center text-muted-foreground">
                {requestStats.remaining} free {requestStats.remaining === 1 ? 'request' : 'requests'} remaining
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // USER_TO_USER Flow Rendering (existing flow)
  return (
    <Layout>
      {/* Request Limit Modal */}
      <RequestLimitModal
        isOpen={showLimitModal}
        onClose={handleLimitModalClose}
        type={limitModalType}
        remaining={remainingRequests}
        recipientName={receiverUser?.name || 'the user'}
      />

      {/* No Roadmap Confirmation Dialog */}
      <Dialog open={showNoRoadmapDialog} onOpenChange={setShowNoRoadmapDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-500" />
              No Roadmap Selected
            </DialogTitle>
            <DialogDescription className="text-left mt-2">
              You're selecting no roadmap for this team. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-orange-900">Note:</p>
                  <p className="text-orange-800">
                    You can always add a roadmap from your team space roadmap later.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleNoRoadmapCancel}>
              Cancel
            </Button>
            <Button onClick={handleNoRoadmapConfirm} className="bg-orange-600 hover:bg-orange-700">
              Continue Without Roadmap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fork Confirmation Dialog */}
      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-blue-500" />
              Create Team Copy
            </DialogTitle>
            <DialogDescription className="text-left mt-2">
              This will create a new, separate copy of your personal roadmap for the team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">Important:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• A separate copy will be created for the team</li>
                    <li>• Future edits will NOT sync with your personal version</li>
                    <li>• Admins in this team will be able to modify the team copy</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Do you want to proceed with creating a team copy of this roadmap?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleForkCancel}>
              Cancel
            </Button>
            <Button onClick={handleForkConfirm} className="bg-blue-600 hover:bg-blue-700">
              Create Team Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="bg-ekana-white-bg min-h-screen">
        {/* Header */}
        <div className="flex items-center space-x-4 p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/connect")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            Team up request
          </h1>
        </div>
        
        <div className="max-w-2xl mx-auto px-6 space-y-8 pb-8">

        {/* Header Card with User Avatars */}
        <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-16 mb-4">
              <div className="text-center">
                {/* Current User */}
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                    {profile?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">
                  {profile?.name || 'User'}
                  {displayAge(currentUser) !== null && `, ${displayAge(currentUser)}`}
                </p>
              </div>
              
              <div className="text-center">
                {/* Receiver User */}
                <Avatar className="h-16 w-16 mx-auto mb-2">
                  <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                    {receiverUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">
                  {receiverUser?.name || 'User'}
                  {displayAge(receiverUser) !== null && `, ${displayAge(receiverUser)}`}
                </p>
              </div>
            </div>

            {/* Course Info */}
            <Card className="bg-white/10 border-white/20 mt-4">
              <CardContent className="p-4">
                <p className="text-sm text-white/90">
                  {(() => {
                    const firstName = receiverUser?.name?.split(' ')[0] || 'the user';
                    const duration = durationOptions.find(d => d.value === maxDuration)?.label || '6 weeks';
                    const selectedTeam = userTeams.find(t => t.id === teamOption);
                    const roadmap = personalRoadmaps.find(r => r.id.toString() === selectedRoadmap);
                    
                    // Existing team selected
                    if (teamOption !== "new" && selectedTeam) {
                      const adminText = makeAdmin ? "as an admin" : "as a non-admin";
                      // Derive roadmap title from currentRoadmapId
                      const teamRoadmap = selectedTeam.currentRoadmapId 
                        ? roadmaps.find(r => r.id === selectedTeam.currentRoadmapId) 
                        : null;
                      const teamRoadmapTitle = teamRoadmap?.title || selectedTeam.roadmapName || 'with your team';
                      return (
                        <>
                          You are inviting {firstName} to learn <span className="font-bold">{teamRoadmapTitle}</span> in your team <span className="font-bold">{selectedTeam.name}</span> for <span className="font-bold">{duration}</span> {adminText}.
                        </>
                      );
                    }
                    
                    // New team with roadmap and name selected
                    if (teamOption === "new" && teamName.trim() && selectedRoadmap && selectedRoadmap !== "no-roadmap" && roadmap) {
                      return (
                        <>
                          You are inviting {firstName} to learn <span className="font-bold">{roadmap.title}</span> in a new team (<span className="font-bold">{teamName}</span>) for <span className="font-bold">{duration}</span>, <span className="font-bold">{maxPeople} people max</span>.
                        </>
                      );
                    }
                    
                    // New team without name or roadmap
                    if (teamOption === "new" && (!teamName.trim() || !selectedRoadmap || selectedRoadmap === "no-roadmap")) {
                      return (
                        <>
                          You are inviting {firstName} to learn in a new team for <span className="font-bold">{duration}</span>, <span className="font-bold">{maxPeople} people max</span>. Please choose a roadmap and name for your team below.
                        </>
                      );
                    }
                    
                    // Empty state (shouldn't normally happen with default teamOption="existing")
                    return (
                      <>
                        You are inviting {firstName} to learn for <span className="font-bold">{duration}</span>, <span className="font-bold">{maxPeople} people max</span>. Choose a roadmap/team below.
                      </>
                    );
                  })()}
                </p>
                <p className="text-xs text-white/80 mt-2">
                  Change team settings below
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Message Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Tell them why you'd want to partner up:
          </h3>
          
          <div className="space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Tell ${receiverUser?.name?.split(' ')[0] || 'them'} what sort of teammate you're looking for, why you're learning ${currentUser?.subject || 'this subject'} and what your goal is`}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Max. 500 characters</span>
              <span>{500 - message.length} left</span>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Team</h3>
            <Info className="h-4 w-4 text-blue-500" />
          </div>

          <RadioGroup value={teamOption} onValueChange={setTeamOption} className="space-y-3">
            {userTeams.map((team) => {
              // Check if team has a paid roadmap that receiver doesn't have entitlement for
              const teamRoadmap = team.currentRoadmapId 
                ? roadmaps.find(r => r.id.toString() === team.currentRoadmapId)
                : null;
              const isPaidRoadmap = teamRoadmap?.isPaid || false;
              const hasReceiverEntitlement = receiverUser && teamRoadmap
                ? checkReceiverEntitlement(receiverUser.id, teamRoadmap.id.toString())
                : true;
              const isDisabled = isPaidRoadmap && !hasReceiverEntitlement;
              const receiverFirstName = receiverUser?.name?.split(' ')[0] || 'User';
              
              return (
                <div key={team.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={team.id} id={team.id} disabled={isDisabled} />
                  <label htmlFor={team.id} className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{team.name} ({team.spotsLeft} {team.spotsLeft === 1 ? 'spot' : 'spots'} left)</span>
                          {isDisabled && (
                            <span className="text-gray-400 text-[0.9em]">
                              ({receiverFirstName} hasn't purchased the paid roadmap this team is using)
                            </span>
                          )}
                        </div>
                      </div>
                      {!isDisabled && (
                        <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
            
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="new" id="new" />
              <label htmlFor="new" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span>Create a new team</span>
                  <Crown className="h-4 w-4 text-orange-500" />
                </div>
              </label>
            </div>
          </RadioGroup>

          {/* Team Name and Roadmap Selection for New Team */}
          {teamOption === "new" && (
            <TooltipProvider>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Team name
                  </h4>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    maxLength={29}
                    className="w-full"
                  />
                  <div className="flex justify-end text-xs text-gray-500">
                    <span>{29 - teamName.length} characters left</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Which roadmap do you want to use?
                  </h4>
                  <Select value={selectedRoadmap} onValueChange={handleRoadmapSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a roadmap or course" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="no-roadmap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <div>
                          <p className="font-medium">Select no roadmap for now</p>
                          <p className="text-xs text-gray-500">Create team without a roadmap</p>
                        </div>
                      </div>
                    </SelectItem>
                    {personalRoadmaps.map((roadmap) => {
                      const isThirdParty = roadmap.ownerType === 'THIRD_PARTY';
                      const hasEntitlement = receiverUser ? useCheckUserEntitlement(receiverUser.id, roadmap.id.toString()) : false;
                      const isDisabled = isThirdParty && roadmap.isPaid && !hasEntitlement;
                      
                      const itemContent = (
                        <SelectItem 
                          key={roadmap.id} 
                          value={roadmap.id.toString()}
                          disabled={isDisabled}
                          className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isThirdParty ? 'bg-purple-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{roadmap.title}</p>
                                {isDisabled && <Lock className="h-3 w-3 text-gray-400" />}
                              </div>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                {roadmap.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      );
                      
                      if (isDisabled) {
                        return (
                          <Tooltip key={roadmap.id}>
                            <TooltipTrigger asChild>
                              {itemContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">
                                {receiverUser?.name || 'This user'} does not have access to this paid course. 
                                They would need to purchase it first to join a team using this roadmap.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      
                      return itemContent;
                    })}
                    {personalRoadmaps.length === 0 && (
                      <SelectItem value="none" disabled>
                        No available roadmaps or courses
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedRoadmap && selectedRoadmap !== 'no-roadmap' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected roadmap will be used as the foundation for your new team
                  </p>
                )}
                {selectedRoadmap === 'no-roadmap' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Team will be created without a roadmap - you can add one later
                  </p>
                )}
                </div>
              </div>
            </TooltipProvider>
          )}

          {/* Admin Option - shows when existing team is selected */}
          {teamOption !== "new" && userTeams.some(team => team.id === teamOption) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Do you want to make this new member an admin?
              </h4>
              <RadioGroup 
                value={makeAdmin ? "yes" : "no"} 
                onValueChange={(value) => setMakeAdmin(value === "yes")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="admin-yes" />
                  <label htmlFor="admin-yes" className="text-sm cursor-pointer">Yes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="admin-no" />
                  <label htmlFor="admin-no" className="text-sm cursor-pointer">No</label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Maximum Time Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {teamOption === "new" ? "Maximum time of the group" : "Time Left for this Team"}
            </h3>
            <Info className="h-4 w-4 text-blue-500" />
          </div>

          <Card className="bg-ekana-white">
            <CardContent className="p-4">
              {teamOption === "new" ? (
                <Select value={maxDuration} onValueChange={setMaxDuration}>
                  <SelectTrigger className="w-full border-0 p-0 h-auto shadow-none focus:ring-0">
                    <SelectValue className="text-purple-600 font-medium">
                      <span className="text-purple-600 font-medium">
                        {durationOptions.find(opt => opt.value === maxDuration)?.label || '6 weeks'}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {durationOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.premium && !currentUser?.isPremium}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          {option.premium && <Crown className="h-3 w-3 text-orange-500 ml-2" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                (() => {
                  const selectedTeam = userTeams.find(t => t.id === teamOption);
                  if (!selectedTeam) return null;
                  
                  const timeInfo = getTeamTimeLeft(selectedTeam.id);
                  if (!timeInfo) {
                    return (
                      <span className="text-purple-600 font-medium">
                        {selectedTeam.duration || 'No duration set'}
                      </span>
                    );
                  }
                  
                  return (
                    <span className="text-purple-600 font-medium">
                      {timeInfo.displayText}
                    </span>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </div>

        {/* Maximum People Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {teamOption === "new" 
              ? "Select maximum number of people" 
              : (() => {
                  const selectedTeam = userTeams.find(t => t.id === teamOption);
                  if (!selectedTeam) return "Maximum number of teammates";
                  return `Maximum number of teammates: ${selectedTeam.maxMembers} people (${selectedTeam.spotsLeft} ${selectedTeam.spotsLeft === 1 ? 'spot' : 'spots'} left)`;
                })()
            }
          </h3>

          <Card className="bg-ekana-white">
            <CardContent className="p-4">
              {teamOption === "new" ? (
                <Select value={maxPeople} onValueChange={setMaxPeople}>
                  <SelectTrigger className="w-full border-0 p-0 h-auto shadow-none focus:ring-0">
                    <SelectValue className="text-purple-600 font-medium">
                      <span className="text-purple-600 font-medium">
                        {peopleOptions.find(opt => opt.value === maxPeople)?.label || '5 people'}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {peopleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                (() => {
                  const selectedTeam = userTeams.find(t => t.id === teamOption);
                  if (!selectedTeam) return null;
                  
                  return (
                    <span className="text-purple-600 font-medium">
                      {selectedTeam.maxMembers} people ({selectedTeam.spotsLeft} {selectedTeam.spotsLeft === 1 ? 'spot' : 'spots'} left)
                    </span>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendRequest}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={requestStats.isLimitReached}
        >
          {requestStats.isLimitReached ? 'Request Limit Reached' : 'Send request +'}
        </Button>
        {!currentUser?.isPremium && (
          <p className="text-xs text-center text-muted-foreground">
            {requestStats.remaining} free {requestStats.remaining === 1 ? 'request' : 'requests'} remaining
          </p>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default TeamRequest;
