import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, ChevronDown, Lock, Loader2 } from "lucide-react";
import { useRoadmap } from "@/hooks/useMockData";
import { TeamLayoutContext } from "@/layouts/TeamLayout";
import { useChatContext } from "@/contexts/ChatContext";
import { EKKY_AI_ID } from "@/lib/mockData";
import Message from "@/components/chat/Message";

const EkkyAI = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { team, user } = useOutletContext<TeamLayoutContext>();
  const { getDirectMessages, sendMessage } = useChatContext();
  
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);

  // Get the team's current roadmap for unit hydration
  const { roadmap, units } = useRoadmap(team.currentRoadmapId || '');
  
  // Map roadmap units to dropdown format
  const roadmapUnits = units.map(unit => unit.title);
  
  // Set initial selected unit if not already set
  if (!selectedUnit && roadmapUnits.length > 0) {
    setSelectedUnit(roadmapUnits[0]);
  }

  // Fetch messages between user and Ekky AI
  const messages = getDirectMessages(user.id, EKKY_AI_ID);

  // Send welcome message if chat is empty and user is premium
  useEffect(() => {
    if (user?.isPremium && messages.length === 0 && selectedUnit) {
      // Send welcome message from Ekky AI
      const welcomeText = `Hi ${user.name.split(' ')[0]}! I'm ready to help you with ${roadmap?.title || team.course}. Select a unit below to get started.`;
      
      setTimeout(() => {
        sendMessage({
          userId: EKKY_AI_ID,
          receiverId: user.id,
          text: welcomeText,
        });
      }, 500);
    }
  }, [user?.isPremium, messages.length]);

  // Mock AI user for Message component
  const ekkyUser = {
    id: EKKY_AI_ID,
    name: "Ekky AI",
    avatar: "/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png",
  };

  // Premium Access Gate
  if (!user?.isPremium) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
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
              <h2 className="font-semibold text-ekana-white">Ekky AI</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-ekana-white/80">{roadmap?.title || team.course}</span>
            </div>
          </div>
        </div>

        {/* Locked State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Premium Feature</h2>
                <p className="text-gray-600">
                  Ekky AI is a premium feature that provides personalized AI assistance for your learning journey.
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/premium')}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  size="lg"
                >
                  Upgrade to Premium
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/team/${teamId}`)}
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Send user message
      sendMessage({
        userId: user.id,
        receiverId: EKKY_AI_ID,
        text: message,
      });

      const userMessage = message;
      setMessage("");
      
      // Simulate AI typing and response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        
        // Generate context-aware response
        let aiResponse = "";
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes("scenario") || lowerMessage.includes("practice question")) {
          aiResponse = `Here is a scenario-based practice question about ${selectedUnit}:\n\nScenario: You're building a feature that requires ${selectedUnit} knowledge. How would you approach this problem while ensuring best practices and optimal performance?`;
        } else if (lowerMessage.includes("quiz") || lowerMessage.includes("self-test") || lowerMessage.includes("10 questions")) {
          aiResponse = `Here is a 10-question quiz about ${selectedUnit}:\n\n1. What is the primary purpose of ${selectedUnit}?\n2. When should you use ${selectedUnit}?\n3. What are the key concepts in ${selectedUnit}?\n4. How does ${selectedUnit} improve your code?\n5. What are common mistakes with ${selectedUnit}?\n6. How do you debug issues in ${selectedUnit}?\n7. What are best practices for ${selectedUnit}?\n8. How does ${selectedUnit} compare to alternatives?\n9. What performance considerations exist for ${selectedUnit}?\n10. How would you explain ${selectedUnit} to a beginner?`;
        } else {
          aiResponse = `That's a great question about ${selectedUnit}. Here's what I think:\n\n${selectedUnit} is an important concept that requires understanding of its core principles. Let me break this down for you with practical examples and best practices.`;
        }
        
        sendMessage({
          userId: EKKY_AI_ID,
          receiverId: user.id,
          text: aiResponse,
        });
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  const handleUnitSelect = (unit: string) => {
    setSelectedUnit(unit);
    setShowUnitModal(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Unit Selection Modal */}
      <Dialog open={showUnitModal} onOpenChange={setShowUnitModal}>
        <DialogContent className="max-w-lg bg-ekana-white-bg">
          <DialogHeader>
            <DialogTitle className="text-center">Select a Unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {roadmapUnits.map((unit, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left p-3 h-auto"
                onClick={() => handleUnitSelect(unit)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-ekana-purple-dark rounded-full"></div>
                  <span>{unit}</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
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
            <Avatar className="h-8 w-8">
              <AvatarImage src="/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png" alt="Ekky AI" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <h2 className="font-semibold text-ekana-white">Ekky AI</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-ekana-white/80">{roadmap?.title || team.course}</span>
          </div>
        </div>
      </div>

      {/* Chat Content - Using Flexbox */}
      <div className="flex flex-col h-full">
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-start pt-16">
              {/* Ekana Logo Avatar */}
              <div className="mb-4">
                <img 
                  src="/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png" 
                  alt="Ekky AI" 
                  className="h-16 w-16 rounded-lg"
                />
              </div>
              {/* Ekky AI Text */}
              <h3 className="text-lg font-semibold text-gray-800 mb-8">Ekky AI</h3>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const sender = msg.senderId === EKKY_AI_ID ? ekkyUser : user;
                return (
                  <Message
                    key={msg.id}
                    message={msg}
                    currentUser={user}
                    sender={sender}
                    threadReplies={[]}
                    readOnly={true}
                  />
                );
              })}
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Ekky is thinking...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Section - Unit Selection + Prompts + Input */}
        <div className="bg-white border-t p-4 space-y-4 flex flex-col items-center sticky bottom-0 flex-shrink-0">
          {/* Unit Selection Card */}
          <Card 
            className="bg-ekana-cream border-none cursor-pointer hover:bg-ekana-cream/80 transition-colors w-1/2"
            onClick={() => setShowUnitModal(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/lovable-uploads/adbd15e5-8c87-41c7-9475-cb46181612f8.png" 
                    alt="lesson icon" 
                    className="h-6 w-6"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Lesson: {selectedUnit || "Select a unit"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          {/* Pre-made prompts */}
          <div className="flex flex-col sm:flex-row gap-2 w-[70%]">
            <Button
              variant="outline"
              className="bg-ekana-gray-light hover:bg-ekana-gray-light text-gray-700 hover:text-gray-700 border-gray-300 hover:border-gray-500 flex-1"
              onClick={() => handlePromptClick("Generate a scenario-based practice question")}
            >
              Generate a scenario-based practice question
            </Button>
            <Button
              variant="outline"
              className="bg-ekana-gray-light hover:bg-ekana-gray-light text-gray-700 hover:text-gray-700 border-gray-300 hover:border-gray-500 flex-1"
              onClick={() => handlePromptClick("Generate a self-test (10 questions)")}
            >
              Generate a self-test (10 questions)
            </Button>
          </div>

          {/* Chat Input */}
          <div className="flex items-center space-x-2 w-full">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
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

export default EkkyAI;
