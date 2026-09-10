import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Award } from 'lucide-react';

interface BadgeAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalDescription: string;
  teamName: string;
  teamId: string;
  badgesAwarded: number;
  memberCount: number;
}

const BadgeAwardModal: React.FC<BadgeAwardModalProps> = ({ 
  isOpen, 
  onClose, 
  goalDescription, 
  teamName,
  teamId,
  badgesAwarded,
  memberCount
}) => {
  const navigate = useNavigate();

  const handleCelebrate = () => {
    onClose();
    navigate(`/team/${teamId}`, { replace: true });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="py-6 text-center">
          {/* Trophy Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Award className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-2 text-foreground">
            🎉 Goal Completed!
          </h3>
          
          {/* Goal Description */}
          <Card className="mb-6 bg-muted/50 border-primary/20">
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Team Goal</p>
              <p className="font-semibold text-foreground">{goalDescription}</p>
              <p className="text-xs text-muted-foreground mt-2">Team: {teamName}</p>
            </div>
          </Card>

          {/* Badges Awarded */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 px-6 py-3 rounded-full border border-yellow-500/30">
              <Award className="h-5 w-5 text-yellow-600" />
              <span className="text-lg font-bold text-foreground">
                {badgesAwarded} {badgesAwarded === 1 ? 'Badge' : 'Badges'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Awarded to each of the {memberCount} team {memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>

          {/* Success Message */}
          <p className="text-muted-foreground mb-6">
            Congratulations! Your team has successfully completed this goal. 
            Each member has been awarded {badgesAwarded} {badgesAwarded === 1 ? 'badge' : 'badges'}!
          </p>

          {/* Close Button */}
          <Button onClick={handleCelebrate} className="w-full" size="lg">
            Celebrate 🎊
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeAwardModal;
