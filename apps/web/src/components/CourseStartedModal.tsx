import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CourseStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseName: string;
  sectionTitle: string;
}

export const CourseStartedModal = ({ 
  isOpen, 
  onClose, 
  courseName,
  sectionTitle 
}: CourseStartedModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Course started!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Now you can access <span className="font-semibold text-foreground">{courseName}</span> from <span className="font-semibold text-foreground">{sectionTitle}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
