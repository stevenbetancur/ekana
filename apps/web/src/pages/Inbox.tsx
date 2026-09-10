import { useAuth } from "@/contexts/AuthContext";
import { useRequestContext } from "@/contexts/RequestContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Flag, MessageSquare } from "lucide-react";
import RequestCard from "@/components/cards/RequestCard";

const Inbox = () => {
  const { user } = useAuth();
  const { getUserRequests } = useRequestContext();
  const navigate = useNavigate();

  // Get pending requests for current user (latest first)
  const userRequests = user ? getUserRequests(user.id).reverse() : [];

  // Mock direct messages (keeping for now as they're separate from team requests)
  const directMessages = [
    {
      id: 1,
      senderName: "James Swift",
      teamCommon: 1,
      badges: 1,
      message: "Hey would love to connect regarding the course that you are doing on AI. I've also got a background on Biology and I think...",
      timeAgo: "1d",
      avatar: "JS",
      unreadCount: 2
    },
    {
      id: 2, 
      senderName: "James Swift",
      teamCommon: 1,
      badges: 1,
      message: "Hey would love to connect regarding the course that you are doing on AI. I've also got a background on Biology and I think...",
      timeAgo: "1d",
      avatar: "JS",
      unreadCount: 0
    },
    {
      id: 3,
      senderName: "James Swift", 
      teamCommon: 1,
      badges: 1,
      message: "Hey would love to connect regarding the course that you are doing on AI. I've also got a background on Biology and I think...",
      timeAgo: "1d",
      avatar: "JS",
      unreadCount: 0
    }
  ];

  // Calculate notification counts
  const activeRequestsCount = userRequests.length;
  const unreadMessagesCount = directMessages.filter(message => message.unreadCount > 0).length;

  return (
    <Layout>
      <div className="space-y-6 bg-ekana-white-bg min-h-screen p-6">
        <div>
          <h1 className="text-2xl font-bold">Inbox ({activeRequestsCount + unreadMessagesCount})</h1>
        </div>

        {/* Toggle between Requests and Direct Messages */}
        <Tabs defaultValue="requests" className="w-full">
          <div className="flex justify-start mb-6">
            <TabsList className="grid w-auto grid-cols-2 bg-gray-100 rounded-lg p-1">
              <TabsTrigger 
                value="requests"
                className="rounded-md bg-muted text-foreground data-[state=active]:!bg-secondary data-[state=active]:!text-white px-6"
              >
                Requests {activeRequestsCount > 0 && `(${activeRequestsCount})`}
              </TabsTrigger>
              <TabsTrigger 
                value="direct-messages"
                className="rounded-md bg-muted text-foreground data-[state=active]:!bg-secondary data-[state=active]:!text-white px-6"
              >
                Direct Messages {unreadMessagesCount > 0 && `(${unreadMessagesCount})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="space-y-4">
            {userRequests.length === 0 ? (
              <Card className="bg-ekana-white">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No new requests at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              userRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="direct-messages" className="space-y-4">
            {directMessages.map(message => (
              <Card key={message.id} className="hover:shadow-md transition-shadow bg-ekana-white">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-500 text-white font-semibold">
                        {message.avatar}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      {/* Header with sender and time */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{message.senderName}</h3>
                          <Flag className="h-4 w-4 text-orange-500" />
                          {message.unreadCount > 0 && (
                            <Badge variant="destructive" className="bg-red-500 text-white">
                              {message.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{message.timeAgo}</span>
                        </div>
                      </div>

                      {/* Team info */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span className="text-gray-600">{message.teamCommon} team in common</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            {message.badges} Badge
                          </Badge>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {message.message}
                      </p>

                      {/* Action button */}
                      <div className="pt-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => navigate(`/direct-message/${message.id}`)}
                        >
                          Reply to {message.senderName.split(' ')[0]}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Inbox;