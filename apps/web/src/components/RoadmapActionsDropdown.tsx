import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit, Copy, Eye, Flag, Trash } from "lucide-react";
import type { RoadmapPermissions } from '@/hooks/useRoadmapPermissions';
import type { ExistingCopyResult } from '@/hooks/useCheckForExistingCopy';

interface RoadmapActionsDropdownProps {
  roadmap: any;
  permissions: RoadmapPermissions;
  existingCopy?: ExistingCopyResult;
  onAction: (action: string) => void;
}

export const RoadmapActionsDropdown = ({ roadmap, permissions, existingCopy, onAction }: RoadmapActionsDropdownProps) => {
  const hasCopy = existingCopy?.hasCopy ?? false;
  return (
    <TooltipProvider>
      <DropdownMenuContent align="end" className="w-48">
        {/* Edit Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuItem 
              onClick={() => onAction('edit')}
              disabled={!permissions.canEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </TooltipTrigger>
          {permissions.editTooltip && (
            <TooltipContent>
              <p>{permissions.editTooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Make a Copy Button - only show if canCopy is true and no existing copy */}
        {permissions.canCopy && !hasCopy && (
          <DropdownMenuItem 
            onClick={() => onAction('copy')}
          >
            <Copy className="h-4 w-4 mr-2" />
            Make a personal copy
          </DropdownMenuItem>
        )}

        {/* Make Public/Private Button - only show if canMakePublic is true */}
        {permissions.canMakePublic && (
          <DropdownMenuItem onClick={() => onAction('toggle-visibility')}>
            <Eye className="h-4 w-4 mr-2" />
            {roadmap.isPublic === true ? 'Make Private' : 'Make Public'}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Report Button - always shown */}
        <DropdownMenuItem onClick={() => onAction('report')}>
          <Flag className="h-4 w-4 mr-2" />
          Report Roadmap
        </DropdownMenuItem>
        
        {/* Delete/Unenroll Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuItem 
              onClick={() => onAction('delete')}
              disabled={roadmap.ownerType === 'THIRD_PARTY' ? !permissions.canUnenroll : !permissions.canDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="h-4 w-4 mr-2" />
              {roadmap.ownerType === 'THIRD_PARTY' ? 'Unenroll' : 'Delete'}
            </DropdownMenuItem>
          </TooltipTrigger>
          {(roadmap.ownerType === 'THIRD_PARTY' ? permissions.unenrollTooltip : permissions.deleteTooltip) && (
            <TooltipContent>
              <p>{roadmap.ownerType === 'THIRD_PARTY' ? permissions.unenrollTooltip : permissions.deleteTooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </DropdownMenuContent>
    </TooltipProvider>
  );
};
