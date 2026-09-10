import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

interface RequestActionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'accept' | 'decline';
  userName: string;
  teamName: string;
  teamId?: string;
}

const RequestActionSuccessModal = ({
  isOpen,
  onClose,
  actionType,
  userName,
  teamName,
  teamId
}: RequestActionSuccessModalProps) => {
  const navigate = useNavigate();

  const handleGoToTeam = () => {
    if (teamId) {
      navigate(`/team/${teamId}`);
    }
    onClose();
  };
  
  const handleOk = () => {
    navigate('/inbox');
    onClose();
  };

  const isAccept = actionType === 'accept';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isAccept ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isAccept ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {isAccept ? "Request Accepted" : "Request Declined"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {isAccept
              ? `You've accepted ${userName}'s request to join ${teamName}.`
              : `You've declined ${userName}'s request to join ${teamName}.`
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={`mt-4 ${isAccept ? 'flex-col gap-2 sm:flex-col' : 'flex justify-center items-center sm:justify-center'}`}>
          {isAccept && teamId && (
            <Button 
              onClick={handleGoToTeam}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Go to Team
            </Button>
          )}
          <Button 
            variant={isAccept ? "outline" : "default"}
            onClick={handleOk}
            className={isAccept ? "w-full" : "w-auto"}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestActionSuccessModal;
