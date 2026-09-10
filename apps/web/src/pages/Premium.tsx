
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, MapPin, Users, Bot, Star, Zap } from "lucide-react";
import { toast } from "sonner";

const Premium = () => {
  const { user, updateUser } = useAuth();

  const handleUpgrade = () => {
    updateUser({ isPremium: true });
    toast.success("Welcome to Ekana Premium! 🎉");
  };

  const features = [
    {
      icon: Users,
      title: "Find your learning mates faster",
      description: "More than 12 requests a day",
      current: "3 requests/day",
      premium: "Unlimited requests"
    },
    {
      icon: MapPin,
      title: "Find learning partners near you",
      description: "Enable location-based search",
      current: "Global search only",
      premium: "Location search"
    },
    {
      icon: Star,
      title: "Become more visible",
      description: "Obtain an 'official member' medal",
      current: "Standard profile",
      premium: "Premium badge"
    },
    {
      icon: Bot,
      title: "Turbo charge your learning with AI",
      description: "Use Ekky AI to coach your learning",
      current: "No AI access",
      premium: "Full AI coach"
    },
  ];

  if (user?.isPremium) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-full mb-4">
              <Crown className="h-5 w-5" />
              <span className="font-semibold">Premium Member</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">You're all set! ✨</h1>
            <p className="text-gray-600">Enjoy all the premium features to accelerate your learning</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                    <Check className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                  <div className="text-sm">
                    <Badge className="bg-orange-500">Active: {feature.premium}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Premium Benefits Unlocked</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">∞</div>
                  <p className="font-semibold">Unlimited Requests</p>
                  <p className="text-sm text-gray-600">Connect with anyone, anytime</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">🌍</div>
                  <p className="font-semibold">Global + Local Search</p>
                  <p className="text-sm text-gray-600">Find nearby study partners</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">🤖</div>
                  <p className="font-semibold">AI Learning Coach</p>
                  <p className="text-sm text-gray-600">Personalized guidance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Accelerate Your Learning Journey</h1>
          <p className="text-xl text-gray-600 mb-6">
            Unlock premium features to connect faster and learn smarter
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-center">Monthly</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold mb-2">$12</div>
              <div className="text-gray-600 mb-4">per month</div>
              <Button onClick={handleUpgrade} className="w-full">
                Choose Plan
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-orange-300 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-orange-500">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-center">Quarterly</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold mb-2">$26</div>
              <div className="text-gray-600 mb-4">per month</div>
              <Button onClick={handleUpgrade} className="w-full">
                Choose Plan
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-center">Annual</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold mb-2">$86</div>
              <div className="text-gray-600 mb-4">per month</div>
              <Button onClick={handleUpgrade} className="w-full">
                Choose Plan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="text-2xl font-bold text-center mb-6 md:col-span-2">What You Get with Premium</h2>
          
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Free: {feature.current}</div>
                    <Badge className="bg-orange-500">{feature.premium}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social Proof */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-center mb-6">Join 10,000+ Premium Learners</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">3x</div>
                <p className="text-sm">Faster team formation</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
                <p className="text-sm">Course completion rate</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">4.9</div>
                <p className="text-sm">Average rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-orange-500 to-yellow-500 text-white p-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4">Ready to Level Up?</h3>
          <p className="text-lg mb-6">Start your free trial today and experience the difference</p>
          <Button 
            onClick={handleUpgrade}
            size="lg" 
            className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Premium;
