import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Globe, Users, Crown, Target, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User, Team } from "@/lib/mockData";
import { calculateAge } from "@/lib/utils";
import { useAggregatedTeamData, useTeamMembersWithRoles } from "@/hooks/useMockData";

// Type definitions for the card data
interface UserData {
  name: string;
  avatarUrl: string;
  level: string;
  weeklyCommitment: string;
  languages: string[];
  location: string;
  goal: string;
  isPremium?: boolean;
}

interface TeamData {
  name: string;
  avatarUrl: string;
  memberCount: number;
  level: string;
  weeklyCommitment: string;
  languages: string[];
  location: string;
}

interface ConnectCardProps {
  type: 'user' | 'team';
  data: UserData | TeamData;
  user?: User;
  team?: Team;
  onAction: () => void;
}

const ConnectCard = ({ type, data, user, team, onAction }: ConnectCardProps) => {
  const navigate = useNavigate();
  const isUser = type === 'user';
  const userData = isUser ? data as UserData : null;
  const teamData = !isUser ? data as TeamData : null;
  
  const age = user?.birthDate ? calculateAge(user.birthDate) : null;
  
  // Get aggregated team data if this is a team card
  const displayTeam = team ? useAggregatedTeamData(team) : null;
  const teamMembersWithRoles = team ? useTeamMembersWithRoles(team.id) : [];
  const currentMemberCount = teamMembersWithRoles.length;

  return (
    <Card className="hover:shadow-md transition-shadow bg-ekana-white">
      <CardContent className="p-4">
        {isUser ? (
          <>
            {/* User Card Layout */}
            <div className="flex items-start space-x-3 mb-3">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                {data.avatarUrl}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{data.name}, {age}</h4>
                  {userData?.isPremium && (
                    <Crown className="h-4 w-4 text-orange-500 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user?.subject || 'Not specified'}</p>
                <p className="text-sm text-muted-foreground">{data.level}</p>
              </div>
            </div>

            {/* Two-column info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Target className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">{userData?.goal}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">{data.weeklyCommitment}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Globe className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">{data.languages.join(", ")}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">{data.location}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => user && navigate(`/profile/${user.id}`)}
              className="w-full" 
              size="sm"
            >
              See Profile
            </Button>
          </>
        ) : (
          <>
            {/* Team Card Layout */}
            <div className="flex items-start space-x-3 mb-3">
              <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">{data.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const subject = displayTeam?.subject || 'Not specified';
                    if (subject === 'Not specified') return subject;
                    
                    const subjectArray = subject.split(', ');
                    if (subjectArray.length <= 2) return subject;
                    
                    return `${subjectArray.slice(0, 2).join(', ')} and more`;
                  })()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const teamLevel = displayTeam?.teamLevel || 'Not specified';
                    if (teamLevel === 'Not specified') return teamLevel;
                    
                    const levelArray = Array.isArray(teamLevel) 
                      ? teamLevel 
                      : teamLevel.split(', ');
                    if (levelArray.length === 1) return `${levelArray[0]} level`;
                    if (levelArray.length === 2) return `${levelArray.join(' & ')} levels`;
                    return 'All levels';
                  })()}
                </p>
              </div>
            </div>

            {/* Member count */}
            {team && (
              <div className="mb-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span>{currentMemberCount} / {team.maxMembers}</span>
                </div>
              </div>
            )}

            {/* Two-column info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Globe className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">
                    {(() => {
                      const languages = displayTeam?.languages || 'Not specified';
                      if (languages === 'Not specified') return languages;
                      
                      const languageArray = Array.isArray(languages)
                        ? languages
                        : languages.split(', ');
                      if (languageArray.length <= 4) return languageArray.join(', ');
                      
                      return `${languageArray.slice(0, 4).join(', ')} and more`;
                    })()}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">{displayTeam?.timeCommitments || 'Not specified'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">{displayTeam?.location || 'Remote'}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-600 break-words">
                    {(() => {
                      const commPrefs = displayTeam?.communicationPreferences;
                      if (!commPrefs || commPrefs === 'Not specified') return 'Not specified';
                      
                      const prefsArray = Array.isArray(commPrefs)
                        ? commPrefs
                        : [commPrefs];
                      return prefsArray.join(', ');
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => team && navigate(`/team/profile/${team.id}`)}
              className="w-full" 
              size="sm"
            >
              View Team
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectCard;
export type { UserData, TeamData };