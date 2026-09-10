import { useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useMockData";
import { Request } from "@/contexts/RequestContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface RequestCardProps {
  request: Request;
}

const RequestCard = ({ request }: RequestCardProps) => {
  const navigate = useNavigate();
  const sender = useUser(request.senderId);

  const handleClick = () => {
    navigate(`/collaboration-preview/${request.id}`);
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const getRequestSummary = () => {
    switch (request.type) {
      case "CREATE_TEAM":
        return `wants to form a new team "${request.newTeamName}"`;
      case "INVITE_TO_TEAM":
        return "wants you to join their team";
      case "REQUEST_TO_JOIN":
        return "wants to join your team";
      default:
        return "sent you a team request";
    }
  };

  const getMessagePreview = () => {
    if (!request.message) return null;
    const maxLength = 80;
    return request.message.length > maxLength
      ? `${request.message.substring(0, maxLength)}...`
      : request.message;
  };

  const senderFirstName = sender?.name?.split(" ")[0] || "User";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {sender?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-semibold text-base">{sender?.name || "Unknown User"}</h3>
                <p className="text-sm text-muted-foreground font-bold">{getRequestSummary()}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {getTimeAgo(request.createdAt)}
              </span>
            </div>

            {getMessagePreview() && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {getMessagePreview()}
              </p>
            )}

            <Button
              type="button"
              variant="default"
              size="sm"
              className="mt-3"
              onClick={handleClick}
            >
              Reply to {senderFirstName}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;
