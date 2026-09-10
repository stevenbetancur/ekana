import { useState } from "react";
import { Message as MessageType } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reply } from "lucide-react";
import MessageActionsDropdown from "./MessageActionsDropdown";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  [key: string]: any;
}

interface MessageProps {
  message: MessageType;
  currentUser: User;
  sender: User;
  threadReplies: MessageType[];
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  readOnly?: boolean;
}

const Message = ({
  message,
  currentUser,
  sender,
  threadReplies,
  onReply,
  onEdit,
  onDelete,
  readOnly = false,
}: MessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleAction = (action: 'edit' | 'delete' | 'flag', messageId: string) => {
    switch (action) {
      case 'edit':
        setIsEditing(true);
        break;
      case 'delete':
        onDelete?.(messageId);
        break;
      case 'flag':
        toast.info('Comment flagged for review');
        break;
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit?.(message.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-3 group">
        <Avatar className="h-8 w-8">
          {sender?.avatar && <AvatarImage src={sender.avatar} alt={sender?.name} />}
          <AvatarFallback>
            {sender?.name.split(' ').map(n => n[0]).join('') || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm">{sender?.name}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {message.handle && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                @{message.handle}
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="text-sm"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm">{message.text}</p>
              
              {/* Show thread reply count */}
              {!readOnly && threadReplies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => onReply?.(message.id)}
                >
                  {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
                </Button>
              )}
            </>
          )}
        </div>
        {!isEditing && !readOnly && (
          <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onReply?.(message.id)}
            >
              <Reply className="h-3 w-3" />
            </Button>
            <MessageActionsDropdown
              message={message}
              currentUser={currentUser}
              onAction={handleAction}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
