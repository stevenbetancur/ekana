import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import { useProgressContext } from "@/contexts/ProgressContext";
import { useRoadmap } from "@/hooks/useMockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";

interface EditorUnit {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
}

// Helper at top level
const detectSubunitType = (contentUrl?: string): 'video' | 'article' => {
  if (!contentUrl) return 'article';
  const videoPatterns = ['youtube.com', 'youtu.be', 'vimeo.com'];
  return videoPatterns.some(pattern => contentUrl.includes(pattern)) ? 'video' : 'article';
};

interface RoadmapData {
  title: string;
  description: string;
  units: EditorUnit[];
}

interface RoadmapEditorProps {
  context?: 'page' | 'team';
  teamId?: string;
}

const RoadmapEditor = ({ context = 'page', teamId: propTeamId }: RoadmapEditorProps) => {
  const { roadmapId, teamId: paramTeamId } = useParams();
  const teamId = propTeamId || paramTeamId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { editRoadmap, addRoadmap, syncUnitsForRoadmap, roadmaps, units } = useRoadmapsContext();
  const { activations } = useProgressContext();
  const isEditing = roadmapId && roadmapId !== 'new';
  
  // Fetch roadmap data using the hook
  const { roadmap: fetchedRoadmap, units: fetchedUnits } = useRoadmap(roadmapId || '');

  const [roadmapData, setRoadmapData] = useState<RoadmapData>({
    title: '',
    description: '',
    units: []
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPublicDialog, setShowPublicDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  // Debug logging on mount
  useEffect(() => {
    console.log("DEBUG: Editor mounted. Roadmaps:", roadmaps, "Units:", units, "Activations:", activations);
  }, []);

  // Load existing roadmap data if editing
  useEffect(() => {
    if (isEditing && fetchedRoadmap && fetchedUnits) {
      // Map the fetched roadmap and units to the editor format
      const mappedUnits = fetchedUnits.map(unit => ({
        id: unit.id.toString(),
        title: unit.title,
        description: unit.description,
        contentUrl: unit.subunits[0]?.contentUrl || ''
      }));
      
      setRoadmapData({
        title: fetchedRoadmap.title,
        description: fetchedRoadmap.description,
        units: mappedUnits
      });
    }
  }, [isEditing, fetchedRoadmap, fetchedUnits]);

  const handleInputChange = (field: keyof RoadmapData, value: string) => {
    setRoadmapData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUnitChange = (unitId: string, field: keyof EditorUnit, value: string) => {
    setRoadmapData(prev => ({
      ...prev,
      units: prev.units.map(unit =>
        unit.id === unitId ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const addUnit = () => {
    const newUnit: EditorUnit = {
      id: Date.now().toString(),
      title: '',
      description: '',
      contentUrl: ''
    };
    
    setRoadmapData(prev => ({
      ...prev,
      units: [...prev.units, newUnit]
    }));
  };

  const removeUnit = (unitId: string) => {
    setRoadmapData(prev => ({
      ...prev,
      units: prev.units.filter(unit => unit.id !== unitId)
    }));
  };

  const handleSaveChanges = () => {
    if (!roadmapData.title.trim()) {
      toast.error("Please enter a roadmap title");
      return;
    }

    if (!roadmapData.description.trim()) {
      toast.error("Please enter a roadmap description");
      return;
    }

    if (roadmapData.units.length === 0) {
      toast.error("Please add at least one unit");
      return;
    }

    // Validate units
    const invalidUnit = roadmapData.units.find(unit => 
      !unit.title.trim() || !unit.description.trim()
    );

    if (invalidUnit) {
      toast.error("Please fill in all unit fields");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (isEditing) {
      // Update roadmap metadata
      editRoadmap(roadmapId!, {
        title: roadmapData.title,
        description: roadmapData.description,
        totalUnits: roadmapData.units.length
      });
      
      // Sync all units for this roadmap (handles add/update/delete)
      const mappedUnits = roadmapData.units.map((unit, index) => ({
        id: unit.id,
        roadmapId: roadmapId!,
        title: unit.title,
        description: unit.description,
        sequence_order: index + 1,
        subunits: [{
          id: `sub-${unit.id}-1`,
          title: "Main Lesson",
          type: detectSubunitType(unit.contentUrl),
          contentUrl: unit.contentUrl,
          duration: "20 min"
        }]
      }));
      syncUnitsForRoadmap(roadmapId!, mappedUnits);
      
      toast.success("Roadmap updated successfully!");
      
      // Navigate based on context
      if (context === 'team' && teamId) {
        navigate(`/team/${teamId}/roadmap`);
      } else {
        navigate(`/roadmap/${roadmapId}`);
      }
    } else {
      // Show public dialog for new roadmaps
      setShowPublicDialog(true);
    }
  };

  const handlePublicChoice = (makePublic: boolean) => {
    setIsPublic(makePublic);
    
    // Generate unique ID for the new roadmap
    const newRoadmapId = Date.now().toString();
    
    // Construct complete roadmap object with all required metadata and defaults
    const newRoadmapObject = {
      id: newRoadmapId,
      title: roadmapData.title,
      description: roadmapData.description,
      totalUnits: roadmapData.units.length,
      // Note: progress and completedUnits are calculated properties, not stored
      ownerType: 'USER' as const,
      ownerId: user!.id, // user guaranteed to exist due to ProtectedRoute
      ownerName: user!.name,
      originId: newRoadmapId, // New roadmap is its own origin
      isPublic: makePublic,
      isPaid: false,
      price: "Free",
      copies: 0,
      rating: 0,
      students: 0,
      createdAt: new Date().toISOString()
    };
    
    // Add roadmap to context first
    const finalRoadmapId = addRoadmap(newRoadmapObject);
    
    // Prepare units with auto-wrapped subunits
    const mappedUnits = roadmapData.units.map((unit, index) => ({
      id: `unit-${Date.now()}-${index}`,
      roadmapId: finalRoadmapId,
      title: unit.title,
      description: unit.description,
      sequence_order: index + 1,
      subunits: [{
        id: `sub-${Date.now()}-${index}-1`,
        title: "Main Lesson",
        type: detectSubunitType(unit.contentUrl),
        contentUrl: unit.contentUrl,
        duration: "20 min"
      }]
    }));
    
    console.log("DEBUG: Creating New Roadmap", newRoadmapObject, "With Units:", mappedUnits);
    syncUnitsForRoadmap(finalRoadmapId, mappedUnits);
    
    console.log("🎯 RoadmapEditor: Roadmap created, activation should have been created automatically");
    
    setShowPublicDialog(false);
    toast.success("Roadmap created successfully!");
    
    // Navigate based on context
    if (context === 'team' && teamId) {
      navigate(`/team/${teamId}/roadmap/${finalRoadmapId}`);
    } else {
      // For personal roadmaps, navigate to Courses page with success modal
      navigate('/courses', { 
        state: { 
          roadmapCreated: true, 
          roadmapId: finalRoadmapId,
          roadmapTitle: roadmapData.title 
        } 
      });
    }
  };


  const editorContent = (
    <>
      {/* Public/Private Choice Dialog */}
      <Dialog open={showPublicDialog} onOpenChange={setShowPublicDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share your {isEditing ? 'updated' : 'new'} roadmap?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Do you wish to make this roadmap public? 
              That could help you find teammates to learn with and enable so that other community members 
              use it or make their own copies of it. You can always change 
              these settings later in the roadmap's options.
            </p>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => handlePublicChoice(false)}>
              No, keep it private for now
            </Button>
            <Button onClick={() => handlePublicChoice(true)}>
              Yes, make it public
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background">
        {/* Header - Conditional based on context */}
        {context === 'team' ? (
          <div className="bg-ekana-purple-dark border-b px-4 h-[75px] sticky top-0 z-10 flex items-center">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-ekana-white hover:bg-ekana-purple-light p-1"
                onClick={() => navigate(`/team/${teamId}/roadmap`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold text-ekana-white">Team Roadmap</h2>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => navigate('/courses')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Edit Roadmap' : 'Create New Roadmap'}
              </h1>
              <img 
                src="/lovable-uploads/49efc226-52e1-48a9-b134-f96d67868eb9.png" 
                alt="Edit roadmap" 
                className="h-5 w-5"
              />
            </div>
          </div>
        )}

        {/* Editor Content */}
        <div className={context === 'team' ? 'px-6 pt-6 space-y-6' : 'max-w-4xl mx-auto space-y-6'}>
          {/* Roadmap Basic Info */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Roadmap Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roadmap-title">Roadmap Title</Label>
                <Input
                  id="roadmap-title"
                  placeholder="Enter your roadmap title"
                  value={roadmapData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roadmap-description">Roadmap Description</Label>
                <Textarea
                  id="roadmap-description"
                  placeholder="Describe what this roadmap covers and its learning objectives"
                  rows={3}
                  value={roadmapData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Units Section */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Learning Units</CardTitle>
                <Button onClick={addUnit} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {roadmapData.units.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📚</div>
                  <p>No units added yet. Click "Add Unit" to get started.</p>
                </div>
              ) : (
                roadmapData.units.map((unit, index) => (
                  <Card key={unit.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Unit {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUnit(unit.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`unit-title-${unit.id}`}>Unit Title</Label>
                          <Input
                            id={`unit-title-${unit.id}`}
                            placeholder="Enter unit title"
                            value={unit.title}
                            onChange={(e) => handleUnitChange(unit.id, 'title', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`unit-description-${unit.id}`}>Unit Description</Label>
                          <Textarea
                            id={`unit-description-${unit.id}`}
                            placeholder="Describe what this unit covers"
                            rows={2}
                            value={unit.description}
                            onChange={(e) => handleUnitChange(unit.id, 'description', e.target.value)}
                            className="w-full resize-none"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`unit-content-url-${unit.id}`}>Content URL</Label>
                          <Input
                            id={`unit-content-url-${unit.id}`}
                            placeholder="https://example.com/lesson-content"
                            type="url"
                            value={unit.contentUrl}
                            onChange={(e) => handleUnitChange(unit.id, 'contentUrl', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          {/* Terms and Create Button */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                I confirm that this content does not infringe on any copyrights and adheres to Ekana's Terms of Service.
              </Label>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveChanges} 
                size="lg" 
                className="min-w-32"
                disabled={!termsAccepted}
              >
                {isEditing ? 'Update Roadmap' : 'Create Roadmap'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Conditionally wrap in Layout only for page context
  return context === 'page' ? (
    <Layout>{editorContent}</Layout>
  ) : (
    editorContent
  );
};

export default RoadmapEditor;