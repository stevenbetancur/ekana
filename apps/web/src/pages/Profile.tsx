import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useGamificationContext } from "@/contexts/GamificationContext";
import { useTeamContext } from "@/contexts/TeamContext";
import { useProgressContext } from "@/contexts/ProgressContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Edit, Star, Trophy, Target, Calendar, Users, BookOpen, Crown, Clock, MessageSquare, Video, Phone, UserCheck, CheckCircle, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { SUBJECTS, GOALS, LEVELS, COMMUNICATION_OPTIONS, INTEREST_OPTIONS, TIME_SLOTS, DAY_TYPES, AVAILABLE_LANGUAGES } from '@/lib/constants';

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { profile, updateProfile, calculateAge } = useUserProfile();
  const { settings, updateSetting } = useUserSettings();
  const { getUserPoints, getUserBadges } = useGamificationContext();
  const { getUserTeams } = useTeamContext();
  const { activations } = useProgressContext();
  
  // Individual edit states for each card
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingLearningPrefs, setIsEditingLearningPrefs] = useState(false);
  const [isEditingInterestsAvail, setIsEditingInterestsAvail] = useState(false);
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  
  // Local edit state for Identity (Name, Location, Birthdate)
  const [editIdentity, setEditIdentity] = useState({
    name: '',
    location: '',
    birthDate: { month: '', day: '', year: '' }
  });
  
  // Local edit state for Basic Info card
  const [editBasicInfo, setEditBasicInfo] = useState({
    bio: '',
    subject: '',
    goal: '',
    level: ''
  });

  // Local edit state for Learning Preferences card
  const [editLearningPrefs, setEditLearningPrefs] = useState({
    weeklyHours: 5,
    communicationMethods: [] as string[],
    languages: [] as { language: string; proficiency: string }[]
  });

  // Local edit state for Interests & Availability card
  const [editInterestsAvail, setEditInterestsAvail] = useState({
    interests: [] as string[],
    schedule: { weekdays: [] as string[], weekend: [] as string[] }
  });

  // Sync identity edit state when entering edit mode
  useEffect(() => {
    if (isEditingIdentity) {
      setEditIdentity({
        name: profile.name || '',
        location: profile.location || '',
        birthDate: profile.birthDate || { month: '', day: '', year: '' }
      });
    }
  }, [isEditingIdentity, profile.name, profile.birthDate, profile.location]);

  // Sync edit states from context when entering edit mode
  useEffect(() => {
    if (isEditingBasicInfo) {
      setEditBasicInfo({
        bio: profile.bio,
        subject: profile.subject,
        goal: profile.goal,
        level: profile.level
      });
    }
  }, [isEditingBasicInfo, profile.bio, profile.subject, profile.goal, profile.level]);

  useEffect(() => {
    if (isEditingLearningPrefs) {
      setEditLearningPrefs({
        weeklyHours: profile.weeklyHours,
        communicationMethods: [...profile.communicationMethods],
        // Normalize proficiency to capitalized form expected by Select component
        languages: profile.languages.map(l => ({ 
          language: l.language, 
          proficiency: normalizeProficiency(l.proficiency) 
        }))
      });
    }
  }, [isEditingLearningPrefs, profile.weeklyHours, profile.communicationMethods, profile.languages]);

  useEffect(() => {
    if (isEditingInterestsAvail) {
      console.log('🎯 Syncing interests edit state from profile:', profile.interests);
      setEditInterestsAvail({
        interests: [...profile.interests],
        schedule: {
          weekdays: [...profile.schedule.weekdays],
          weekend: [...profile.schedule.weekend]
        }
      });
    }
  }, [isEditingInterestsAvail, profile.interests, profile.schedule]);

  // Helper function to toggle array items
  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  // Helper function to get communication icon
  const getCommunicationIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'video calls':
        return Video;
      case 'voice calls':
        return Phone;
      case 'text chat':
        return MessageSquare;
      case 'screen sharing':
        return Users;
      case 'in-person meetups':
        return UserCheck;
      default:
        return MessageSquare;
    }
  };

  // Helper function to convert star rating to proficiency text (for display)
  const getProficiencyText = (proficiency: string) => {
    const lowerProf = proficiency.toLowerCase();
    
    if (proficiency === "1" || lowerProf === "beginner") return "beginner";
    if (proficiency === "2" || lowerProf === "intermediate") return "intermediate";
    if (proficiency === "3" || lowerProf === "advanced") return "advanced";
    if (proficiency === "4" || lowerProf === "fluent") return "fluent";
    if (proficiency === "5" || lowerProf === "native") return "native";
    
    return lowerProf;
  };

  // Helper function to normalize proficiency to capitalized form (for Select component)
  const normalizeProficiency = (proficiency: string): string => {
    const lowerProf = proficiency.toLowerCase();
    
    if (proficiency === "1" || lowerProf === "beginner") return "Beginner";
    if (proficiency === "2" || lowerProf === "intermediate") return "Intermediate";
    if (proficiency === "3" || lowerProf === "advanced") return "Advanced";
    if (proficiency === "4" || lowerProf === "fluent") return "Fluent";
    if (proficiency === "5" || lowerProf === "native") return "Native";
    
    // If already capitalized or unrecognized, return as-is
    const found = PROFICIENCY_LEVELS.find(p => p.toLowerCase() === lowerProf);
    return found || proficiency;
  };

  // Helper function to format availability
  const formatAvailability = () => {
    const { weekdays = [], weekend = [] } = profile.schedule;
    const result = [];
    
    if (weekdays.length > 0) {
      const weekdayTimes = weekdays.map(time => time.toLowerCase()).join(', ');
      result.push(`Weekdays in the ${weekdayTimes}`);
    }
    
    if (weekend.length > 0) {
      const weekendTimes = weekend.map(time => time.toLowerCase()).join(', ');
      result.push(`Weekends in the ${weekendTimes}`);
    }
    
    return result;
  };

  // TODO: Implement rate limiting for name/DOB changes (1x per 60 days) in backend.
  const handleSaveIdentity = () => {
    // Validation: name cannot be empty
    if (!editIdentity.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    // Validation: if birthDate is provided, ensure age is >= 13
    if (editIdentity.birthDate.year && editIdentity.birthDate.month && editIdentity.birthDate.day) {
      const age = calculateAge(editIdentity.birthDate);
      if (age !== null && age < 13) {
        toast.error("You must be at least 13 years old.");
        return;
      }
    }

    // Save identity fields to UserProfileContext (source of truth for all users)
    // Also update AuthContext for current session display consistency
    updateProfile({ 
      name: editIdentity.name.trim(),
      location: editIdentity.location.trim(),
      birthDate: editIdentity.birthDate.year ? editIdentity.birthDate : null
    });
    // Keep AuthContext in sync for current user session
    updateUser({ 
      name: editIdentity.name.trim(), 
      birthDate: editIdentity.birthDate.year ? editIdentity.birthDate : undefined 
    });

    setIsEditingIdentity(false);
    toast.success("Profile identity updated.");
  };

  const handleCancelIdentity = () => {
    setIsEditingIdentity(false);
  };

  const handleSaveBasicInfo = () => {
    updateProfile({
      bio: editBasicInfo.bio,
      subject: editBasicInfo.subject,
      goal: editBasicInfo.goal,
      level: editBasicInfo.level
    });
    
    setIsEditingBasicInfo(false);
    toast.success("Basic information updated!");
  };

  const handleSaveLearningPrefs = () => {
    // Filter out incomplete language entries (both language and proficiency must be set)
    const validLanguages = editLearningPrefs.languages.filter(
      l => l.language.trim() !== '' && l.proficiency.trim() !== ''
    );
    
    updateProfile({
      weeklyHours: editLearningPrefs.weeklyHours,
      communicationMethods: editLearningPrefs.communicationMethods,
      languages: validLanguages
    });
    
    setIsEditingLearningPrefs(false);
    toast.success("Learning preferences updated!");
  };

  // Language editing helpers
  const addLanguage = () => {
    // Add empty entry - user must select both language and proficiency
    setEditLearningPrefs(prev => ({
      ...prev,
      languages: [...prev.languages, { language: '', proficiency: '' }]
    }));
  };

  const removeLanguage = (index: number) => {
    setEditLearningPrefs(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const updateLanguage = (index: number, field: 'language' | 'proficiency', value: string) => {
    setEditLearningPrefs(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => 
        i === index ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const handleSaveInterestsAvail = () => {
    updateProfile({
      interests: editInterestsAvail.interests,
      schedule: editInterestsAvail.schedule
    });
    
    setIsEditingInterestsAvail(false);
    toast.success("Interests & availability updated!");
  };

  const handleCancelBasicInfo = () => {
    setIsEditingBasicInfo(false);
  };

  const handleCancelLearningPrefs = () => {
    setIsEditingLearningPrefs(false);
  };

  const handleCancelInterestsAvail = () => {
    setIsEditingInterestsAvail(false);
  };

  // Safe schedule toggle with proper key mapping
  const toggleSchedule = (dayType: string, timeSlot: string) => {
    const dayKey = dayType.toLowerCase() === 'weekdays' ? 'weekdays' : 'weekend';
    setEditInterestsAvail(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayKey]: prev.schedule[dayKey].includes(timeSlot)
          ? prev.schedule[dayKey].filter(slot => slot !== timeSlot)
          : [...prev.schedule[dayKey], timeSlot]
      }
    }));
  };

  // Calculate stats from context data
  const userTeams = user?.id ? getUserTeams(user.id) : [];
  const userActivations = user?.id ? activations.filter(a => a.userId === user.id) : [];
  
  const stats = {
    points: user?.id ? getUserPoints(user.id) : 0,
    badges: user?.id ? getUserBadges(user.id) : 0,
    teamsJoined: userTeams.length,
    coursesCompleted: userActivations.length,
    weekStreak: 5 // TODO: Calculate from activity data
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">{profile.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {isEditingIdentity ? (
                  <div className="space-y-3 flex-1">
                    <div>
                      <Label htmlFor="edit-name" className="text-sm text-muted-foreground">Name</Label>
                      <Input
                        id="edit-name"
                        value={editIdentity.name}
                        onChange={(e) => setEditIdentity(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-location" className="text-sm text-muted-foreground">Location</Label>
                      <Input
                        id="edit-location"
                        value={editIdentity.location}
                        onChange={(e) => setEditIdentity(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Birthdate</Label>
                      <div className="flex gap-2 mt-1">
                        <Select 
                          value={editIdentity.birthDate.month} 
                          onValueChange={(value) => setEditIdentity(prev => ({ 
                            ...prev, 
                            birthDate: { ...prev.birthDate, month: value } 
                          }))}
                        >
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>
                                {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select 
                          value={editIdentity.birthDate.day} 
                          onValueChange={(value) => setEditIdentity(prev => ({ 
                            ...prev, 
                            birthDate: { ...prev.birthDate, day: value } 
                          }))}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => (
                              <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select 
                          value={editIdentity.birthDate.year} 
                          onValueChange={(value) => setEditIdentity(prev => ({ 
                            ...prev, 
                            birthDate: { ...prev.birthDate, year: value } 
                          }))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 100 }, (_, i) => {
                              const year = new Date().getFullYear() - i - 13;
                              return (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={handleSaveIdentity}>Save</Button>
                      <Button size="sm" variant="outline" onClick={handleCancelIdentity}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h1 className="text-2xl font-bold">{profile.name}</h1>
                      {user?.isPremium && <Crown className="h-5 w-5 text-orange-500" />}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setIsEditingIdentity(true)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-muted-foreground">
                      {profile.birthDate ? `${calculateAge(profile.birthDate)} years old` : 'Age not set'}
                    </p>
                    <p className="text-muted-foreground">{profile.location || 'Location not set'}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">{profile.level || 'Not set'}</Badge>
                      <Badge variant="outline">{profile.subject || 'Not set'}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Visibility Toggle - Connected to UserSettingsContext */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="profile-visibility" className="text-sm font-medium">
                  Show my profile to other users
                </Label>
                <p className="text-xs text-muted-foreground">Allow others to find and connect with you</p>
              </div>
              <Switch 
                id="profile-visibility" 
                checked={settings.allowProfileDiscovery}
                onCheckedChange={(checked) => updateSetting('allowProfileDiscovery', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.points}</div>
              <p className="text-sm text-muted-foreground">Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.badges}</div>
              <p className="text-sm text-muted-foreground">Badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.teamsJoined}</div>
              <p className="text-sm text-muted-foreground">Teams</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.coursesCompleted}</div>
              <p className="text-sm text-muted-foreground">Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.weekStreak}</div>
              <p className="text-sm text-muted-foreground">Week Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Basic Information</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingBasicInfo(!isEditingBasicInfo)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingBasicInfo ? (
                <>
                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={editBasicInfo.bio}
                      onChange={(e) => setEditBasicInfo(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{editBasicInfo.bio.length}/500 characters</p>
                  </div>
                  <div>
                    <Label>Learning Subject</Label>
                    <Select value={editBasicInfo.subject} onValueChange={(value) => setEditBasicInfo(prev => ({ ...prev, subject: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                         {SUBJECTS.map(subject => (
                           <SelectItem key={subject.name} value={subject.name}>{subject.name}</SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Learning Goal</Label>
                    <Select value={editBasicInfo.goal} onValueChange={(value) => setEditBasicInfo(prev => ({ ...prev, goal: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                         {GOALS.map(goal => (
                           <SelectItem key={goal.name} value={goal.name}>{goal.name}</SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={editBasicInfo.level} onValueChange={(value) => setEditBasicInfo(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                         {LEVELS.map(level => (
                           <SelectItem key={level.name} value={level.name}>{level.name}</SelectItem>
                         ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveBasicInfo}>Save</Button>
                    <Button variant="outline" onClick={handleCancelBasicInfo}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground">Bio</Label>
                    <p className="mt-1">{profile.bio || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Learning Subject</Label>
                    <p className="mt-1">{profile.subject || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Goal</Label>
                    <p className="mt-1">{profile.goal || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Level</Label>
                    <p className="mt-1">{profile.level || 'Not set'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Learning Preferences</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingLearningPrefs(!isEditingLearningPrefs)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingLearningPrefs ? (
                <>
                  <div>
                    <Label>Weekly Time Commitment: {editLearningPrefs.weeklyHours} hours</Label>
                    <Slider
                      value={[editLearningPrefs.weeklyHours]}
                      min={1}
                      max={40}
                      step={1}
                      onValueChange={(value) => setEditLearningPrefs(prev => ({ ...prev, weeklyHours: value[0] }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Languages</Label>
                    <div className="space-y-2 mt-2">
                      {editLearningPrefs.languages.map((lang, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select 
                            value={lang.language || undefined} 
                            onValueChange={(value) => updateLanguage(index, 'language', value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_LANGUAGES.map(l => (
                                <SelectItem key={l} value={l}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select 
                            value={lang.proficiency || undefined} 
                            onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROFICIENCY_LEVELS.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeLanguage(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addLanguage}
                        disabled={editLearningPrefs.languages.length >= AVAILABLE_LANGUAGES.length}
                      >
                        + Add Language
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Communication Preferences</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {COMMUNICATION_OPTIONS.map(option => (
                         <div key={option.name} className="flex items-center space-x-2">
                           <Checkbox
                             id={option.name}
                             checked={editLearningPrefs.communicationMethods.includes(option.name)}
                             onCheckedChange={(checked) => {
                               setEditLearningPrefs(prev => ({
                                 ...prev,
                                 communicationMethods: checked
                                   ? [...prev.communicationMethods, option.name]
                                   : prev.communicationMethods.filter(m => m !== option.name)
                               }));
                             }}
                           />
                           <Label htmlFor={option.name} className="text-sm">{option.name}</Label>
                         </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveLearningPrefs}>Save</Button>
                    <Button variant="outline" onClick={handleCancelLearningPrefs}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Weekly Hours
                    </Label>
                    <p className="mt-1">{profile.weeklyHours || 'Not set'} hours</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Languages</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.languages?.length > 0 ? profile.languages.map((lang, index) => (
                        <Badge key={index} variant="secondary">
                          {lang.language} ({getProficiencyText(lang.proficiency)})
                        </Badge>
                      )) : <span className="text-muted-foreground">Not set</span>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Communication Preferences</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.communicationMethods?.length > 0 ? profile.communicationMethods.map((method, index) => {
                        const IconComponent = getCommunicationIcon(method);
                        return (
                          <div key={index} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                            <IconComponent className="h-3 w-3" />
                            <span className="text-sm">{method}</span>
                          </div>
                        );
                      }) : <span className="text-muted-foreground">Not set</span>}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interests & Availability */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interests & Availability</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingInterestsAvail(!isEditingInterestsAvail)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditingInterestsAvail ? (
              <>
                <div>
                  <Label>Interests</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {INTEREST_OPTIONS.map(interest => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={editInterestsAvail.interests.includes(interest)}
                          onCheckedChange={() => {
                            setEditInterestsAvail(prev => ({
                              ...prev,
                              interests: toggleArrayItem(prev.interests, interest)
                            }));
                          }}
                        />
                        <Label htmlFor={interest} className="text-sm">{interest}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Study Availability</Label>
                  <div className="bg-muted rounded-lg p-4 mt-2">
                    {/* Time headers */}
                    <div className="grid grid-cols-4 gap-4 text-center mb-4">
                      <div></div>
                      {TIME_SLOTS.map((slot) => (
                        <div key={slot} className="font-medium text-muted-foreground py-2 text-sm">
                          {slot}
                        </div>
                      ))}
                    </div>

                    {/* Schedule grid */}
                    <div className="space-y-3">
                      {DAY_TYPES.map((dayType) => {
                        // Safe key mapping
                        const dayKey = dayType.toLowerCase() === 'weekdays' ? 'weekdays' : 'weekend';
                        return (
                          <div key={dayType} className="grid grid-cols-4 gap-4 items-center">
                            <div className="font-medium text-muted-foreground text-sm">{dayType}</div>
                            {TIME_SLOTS.map((slot) => {
                              const isSelected = editInterestsAvail.schedule[dayKey]?.includes(slot);
                              return (
                                <div key={slot} className="flex justify-center">
                                  <button
                                    onClick={() => toggleSchedule(dayType, slot)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected 
                                        ? "bg-primary border-primary text-primary-foreground" 
                                        : "border-border bg-background hover:bg-muted hover:border-muted-foreground"
                                    }`}
                                  >
                                    {isSelected && <CheckCircle className="w-5 h-5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleSaveInterestsAvail}>Save</Button>
                  <Button variant="outline" onClick={handleCancelInterestsAvail}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm text-muted-foreground">Interests</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.interests?.filter(i => i && i.trim()).length > 0 ? 
                      profile.interests.filter(i => i && i.trim()).map((interest, index) => (
                        <Badge key={`interest-${index}-${interest}`} variant="secondary">{interest}</Badge>
                      )) : <span className="text-muted-foreground">Not set</span>
                    }
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Study Availability
                  </Label>
                  <div className="mt-1 space-y-2">
                    {formatAvailability().length > 0 ? (
                      formatAvailability().map((schedule, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{schedule}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
