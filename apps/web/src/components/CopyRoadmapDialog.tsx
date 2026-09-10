import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CopyRoadmapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

const CopyRoadmapDialog = ({ isOpen, onClose, onConfirm }: CopyRoadmapDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    console.log("🟢 CopyRoadmapDialog: handleConfirm called");
    setIsLoading(true);
    try {
      console.log("🟢 CopyRoadmapDialog: Calling onConfirm...");
      await onConfirm();
      console.log("🟢 CopyRoadmapDialog: onConfirm completed");
    } catch (error) {
      console.error("🟢 CopyRoadmapDialog: onConfirm threw error:", error);
    } finally {
      console.log("🟢 CopyRoadmapDialog: Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Prevent closing while loading
    if (!open && !isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Roadmap</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            This will create a personal copy of this roadmap that you can customize and track independently.
          </p>
        </div>
        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copying...
              </>
            ) : (
              "Create Copy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyRoadmapDialog;
