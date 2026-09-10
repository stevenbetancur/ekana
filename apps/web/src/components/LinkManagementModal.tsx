import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Edit2 } from "lucide-react";

interface LinkData {
  name: string;
  url: string;
  description: string;
}

interface LinkManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkData | null;
  onSave: (link: LinkData) => void;
}

const LinkManagementModal = ({ isOpen, onClose, link, onSave }: LinkManagementModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLink, setEditedLink] = useState<LinkData>({
    name: "",
    url: "",
    description: ""
  });

  const handleEdit = () => {
    if (link) {
      setEditedLink(link);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    onSave(editedLink);
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLink({ name: "", url: "", description: "" });
  };

  const handleGoToLink = () => {
    if (link?.url) {
      window.open(link.url, '_blank');
    }
  };

  if (!link) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-ekana-white-bg">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isEditing ? "Edit Link" : "Link Details"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Link Name</Label>
                <Input
                  id="name"
                  value={editedLink.name}
                  onChange={(e) => setEditedLink({ ...editedLink, name: e.target.value })}
                  placeholder="Enter link name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={editedLink.url}
                  onChange={(e) => setEditedLink({ ...editedLink, url: e.target.value })}
                  placeholder="Enter URL"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editedLink.description}
                  onChange={(e) => setEditedLink({ ...editedLink, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-base font-semibold">{link.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">URL</Label>
                  <p className="text-sm text-blue-600 break-all">{link.url}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-sm text-gray-700">{link.description}</p>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleGoToLink} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Link
                </Button>
                <Button variant="outline" onClick={handleEdit} className="flex-1">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkManagementModal;