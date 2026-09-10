import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PointsAwardedModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
}

const PointsAwardedModal: React.FC<PointsAwardedModalProps> = ({ isOpen, onClose, points }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs text-center">
        <div className="py-6">
          <div className="mb-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Great interaction!</h3>
            <p className="text-gray-600">You earned {points} points! 🏆</p>
          </div>
          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PointsAwardedModal;
