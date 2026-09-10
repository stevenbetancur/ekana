import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus, ArrowLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate, useParams } from "react-router-dom";

interface EmptyStateNoRoadmapProps {
  isAdmin: boolean;
  onChooseRoadmap?: () => void;
}

const EmptyStateNoRoadmap = ({ isAdmin }: EmptyStateNoRoadmapProps) => {
  const navigate = useNavigate();
  const { teamId } = useParams();

  const handleBackNavigation = () => {
    if (teamId) {
      navigate(`/team/${teamId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Purple Header Bar */}
      <div className="bg-ekana-purple-dark border-b p-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-ekana-white hover:bg-ekana-purple-light p-1"
            onClick={handleBackNavigation}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-ekana-white">Team Roadmap</h2>
        </div>
      </div>

      {/* Empty State Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
        <Card className="max-w-lg w-full border-border shadow-sm">
          <CardContent className="pt-16 pb-16 px-8 text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">No Active Roadmap</h2>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            This team doesn't have an active roadmap yet.
            {isAdmin 
              ? " As a team admin, you'll be able to choose a roadmap to get your team started." 
              : " Please wait for your team admin to select a roadmap."}
          </p>
          
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button 
                      disabled
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Choose Roadmap
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default EmptyStateNoRoadmap;
