import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Crown } from "lucide-react";

interface Team {
  id: number;
  name: string;
  members: number;
  maxMembers: number;
}

interface SendTeamRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onSend: (teamId: number | null, message: string, isNewTeam: boolean) => void;
}

const SendTeamRequestModal = ({ isOpen, onClose, userName, onSend }: SendTeamRequestModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("existing");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isPremium] = useState(false); // This would come from auth context in real app

  // Mock user teams - in real app this would come from user context
  const userTeams: Team[] = [
    { id: 1, name: "Frontend Developers", members: 4, maxMembers: 5 },
    { id: 2, name: "UI/UX Designers", members: 3, maxMembers: 4 }
  ];

  const hasTeams = userTeams.length > 0;
  const canCreateNewTeam = !hasTeams || isPremium;

  const handleSend = () => {
    if (selectedOption === "new") {
      onSend(null, message, true);
    } else if (selectedTeamId) {
      onSend(selectedTeamId, message, false);
    }
    onClose();
  };

  const getAvailableSpots = (team: Team) => {
    return team.maxMembers - team.members;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Send Team Request
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Team Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Choose an option:</h3>
            
            <RadioGroup 
              value={selectedOption} 
              onValueChange={setSelectedOption}
              className="space-y-3"
            >
              {/* Create New Team Option */}
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem 
                  value="new" 
                  id="new" 
                  disabled={!canCreateNewTeam}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="new" className="text-sm font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Create a new team
                    {!canCreateNewTeam && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    {!canCreateNewTeam 
                      ? "Upgrade to premium to create additional teams"
                      : "Start fresh with a new learning team"
                    }
                  </p>
                </div>
              </div>

              {/* Existing Teams Options */}
              {hasTeams && userTeams.map((team) => {
                const availableSpots = getAvailableSpots(team);
                const isTeamFull = availableSpots === 0;
                
                return (
                  <div key={team.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem 
                      value="existing" 
                      id={`team-${team.id}`}
                      disabled={isTeamFull}
                      className="mt-1"
                      onClick={() => setSelectedTeamId(team.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`team-${team.id}`} className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Invite {userName} to join {team.name}
                        <span className="text-gray-500">
                          ({availableSpots} {availableSpots === 1 ? 'spot' : 'spots'} left)
                        </span>
                      </Label>
                      {isTeamFull && (
                        <p className="text-xs text-red-500 mt-1">This team is full</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Personal message (optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={selectedOption === "existing" && !selectedTeamId}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendTeamRequestModal;
