import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAggregatedTeamData, useTeamGoals, useTeamPoints, useTeamBadges, useTeamCompletedUnits } from '@/hooks/useMockData';
import { useTeamContext } from '@/contexts/TeamContext';
import { useRequestContext } from '@/contexts/RequestContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, MapPin, Users, Clock, Calendar } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { GOALS, COMMUNICATION_OPTIONS } from '@/lib/constants';

const TeamProfilePage = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromRequestFlow = location.state?.fromRequestFlow || false;
  
  // Get team and members from TeamContext
  const { teams, teamMembers } = useTeamContext();
  const { user: currentUser } = useAuth();
  const { getPendingRequest } = useRequestContext();
  const team = teams.find(t => t.id === teamId);
  
  // Find members for this team
  const teamMemberIds = teamMembers
    .filter(tm => tm.teamId === teamId)
    .map(tm => tm.userId);
  
  const members = mockUsers.filter(u => teamMemberIds.includes(u.id));
  
  const displayTeam = team ? useAggregatedTeamData(team) : null;
  const goals = useTeamGoals(teamId);
  const teamPoints = useTeamPoints(teamId || '');
  const teamBadges = useTeamBadges(teamId || '');
  const completedUnits = useTeamCompletedUnits(teamId || '');
  
  const [showFullBio, setShowFullBio] = useState(false);

  if (!team || !displayTeam) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Team not found</p>
        </div>
      </Layout>
    );
  }

  // Calculate spots left
  const currentMembers = members.length;
  const maxMembers = team.maxMembers || 10;
  const spotsLeft = maxMembers - currentMembers;

  // Get time left from TeamContext
  const { getTeamTimeLeft } = useTeamContext();
  const timeInfo = getTeamTimeLeft(teamId || '');

  // Parse goals from displayTeam.goals string or array
  const parseGoals = () => {
    if (!displayTeam.goals || displayTeam.goals === 'Not specified') return [];
    
    // Handle array format (already parsed)
    if (Array.isArray(displayTeam.goals)) {
      return displayTeam.goals.map(goal => goal.trim());
    }
    
    // Handle string format (needs splitting)
    return displayTeam.goals.split(', ').map(goal => goal.trim());
  };

  // Format levels for summary
  const formatLevelsForSummary = () => {
    if (!displayTeam.teamLevel || displayTeam.teamLevel === 'Not specified') return 'various levels';
    
    // Handle array format (already parsed)
    const levels = Array.isArray(displayTeam.teamLevel) 
      ? displayTeam.teamLevel.map(level => level.trim())
      : displayTeam.teamLevel.split(', ').map(level => level.trim());
    
    if (levels.length === 1) {
      return `${levels[0]} level`;
    } else if (levels.length === 2) {
      return `${levels[0]} & ${levels[1]} levels`;
    } else {
      return `${levels.slice(0, -1).join(', ')} & ${levels[levels.length - 1]} levels`;
    }
  };

  // Format goals for summary
  const formatGoalsForSummary = () => {
    const goals = parseGoals();
    if (goals.length === 0) return 'achieve their goals';
    
    if (goals.length === 1) {
      return goals[0];
    } else if (goals.length === 2) {
      return `${goals[0]} & ${goals[1]}`;
    } else {
      return `${goals.slice(0, -1).join(', ')} & ${goals[goals.length - 1]}`;
    }
  };

  // Parse languages
  const parseLanguages = () => {
    if (!displayTeam.languages || displayTeam.languages === 'Not specified') return '';
    
    // Handle array format (already parsed)
    if (Array.isArray(displayTeam.languages)) {
      return displayTeam.languages.join(', ');
    }
    
    // Handle string format
    return displayTeam.languages;
  };

  // Parse communication preferences
  const parseCommPreferences = () => {
    if (!displayTeam.communicationPreferences || displayTeam.communicationPreferences === 'Not specified') return [];
    
    // Handle array format (already parsed)
    if (Array.isArray(displayTeam.communicationPreferences)) {
      return displayTeam.communicationPreferences.map(pref => pref.trim());
    }
    
    // Handle string format (needs splitting)
    return displayTeam.communicationPreferences.split(', ').map(pref => pref.trim());
  };

  // Get icon for goal
  const getGoalIcon = (goal: string) => {
    const matchedGoal = GOALS.find(g => 
      goal.toLowerCase().includes(g.name.toLowerCase()) ||
      g.name.toLowerCase().includes(goal.toLowerCase())
    );
    return matchedGoal?.icon;
  };

  // Get icon for communication preference
  const getCommIcon = (pref: string) => {
    const matchedComm = COMMUNICATION_OPTIONS.find(c => 
      pref.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(pref.toLowerCase())
    );
    return matchedComm?.icon;
  };

  // Check for pending request
  const pendingRequest = currentUser && teamId 
    ? getPendingRequest(currentUser.id, teamId, 'REQUEST_TO_JOIN')
    : undefined;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Header Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                {/* Cascading Avatars */}
                <div className="flex -space-x-3">
                  {members.slice(0, 3).map((member, index) => (
                    <Avatar key={member.id} className="w-20 h-20 border-2 border-background">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{team.name}</h1>
                  {displayTeam.location && displayTeam.location !== 'Remote' && (
                    <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{displayTeam.location}</span>
                    </div>
                  )}
                </div>
              </div>
              {!fromRequestFlow && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button 
                          onClick={() => navigate(`/team-request?recipientTeamId=${teamId}`)}
                          disabled={!!pendingRequest}
                        >
                          {pendingRequest ? 'Request Pending' : 'Request to join'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {pendingRequest && (
                      <TooltipContent>
                        <p>You've already sent a request to this team. You should receive an answer shortly.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </Card>

          {/* Status Cards Row */}
          <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-orange-100">
            <div className="flex items-center justify-center gap-3">
              <Users className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-black leading-none">{spotsLeft} spots left</span>
            </div>
          </Card>
            
            {timeInfo && (
              <Card className="p-4 bg-orange-100">
                <div className="flex items-center justify-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-bold text-black">
                      {timeInfo.displayText} left
                    </p>
                    <p className="text-xs text-black">
                      (started {timeInfo.weeksSinceStart} w ago)
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 text-center bg-green-600 text-white">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-2xl font-bold">{currentMembers}</p>
              <p className="text-sm">Members</p>
            </Card>
            <Card className="p-6 text-center bg-green-500 text-white">
              <div className="text-3xl mb-2">🎖️</div>
              <p className="text-2xl font-bold">{teamBadges}</p>
              <p className="text-sm">Badges</p>
            </Card>
            <Card className="p-6 text-center bg-blue-600 text-white">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-2xl font-bold">{completedUnits}</p>
              <p className="text-sm">Lessons</p>
            </Card>
          </div>

          {/* Summary Section */}
          <Card className="p-6 bg-orange-200">
            <h2 className="text-xl font-bold mb-3 text-black">Summary</h2>
            <p className="text-black leading-relaxed">
              {team.name} is learning {displayTeam.subject || 'various topics'}, at {formatLevelsForSummary()} in order to {formatGoalsForSummary()}.
            </p>
          </Card>

          {/* Bio Section */}
          {team.bio && (
            <Card className="p-6 bg-purple-200">
              <h2 className="text-xl font-bold mb-3 text-black">Bio</h2>
              <p className="text-black leading-relaxed">
                {showFullBio 
                  ? team.bio 
                  : `${team.bio.substring(0, 150)}${team.bio.length > 150 ? '...' : ''}`
                }
              </p>
              {team.bio.length > 150 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="mt-3 text-purple-700 hover:text-purple-900"
                >
                  {showFullBio ? 'See less' : 'See more'} +
                </Button>
              )}
            </Card>
          )}

          {/* Languages Section */}
          {parseLanguages() && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Languages</h2>
              <p className="text-foreground">{parseLanguages()}</p>
            </Card>
          )}

          {/* Goals Section */}
          {parseGoals().length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Goals</h2>
              <div className="space-y-4">
                {parseGoals().map((goal, index) => {
                  const icon = getGoalIcon(goal);
                  return (
                    <div key={index} className="flex items-center gap-3">
                      {icon && <img src={icon} alt={goal} className="w-6 h-6" />}
                      <span className="text-foreground">{goal}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Average Time Commitment Section */}
          {displayTeam.timeCommitments && displayTeam.timeCommitments !== 'Not specified' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Average Time Commitment</h2>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{displayTeam.timeCommitments}</span>
              </div>
            </Card>
          )}

          {/* Communication Preferences Section */}
          {parseCommPreferences().length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Communication Preferences</h2>
              <div className="space-y-4">
                {parseCommPreferences().map((pref, index) => {
                  const icon = getCommIcon(pref);
                  return (
                    <div key={index} className="flex items-center gap-3">
                      {icon && <img src={icon} alt={pref} className="w-6 h-6" />}
                      <span className="text-foreground">{pref}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default TeamProfilePage;
