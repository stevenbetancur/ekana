import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RoadmapCreationSuccessModalProps {
  roadmapId: string | null;
  roadmapTitle: string;
  onClose: () => void;
}

export const RoadmapCreationSuccessModal = ({ roadmapId, roadmapTitle, onClose }: RoadmapCreationSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewRoadmap = () => {
    if (roadmapId) {
      navigate(`/roadmap/${roadmapId}`);
      onClose();
    }
  };

  const handleStayOnConnect = () => {
    onClose();
  };

  return (
    <Dialog open={!!roadmapId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Success! 🎉</DialogTitle>
          <DialogDescription className="text-center pt-4 text-base">
            You've successfully created <span className="font-semibold">{roadmapTitle}</span>.
            Start finding teammates to learn with!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={handleViewRoadmap} size="lg" className="w-full">
            View Roadmap
          </Button>
          <Button onClick={handleStayOnConnect} variant="ghost" size="sm" className="w-full text-muted-foreground">
            Find teammates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
