import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, MapPin, Users, User, MessageSquare, Clock, Globe, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FilterModal } from "@/components/FilterModal";
import SendTeamRequestModal from "@/components/SendTeamRequestModal";
import { useAllTeams, useAllUsers, useAllUsersLoading } from "../hooks/useMockData";
import { useTeamContext } from "@/contexts/TeamContext";
import ConnectCard, { type UserData, type TeamData } from "@/components/cards/ConnectCard";

const Connect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationUpgrade, setShowLocationUpgrade] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    levels: [],
    languages: [],
    goals: [],
    minHours: [2],
    location: ""
  });

  const allUsers = useAllUsers();
  const isLoadingUsers = useAllUsersLoading();
  const allTeams = useAllTeams();
  const { teamMembers } = useTeamContext();

  // Filter out current user and only show users they're not already teamed with
  const users = allUsers.filter(u => u.id !== user?.id);

  // Filter out teams the current user is already a member of and teams with no spots left
  const teams = allTeams.filter(team => {
    if (!user) return true;
    
    // Check if user is already a member
    const isAlreadyMember = teamMembers.some(tm => tm.teamId === team.id && tm.userId === user.id);
    if (isAlreadyMember) return false;
    
    // Check if team has spots remaining
    const currentMemberCount = teamMembers.filter(tm => tm.teamId === team.id).length;
    const spotsRemaining = (team.maxMembers || 0) - currentMemberCount;
    
    return spotsRemaining >= 1;
  });

  // Transform mock data for ConnectCard component
  const transformUserData = (user: typeof users[0]): UserData => ({
    name: user.name,
    avatarUrl: user.avatar || user.name.split(' ').map(n => n[0]).join(''),
    level: user.level || 'Beginner',
    weeklyCommitment: `${user.weeklyHours || 0}h/week`,
    languages: user.languages?.map(lang => typeof lang === 'string' ? lang : lang.language) || ['English'],
    location: user.location || 'Not specified',
    goal: user.goal || 'Learn new skills',
    isPremium: user.isPremium
  });
  
  const transformTeamData = (team: typeof teams[0]): TeamData => {
    const teamMemberCount = Math.floor(Math.random() * 5) + 1; // Mock member count
    return {
      name: team.name,
      avatarUrl: team.avatar,
      memberCount: teamMemberCount,
      level: team.teamLevel === 'aggregate' 
        ? 'Mixed Levels' 
        : Array.isArray(team.teamLevel) 
          ? team.teamLevel.join(', ') 
          : team.teamLevel,
      weeklyCommitment: team.timeCommitments === 'aggregate' ? 'Mixed' : team.timeCommitments,
      languages: team.languages === 'aggregate' 
        ? ['Mixed Languages'] 
        : Array.isArray(team.languages)
          ? team.languages
          : [team.languages],
      location: 'Remote'
    };
  };

  const handleLocationSearch = () => {
    if (!user?.isPremium) {
      setShowLocationUpgrade(true);
    } else {
      setShowFilterModal(true);
    }
  };

  const handleSendTeamRequest = (teamId: number | null, message: string, isNewTeam: boolean) => {
    if (isNewTeam) {
      toast.success("New team request sent successfully!");
    } else {
      toast.success("Team invitation sent successfully!");
    }
    setShowRequestModal(false);
  };

  const handleUserAction = (user: typeof users[0]) => {
    navigate("/team-request", { state: { selectedUser: user } });
  };

  const handleTeamAction = (team: typeof teams[0]) => {
    navigate("/team-join-request", { state: { selectedTeam: team } });
  };

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters);
  };

  const renderFilterBadges = () => {
    const badges = [];

    // Individual level badges
    activeFilters.levels.forEach(level => {
      badges.push(
        <FilterModal key={`level-${level}`} onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            {level}
          </Badge>
        </FilterModal>
      );
    });

    // Individual language badges
    activeFilters.languages.forEach(language => {
      badges.push(
        <FilterModal key={`language-${language}`} onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            {language}
          </Badge>
        </FilterModal>
      );
    });

    // Individual goal badges
    activeFilters.goals.forEach(goal => {
      badges.push(
        <FilterModal key={`goal-${goal}`} onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            {goal}
          </Badge>
        </FilterModal>
      );
    });

    // Location badge
    if (activeFilters.location) {
      badges.push(
        <FilterModal key="location" onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            Location: {activeFilters.location}
          </Badge>
        </FilterModal>
      );
    }

    // Time commitment badge
    badges.push(
      <FilterModal key="time-commitment" onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
          Min {activeFilters.minHours[0]}h commitment
        </Badge>
      </FilterModal>
    );

    // Default badges when no filters are selected
    if (activeFilters.levels.length === 0) {
      badges.push(
        <FilterModal key="all-levels" onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">All Levels</Badge>
        </FilterModal>
      );
    }

    if (activeFilters.languages.length === 0) {
      badges.push(
        <FilterModal key="any-language" onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Any Language</Badge>
        </FilterModal>
      );
    }

    if (activeFilters.goals.length === 0) {
      badges.push(
        <FilterModal key="any-goal" onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Any Goal</Badge>
        </FilterModal>
      );
    }

    // More Filters badge
    badges.push(
      <FilterModal key="more-filters" onFiltersChange={handleFiltersChange} currentFilters={activeFilters}>
        <Badge variant="outline" className="cursor-pointer hover:bg-accent">+ More Filters</Badge>
      </FilterModal>
    );

    return badges;
  };

  return (
    <Layout>
      {/* Premium Location Upgrade Modal */}
      <Dialog open={showLocationUpgrade} onOpenChange={setShowLocationUpgrade}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">✨ Premium Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
              <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Find Learning Partners Near You</h3>
              <p className="text-sm text-gray-600 mb-4">Enable location-based search to connect with learners in your area</p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>More than 12 requests a day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Location-based search</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Official member badge</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>AI learning coach</span>
                </li>
              </ul>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Team Request Modal */}
      <SendTeamRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        userName={selectedUser?.name || ""}
        onSend={handleSendTeamRequest}
      />

      <div className="space-y-6 bg-ekana-white-bg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Connect with Learners
              <img 
                src="/lovable-uploads/ce70f5ff-d7f9-4545-ab11-5bf67c0821b8.png" 
                alt="handshake with lightbulb" 
                className="h-7 w-7"
              />
            </h1>
            <p className="text-gray-600">Find your perfect study partners and teams</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by course, keywords..."
                    className="pl-10"
                  />
                </div>
              </div>
              <FilterModal 
                onFiltersChange={handleFiltersChange} 
                currentFilters={activeFilters}
                isOpen={showFilterModal}
                onOpenChange={setShowFilterModal}
              >
                <Button onClick={handleLocationSearch} variant="outline" className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                  {!user?.isPremium && <Crown className="h-3 w-3 text-orange-500" />}
                </Button>
              </FilterModal>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {renderFilterBadges()}
            </div>
          </CardContent>
        </Card>

        {/* Search Results Tabs */}
        <Tabs defaultValue="individuals">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
            <TabsTrigger 
              value="individuals" 
              className="rounded-md bg-muted text-foreground data-[state=active]:!bg-secondary data-[state=active]:!text-white"
            >
              Individuals
            </TabsTrigger>
            <TabsTrigger 
              value="teams" 
              className="rounded-md bg-muted text-foreground data-[state=active]:!bg-secondary data-[state=active]:!text-white"
            >
              Teams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individuals" className="space-y-4">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Recommended for You</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.slice(0, 3).map(user => (
                      <ConnectCard
                        key={user.id}
                        type="user"
                        data={transformUserData(user)}
                        user={user}
                        onAction={() => handleUserAction(user)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">All Results</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                      <ConnectCard
                        key={user.id}
                        type="user"
                        data={transformUserData(user)}
                        user={user}
                        onAction={() => handleUserAction(user)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Recommended for You</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {teams.slice(0, 2).map(team => (
                  <ConnectCard
                    key={team.id}
                    type="team"
                    data={transformTeamData(team)}
                    team={team}
                    onAction={() => handleTeamAction(team)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">All Results</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {teams.map(team => (
                  <ConnectCard
                    key={team.id}
                    type="team"
                    data={transformTeamData(team)}
                    team={team}
                    onAction={() => handleTeamAction(team)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Connect;
