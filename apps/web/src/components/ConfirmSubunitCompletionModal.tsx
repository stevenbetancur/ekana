import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ConfirmSubunitCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subunitTitle: string;
  isCompleting: boolean;
}

const ConfirmSubunitCompletionModal = ({
  isOpen,
  onClose,
  onConfirm,
  subunitTitle,
  isCompleting,
}: ConfirmSubunitCompletionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">
            {isCompleting ? "Mark Lesson as Done?" : "Mark Lesson as Incomplete?"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isCompleting ? (
              <>
                Are you sure you want to mark <span className="font-semibold">"{subunitTitle}"</span> as completed?
                {" "}You'll earn 10 points for this achievement.
              </>
            ) : (
              <>
                Are you sure you want to mark <span className="font-semibold">"{subunitTitle}"</span> as incomplete?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmSubunitCompletionModal;
