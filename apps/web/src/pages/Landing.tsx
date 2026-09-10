
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Brain, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Only redirect if user exists and we have a navigate function
    if (user && navigate) {
      if (!user.profileComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleNavigation = (path: string) => {
    if (navigate) {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark" style={{'--primary-dark': 'hsl(262 83% 48%)'} as any}>
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center">
        <div className="text-white text-2xl font-bold">Ekana</div>
        <Button 
          variant="outline" 
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => handleNavigation('/auth')}
        >
          Log In
        </Button>
      </nav>

      {/* Hero Section */}
      <div className="px-6 py-12 text-center text-white max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Learn Together,
          <br />
          <span className="text-yellow-300">Achieve More</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100">
          Join small peer-learning teams and boost your success with collaborative study, 
          gamification, and AI mentorship.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="bg-ekana-orange-dark text-white hover:bg-ekana-orange-light font-semibold"
            onClick={() => handleNavigation('/auth')}
          >
            Find your team now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            onClick={() => handleNavigation('/auth')}
          >
            Sign up now for free
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Collaborative Learning</h3>
              <p className="text-blue-100">Join 2-6 member teams matched by your learning goals and preferences</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gamification</h3>
              <p className="text-blue-100">Earn points, badges, and compete with your team to stay motivated</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Mentorship</h3>
              <p className="text-blue-100">Get personalized guidance from Ekky AI to optimize your learning path</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 py-12 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-8">Why Ekana Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-yellow-300 mb-2">85%</div>
              <p className="text-lg">Higher completion rates in teams</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-300 mb-2">3x</div>
              <p className="text-lg">Faster learning progress</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-300 mb-2">92%</div>
              <p className="text-lg">User satisfaction rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
