import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Team } from "@/lib/mockData";

interface TeamCreationSuccessModalProps {
  team: Team | null;
  onClose: () => void;
}

export const TeamCreationSuccessModal = ({ team, onClose }: TeamCreationSuccessModalProps) => {
  const navigate = useNavigate();

  const handleGoToTeam = () => {
    if (team) {
      navigate(`/team/${team.id}`);
      onClose();
    }
  };

  const handleNotNow = () => {
    navigate('/inbox');
    onClose();
  };

  return (
    <Dialog open={!!team} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Success! 🎉</DialogTitle>
          <DialogDescription className="text-center pt-4 text-base">
            You've successfully created the team <span className="font-semibold">{team?.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={handleGoToTeam} size="lg" className="w-full">
            Go to team
          </Button>
          <Button onClick={handleNotNow} variant="ghost" size="sm" className="w-full text-muted-foreground">
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
