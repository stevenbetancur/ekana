import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookX, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface EmptyStateNotEnrolledProps {
  roadmapTitle: string;
}

const EmptyStateNotEnrolled = ({ roadmapTitle }: EmptyStateNotEnrolledProps) => {
  const navigate = useNavigate();
  const { teamId } = useParams();

  const handleBackNavigation = () => {
    if (teamId) {
      navigate(`/team/${teamId}`);
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Purple Team Header */}
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
              <BookX className="h-16 w-16 text-muted-foreground" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-4">Not Enrolled</h2>
          <div className="mb-8 space-y-2">
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              You are not currently enrolled in <strong className="text-foreground">{roadmapTitle}</strong>.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Visit the courses page to re-enroll or copy this roadmap to your personal collection.
            </p>
          </div>
          
            <Button 
              onClick={() => navigate('/courses')}
              className="gap-2"
            >
              Browse Courses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmptyStateNotEnrolled;
