import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { userProfileService, UserProfile, defaultProfile } from '@/services/userProfile';

// Re-export UserProfile type for consumers
export type { UserProfile } from '@/services/userProfile';

interface UserProfileContextType {
  // Loading state
  isLoading: boolean;

  // Backward compatibility - current user's profile
  profile: UserProfile;

  // Query functions (The API)
  getUserProfile: (userId: string) => UserProfile | undefined;
  getAllVisibleProfiles: () => UserProfile[];
  searchUsers: (query: string) => UserProfile[];

  // Mutation function
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Utility
  calculateAge: (birthDate: { month: string; day: string; year: string } | null) => number | null;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Internal state - NOT exposed directly
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Los perfiles requieren sesión: se cargan al iniciar sesión y se vacían al cerrarla.
  useEffect(() => {
    if (!user?.id) {
      setAllProfiles([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    userProfileService
      .fetchAllProfiles()
      .then((profiles) => {
        if (mounted) setAllProfiles(profiles);
      })
      .catch((error) => {
        console.error('Failed to load user profiles:', error);
        toast.error('Failed to load user profiles');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Backward compatibility: current user's profile
  const profile: UserProfile = allProfiles.find(p => p.id === user?.id) || { ...defaultProfile, id: user?.id || '' };

  // Helper function to calculate age from birthDate
  const calculateAge = useCallback((birthDate: { month: string; day: string; year: string } | null): number | null => {
    if (!birthDate || !birthDate.year || !birthDate.month || !birthDate.day) return null;

    const today = new Date();
    const birth = new Date(
      parseInt(birthDate.year),
      parseInt(birthDate.month) - 1,
      parseInt(birthDate.day)
    );

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }, []);

  // Query Functions (The API)
  const getUserProfile = useCallback((userId: string): UserProfile | undefined => {
    return allProfiles.find(p => p.id === userId);
  }, [allProfiles]);

  const getAllVisibleProfiles = useCallback((): UserProfile[] => {
    // TODO: Add visibility/privacy filtering here when needed
    return allProfiles;
  }, [allProfiles]);

  const searchUsers = useCallback((query: string): UserProfile[] => {
    if (!query.trim()) return allProfiles;

    const lowerQuery = query.toLowerCase();
    return allProfiles.filter(p =>
      p.bio.toLowerCase().includes(lowerQuery) ||
      p.location.toLowerCase().includes(lowerQuery) ||
      p.subject.toLowerCase().includes(lowerQuery) ||
      p.interests.some(i => i.toLowerCase().includes(lowerQuery))
    );
  }, [allProfiles]);

  // Mutation Function with Optimistic Updates
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    console.log('🔵 [Context] updateProfile START:', { userId: user?.id, updates });

    if (!user) {
      console.error('❌ [Context] No user logged in');
      toast.error('You must be logged in to update your profile');
      return;
    }

    // Validation: bio max 500 chars
    if (updates.bio !== undefined && updates.bio.length > 500) {
      toast.error("Bio must be 500 characters or less.");
      return;
    }

    // Validation: location max 100 chars
    if (updates.location !== undefined && updates.location.length > 100) {
      toast.error("Location must be 100 characters or less.");
      return;
    }

    // Validation: weeklyHours must be non-negative
    if (updates.weeklyHours !== undefined && updates.weeklyHours < 0) {
      toast.error("Weekly hours cannot be negative.");
      return;
    }

    // Validation: birthDate year must be reasonable
    if (updates.birthDate !== undefined && updates.birthDate !== null) {
      const year = parseInt(updates.birthDate.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        toast.error("Please enter a valid birth year.");
        return;
      }
    }

    // Store previous state for rollback
    const previousProfiles = [...allProfiles];

    // 1. Optimistic Update
    setAllProfiles(prev => {
      const index = prev.findIndex(p => p.id === user.id);
      if (index === -1) {
        // Add new profile
        return [...prev, { ...defaultProfile, id: user.id, ...updates }];
      }
      // Update existing
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
    console.log('🟢 [Context] Optimistic update applied');

    try {
      // 2. Service Call
      console.log('🟡 [Context] Awaiting service call...');
      const result = await userProfileService.updateProfile(user.id, updates);
      console.log('✅ [Context] Service SUCCESS:', result);

      // 3. Refetch to ensure DB consistency
      const fresh = await userProfileService.getProfileById(user.id);
      if (fresh) {
        setAllProfiles(prev => {
          const index = prev.findIndex(p => p.id === user.id);
          if (index === -1) return [...prev, fresh];
          const updated = [...prev];
          updated[index] = fresh;
          return updated;
        });
        console.log('🔄 [Context] Profile refetched and synced');
      }
    } catch (error) {
      // 4. Error Handling - Rollback
      console.error('❌ [Context] Service FAILED:', error);
      setAllProfiles(previousProfiles);
      toast.error('Failed to save profile changes. Please try again.');
      throw error; // Re-throw so caller knows it failed
    }
    console.log('🏁 [Context] updateProfile END');
  }, [user, allProfiles]);

  return (
    <UserProfileContext.Provider value={{
      isLoading,
      profile,
      getUserProfile,
      getAllVisibleProfiles,
      searchUsers,
      updateProfile,
      calculateAge
    }}>
      {children}
    </UserProfileContext.Provider>
  );
};
