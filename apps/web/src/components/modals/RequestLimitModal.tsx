import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Crown } from "lucide-react";

interface RequestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'limit_reached';
  remaining?: number;
  recipientName?: string;
}

const RequestLimitModal = ({ 
  isOpen, 
  onClose, 
  type, 
  remaining = 0,
  recipientName = 'the user'
}: RequestLimitModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  if (type === 'limit_reached') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Request Limit Reached</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-center py-4">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">You've used all 10 free requests</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium for unlimited team connections and unlock your full learning potential!
              </p>
            </div>
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Request Sent!</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-center py-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Team request sent successfully!</h3>
            <p className="text-sm text-muted-foreground">
              We'll notify you when {recipientName} responds to your request.
            </p>
            {remaining !== Infinity && (
              <p className="text-sm font-medium text-primary">
                You have {remaining} free {remaining === 1 ? 'request' : 'requests'} left.
              </p>
            )}
          </div>
          <Button 
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            OK
          </Button>
          {remaining !== Infinity && (
            <button
              onClick={handleUpgrade}
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              Get unlimited requests with Premium
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestLimitModal;
