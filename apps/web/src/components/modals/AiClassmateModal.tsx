import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/lib/constants";
import { toast } from "sonner";

interface AiClassmateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'intro' | 'level' | 'frequency';

const AiClassmateModal = ({ isOpen, onClose }: AiClassmateModalProps) => {
  const [step, setStep] = useState<Step>('intro');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setStep('frequency');
  };

  const handleFrequencySelect = (frequency: string) => {
    setSelectedFrequency(frequency);
  };

  const handleAddAI = () => {
    // TODO: Add AI user to team
    toast.success('EkyIA classmate added!');
    onClose();
    // Reset state
    setStep('intro');
    setSelectedLevel('');
    setSelectedFrequency('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add AI Classmate</DialogTitle>
        </DialogHeader>

        {step === 'intro' && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png" 
                alt="EkyIA AI" 
                className="h-16 w-16"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              AI is here to foster your explanation skills and engage with your team. 
              The AI classmate will participate in discussions, ask questions, and provide 
              feedback to help everyone learn better together.
            </p>
            <Button onClick={() => setStep('level')} className="w-full">
              OK
            </Button>
          </div>
        )}

        {step === 'level' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-center mb-4">
              What level do you want AI classmate to be?
            </h3>
            <div className="grid gap-3">
              {LEVELS.map((level) => (
                <Button
                  key={level.name}
                  variant="outline"
                  className="h-auto p-4 flex items-center justify-start space-x-3 hover:bg-accent"
                  onClick={() => handleLevelSelect(level.name)}
                >
                  <img 
                    src={level.icon} 
                    alt={level.name} 
                    className="h-8 w-8"
                  />
                  <span className="font-medium">{level.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === 'frequency' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-center mb-4">
              How often would you like to see comments from EkyIA?
            </h3>
            <div className="grid gap-3">
              {['1 a day', '2-3 times a week', '1 once a week'].map((freq) => (
                <Button
                  key={freq}
                  variant={selectedFrequency === freq ? "default" : "outline"}
                  className="h-auto p-4"
                  onClick={() => handleFrequencySelect(freq)}
                >
                  {freq}
                </Button>
              ))}
            </div>
            <Button 
              onClick={handleAddAI} 
              disabled={!selectedFrequency}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Add EkyIA
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiClassmateModal;
