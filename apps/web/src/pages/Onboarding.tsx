import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, Check, Upload, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Import constants
import { SUBJECTS, GOALS, LEVELS, COMMUNICATION_OPTIONS, INTEREST_OPTIONS, TIME_SLOTS, DAY_TYPES } from '@/lib/constants';
import starYellowIcon from '@/assets/icons/star-yellow.png';
import starGrayIcon from '@/assets/icons/star-gray.png';

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  canNext?: boolean;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  subtitleClassName = "text-lg",
  children,
  onNext,
  onBack,
  canNext = true
}) => {
  return (
    <Card className="w-full max-w-lg mx-auto min-h-[400px] flex flex-col justify-between">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="space-y-6 mb-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-black mb-2">
              {step}/{totalSteps}
            </div>
            <div className="flex justify-center mb-4">
              <Progress 
                value={(step / totalSteps) * 100} 
                className="w-[420px] h-3 bg-gray-200 rounded-full transition-all duration-500 ease-out" 
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center">{title}</h2>
          {subtitle && (
            <p className={`${subtitleClassName} text-center`}>{subtitle}</p>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {children}
        </div>

        <div className="flex justify-between items-center mt-6">
          {onBack ? (
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button 
            onClick={onNext} 
            disabled={!canNext}
            className="px-8"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showCourseActivation, setShowCourseActivation] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseActivated, setCourseActivated] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    subject: "",
    customSubject: "",
    goal: "",
    level: "",
    weeklyHours: [5],
    communicationMethods: [] as string[],
    languages: [{ language: "", proficiency: "" }],
    avatar: null as File | null,
    bio: "",
    interests: [] as string[],
    availability: [] as string[]
  });

  const { user, updateUser } = useAuth();
  const { updateProfile } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.profileComplete) {
      navigate('/dashboard');
    }
  }, [user, navigate]);


  const handleNext = () => {
    if (currentStep === 4 && !showCourseActivation) {
      setCurrentStep(5);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (showCourseActivation) {
      setShowCourseActivation(false);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCourseActivation = () => {
    if (courseCode.length === 7) {
      setCourseActivated(true);
      toast.success("Course activated successfully!");
      setTimeout(() => {
        setCurrentStep(5);
        setShowCourseActivation(false);
      }, 2000);
    }
  };

  const handleFinish = async () => {
    // CRITICAL: Include name from auth user to ensure it's persisted
    // The DB trigger may have failed to capture it from auth metadata
    const profileData = {
      name: user?.name, // Explicitly include name from auth context
      subject: formData.subject === "Other" ? formData.customSubject : formData.subject,
      goal: formData.goal,
      level: formData.level,
      bio: formData.bio,
      interests: formData.interests,
      availability: formData.availability,
      weeklyHours: formData.weeklyHours[0],
      communicationMethods: formData.communicationMethods,
      languages: formData.languages,
      profileComplete: true,
    };

    // Debug: Log the data being submitted (including name for verification)
    console.log('💾 [Onboarding] Saving profile data:', profileData);
    console.log('🔍 [Onboarding] User name from auth context:', user?.name);
    console.log('🔍 [Onboarding] Raw formData state:', {
      subject: formData.subject,
      customSubject: formData.customSubject,
      goal: formData.goal,
      level: formData.level,
      bio: formData.bio,
      interests: formData.interests,
      availability: formData.availability,
      weeklyHours: formData.weeklyHours,
      communicationMethods: formData.communicationMethods,
      languages: formData.languages,
    });

    try {
      // Persist to Supabase via UserProfileContext
      await updateProfile(profileData);

      // Update local AuthContext state for immediate UI update
      updateUser({
        ...profileData,
        goal: formData.goal as any
      });

      toast.success("Profile setup complete! Welcome to Ekana!");
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Failed to save onboarding data:', error);
      toast.error("Failed to save your profile. Please try again.");
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (showCourseActivation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4" style={{'--primary-dark': 'hsl(262 83% 48%)'} as any}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {courseActivated ? "Course Activated!" : "Activate Your Course"}
              </h2>
            </div>
            
            {courseActivated ? (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p>Your course has been successfully activated!</p>
              </div>
            ) : (
              <>
                <div>
                  <Label>Enter your 7-digit course code</Label>
                  <Input
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value.slice(0, 7))}
                    placeholder="XXXXXXX"
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleCourseActivation} 
                    disabled={courseCode.length !== 7}
                    className="flex-1"
                  >
                    Activate
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4" style={{'--primary-dark': 'hsl(262 83% 48%)'} as any}>
      {currentStep === 1 && (
        <OnboardingStep
          step={1}
          totalSteps={8}
          title="What are you learning?"
          onNext={handleNext}
          canNext={!!formData.subject && (formData.subject !== "Other" || !!formData.customSubject)}
        >
          <div className="space-y-3">
            {SUBJECTS.map(subject => (
              <Button
                key={subject.name}
                variant={formData.subject === subject.name ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => updateFormData('subject', subject.name)}
              >
                <img src={subject.icon} alt={subject.name} className="w-5 h-5 mr-3" />
                {subject.name}
              </Button>
            ))}
            {formData.subject === "Other" && (
              <div className="mt-3">
                <Input
                  placeholder="Please specify what you're learning"
                  value={formData.customSubject}
                  onChange={(e) => updateFormData('customSubject', e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </OnboardingStep>
      )}

      {currentStep === 2 && (
        <OnboardingStep
          step={2}
          totalSteps={8}
          title="What do you want to achieve?"
          onNext={handleNext}
          onBack={handleBack}
          canNext={!!formData.goal}
        >
          <div className="space-y-3">
            {GOALS.map(goal => (
              <Button
                key={goal.name}
                variant={formData.goal === goal.name ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => updateFormData('goal', goal.name)}
              >
                <img src={goal.icon} alt={goal.name} className="w-5 h-5 mr-3" />
                {goal.name}
              </Button>
            ))}
          </div>
        </OnboardingStep>
      )}

      {currentStep === 3 && (
        <OnboardingStep
          step={3}
          totalSteps={8}
          title="What is your current level?"
          onNext={handleNext}
          onBack={handleBack}
          canNext={!!formData.level}
        >
          <div className="space-y-3">
            {LEVELS.map(level => (
              <Button
                key={level.name}
                variant={formData.level === level.name ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => updateFormData('level', level.name)}
              >
                <img src={level.icon} alt={level.name} className="w-5 h-5 mr-3" />
                {level.name}
              </Button>
            ))}
          </div>
        </OnboardingStep>
      )}

      {currentStep === 4 && (
        <OnboardingStep
          step={4}
          totalSteps={8}
          title="Do you have a course code to activate?"
          onNext={handleNext}
          onBack={handleBack}
        >
          <div className="space-y-4 flex flex-col items-center">
            <Button
              onClick={() => setShowCourseActivation(true)}
              className="w-[280px]"
            >
              Yes, I have a course code
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              className="w-[280px]"
            >
              No, continue without a course
            </Button>
          </div>
        </OnboardingStep>
      )}

      {currentStep === 5 && (
        <OnboardingStep
          step={5}
          totalSteps={8}
          title="Weekly time investment"
          onNext={handleNext}
          onBack={handleBack}
        >
          <div className="space-y-4">
            <Label className="text-base text-left block px-4">How many hours per week can you dedicate to learning?</Label>
            <div className="h-5"></div>
            <div className="px-4">
              <Slider
                value={formData.weeklyHours}
                onValueChange={(value) => updateFormData('weeklyHours', value)}
                max={40}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-center text-lg font-semibold">
              {formData.weeklyHours[0]} hours per week
            </div>
          </div>
        </OnboardingStep>
      )}

      {currentStep === 6 && (
        <OnboardingStep
          step={6}
          totalSteps={8}
          title="How do you prefer to interact with your team?"
          subtitle="You can choose more than one"
          subtitleClassName="text-lg text-left"
          onNext={handleNext}
          onBack={handleBack}
        >
          <div className="space-y-3">
            {COMMUNICATION_OPTIONS.map(method => (
              <Button
                key={method.name}
                variant={formData.communicationMethods.includes(method.name) ? "default" : "outline"}
                className="w-full justify-start relative"
                onClick={() => 
                  updateFormData('communicationMethods', 
                    toggleArrayItem(formData.communicationMethods, method.name)
                  )
                }
              >
                <img src={method.icon} alt={method.name} className="w-5 h-5 mr-3" />
                {method.name}
                {formData.communicationMethods.includes(method.name) && (
                  <CheckCircle className="h-4 w-4 ml-auto" />
                )}
              </Button>
            ))}
          </div>
        </OnboardingStep>
      )}

      {currentStep === 7 && (
        <OnboardingStep
          step={7}
          totalSteps={8}
          title="What languages do you speak?"
          onNext={handleNext}
          onBack={handleBack}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 ml-3">Add languages</span>
              <button
                type="button"
                className="w-6 h-6 flex items-center justify-center"
                onClick={() => {
                  const newLanguages = [...formData.languages, { language: "", proficiency: "" }];
                  updateFormData('languages', newLanguages);
                }}
              >
                <img src="/lovable-uploads/fe020fe6-23d4-4f7b-a50e-56b924e47bd3.png" alt="Add" className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Select 
                      value={lang.language}
                      onValueChange={(value) => {
                        const newLanguages = [...formData.languages];
                        newLanguages[index] = { ...newLanguages[index], language: value };
                        updateFormData('languages', newLanguages);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Portuguese">Portuguese</SelectItem>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                        <SelectItem value="Dutch">Dutch</SelectItem>
                        <SelectItem value="Swahili">Swahili</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center space-x-2">
                       <div className="flex space-x-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button
                             key={star}
                             type="button"
                             className="w-6 h-6"
                             onClick={() => {
                               const newLanguages = [...formData.languages];
                               newLanguages[index] = { ...newLanguages[index], proficiency: star.toString() };
                               updateFormData('languages', newLanguages);
                             }}
                           >
                             <img 
                               src={parseInt(lang.proficiency || '0') >= star ? starYellowIcon : starGrayIcon}
                               alt="Star rating"
                               className="w-6 h-6"
                             />
                           </button>
                         ))}
                       </div>
                      <span className="text-xs text-gray-500">
                        {lang.proficiency === '1' && 'Basic'}
                        {lang.proficiency === '2' && 'Intermediate'}
                        {lang.proficiency === '3' && 'Advanced'}
                        {lang.proficiency === '4' && 'Fluent'}
                        {lang.proficiency === '5' && 'Native'}
                      </span>
                    </div>
                  </div>
                  
                  {formData.languages.length > 1 && (
                    <button
                      type="button"
                      className="w-6 h-6 flex items-center justify-center"
                      onClick={() => {
                        const newLanguages = formData.languages.filter((_, i) => i !== index);
                        updateFormData('languages', newLanguages);
                      }}
                    >
                      <img src="/lovable-uploads/fbe391fb-a970-44a6-9743-56524d714816.png" alt="Remove" className="w-6 h-6" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </OnboardingStep>
      )}

      {currentStep === 8 && (
        <OnboardingStep
          step={8}
          totalSteps={8}
          title="Choose your profile picture"
          onNext={handleFinish}
          onBack={handleBack}
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Note ✅</span> : To create a culture of trust, we ask all our users to have real pictures of their own face. <span className="font-medium">Users flagged as using other types of pictures may be banned.</span>
                </p>
              </div>
            </div>
            <div className="h-5"></div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload your photo</p>
            </div>
          </div>
        </OnboardingStep>
      )}
    </div>
  );
};

export default Onboarding;