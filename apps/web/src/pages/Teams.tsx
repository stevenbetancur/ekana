
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useTeamGoalProgress } from "@/hooks/useTeamGoalProgress";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, ArrowRight, Calendar, Target, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Teams = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { getUserTeams, getCurrentTeamGoal, isLoading } = useTeamContext();

  // Get user's teams dynamically from TeamContext (now fetched from Supabase)
  const userTeams = getUserTeams(currentUser?.id || '');

  // Component to render a single team card with dynamic progress
  const TeamCard = ({ team }: { team: any }) => {
    const currentGoal = getCurrentTeamGoal(team.id);
    const { totalProgress } = useTeamGoalProgress(team.id, currentGoal);

    return (
      <Card key={team.id} className="hover:shadow-md transition-shadow max-w-[580px]">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {team.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold break-words">{team.name}</h3>
                <p className="text-sm text-gray-600 truncate">{team.course}</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 5) + 1}/{team.maxMembers} members
                  </span>
                  <Badge variant="outline" className="text-xs">You're admin</Badge>
                  <span className="text-xs text-gray-400">Last active {team.lastActive}</span>
                </div>
              </div>
            </div>
            <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate(`/team/${team.id}`)}>
              Enter Team
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs font-medium">Progress</p>
                <p className="text-base font-semibold">{Math.round(totalProgress)}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium">Members</p>
                <p className="text-base font-semibold">{Math.floor(Math.random() * 5) + 1}</p>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Course Progress</span>
              <span className="text-xs text-gray-600">{Math.round(totalProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Your Teams
              <img 
                src="/lovable-uploads/67f86ffa-a0b8-4847-b4e0-0b4f2d5904bd.png" 
                alt="team avatars" 
                className="h-6 w-6"
              />
            </h1>
            <p className="text-gray-600">Manage your learning teams and collaborate</p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => navigate('/connect')}>
            <Plus className="h-4 w-4 mr-2" />
            Find Teams
          </Button>
        </div>

        {/* Quick Stats - Moved to top */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Target className="h-5 w-5 text-green-500 mx-auto mb-2" />
              <div className="text-xl font-bold">2</div>
              <p className="text-xs text-gray-600">Active Teams</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
              <div className="text-xl font-bold">7</div>
              <p className="text-xs text-gray-600">Team Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-2" />
              <div className="text-xl font-bold">53%</div>
              <p className="text-xs text-gray-600">Avg Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Calendar className="h-5 w-5 text-orange-500 mx-auto mb-2" />
              <div className="text-xl font-bold">5</div>
              <p className="text-xs text-gray-600">Days Streak</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="text-center py-10">
              <div className="h-14 w-14 mx-auto mb-3 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Loading Teams...</h3>
              <p className="text-gray-600">Fetching your teams from the database</p>
            </CardContent>
          </Card>
        ) : userTeams.length > 0 ? (
          <div className="grid gap-5">
            {userTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-10">
              <Users className="h-14 w-14 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
              <p className="text-gray-600 mb-5">
                Join or create your first learning team to start collaborating with peers
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="w-full sm:w-auto" onClick={() => navigate('/connect')}>
                  Find Existing Teams
                </Button>
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => navigate('/connect')}>
                  Create New Team
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Teams;
