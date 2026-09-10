import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, Info, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRequestContext } from "@/contexts/RequestContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useUser, useTeam, useRoadmap, useTeamMembersWithRoles } from "@/hooks/useMockData";
import { useToast } from "@/hooks/use-toast";
import { TeamCreationSuccessModal } from "@/components/TeamCreationSuccessModal";
import RequestActionSuccessModal from "@/components/RequestActionSuccessModal";
import { Team } from "@/lib/mockData";

const CollaborationPreview = () => {
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { requests, acceptRequest, rejectRequest } = useRequestContext();
  const { getTeamTimeLeft } = useTeamContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [actionType, setActionType] = useState<'join' | 'create'>('join');
  const [justAccepted, setJustAccepted] = useState(false);
  const [justDeclined, setJustDeclined] = useState(false);
  const [showRequestActionModal, setShowRequestActionModal] = useState(false);
  const [requestActionType, setRequestActionType] = useState<'accept' | 'decline'>('accept');

  // Find the request from RequestContext
  const request = requests.find(r => r.id === requestId);

  // Debug logging
  console.log('🔍 CollaborationPreview Debug:', {
    requestId,
    allRequestIds: requests.map(r => r.id),
    foundRequest: request,
    requestStatus: request?.status
  });

  // Fetch related data based on request
  const sender = useUser(request?.senderId || '');
  const { team, members } = useTeam(request?.teamId || '');
  const teamMembersWithRoles = useTeamMembersWithRoles(request?.teamId || '');
  
  // Use team's roadmap if available, otherwise use request's roadmapId
  const roadmapIdToFetch = team?.currentRoadmapId || request?.roadmapId || '';
  const { roadmap } = useRoadmap(roadmapIdToFetch);

  // Check if request exists and is still pending
  useEffect(() => {
    if (!request) {
      console.log('❌ Request not found, navigating back');
      toast({
        title: "Request not found",
        description: "This request doesn't exist or has been removed.",
        variant: "destructive",
      });
      navigate("/inbox");
      return;
    }

    // Only redirect if already processed AND we didn't just accept/decline it
    if (request.status !== 'pending' && !justAccepted && !justDeclined) {
      console.log('❌ Request already processed:', request.status);
      toast({
        title: "Request already processed",
        description: `This request has already been ${request.status}.`,
      });
      navigate("/inbox");
    }
  }, [request, navigate, toast, justAccepted, justDeclined]);

  if (!request || !sender) {
    return null;
  }

  const isInviteToTeam = request.type === 'INVITE_TO_TEAM';
  const isRequestToJoin = request.type === 'REQUEST_TO_JOIN';
  const isCreateTeam = request.type === 'CREATE_TEAM';
  
  // For REQUEST_TO_JOIN, calculate how many admins are receiving this request
  const totalAdmins = isRequestToJoin ? (request.recipientIds?.length || 1) : 0;
  const otherAdminsCount = totalAdmins > 1 ? totalAdmins - 1 : 0;
  
  const handleAcceptClick = () => {
    setActionType(isCreateTeam ? 'create' : 'join');
    setShowJoinConfirm(true);
  };

  const handleDeclineClick = () => {
    setShowDeclineConfirm(true);
  };

  const handleConfirmAccept = async () => {
    setIsProcessing(true);
    setShowJoinConfirm(false);
    setJustAccepted(true); // Prevent useEffect from navigating away

    // Simulate brief processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Accept the request using RequestContext - it now handles team creation/joining
      const result = await acceptRequest(request.id);
      
      if (result) {
        console.log('✅ Request accepted and team assigned:', result);
        
        // If a team was created (CREATE_TEAM flow), show success modal
        if (result.team) {
          console.log('🎉 Showing success modal for created team:', result.team.name);
          console.log('🔍 Modal state - createdTeam before set:', createdTeam);
          setCreatedTeam(result.team);
          console.log('🔍 Modal state - createdTeam after set:', result.team);
          console.log('🔍 Modal - should be open:', !!result.team);
        } else if (isRequestToJoin) {
          // For REQUEST_TO_JOIN (admin accepting user), show success modal and stay on page
          setRequestActionType('accept');
          setShowRequestActionModal(true);
        } else {
          // For INVITE_TO_TEAM, navigate directly
          toast({
            title: "Success!",
            description: "You have joined the team.",
          });
          navigate(`/team/${result.teamId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDecline = () => {
    setIsProcessing(true);
    setShowDeclineConfirm(false);
    setJustDeclined(true); // Prevent useEffect from navigating away

    // Reject the request using RequestContext
    setTimeout(() => {
      rejectRequest(request.id);
      setIsProcessing(false);
      
      if (isRequestToJoin) {
        // For REQUEST_TO_JOIN (admin declining user), show success modal and stay on page
        setRequestActionType('decline');
        setShowRequestActionModal(true);
      } else {
        // For other request types, navigate to inbox with toast
        toast({
          title: "Request declined",
          description: "You have declined this request.",
        });
        navigate("/inbox");
      }
    }, 1000);
  };

  const handleGoToTeam = () => {
    if (request.teamId) {
      navigate(`/team/${request.teamId}`);
    } else {
      navigate("/teams");
    }
  };

  // Helper to get sender display name
  const getSenderDisplayName = () => {
    if (isInviteToTeam && team) {
      return team.name;
    }
    return sender.name;
  };

  // Helper to get sender initials for avatar
  const getSenderInitials = () => {
    if (isInviteToTeam && team) {
      return team.name.substring(0, 2).toUpperCase();
    }
    return sender.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  return <Layout>
      <div className="bg-ekana-white-bg min-h-screen">
        {/* Header */}
        <div className="flex items-center space-x-4 p-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/inbox")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            {isInviteToTeam ? "Invitation to join a team" : isRequestToJoin ? "Request to join team" : "Invitation to team up"}
          </h1>
        </div>
        
        <div className="max-w-2xl mx-auto px-6 space-y-8 pb-8">

        {/* Purple Hero Card */}
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="bg-white/20 p-4 rounded-2xl">
                  {isInviteToTeam && members.length > 1 ? (
                    <div className="flex items-center justify-center space-x-1">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold">{getSenderInitials()}</span>
                      </div>
                      <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                        <span className="text-xs">+{members.length - 1}</span>
                      </div>
                    </div>
                  ) : (
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                        {getSenderInitials()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-xl font-semibold">
                  {isInviteToTeam && team 
                    ? `${team.name}, ${members.length} members` 
                    : isRequestToJoin
                    ? `${sender.name}, ${(() => {
                        const birthDate = sender.birthDate;
                        if (birthDate?.year) {
                          const age = new Date().getFullYear() - parseInt(birthDate.year);
                          return age;
                        }
                        return 'N/A';
                      })()}`
                    : sender.name}
                </h2>
              </div>

              {/* See Profile Button */}
              <Button 
                variant="outline" 
                className="bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600"
                onClick={() => {
                  if (isInviteToTeam && request.teamId) {
                    navigate(`/team/profile/${request.teamId}`, { state: { fromRequestFlow: true } });
                  } else {
                    navigate(`/profile/${sender.id}`, { state: { fromRequestFlow: true } });
                  }
                }}
              >
                {isInviteToTeam ? "See Team Profile" : "See Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Course Info Box */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <p className="text-sm text-gray-700">
              {isRequestToJoin ? (
                <>
                  <span className="font-bold">{sender.name.split(' ')[0]}</span> wants to join your <span className="font-bold">{team?.name || 'team'}</span> team{roadmap ? ` to learn ${roadmap.title}` : ''}.{' '}
                  {otherAdminsCount > 0 && (
                    <span className="text-gray-600">Sent to <span className="font-bold">{otherAdminsCount} more admin{otherAdminsCount !== 1 ? 's' : ''}</span>.</span>
                  )}
                </>
              ) : (
                <>
                  {sender.name.split(' ')[0]} is inviting you to learn{" "}
                  {roadmap ? (
                    <span className="font-medium underline">{roadmap.title}</span>
                  ) : isCreateTeam ? (
                    ""
                  ) : (
                    <span className="font-medium underline">a course</span>
                  )}{" "}
                  {isInviteToTeam ? (
                    <>
                      in {team ? 'the' : 'their'} team {team?.name || ''} for{" "}
                      <span className="font-bold">{request.duration || team?.duration || 'N/A'}</span>,{" "}
                      <span className="font-bold">{request.maxMembers || team?.maxMembers || 'N/A'} people max</span>.
                    </>
                  ) : (
                    <>
                      in a new team {request.newTeamName ? `"${request.newTeamName}"` : ''} for{" "}
                      <span className="font-bold">{request.duration || 'N/A'}</span>,{" "}
                      <span className="font-bold">{request.maxMembers || 'N/A'} people max</span>.
                      {!roadmap && <span className="font-bold"> No roadmap has been selected for this team yet.</span>}
                    </>
                  )}
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button onClick={handleAcceptClick} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            {isProcessing ? "Processing..." : isRequestToJoin ? "Accept request" : (isInviteToTeam ? "Join this team" : "Accept invitation")}
          </Button>
          <Button onClick={handleDeclineClick} disabled={isProcessing} variant="outline" className="flex-1 bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200">
            Decline request
          </Button>
        </div>

        {/* Message Section */}
        {request.message && (
          <Card className="bg-ekana-white">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {sender.name.split(' ')[0]} says
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {request.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">Team settings</h3>
            <Info className="h-4 w-4 text-blue-500" />
          </div>

          <Card className="bg-ekana-white">
            <CardContent className="p-6 space-y-6">
              {/* Admin Settings */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">Admin settings</span>
                  <Info className="h-4 w-4 text-blue-500" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                  <span className="text-purple-600 font-medium">
                    {isRequestToJoin
                      ? `${sender.name.split(' ')[0]} will not join this team as an admin`
                      : isCreateTeam
                      ? "You will be an admin"
                      : (request.makeAdmin 
                          ? "You will join as an admin" 
                          : "You will not join as an admin")}
                  </span>
                </div>
              </div>

              {/* Time Limit */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {(isInviteToTeam || isRequestToJoin) ? "Time left for this group" : "Maximum time of the group"}
                  </span>
                  <Info className="h-4 w-4 text-blue-500" />
                </div>
                 <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                   <span className="text-purple-600 font-medium">
                     {(() => {
                       if ((isInviteToTeam || isRequestToJoin) && team) {
                         const timeInfo = getTeamTimeLeft(team.id);
                         return timeInfo ? timeInfo.displayText : (request.duration || team.duration || 'N/A');
                       }
                       return request.duration || 'N/A';
                     })()}
                   </span>
                 </div>
              </div>

              {/* Member Limit */}
              <div className="space-y-2">
                <span className="font-medium text-gray-900">
                  {(isInviteToTeam || isRequestToJoin) ? "Number of teammembers" : "Maximum number of people"}
                </span>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-4 py-2 text-center">
                    <span className="text-purple-600 font-medium">
                      {(isInviteToTeam || isRequestToJoin) && team
                        ? `${members.length} people (${(request.maxMembers || team.maxMembers || 0) - members.length} spots left)`
                        : `${request.maxMembers || 'N/A'} people`}
                    </span>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Join Confirmation Modal */}
        <Dialog open={showJoinConfirm} onOpenChange={setShowJoinConfirm}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-6 p-6">
              <div className="text-lg">
                {isRequestToJoin ? (
                  <>
                    <span className="font-semibold">{sender.name}</span> will join{' '}
                    <span className="font-semibold">{team?.name || 'the team'}</span>{' '}
                    <span className="text-2xl">🧩</span>
                  </>
                ) : (
                  <>
                    You are about to {actionType === 'join' ? 'join' : 'create a group with'} {' '}
                    <span className="font-semibold">
                      {actionType === 'join' ? (team ? `${team.name}` : 'the team') : sender.name}
                    </span>{' '}
                    <span className="text-2xl">🧩</span>
                  </>
                )}
              </div>
              <div className="flex space-x-4">
                <Button onClick={handleConfirmAccept} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {isProcessing ? "Processing..." : "Continue"}
                </Button>
                <Button onClick={() => setShowJoinConfirm(false)} variant="outline" className="flex-1 bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Decline Confirmation Modal */}
        <Dialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
          <DialogContent className="sm:max-w-md">
            <div className="text-center space-y-6 p-6">
              <div className="text-lg">
                You are about to <span className="font-semibold">decline {getSenderDisplayName()}'s request</span>{' '}
                <X className="inline w-5 h-5 text-red-500" />
              </div>
              <div className="text-sm text-gray-600">
                Are you sure you want to continue?
              </div>
              <div className="flex space-x-4">
                <Button onClick={handleConfirmDecline} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {isProcessing ? "Processing..." : "Yes"}
                </Button>
                <Button onClick={() => setShowDeclineConfirm(false)} variant="outline" className="flex-1 bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Team Creation Success Modal */}
        <TeamCreationSuccessModal 
          team={createdTeam} 
          onClose={() => setCreatedTeam(null)} 
        />

        {/* Request Action Success Modal (for REQUEST_TO_JOIN admin actions) */}
        <RequestActionSuccessModal
          isOpen={showRequestActionModal}
          onClose={() => {
            setShowRequestActionModal(false);
            // Don't navigate here - let the modal button handle navigation
          }}
          actionType={requestActionType}
          userName={sender?.name?.split(' ')[0] || 'User'}
          teamName={team?.name || 'team'}
          teamId={request.teamId}
        />
        </div>
      </div>
    </Layout>;
};
export default CollaborationPreview;