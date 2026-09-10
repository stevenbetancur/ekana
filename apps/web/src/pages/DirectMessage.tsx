import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Circle, Users } from "lucide-react";

const DirectMessage = () => {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");

  // Mock contact data based on messageId
  const contact = {
    id: messageId,
    name: "James Swift",
    avatar: "JS",
    isOnline: true,
    location: "Medellín, Colombia",
    badges: 1,
    teamsInCommon: 1
  };

  // Mock chat messages
  const messages = [
    {
      id: 1,
      user: contact.name,
      avatar: contact.avatar,
      message: "Hey would love to connect regarding the course that you are doing on AI. I've also got a background on Biology and I think we could collaborate well!",
      timestamp: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      user: "You",
      avatar: user?.name?.split(' ').map(n => n[0]).join('') || "U",
      message: "Hi James! That sounds great. I'd love to hear more about your Biology background and how it relates to AI.",
      timestamp: "10:35 AM", 
      isOwn: true
    },
    {
      id: 3,
      user: contact.name,
      avatar: contact.avatar,
      message: "Perfect! I've been working on bioinformatics projects and see huge potential in applying machine learning to genomic data analysis.",
      timestamp: "10:37 AM",
      isOwn: false
    },
    {
      id: 4,
      user: "You",
      avatar: user?.name?.split(' ').map(n => n[0]).join('') || "U",
      message: "That's fascinating! Are you familiar with deep learning approaches for protein structure prediction?",
      timestamp: "11:15 AM",
      isOwn: true
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the backend
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-120px)] bg-ekana-white-bg">
        {/* Header */}
        <div className="bg-ekana-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/inbox")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inbox
              </Button>
              
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-500 text-white font-semibold">
                    {contact.avatar}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-semibold text-gray-900">{contact.name}</h1>
                    <div className="flex items-center space-x-1">
                      <Circle 
                        className={`h-2 w-2 fill-current ${
                          contact.isOnline ? "text-green-500" : "text-gray-400"
                        }`} 
                      />
                      <span className={`text-xs ${
                        contact.isOnline ? "text-green-600" : "text-gray-500"
                      }`}>
                        {contact.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{contact.location}</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-orange-500" />
                      <span>{contact.teamsInCommon} team in common</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                      {contact.badges} Badge
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white font-semibold">
                    {msg.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{msg.user}</span>
                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-900">{msg.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-ekana-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Input
              placeholder={`Message ${contact.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-gray-50 border-gray-200 focus:border-blue-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DirectMessage;