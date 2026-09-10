import { Message } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface User {
  id: string;
  [key: string]: any;
}

interface MessageActionsDropdownProps {
  message: Message;
  currentUser: User;
  onAction: (action: 'edit' | 'delete' | 'flag', messageId: string) => void;
}

const MessageActionsDropdown = ({ 
  message, 
  currentUser, 
  onAction 
}: MessageActionsDropdownProps) => {
  const isAuthor = currentUser.id === message.userId;
  const messageAge = new Date().getTime() - new Date(message.timestamp).getTime();
  const isEditable = messageAge < 24 * 60 * 60 * 1000; // Less than 24 hours old

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isAuthor ? (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem
                      disabled={!isEditable}
                      onClick={() => onAction('edit', message.id)}
                      className={!isEditable ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Edit
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                {!isEditable && (
                  <TooltipContent>
                    <p>Can only edit messages sent within 24 hours</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuItem
              onClick={() => onAction('delete', message.id)}
              className="text-red-600 focus:text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => onAction('flag', message.id)}>
            Flag comment
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageActionsDropdown;
