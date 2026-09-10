import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Settings, 
  Target, 
  Users, 
  BookOpen, 
  Bot, 
  Crown, 
  ExternalLink, 
  Home, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LinkManagementModal from "@/components/LinkManagementModal";
import AiClassmateModal from "@/components/modals/AiClassmateModal";
import BadgeAwardModal from "@/components/BadgeAwardModal";
import { useTeamContext } from "@/contexts/TeamContext";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { useTeamGoalProgress } from "@/hooks/useTeamGoalProgress";
import { useGamificationContext } from "@/contexts/GamificationContext";

interface TeamMember {
  id: number;
  userId?: string; // Actual user ID for proper identification
  name: string;
  avatar: string;
  isAdmin: boolean;
  online: boolean;
  goalCompleted: boolean;
}

interface TeamData {
  id: string;
  name: string;
  course: string;
  members: TeamMember[];
  progress: number;
  resourceLinks: Array<{ name: string; url: string; description: string }>;
}

interface User {
  name?: string;
  isPremium?: boolean;
}

interface Goal {
  id: string;
  teamId: string;
  type: 'units' | 'points';
  amount: number;
  weeks: number;
  badges: number;
  description: string;
  startDate: string;
}

interface TeamSidebarProps {
  team: TeamData;
  user: User | null;
  currentPage?: 'team' | 'leaderboard' | 'roadmap' | 'ekky-ai' | 'settings';
  onSettings?: () => void; // Optional for backward compatibility
  onGoalModal?: () => void; // Optional for backward compatibility
  onGoalDetails?: () => void; // Optional for backward compatibility
  onAIAccess?: () => void; // Optional for backward compatibility
  onRoadmap?: () => void; // Optional for backward compatibility
  onLeaderboard?: () => void; // Optional for backward compatibility
  onPremiumModal?: () => void; // Optional for backward compatibility
}

const TeamSidebar = ({ 
  team, 
  user, 
  currentPage = 'team',
  onSettings,
  onGoalModal,
  onGoalDetails,
  onAIAccess,
  onRoadmap,
  onLeaderboard,
  onPremiumModal
}: TeamSidebarProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { getUnreadCount } = useChatContext();
  const { awardBadge } = useGamificationContext();
  const [directMessagesOpen, setDirectMessagesOpen] = useState(true);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [resourceLinksOpen, setResourceLinksOpen] = useState(true);
  const [teamMembersOpen, setTeamMembersOpen] = useState(true);
  const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
  const [showBadgeAwardModal, setShowBadgeAwardModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<{ name: string; url: string; description: string } | null>(null);
  
  // Get current goal from TeamContext and calculate progress
  const { getCurrentTeamGoal, getTeamMembersWithRoles } = useTeamContext();
  const currentGoal = getCurrentTeamGoal(team.id);
  
  // Use the smart hook for dynamic goal progress calculation
  const { totalProgress, isComplete, sortedMembersProgress, minimumPoints, allMembersMetMinimum, goalStatus } = useTeamGoalProgress(team.id, currentGoal);
  
  // Compute goal display text and time remaining
  const goalText = currentGoal 
    ? currentGoal.type === 'points' && minimumPoints
      ? `${currentGoal.amount} points (${Math.round(minimumPoints)} each minimum) ${currentGoal.weeks === 1 ? 'weekly' : `in ${currentGoal.weeks} weeks`}`
      : currentGoal.description
    : "No active goal";
  
  // Calculate time remaining dynamically
  const timeLeftText = currentGoal ? (() => {
    if (goalStatus === 'COMPLETED') return "Goal completed";
    
    const startDate = new Date(currentGoal.startDate);
    const deadlineDate = new Date(startDate);
    deadlineDate.setDate(deadlineDate.getDate() + (currentGoal.weeks * 7));
    
    const now = new Date();
    const timeLeft = deadlineDate.getTime() - now.getTime();
    
    if (timeLeft <= 0) return "Goal expired";
    
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    const weeksLeft = Math.floor(daysLeft / 7);
    const remainingDays = daysLeft % 7;
    
    if (weeksLeft > 0 && remainingDays > 0) {
      return `${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} left`;
    } else if (weeksLeft > 0) {
      return `${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} left`;
    } else {
      return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
    }
  })() : "";

  // Get members with roles directly from context for role verification
  const membersWithRoles = getTeamMembersWithRoles(team.id);
  
  console.log('🔍 [TeamSidebar] Received team.members:', team.members);
  console.log('🔍 [TeamSidebar] membersWithRoles from context:', membersWithRoles);
  console.log('🔍 [TeamSidebar] team.id:', team.id);
  
  // Correct the isAdmin values based on actual roles from TeamContext (Supabase)
  const correctedMembers = team.members.map(member => {
    const memberWithRole = membersWithRoles.find(mwr => mwr.userId === member.userId);
    console.log(`🔍 [TeamSidebar] Member ${member.userId} (${member.name}) - role: ${memberWithRole?.role}`);
    return {
      ...member,
      isAdmin: memberWithRole?.role === 'admin'
    };
  });
  
  console.log('🔍 [TeamSidebar] correctedMembers:', correctedMembers);

  // Award badges when goal is completed
  useEffect(() => {
    if (goalStatus === 'COMPLETED' && currentGoal && correctedMembers.length > 0 && currentUser) {
      // Check if this goal has already been celebrated by this user
      const celebrationKey = `ekana_celebrated_${currentGoal.id}_${currentUser.id}`;
      const alreadyCelebrated = localStorage.getItem(celebrationKey);
      
      if (alreadyCelebrated) {
        return; // Already celebrated, don't show modal again
      }
      
      // Award badge to each team member
      correctedMembers.forEach(member => {
        if (member.userId) {
          awardBadge(
            member.userId,
            `Completed Team Goal: ${currentGoal.description}`,
            currentGoal.teamId,
            `goal-${currentGoal.id}-completed-${member.userId}`
          );
        }
      });
      
      // Mark as celebrated for this user
      localStorage.setItem(celebrationKey, 'true');
      
      // Show the badge award modal
      setShowBadgeAwardModal(true);
    }
  }, [goalStatus, currentGoal, correctedMembers, awardBadge, currentUser]);

  const navigationItems = [
    { icon: Home, path: "/dashboard" },
    { icon: Users, path: "/teams" },
    { icon: Search, path: "/connect" },
    { icon: BookOpen, path: "/courses" },
    { icon: Crown, path: "/premium" },
  ];

  const handleAIAccess = () => {
    if (!user?.isPremium) {
      navigate('/premium');
    } else {
      navigate(`/team/${team.id}/ekky-ai`);
    }
  };

  const handleGoalDetailsModal = () => {
    setShowGoalDetailsModal(true);
    onGoalDetails?.();
  };

  const handleLinkClick = (link: { name: string; url: string; description: string }) => {
    setSelectedLink(link);
    setShowLinkModal(true);
  };

  const handleSaveLink = (updatedLink: { name: string; url: string; description: string }) => {
    // This would typically save to a backend or update local state
    console.log('Saving link:', updatedLink);
    // For now, just close the modal
    setShowLinkModal(false);
  };

  return (
    <TooltipProvider>
      <>
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
                    <p className="text-lg text-ekana-white font-semibold">{goalText}</p>
                    {goalStatus === 'MINIMUMS_NOT_MET' && (
                      <span className="text-sm font-bold text-ekana-yellow-light">
                        Minimums per member not met
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-ekana-green-light/30 rounded-full h-4 mb-2">
                  <div className="bg-ekana-white h-4 rounded-full transition-all duration-300" style={{ width: `${totalProgress}%` }}></div>
                </div>
                <div className="flex justify-between text-ekana-white/90">
                  <span className="text-sm">
                    {goalStatus === 'COMPLETED' ? 'Goal Completed!' : `${Math.round(totalProgress)}% complete`}
                  </span>
                  <span className="text-sm">{goalStatus !== 'COMPLETED' && timeLeftText}</span>
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
                  {sortedMembersProgress.map((progress, index) => {
                    // Find the corresponding team member for avatar and online status
                    const teamMember = correctedMembers.find(m => m.name === progress.member.name);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{teamMember?.avatar || '?'}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 ${teamMember?.online ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{progress.member.name}</p>
                            {teamMember?.isAdmin && <Badge className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-600">Admin</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {progress.status === 'Completed' ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">In progress</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Management Modal */}
      <LinkManagementModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        link={selectedLink}
        onSave={handleSaveLink}
      />

      {/* Icon-only sidebar - Fixed position */}
      <div className="fixed left-0 top-0 w-16 h-screen bg-ekana-purple-dark flex flex-col items-center py-4 space-y-4 z-20">
        {/* Back arrow with extra spacing */}
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 text-ekana-white hover:bg-ekana-purple-light mb-4"
          onClick={() => navigate('/teams')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {navigationItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 text-ekana-white hover:bg-ekana-purple-light"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Main sidebar - Fixed position with margin for icon sidebar */}
      <div className="fixed left-16 top-0 w-80 h-screen bg-ekana-purple-light flex flex-col z-10">
        {/* Team Header */}
        <div className="p-4 border-b border-ekana-purple-dark flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-3">
              {/* Team profile picture placeholder */}
              <div className="w-8 h-8 bg-gray-300 rounded-sm flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {team.name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                </span>
              </div>
              <h1 className="text-lg font-bold text-ekana-white">{team.name}</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                console.log('Settings button clicked, team.id:', team.id);
                navigate(`/team/${team.id}/settings`);
              }} 
              className="text-ekana-white hover:bg-ekana-purple-dark"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

          {/* Weekly Goal Section */}
          <div className="px-4 pt-1 pb-4 border-b border-ekana-purple-dark flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-ekana-white">Weekly Goal</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  console.log('Goal modal button clicked - handled by parent');
                  onGoalModal?.();
                }} 
                className="text-ekana-white hover:bg-ekana-purple-dark p-1"
              >
                <Target className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Goal Card - Conditional Rendering */}
            {currentGoal ? (
              // Active Goal Card
              <Card className="bg-ekana-green-dark border-none relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <img 
                        src="/lovable-uploads/67f86ffa-a0b8-4847-b4e0-0b4f2d5904bd.png" 
                        alt="team goal" 
                        className="h-4 w-4"
                      />
                      <p className="text-sm text-ekana-white font-medium">{goalText}</p>
                      {goalStatus === 'MINIMUMS_NOT_MET' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs font-bold cursor-help text-ekana-yellow-light">
                              Minimums not met
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Everyone must meet their minimum contribution.</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-ekana-green-light/30 rounded-full h-2 mb-1">
                    <div className="bg-ekana-white h-2 rounded-full" style={{ width: `${totalProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-ekana-white/70">{Math.round(totalProgress)}% complete | {timeLeftText}</p>
                  
                  {/* See progress button */}
                  <button 
                    onClick={handleGoalDetailsModal}
                    className="absolute bottom-2 right-2 text-xs text-ekana-white/80 hover:text-ekana-white underline"
                  >
                    See progress
                  </button>
                </CardContent>
              </Card>
            ) : (
              // Empty State Card
              <Card 
                className="bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer hover:border-ekana-green-dark hover:bg-gray-50 transition-colors"
                onClick={() => {
                  console.log('Empty state goal card clicked - handled by parent');
                  onGoalModal?.();
                }}
              >
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 mb-1">No team goal set</p>
                  <p className="text-xs text-gray-500">Set a new team goal</p>
                </CardContent>
              </Card>
            )}
          </div>

        {/* Quick Actions - 3 Button Grid */}
        <div className="p-4 border-b border-ekana-purple-dark flex-shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              className={`flex flex-col items-start justify-center h-16 text-xs font-medium p-2 relative ${
                !user?.isPremium ? 'opacity-60' : ''
              } ${
                currentPage === 'ekky-ai' 
                  ? 'bg-ekana-orange-light hover:bg-ekana-orange-light/80 text-ekana-white' 
                  : 'bg-ekana-gray-light hover:bg-ekana-gray-light/90 text-ekana-dark'
              }`}
              onClick={handleAIAccess}
              disabled={!user?.isPremium}
            >
              <img 
                src="/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png" 
                alt="Ekky AI" 
                className="h-6 w-6 ml-1"
              />
              <span className="mt-0 ml-1">Ekky AI</span>
              {!user?.isPremium && <img src="/lovable-uploads/0cbc90a0-9dd3-45b8-8819-76efab40077a.png" alt="Premium" className="h-3 w-3 absolute top-1 right-1" />}
            </Button>
            
            <Button 
              className={`flex flex-col items-start justify-center h-16 text-xs font-medium p-2 ${
                currentPage === 'roadmap' 
                  ? 'bg-ekana-orange-light hover:bg-ekana-orange-light/80 text-ekana-white' 
                  : 'bg-ekana-gray-light hover:bg-ekana-gray-light/90 text-ekana-dark'
              }`}
              onClick={() => navigate(`/team/${team.id}/roadmap`)}
            >
              <img 
                src="/lovable-uploads/aa954090-0132-4565-abb9-750898a7c06b.png" 
                alt="Roadmap" 
                className="h-6 w-6 ml-1"
              />
              <span className="mt-0 ml-1">Roadmap</span>
            </Button>
            
            <Button 
              className={`flex flex-col items-start justify-center h-16 text-xs font-medium p-2 ${
                currentPage === 'leaderboard' 
                  ? 'bg-ekana-orange-light hover:bg-ekana-orange-light/80 text-ekana-white' 
                  : 'bg-ekana-gray-light hover:bg-ekana-gray-light/90 text-ekana-dark'
              }`}
              onClick={() => navigate(`/team/${team.id}/leaderboard`)}
            >
              <img 
                src="/lovable-uploads/8be34b35-715f-4a35-baf6-29a13a06a4b8.png" 
                alt="Leaderboard" 
                className="h-6 w-6 ml-1"
              />
              <span className="mt-0 ml-1">Leaderboard</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {/* Channels Section */}
              <Collapsible open={channelsOpen} onOpenChange={setChannelsOpen}>
                <div className="flex items-center justify-between" style={{ marginTop: '-15px', marginBottom: '-2px' }}>
                  <h3 className="font-semibold text-sm text-ekana-white">Channels</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-ekana-white hover:bg-ekana-purple-dark p-1">
                      {channelsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-ekana-white hover:bg-ekana-purple-dark relative"
                      onClick={() => navigate(`/team/${team.id}`)}
                    >
                      <span className="mr-0 text-lg">#</span>
                      general
                      {currentUser && getUnreadCount(team.id, currentUser.id) > 0 && (
                        <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-[20px] rounded-full">
                          {getUnreadCount(team.id, currentUser.id)}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Direct Messages Section */}
              <div style={{ marginTop: '-5px' }}>
                <Collapsible open={directMessagesOpen} onOpenChange={setDirectMessagesOpen}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-ekana-white">Direct Messages</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-ekana-white hover:bg-ekana-purple-dark p-1">
                        {directMessagesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-1">
                      {correctedMembers
                        .filter(member => {
                          // Filter out current user from DM list
                          return member.userId !== currentUser?.id;
                        })
                        .sort((a, b) => {
                          // Admins first, then non-admins
                          if (a.isAdmin && !b.isAdmin) return -1;
                          if (!a.isAdmin && b.isAdmin) return 1;
                          // Within each group, sort alphabetically by name
                          return a.name.localeCompare(b.name);
                        })
                        .map(member => {
                          const memberUserId = member.userId;
                          
                          const unreadCount = currentUser && memberUserId ? getUnreadCount(`dm-${memberUserId}`, currentUser.id) : 0;
                          
                          return (
                            <Button
                              key={member.id}
                              variant="ghost"
                              className="w-full flex items-center justify-start space-x-2 p-2 hover:bg-ekana-purple-dark text-left relative"
                              onClick={() => navigate(`/team/${team.id}/dm/${memberUserId}`)}
                            >
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{member.avatar}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 ${member.online ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full`}></div>
                              </div>
                              <div className="flex-1 min-w-0 flex items-center">
                                <p className="text-sm font-medium truncate text-ekana-white">{member.name}</p>
                                {member.isAdmin && <Badge className="text-xs bg-green-600 hover:bg-green-700 text-white border-green-600 ml-2">Admin</Badge>}
                              </div>
                              {unreadCount > 0 && (
                                <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-[20px] rounded-full">
                                  {unreadCount}
                                </Badge>
                              )}
                            </Button>
                          );
                        })}
                    </div>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs hover:bg-ekana-purple-dark text-ekana-white/90 mt-2"
                      onClick={() => setIsAiModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <Bot className="mr-2 h-4 w-4" />
                      Add an EkyIA classmate
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Tools and Links Section with added spacing */}
              <div style={{ marginTop: '-5px' }}>
                <Collapsible open={resourceLinksOpen} onOpenChange={setResourceLinksOpen}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-ekana-white">Tools and Links</h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-ekana-white hover:bg-ekana-purple-dark p-1">
                        {resourceLinksOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="space-y-1">
                      {team.resourceLinks.map((link, index) => (
                        <Button 
                          key={index}
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start text-ekana-blue-light hover:bg-ekana-purple-dark"
                          onClick={() => handleLinkClick(link)}
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          {link.name}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* AI Classmate Modal */}
      <AiClassmateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
      
      {/* Badge Award Modal */}
      <BadgeAwardModal
        isOpen={showBadgeAwardModal}
        onClose={() => setShowBadgeAwardModal(false)}
        goalDescription={currentGoal?.description || ''}
        teamName={team.name}
        teamId={team.id}
        badgesAwarded={currentGoal?.badges || 1}
        memberCount={correctedMembers.length}
      />
      </>
    </TooltipProvider>
  );
};

export default TeamSidebar;