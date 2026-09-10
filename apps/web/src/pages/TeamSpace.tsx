import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import MentionPopup from "@/components/MentionPopup";
import ThreadView from "@/components/ThreadView";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import Message from "@/components/chat/Message";
import { mockUsers } from "@/lib/mockData";

const TeamSpace = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const { getTeamMessages, sendMessage, getThreadMessages, markAsRead, editMessage, deleteMessage } = useChatContext();
  const { team, setShowPointsModal, setPointsAwarded } = useOutletContext<any>();
  const [message, setMessage] = useState("");
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionPopupPosition, setMentionPopupPosition] = useState({ x: 0, y: 0 });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputCardRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const isUserScrollingRef = useRef(false);

  // Get messages from ChatContext
  const currentMessages = teamId ? getTeamMessages(teamId) : [];
  const messageCount = currentMessages.length;

  // Mark messages as read when viewing the chat
  useEffect(() => {
    if (teamId) {
      markAsRead(teamId);
    }
  }, [teamId, markAsRead]);

  // Scroll to bottom on initial load or team change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    isUserScrollingRef.current = false;
  }, [teamId]);

  // Detect manual scrolling
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom > 150) {
        isUserScrollingRef.current = true;
      } else if (distanceFromBottom < 50) {
        isUserScrollingRef.current = false;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll only if user hasn't manually scrolled up
  useEffect(() => {
    if (!isUserScrollingRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageCount]);


  // Handle message input change and detect @ mentions
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Find the last @ in the message
    const atIndex = value.lastIndexOf('@');
    
    // Show popup if @ exists and there's no space after it
    if (atIndex !== -1) {
      const afterAt = value.substring(atIndex + 1);
      const hasSpaceAfter = afterAt.includes(' ');
      
      if (!hasSpaceAfter) {
        const card = inputCardRef.current;
        if (card) {
          const rect = card.getBoundingClientRect();
          setMentionPopupPosition({
            x: rect.left,
            y: rect.top
          });
          setShowMentionPopup(true);
        }
      } else {
        setShowMentionPopup(false);
      }
    } else {
      setShowMentionPopup(false);
    }
  };

  // Get the query after @ for filtering
  const atIndex = message.lastIndexOf('@');
  const query = atIndex !== -1 ? message.substring(atIndex + 1) : '';

  // Handle mention option selection
  const handleMentionSelect = (handleText: string) => {
    // Replace from @ to end of query with the selected handle and add a space
    const beforeAt = message.substring(0, atIndex);
    const newMessage = beforeAt + handleText + ' ';
    setMessage(newMessage);
    setShowMentionPopup(false);
    
    // Focus back on input and set cursor to end
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newMessage.length, newMessage.length);
      }
    }, 0);
  };

  // Close mention popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMentionPopup && inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowMentionPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionPopup]);


  const handleSendMessage = () => {
    if (message.trim() && teamId) {
      const hasHandle = message.includes('@question') || message.includes('@motivation') || message.includes('@exercise') || message.includes('@support');
      
      if (hasHandle) {
        setPointsAwarded(5);
        setShowPointsModal(true);
      }
      
      // Send message using ChatContext
      sendMessage({ userId: user?.id || '', text: message, teamId });
      setMessage("");
    }
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    editMessage(messageId, newText);
  };
  
  const handleDeleteMessage = (messageId: string) => {
    setDeletingMessageId(messageId);
  };
  
  const confirmDelete = () => {
    if (deletingMessageId) {
      deleteMessage(deletingMessageId);
      setDeletingMessageId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mention Popup */}
      <MentionPopup
        isOpen={showMentionPopup}
        query={query}
        position={mentionPopupPosition}
        onSelect={handleMentionSelect}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={confirmDelete}
        title="Delete Message?"
        description="This action cannot be undone."
      />

      {/* Header - Sticky */}
      <div className="bg-ekana-purple-dark border-b px-4 h-[75px] sticky top-0 z-10 flex-shrink-0 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <h2 className="font-semibold text-ekana-white"># Welcome to Team</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-ekana-white/80">{team?.members?.length || 0} members</span>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onClick={() => activeThreadId && setActiveThreadId(null)}
      >
        {currentMessages.map(msg => {
          const msgUser = mockUsers.find(u => u.id === msg.userId);
          const threadReplies = getThreadMessages(msg.id);
          
          return (
            <Message
              key={msg.id}
              message={msg}
              currentUser={user || { id: '', name: '' }}
              sender={msgUser || { id: '', name: 'Unknown' }}
              threadReplies={threadReplies}
              onReply={setActiveThreadId}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Sticky at bottom */}
      <div ref={inputCardRef} className="bg-white border-t p-4 sticky bottom-0 flex-shrink-0">
        <div className="flex space-x-3">
          <Input
            ref={inputRef}
            value={message}
            onChange={handleMessageChange}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            onClick={() => activeThreadId && setActiveThreadId(null)}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thread View - Conditionally rendered */}
      {activeThreadId && teamId && (
        <ThreadView
          parentMessageId={activeThreadId}
          teamId={teamId}
          onClose={() => setActiveThreadId(null)}
        />
      )}
    </div>
  );
};

export default TeamSpace;