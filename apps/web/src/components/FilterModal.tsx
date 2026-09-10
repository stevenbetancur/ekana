
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Filter, Search, X, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FilterModalProps {
  children: React.ReactNode;
  onFiltersChange?: (filters: any) => void;
  currentFilters?: {
    levels: string[];
    languages: string[];
    goals: string[];
    minHours: number[];
    location: string;
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FilterState {
  levels: string[];
  languages: string[];
  goals: string[];
  minHours: number[];
  location: string;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese", 
  "Italian", "Chinese", "Japanese", "Dutch", "Swahili"
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const GOALS = [
  "Start a new career",
  "Learn new skills", 
  "Have fun",
  "Change careers"
];

export function FilterModal({ children, onFiltersChange, currentFilters, isOpen: controlledOpen, onOpenChange }: FilterModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [showLocationUpgrade, setShowLocationUpgrade] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [selectedLocationOption, setSelectedLocationOption] = useState("predefined");
  const [addedCustomLocations, setAddedCustomLocations] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    levels: [],
    languages: [],
    goals: [],
    minHours: [2],
    location: ""
  });

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Update local filters when currentFilters prop changes
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.toLowerCase().includes(languageSearch.toLowerCase()) &&
    !filters.languages.includes(lang)
  );

  const updateFilters = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const toggleArrayItem = (array: string[], item: string, maxItems: number, itemType: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      if (array.length >= maxItems) {
        toast.error(`You can only select up to ${maxItems} ${itemType}.`);
        return array;
      }
      return [...array, item];
    }
  };

  const addLanguage = (language: string) => {
    if (filters.languages.length < 3 && !filters.languages.includes(language)) {
      updateFilters('languages', [...filters.languages, language]);
      setLanguageSearch("");
    } else if (filters.languages.length >= 3) {
      toast.error("You can only select up to 3 languages.");
    }
  };

  const removeLanguage = (language: string) => {
    updateFilters('languages', filters.languages.filter(l => l !== language));
  };

  const addCustomLocation = () => {
    if (customLocation.trim() && addedCustomLocations.length === 0) {
      const newLocation = customLocation.trim();
      setAddedCustomLocations([newLocation]);
      updateFilters('location', `Near: ${newLocation}`);
      setCustomLocation("");
    } else if (addedCustomLocations.length > 0) {
      toast.error("You can only choose one custom location at a time.");
    }
  };

  const removeCustomLocation = (location: string) => {
    setAddedCustomLocations(addedCustomLocations.filter(l => l !== location));
    if (filters.location === location) {
      updateFilters('location', "");
    }
  };

  const handleLocationClick = () => {
    setShowLocationUpgrade(true);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      levels: [],
      languages: [],
      goals: [],
      minHours: [2],
      location: ""
    };
    setFilters(clearedFilters);
    setAddedCustomLocations([]);
    onFiltersChange?.(clearedFilters);
  };

  const hasActiveFilters = filters.levels.length > 0 || 
                          filters.languages.length > 0 || 
                          filters.goals.length > 0 || 
                          filters.minHours[0] > 2 ||
                          filters.location.length > 0;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-8">
            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Location</Label>
                {!user?.isPremium && <Crown className="h-4 w-4 text-orange-500" />}
              </div>
              
              {user?.isPremium ? (
                <div className="space-y-4">
                  {/* Location Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="location-current"
                        checked={selectedLocationOption === "current"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLocationOption("current");
                            updateFilters('location', "London, UK");
                          }
                        }}
                      />
                      <Label htmlFor="location-current" className="text-sm font-normal cursor-pointer">
                        My location (London, UK)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="location-custom"
                        checked={selectedLocationOption === "custom"}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLocationOption("custom");
                          }
                        }}
                      />
                      <Label htmlFor="location-custom" className="text-sm font-normal cursor-pointer">
                        Custom location
                      </Label>
                    </div>
                  </div>

                  {/* Custom Location Input */}
                  {selectedLocationOption === "custom" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Miami, Florida"
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          size="sm" 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                          onClick={addCustomLocation}
                        >
                          Ok
                        </Button>
                      </div>
                      
                      {/* Added Custom Locations */}
                      {addedCustomLocations.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Added locations:</Label>
                          <div className="flex flex-wrap gap-2">
                            {addedCustomLocations.map(location => (
                              <Badge key={location} variant="secondary" className="flex items-center gap-1">
                                Near: {location}
                                <button
                                  onClick={() => removeCustomLocation(location)}
                                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-orange-200 rounded-lg p-4 bg-orange-50/50">
                  <div className="text-center space-y-2">
                    <Crown className="h-6 w-6 text-orange-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Find learning partners near you
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={handleLocationClick}
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Level Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Level</Label>
              <div className="space-y-3">
                {LEVELS.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={filters.levels.includes(level)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newLevels = toggleArrayItem(filters.levels, level, 2, "levels");
                          updateFilters('levels', newLevels);
                        } else {
                          updateFilters('levels', filters.levels.filter(l => l !== level));
                        }
                      }}
                    />
                    <Label htmlFor={`level-${level}`} className="text-sm font-normal cursor-pointer">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Language</Label>
              
              {/* Language Search */}
              {filters.languages.length < 3 && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search languages..."
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {languageSearch && filteredLanguages.length > 0 && (
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {filteredLanguages.map(language => (
                        <button
                          key={language}
                          onClick={() => addLanguage(language)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Languages */}
              {filters.languages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Selected languages:</Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.languages.map(language => (
                      <Badge key={language} variant="secondary" className="flex items-center gap-1">
                        {language}
                        <button
                          onClick={() => removeLanguage(language)}
                          className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {filters.languages.length >= 3 && (
                <p className="text-xs text-muted-foreground">Maximum 3 languages selected</p>
              )}
            </div>

            {/* Goals Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Goals</Label>
              <div className="space-y-3">
                {GOALS.map(goal => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={filters.goals.includes(goal)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newGoals = toggleArrayItem(filters.goals, goal, 3, "goals");
                          updateFilters('goals', newGoals);
                        } else {
                          updateFilters('goals', filters.goals.filter(g => g !== goal));
                        }
                      }}
                    />
                    <Label htmlFor={`goal-${goal}`} className="text-sm font-normal cursor-pointer">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Commitment Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Time commitment</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Minimum</Label>
                  <div className="mt-2 px-2">
                    <Slider
                      value={filters.minHours}
                      onValueChange={(value) => updateFilters('minHours', value)}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="text-center mt-2 text-sm font-medium">
                    {filters.minHours[0]}h
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-background pt-6 pb-2 border-t mt-8">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="flex-1"
                disabled={!hasActiveFilters}
              >
                Clear all
              </Button>
              <Button 
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Apply filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Premium Location Upgrade Modal */}
      <Dialog open={showLocationUpgrade} onOpenChange={setShowLocationUpgrade}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">✨ Premium Feature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg">
              <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Find Learning Partners Near You</h3>
              <p className="text-sm text-gray-600 mb-4">Enable location-based search to connect with learners in your area</p>
              <ul className="text-sm space-y-2 text-left">
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>More than 12 requests a day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Location-based search</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>Official member badge</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span>AI learning coach</span>
                </li>
              </ul>
            </div>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                setShowLocationUpgrade(false);
                navigate('/premium');
              }}
            >
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
