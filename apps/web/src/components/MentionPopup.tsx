
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MentionOption {
  id: string;
  label: string;
  description: string;
}

interface MentionPopupProps {
  isOpen: boolean;
  query: string;
  position: { x: number; y: number };
  onSelect: (handleText: string) => void;
}

const MentionPopup: React.FC<MentionPopupProps> = ({ isOpen, query, position, onSelect }) => {
  const mentionOptions: MentionOption[] = [
    {
      id: 'summary',
      label: '@summary',
      description: 'Send a summary to channel members'
    },
    {
      id: 'motivation',
      label: '@motivation',
      description: 'Request motivation to channel members'
    },
    {
      id: 'exercise',
      label: '@exercise',
      description: 'Send an exercise to channel members'
    },
    {
      id: 'question',
      label: '@question',
      description: 'Send a question to channel members'
    }
  ];

  if (!isOpen) return null;

  // Filter options based on query
  const filteredOptions = mentionOptions.filter(option =>
    option.label.toLowerCase().includes(`@${query.toLowerCase()}`)
  );

  const handleOptionSelect = (option: MentionOption, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(option.label);
  };

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(-100%)',
      }}
    >
      <Card className="w-80 bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-2">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-start space-x-3 p-2 hover:bg-gray-50 cursor-pointer rounded-md"
                onMouseDown={(e) => handleOptionSelect(option, e)}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No matching handles</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MentionPopup;
