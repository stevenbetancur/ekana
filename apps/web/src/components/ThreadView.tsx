import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { X, Send, Star, ChevronLeft } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { mockUsers } from "@/lib/mockData";
import { toast } from "sonner";

interface ThreadViewProps {
  parentMessageId: string;
  teamId: string;
  onClose: () => void;
}

const ThreadView = ({ parentMessageId, teamId, onClose }: ThreadViewProps) => {
  const { user } = useAuth();
  const { messages, getThreadMessages, sendMessage, markBestResponse } = useChatContext();
  const [replyText, setReplyText] = useState("");

  // Get the parent message
  const parentMessage = messages.find(msg => msg.id === parentMessageId);
  const parentUser = mockUsers.find(u => u.id === parentMessage?.userId);

  // Get all replies to this thread
  const threadMessages = getThreadMessages(parentMessageId);

  const handleSendReply = () => {
    if (replyText.trim()) {
      sendMessage({ userId: user?.id || '', text: replyText, teamId, threadId: parentMessageId });
      setReplyText("");
    }
  };

  const handleMarkBestResponse = (replyId: string) => {
    markBestResponse(parentMessageId, replyId);
    toast.success("Marked as best response!");
  };

  const isOriginalPoster = parentMessage?.userId === user?.id;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg flex flex-col z-50">
      {/* Thread Header */}
      <div className="bg-ekana-purple-dark text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">Thread</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Parent Message */}
      {parentMessage && parentUser && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {parentUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-sm">{parentUser.name}</span>
                {parentMessage.handle && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    {parentMessage.handle}
                  </span>
                )}
              </div>
              <p className="text-sm">{parentMessage.text}</p>
              <span className="text-xs text-gray-500">
                {new Date(parentMessage.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Thread Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {threadMessages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No replies yet. Be the first to respond!
          </div>
        ) : (
          threadMessages.map(reply => {
              const replyUser = mockUsers.find(u => u.id === reply.userId);
              const isBestResponse = parentMessage?.bestResponseId === reply.id;
              const isReplyFromCurrentUser = reply.userId === user?.id;
              
              return (
                <Card key={reply.id} className={`p-3 ${isBestResponse ? 'border-yellow-400 bg-yellow-50' : ''}`}>
                  <div className="flex items-start space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {replyUser?.name.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-xs">{replyUser?.name}</span>
                          {isBestResponse && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {isOriginalPoster && !isBestResponse && !isReplyFromCurrentUser && parentMessage?.handle && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleMarkBestResponse(reply.id)}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Best response
                          </Button>
                        )}
                      </div>
                    <p className="text-xs">{reply.text}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(reply.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to thread..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
            className="flex-1"
          />
          <Button onClick={handleSendReply} disabled={!replyText.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
