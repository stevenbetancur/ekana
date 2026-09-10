import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGamificationContext } from "@/contexts/GamificationContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, ArrowRight, Star, Target, CheckCircle, Trophy, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BioSetupModal } from "@/components/BioSetupModal";

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const { getUserPoints } = useGamificationContext();
  const navigate = useNavigate();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBioSetupModal, setShowBioSetupModal] = useState(false);
  const [courseCode, setCourseCode] = useState("");

  useEffect(() => {
    if (!user) return;
    const key = `ekana_welcome_seen_${user.id}`;
    const seen = localStorage.getItem(key) === "true";
    if (!seen) {
      setShowWelcomeModal(true);
      localStorage.setItem(key, "true");
    }
  }, [user]);

  const handleCourseActivation = () => {
    if (courseCode.length === 7) {
      updateUser({ activeCourse: "Front-end Development Bootcamp" });
      toast.success("Course activated successfully!");
      setShowCourseModal(false);
      setCourseCode("");
    }
  };

  const stats = {
    points: user?.id ? getUserPoints(user.id) : 0,
    badges: 3,
    weekStreak: 5,
    completedUnits: 12
  };

  return (
    <Layout>
      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Welcome to Ekana! 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p>You're all set to start your collaborative learning journey!</p>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => { setShowWelcomeModal(false); navigate('/connect'); }}>
                Find Your First Team
              </Button>
              <Button variant="outline" onClick={() => setShowWelcomeModal(false)}>
                Explore Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Activation Modal */}
      <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activate Your Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.slice(0, 7))}
              placeholder="Enter 7-digit course code"
              className="text-center text-lg tracking-widest"
            />
            <Button 
              onClick={handleCourseActivation} 
              disabled={courseCode.length !== 7}
              className="w-full"
            >
              Activate Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8 p-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </header>

        {/* Main 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My teams - Top Left */}
          <section aria-labelledby="my-teams" className="space-y-3">
            <h2 id="my-teams" className="text-xl font-semibold">My teams</h2>
            {user?.hasActiveTeam && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold">
                          FD
                        </div>
                        <div>
                          <h4 className="font-semibold">Frontend Developers</h4>
                          <p className="text-sm text-gray-600">5 members • React Course</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => navigate('/team/1')}>
                        Enter
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card
              role="button"
              tabIndex={0}
              aria-label="Find a team to study together"
              className="group hover:shadow-lg transition-all cursor-pointer bg-ekana-green-dark text-ekana-white border-transparent rounded-2xl h-32 flex items-center"
              onClick={() => navigate('/connect')}
            >
              <CardContent className="p-6 w-full">
                <div className="flex items-center gap-4">
                  <img
                    src="/lovable-uploads/6f27b728-8be9-46b0-92f9-5a5ef6122e79.png"
                    alt="Find a team emoji-style icon"
                    loading="lazy"
                    className="h-10 w-10"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">Find a team now</h3>
                    <p className="text-sm opacity-90">Search for compatible teammates to learn together</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Explore - Top Right */}
          <section aria-labelledby="explore" className="space-y-3">
            <h2 id="explore" className="text-xl font-semibold">Explore</h2>
            <Card
              role="button"
              tabIndex={0}
              aria-label="Try Ekana Premium for free"
              className="group hover:shadow-lg transition-all cursor-pointer bg-ekana-purple-light text-ekana-white border-transparent rounded-2xl h-32 flex items-center"
              onClick={() => navigate('/premium')}
            >
              <CardContent className="p-6 w-full">
                <div className="flex items-center gap-4">
                  <img
                    src="/lovable-uploads/df9a6658-25e8-4bcd-9b02-901c3d5e2d94.png"
                    alt="Premium jewel icon"
                    loading="lazy"
                    className="h-8 w-8"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">Try Ekana Premium for free</h3>
                    <p className="text-sm opacity-90">Unlock advanced features and AI mentorship</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* My roadmaps - Bottom Left */}
          <section aria-labelledby="my-roadmaps" className="space-y-3">
            <h2 id="my-roadmaps" className="text-xl font-semibold">My roadmaps</h2>
            {user?.activeCourse ? (
              <Card className="bg-gradient-to-r from-primary to-primary/80 border-primary/20 text-primary-foreground cursor-pointer hover:shadow-lg transition-all duration-300 h-32 flex items-center" onClick={() => navigate('/courses')}>
                <CardContent className="p-6 w-full">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg text-white">Front-end developer</h3>
                      <Progress value={0} className="h-2 bg-white/20" />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/90">0% | &gt;&gt; Introduction to HTML</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/90">Get started for</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-semibold text-white">+50</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-white/80" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card
                role="button"
                tabIndex={0}
                aria-label="Find a course to start a roadmap"
                className="group hover:shadow-lg transition-all cursor-pointer bg-ekana-yellow-dark text-ekana-white border-transparent rounded-2xl h-32 flex items-center"
                onClick={() => navigate('/courses')}
              >
                <CardContent className="p-6 w-full">
                  <div className="flex items-center gap-4">
                    <img
                      src="/lovable-uploads/99eddd7c-5fc1-42bd-8ad7-517b23e886f8.png"
                      alt="PC with graduation hat icon"
                      loading="lazy"
                      className="h-8 w-8"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Find a course (or set up your roadmap)</h3>
                      <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
                        Already have a course?
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCourseModal(true);
                          }}
                          aria-label="Activate a course with a code"
                        >
                          Activate it here
                        </Button>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Finish setting up your profile - Bottom Right */}
          {(!user?.bio || !user?.interests) ? (
            <section aria-labelledby="finish-profile" className="space-y-3">
              <h2 id="finish-profile" className="text-xl font-semibold">Finish setting up your profile</h2>
              <Card
                role="button"
                tabIndex={0}
                aria-label="Complete your profile"
                className="group hover:shadow-lg transition-all cursor-pointer bg-ekana-blue-light text-ekana-white border-transparent rounded-2xl h-32 flex items-center"
                onClick={() => setShowBioSetupModal(true)}
              >
                <CardContent className="p-6 w-full">
                  <div className="flex items-center gap-4">
                    <img
                      src="/lovable-uploads/8f8c38e9-7f02-485b-8452-75cb5f393d46.png"
                      alt="Flag icon"
                      loading="lazy"
                      className="h-8 w-8"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">Set your bio, interest & more</h3>
                      <p className="text-sm opacity-90">Complete your profile to get better matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : (
            <div></div>
          )}
        </div>

        {/* Stats Cards - keep at bottom */}
        <section aria-labelledby="stats">
          <h2 id="stats" className="sr-only">Your stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-ekana-white border-ekana-white">
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">{stats.points}</div>
                <p className="text-sm text-gray-600">Points</p>
              </CardContent>
            </Card>
            <Card className="bg-ekana-white border-ekana-white">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">{stats.badges}</div>
                <p className="text-sm text-gray-600">Badges</p>
              </CardContent>
            </Card>
            <Card className="bg-ekana-white border-ekana-white">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">{stats.weekStreak}</div>
                <p className="text-sm text-gray-600">Week Streak</p>
              </CardContent>
            </Card>
            <Card className="bg-ekana-white border-ekana-white">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-black">{stats.completedUnits}</div>
                <p className="text-sm text-gray-600">Lessons</p>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>

      {/* Bio Setup Modal */}
      <BioSetupModal 
        open={showBioSetupModal} 
        onOpenChange={setShowBioSetupModal}
        onComplete={() => {
          // Force re-render to hide the profile setup card
          window.location.reload();
        }}
      />
    </Layout>
  );
};

export default Dashboard;
