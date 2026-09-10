
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle, Star, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { toast } from "sonner";
import { INTEREST_OPTIONS, TIME_SLOTS, DAY_TYPES } from "@/lib/constants";

interface BioSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  defaultBirthDate?: { day: string; month: string; year: string };
  defaultLocation?: string;
}

interface FormData {
  bio: string;
  interests: string[];
  schedule: {
    weekdays: string[];
    weekend: string[];
  };
  birthDate: {
    day: string;
    month: string;
    year: string;
  };
  location: string;
}


export const BioSetupModal = ({ open, onOpenChange, onComplete, defaultBirthDate, defaultLocation }: BioSetupModalProps) => {
  const { updateUser } = useAuth();
  const { updateProfile } = useUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmBack, setShowConfirmBack] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showPointsReward, setShowPointsReward] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    bio: "",
    interests: [],
    schedule: {
      weekdays: [],
      weekend: []
    },
    birthDate: defaultBirthDate || { day: "", month: "", year: "" },
    location: defaultLocation || ""
  });

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setShowConfirmBack(true);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const profileData = {
      bio: formData.bio,
      interests: formData.interests,
      schedule: formData.schedule,
      birthDate: formData.birthDate.day && formData.birthDate.month && formData.birthDate.year
        ? { day: formData.birthDate.day, month: formData.birthDate.month, year: formData.birthDate.year }
        : null,
      location: formData.location,
    };

    console.log('💾 [BioModal] Saving:', profileData);

    try {
      // Persist to Supabase via UserProfileContext
      await updateProfile(profileData);

      // Update local AuthContext state for immediate UI update
      updateUser({ 
        ...profileData,
        profileComplete: true
      });

      console.log('✅ [BioModal] Save successful');
      setShowCongrats(true);
    } catch (error) {
      console.error('❌ [BioModal] Save failed:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const handleCongratsComplete = () => {
    setShowCongrats(false);
    setShowPointsReward(true);
  };

  const handlePointsComplete = () => {
    setShowPointsReward(false);
    onOpenChange(false);
    onComplete();
    toast.success("Profile setup completed! You earned 50 points!");
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleSchedule = (dayType: "weekdays" | "weekend", timeSlot: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayType]: prev.schedule[dayType].includes(timeSlot)
          ? prev.schedule[dayType].filter(slot => slot !== timeSlot)
          : [...prev.schedule[dayType], timeSlot]
      }
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.bio.trim().length > 0;
      case 2:
        return formData.interests.length > 0;
      case 3:
        return formData.schedule.weekdays.length > 0 || formData.schedule.weekend.length > 0;
      case 4:
        return formData.birthDate.day && formData.birthDate.month && formData.birthDate.year;
      case 5:
        return formData.location.trim().length > 0;
      default:
        return false;
    }
  };

  // Confirmation dialog for going back
  if (showConfirmBack) {
    return (
      <Dialog open={true} onOpenChange={() => setShowConfirmBack(false)}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-600 to-purple-800 border-none text-white">
          <div className="text-center space-y-6 py-6">
            <h2 className="text-xl font-semibold">Are you sure you want to go back?</h2>
            <p className="text-purple-100">Your progress will be lost if you leave now.</p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmBack(false);
                  onOpenChange(false);
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Yes, go back
              </Button>
              <Button 
                onClick={() => setShowConfirmBack(false)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continue setup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Congratulations modal
  if (showCongrats) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-white border-none">
          <div className="text-center space-y-6 py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Congratulations!</h2>
              <p className="text-gray-600 mt-2">You finished setting up your profile.<br />You're ready to find a learning partner!</p>
            </div>
            <Button 
              onClick={handleCongratsComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Points reward modal
  if (showPointsReward) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-white border-none">
          <div className="text-center space-y-6 py-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Congratulations! You completed your profile setup!
              </h2>
              <p className="text-gray-600">You're now ready to find learning partners and earn points.</p>
              
              <div className="flex items-center justify-center gap-2 text-2xl">
                <span className="text-green-600 font-bold">+50</span>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
            
            <Button 
              onClick={handlePointsComplete}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8"
            >
              Ok
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border-none text-gray-900 p-0">
        <Card className="w-full max-w-lg mx-auto min-h-[400px] flex flex-col border-none shadow-none">
          <CardContent className="p-6 flex flex-col h-full">
            {/* Progress indicator */}
            <div className="text-center mb-6">
              <span className="text-gray-900 font-semibold text-lg">{currentStep}/5</span>
            </div>

            {/* Step 1: Bio */}
            {currentStep === 1 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">Create your Bio!</h1>
                  <p className="text-gray-600 text-base">Let your partners know about:</p>
                  <ul className="text-gray-600 space-y-2 text-left max-w-md mx-auto text-sm">
                    <li>• What drives you to learn?</li>
                    <li>• What is your background?</li>
                    <li>• What is an ideal learning collaboration for you?</li>
                  </ul>
                </div>

                <div className="flex-1 space-y-4">
                  <Textarea
                    placeholder="Write here..."
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="min-h-24 resize-none bg-white border-gray-300 text-gray-900"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500">Max. 500 characters</p>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    className="text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-full flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Interests */}
            {currentStep === 2 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">What are your interests?</h1>
                  <p className="text-gray-600 text-base">Showcasing your interests can help you find compatible learning partners.</p>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {INTEREST_OPTIONS.map((interest) => (
                      <Button
                        key={interest}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleInterest(interest)}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${
                          formData.interests.includes(interest)
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    className="text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-full flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">When are you available to study?</h1>
                  <p className="text-gray-600 text-base">Select your preferred study times</p>
                </div>

                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    {/* Time headers */}
                    <div className="grid grid-cols-4 gap-4 text-center mb-4">
                      <div></div>
                      {TIME_SLOTS.map((slot) => (
                        <div key={slot} className="font-medium text-gray-700 py-2 text-sm">
                          {slot}
                        </div>
                      ))}
                    </div>

                    {/* Schedule grid */}
                    <div className="space-y-3">
                      {DAY_TYPES.map((dayType) => (
                        <div key={dayType} className="grid grid-cols-4 gap-4 items-center">
                          <div className="font-medium text-gray-700 text-sm">{dayType}</div>
                          {TIME_SLOTS.map((slot) => {
                            const isSelected = formData.schedule[dayType.toLowerCase() as keyof typeof formData.schedule]?.includes(slot);
                            return (
                              <div key={slot} className="flex justify-center">
                                <button
                                  onClick={() => toggleSchedule(dayType.toLowerCase() as "weekdays" | "weekend", slot)}
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? "bg-green-600 border-green-600 text-white" 
                                      : "border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400"
                                  }`}
                                >
                                  {isSelected && <CheckCircle className="w-5 h-5" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    className="text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-full flex items-center gap-2"
                  >
                    Complete <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Birth Date */}
            {currentStep === 4 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">What's your day of birth?</h1>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">
                        This information is never shared with third-party providers and is only used for the purposes stated in our Information Policy. You can change the visibility of this information in your user profile settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex gap-4 justify-center">
                    <div className="flex-1">
                      <Select 
                        value={formData.birthDate.day} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          birthDate: { ...prev.birthDate, day: value } 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <Select 
                        value={formData.birthDate.month} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          birthDate: { ...prev.birthDate, month: value } 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ].map((month, index) => (
                            <SelectItem key={month} value={(index + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <Select 
                        value={formData.birthDate.year} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          birthDate: { ...prev.birthDate, year: value } 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 18 - i).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    className="text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-full flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Location */}
            {currentStep === 5 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-gray-900">What is your current location?</h1>
                  <p className="text-gray-600 text-base">(City, Country)</p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">
                        You can change the visibility of this information in your user profile settings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <Input
                    placeholder="e.g., Miami, Florida"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    className="text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-full flex items-center gap-2"
                  >
                    Complete <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
