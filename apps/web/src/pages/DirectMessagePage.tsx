import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUser, useTeam, useTeamMembersWithRoles } from "@/hooks/useMockData";
import { mockUsers } from "@/lib/mockData";
import TeamSidebar from "@/components/TeamSidebar";

const DirectMessagePage = () => {
  const { teamId, otherUserId } = useParams<{ teamId: string; otherUserId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const otherUser = useUser(otherUserId || '');
  const { getDirectMessages, sendMessage, markAsRead } = useChatContext();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Get team data for sidebar
  const { team: teamData } = useTeam(teamId || '');
  const teamMembersWithRoles = useTeamMembersWithRoles(teamId || '');

  // Get direct messages between current user and other user
  const directMessages = getDirectMessages(user?.id || '', otherUserId || '');

  // Mark as read when viewing DMs
  useEffect(() => {
    if (otherUserId) {
      markAsRead(`dm-${otherUserId}`);
    }
  }, [otherUserId, markAsRead]);

  // Smart auto-scroll - only scroll if user is near bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [directMessages]);

  const handleSendMessage = () => {
    if (messageText.trim() && otherUserId) {
      sendMessage({ 
        userId: user?.id || '', 
        text: messageText, 
        receiverId: otherUserId 
      });
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!teamData || !otherUser) {
    return <div>Loading...</div>;
  }

  // Transform team data for sidebar
  const sidebarTeam = {
    id: teamData.id,
    name: teamData.name,
    course: teamData.course || "No course",
    members: teamMembersWithRoles.map((m, idx) => ({
      id: idx,
      name: m.user?.name || "Unknown",
      avatar: m.user?.avatar || "??",
      isAdmin: m.role === 'admin',
      online: true,
      goalCompleted: false,
    })),
    progress: 0,
    resourceLinks: [],
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Team Sidebar */}
      <TeamSidebar
        team={sidebarTeam}
        user={user}
        currentPage="team"
        onRoadmap={() => navigate(`/team/${teamId}/roadmap`)}
        onLeaderboard={() => navigate(`/team/${teamId}/leaderboard`)}
        onAIAccess={() => navigate(`/team/${teamId}/ekky-ai`)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-96 bg-white">
        {/* DM Header */}
        <div className="bg-ekana-purple-dark text-white p-4 border-b">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {otherUser.name?.split(' ').map(n => n[0]).join('') || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold">Private Chat with {otherUser.name}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/profile/${otherUserId}?context=dm&teamId=${teamId}`)}
                className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs h-7"
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {directMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation with {otherUser.name}</p>
            </div>
          ) : (
            directMessages.map(message => {
              const sender = mockUsers.find(u => u.id === message.userId);
              
              return (
                <div key={message.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {sender?.name.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">{sender?.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex space-x-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${otherUser.name}...`}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!messageText.trim()}
              className="bg-ekana-purple-dark hover:bg-ekana-purple-light"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectMessagePage;
