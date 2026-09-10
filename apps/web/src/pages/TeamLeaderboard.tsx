import { useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Medal, Award, Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { useTeamGoals } from "@/hooks/useMockData";

interface TeamLayoutContextType {
  team: any;
  user: any;
  setShowPointsModal: (show: boolean) => void;
  setPointsAwarded: (points: number) => void;
}

const TeamLeaderboard = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { team, user } = useOutletContext<TeamLayoutContextType>();
  
  const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
  const [showOtherTeamsModal, setShowOtherTeamsModal] = useState(false);
  
  // Fetch team goals
  const teamGoals = useTeamGoals(teamId);
  const primaryGoal = teamGoals.length > 0 ? teamGoals[0] : null;
  const goalDescription = primaryGoal?.description || "No active goal";

  const otherTeams = [
    { id: 2, name: "Backend Warriors", course: "Node.js & Express", members: 5, totalPoints: 420, badges: 5 },
    { id: 3, name: "UI/UX Masters", course: "Design Systems", members: 4, totalPoints: 380, badges: 4 },
    { id: 4, name: "Data Scientists", course: "Python & ML", members: 6, totalPoints: 350, badges: 3 },
    { id: 5, name: "Mobile Dev Squad", course: "React Native", members: 4, totalPoints: 290, badges: 2 },
    { id: 6, name: "Full Stack Heroes", course: "MERN Stack", members: 5, totalPoints: 275, badges: 4 }
  ];


  // Sort members by points
  const rankedMembers = [...team.members].sort((a, b) => b.points - a.points);
  const totalPoints = team.members.reduce((sum, member) => sum + member.points, 0);
  const teamBadges = 3; // Could be calculated based on team achievements

  const handleCongratulate = (memberName: string) => {
    toast.success(`Congratulations sent to ${memberName}! 🎉`);
  };

  const handleCongratulateTeam = (teamName: string) => {
    toast.success(`Congratulations sent to ${teamName}! 🎉`);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 1:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 2:
        return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
      default:
        return "hover:bg-gray-50";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Goal Details Modal */}
      <Dialog open={showGoalDetailsModal} onOpenChange={setShowGoalDetailsModal}>
        <DialogContent className="max-w-lg bg-ekana-white-bg">
          <DialogHeader>
            <DialogTitle className="text-center">Weekly Goal Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="bg-ekana-green-dark border-none">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/lovable-uploads/67f86ffa-a0b8-4847-b4e0-0b4f2d5904bd.png" 
                      alt="team goal" 
                      className="h-6 w-6"
                    />
                    <p className="text-lg text-ekana-white font-semibold">{goalDescription}</p>
                  </div>
                </div>
                <div className="w-full bg-ekana-green-light/30 rounded-full h-4 mb-2">
                  <div className="bg-ekana-white h-4 rounded-full transition-all duration-300" style={{ width: `${team.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-ekana-white/90">
                  <span className="text-sm">{team.progress}% complete</span>
                  <span className="text-sm">{Math.round((team.progress / 100) * 5)} / 5 units</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Other Teams Modal */}
      <Dialog open={showOtherTeamsModal} onOpenChange={setShowOtherTeamsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-center">Other Teams Leaderboard</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {otherTeams.map((team, index) => (
                <Card key={team.id} className={`cursor-pointer transition-colors ${
                  index < 3 ? getRankColor(index) : "hover:bg-gray-50"
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-600 w-6">
                            {index + 1}.
                          </span>
                          {getRankIcon(index)}
                        </div>
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {team.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-600">{team.course}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900">+{team.totalPoints}</div>
                          <div className="text-sm text-gray-600">{team.members} members</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700">{team.badges}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700 transition-colors"
                          onClick={() => handleCongratulateTeam(team.name)}
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          Congratulate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Page Toolbar */}
      <div className="bg-ekana-purple-dark border-b px-4 h-[75px] sticky top-0 z-10 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-ekana-white hover:bg-ekana-purple-light p-1"
              onClick={() => navigate(`/team/${teamId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="font-semibold text-ekana-white">Team Leaderboard</h2>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setShowOtherTeamsModal(true)}
              className="bg-ekana-green-dark hover:bg-ekana-green-light text-white"
            >
              Other Teams
            </Button>
            <span className="text-sm text-ekana-white/80">{team.course}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 overflow-auto">
            <Card className="max-w-4xl bg-white shadow-lg border-0 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{team.name} Leaderboard</h3>
                      <p className="text-sm text-gray-600">Track your team's progress and celebrate achievements</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">+{totalPoints}</div>
                      <div className="text-sm text-gray-600">Total Points</div>
                    </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <span className="text-xl font-bold text-gray-900">{teamBadges}</span>
                      </div>
                    </div>
                  </div>
                </div>
              
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Rank</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Member</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Unit</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span>Points</span>
                          <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedMembers.map((member, index) => (
                      <TableRow 
                        key={member.id} 
                        className={`border-b last:border-b-0 transition-colors ${getRankColor(index)}`}
                      >
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-700 w-8">
                              {index + 1}
                            </span>
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8 ring-2 ring-gray-200">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium text-xs">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                                {member.isAdmin && (
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <div className={`h-1.5 w-1.5 rounded-full ${member.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                <span className="text-xs text-gray-500">
                                  {member.online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge variant="outline" className="font-medium">
                            Unit {member.currentUnit}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <span className="text-xl font-bold text-gray-900">
                              +{member.points}
                            </span>
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700 transition-colors"
                            onClick={() => handleCongratulate(member.name)}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            Congratulate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
    </div>
  );
};

export default TeamLeaderboard;
