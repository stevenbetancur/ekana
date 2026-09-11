import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGamificationContext } from '@/contexts/GamificationContext';
import { useRequestContext } from '@/contexts/RequestContext';
import { useUser, useUserTeams, useUserCompletedUnits } from '@/hooks/useMockData';
import { useRoadmapsContext } from '@/contexts/RoadmapsContext';
import { displayAge, findCommonRoadmaps } from '@/lib/utils';
import { mockPointEvents, mockBadgeEvents } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/components/Layout';
import starYellowIcon from '@/assets/icons/star-yellow.png';
import starGrayIcon from '@/assets/icons/star-gray.png';
import { GOALS, COMMUNICATION_OPTIONS } from '@/lib/constants';

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromRequestFlow = location.state?.fromRequestFlow || false;
  const { user: currentUser } = useAuth();
  const { getUserPoints } = useGamificationContext();
  const { getPendingRequest } = useRequestContext();
  const profileUser = useUser(userId || '');
  const userTeams = useUserTeams(userId || '');
  const completedUnits = useUserCompletedUnits(userId || '');
  
  // Calculate points and badges from GamificationContext
  const userPoints = userId ? getUserPoints(userId) : 0;
  
  const userBadges = mockBadgeEvents
    .filter(event => event.userId === userId)
    .length;
  
  const [showTeams, setShowTeams] = useState(false);

  // Get roadmaps for both users to find common ones
  const { getPersonalRoadmaps } = useRoadmapsContext();
  const currentUserRoadmaps = currentUser ? getPersonalRoadmaps(currentUser) : [];
  const profileUserRoadmaps = profileUser ? getPersonalRoadmaps(profileUser) : [];
  
  const commonRoadmap = findCommonRoadmaps(currentUserRoadmaps, profileUserRoadmaps);

  if (!profileUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </Layout>
    );
  }

  const age = displayAge(profileUser);

  // Format availability as strings
  const formatAvailability = () => {
    if (!profileUser.schedule) return [];
    
    const weekdayTimes = new Set<string>();
    const weekendTimes = new Set<string>();
    
    profileUser.schedule.weekdays.forEach(time => {
      const timeFormatted = time?.toLowerCase() || '';
      if (timeFormatted) weekdayTimes.add(timeFormatted);
    });
    
    profileUser.schedule.weekend.forEach(time => {
      const timeFormatted = time?.toLowerCase() || '';
      if (timeFormatted) weekendTimes.add(timeFormatted);
    });
    
    const result = [];
    if (weekdayTimes.size > 0) {
      result.push(`Weekdays in the ${Array.from(weekdayTimes).join(', ')}`);
    }
    if (weekendTimes.size > 0) {
      result.push(`Weekends in the ${Array.from(weekendTimes).join(', ')}`);
    }
    
    return result;
  };

  // Generate summary text
  const getSummaryText = () => {
    let baseText = `${profileUser.name} is learning ${profileUser.subject || 'various topics'}, as a ${profileUser.level || 'learner'} in order to ${profileUser.goal || 'achieve their goals'}.`;
    
    // Determine roadmap status
    let roadmapText = '';
    if (profileUserRoadmaps.length === 0) {
      roadmapText = ` ${profileUser.name} is not using any roadmaps yet.`;
    } else if (profileUserRoadmaps.length === 1) {
      roadmapText = ` ${profileUser.name} is using: "${profileUserRoadmaps[0].title}."`;
    } else if (commonRoadmap) {
      roadmapText = ` ${profileUser.name} is using several roadmaps including "${commonRoadmap.title}."`;
    } else {
      roadmapText = ` ${profileUser.name} is using several roadmaps.`;
    }
    
    return baseText + roadmapText;
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

  // Map proficiency string to star count
  const getProficiencyStars = (proficiency: string): number => {
    const mapping: Record<string, number> = {
      'native': 5,
      'fluent': 4,
      'advanced': 3,
      'intermediate': 2,
      'beginner': 1,
    };
    return mapping[proficiency.toLowerCase()] || 1;
  };

  // Check for pending request (CREATE_TEAM or INVITE_TO_TEAM)
  const pendingRequest = currentUser && userId 
    ? getPendingRequest(currentUser.id, userId)
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

          {/* Header Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {profileUser.avatar || profileUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    {age && <span>{age} years old</span>}
                    {age && profileUser.location && <span>•</span>}
                    {profileUser.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profileUser.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!fromRequestFlow && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button 
                          onClick={() => navigate(`/request-team-up/${profileUser.id}`)}
                          disabled={!!pendingRequest}
                        >
                          {pendingRequest ? 'Request Pending' : 'Request to team up'}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {pendingRequest && (
                      <TooltipContent>
                        <p>You've already sent a request to this user. You should receive an answer shortly.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </Card>

          {/* Teams Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground">
                {userTeams.length > 0
                  ? `${profileUser.name} is currently in ${userTeams.length} team(s)`
                  : `${profileUser.name} doesn't have a team yet`}
              </p>
              {userTeams.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTeams(!showTeams)}
                  className="flex items-center gap-1"
                >
                  See teams <ChevronDown className={`w-4 h-4 transition-transform ${showTeams ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </div>
            
            {showTeams && userTeams.length > 0 && (
              <div className="mt-4 space-y-2">
                {userTeams.map((team) => (
                  <Card key={team.id} className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.course}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{team.durationValue} {team.durationType}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 text-center bg-green-600 text-white">
              <div className="text-3xl mb-2">🏆</div>
              <p className="text-2xl font-bold">{userPoints}</p>
              <p className="text-sm">Points</p>
            </Card>
            <Card className="p-6 text-center bg-green-500 text-white">
              <div className="text-3xl mb-2">🎖️</div>
              <p className="text-2xl font-bold">{userBadges}</p>
              <p className="text-sm">Badges</p>
            </Card>
            <Card className="p-6 text-center bg-blue-600 text-white">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-2xl font-bold">{completedUnits}</p>
              <p className="text-sm">Units done</p>
            </Card>
          </div>

          {/* Summary Section */}
          <Card className="p-6 bg-orange-200">
            <h2 className="text-xl font-bold mb-3 text-black">Summary</h2>
            <p className="text-black leading-relaxed">{getSummaryText()}</p>
          </Card>

          {/* Bio Section */}
          {profileUser.bio && (
            <Card className="p-6 bg-purple-200">
              <h2 className="text-xl font-bold mb-3 text-black">Bio</h2>
              <p className="text-black leading-relaxed">{profileUser.bio}</p>
            </Card>
          )}

          {/* Languages Section */}
          {profileUser.languages && profileUser.languages.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Languages</h2>
              <div className="space-y-3">
                {profileUser.languages.map((lang, index) => (
                  <div key={index} className="flex items-center gap-8">
                    <span className="text-foreground min-w-fit">{lang.language}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <img
                          key={star}
                          src={getProficiencyStars(lang.proficiency || '') >= star ? starYellowIcon : starGrayIcon}
                          alt="Star rating"
                          style={{ 
                            width: getProficiencyStars(lang.proficiency || '') >= star ? '38px' : '30px', 
                            height: getProficiencyStars(lang.proficiency || '') >= star ? '38px' : '30px' 
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Goals Section */}
          {profileUser.goal && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Goals</h2>
              <div className="flex items-center gap-3">
                {getGoalIcon(profileUser.goal) && (
                  <img src={getGoalIcon(profileUser.goal)} alt={profileUser.goal} className="w-6 h-6" />
                )}
                <span className="text-foreground">{profileUser.goal}</span>
              </div>
            </Card>
          )}

          {/* Time Commitment Section */}
          {profileUser.weeklyHours && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Time Commitment</h2>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{profileUser.weeklyHours} hours per week</span>
              </div>
            </Card>
          )}

          {/* Communication Preferences Section */}
          {profileUser.communicationMethods && profileUser.communicationMethods.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Communication Preferences</h2>
              <div className="space-y-4">
                {profileUser.communicationMethods.map((method, index) => {
                  const icon = getCommIcon(method);
                  return (
                    <div key={index} className="flex items-center gap-3">
                      {icon && <img src={icon} alt={method} className="w-6 h-6" />}
                      <span className="text-foreground">{method}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Interests Section */}
          {profileUser.interests && profileUser.interests.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profileUser.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-muted rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Availability Section */}
          {profileUser.schedule && (profileUser.schedule.weekdays.length > 0 || profileUser.schedule.weekend.length > 0) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Study Availability</h2>
              <div className="space-y-2">
                {formatAvailability().map((availability, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-blue-500">📅</span>
                    <span className="text-foreground">{availability}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
