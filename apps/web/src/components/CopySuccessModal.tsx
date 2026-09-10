import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CopySuccessModalProps {
  isOpen: boolean;
  roadmapId: string | null;
  roadmapTitle: string;
  onClose: () => void;
}

export const CopySuccessModal = ({ 
  isOpen, 
  roadmapId, 
  roadmapTitle, 
  onClose 
}: CopySuccessModalProps) => {
  const navigate = useNavigate();

  const handleGoToRoadmap = () => {
    if (roadmapId) {
      navigate(`/roadmap/${roadmapId}`);
      onClose();
    }
  };

  const handleOk = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Success! 🎉</DialogTitle>
          <DialogDescription className="text-center pt-4 text-base">
            You've copied <span className="font-semibold">"{roadmapTitle}"</span> to your personal roadmaps.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={handleGoToRoadmap} size="lg" className="w-full">
            Go to roadmap
          </Button>
          <Button onClick={handleOk} variant="ghost" size="sm" className="w-full text-muted-foreground">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopySuccessModal;
