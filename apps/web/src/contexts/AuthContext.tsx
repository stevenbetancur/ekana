import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { analyticsService } from '@/services/analytics';
import { userProfileService } from '@/services/userProfile';

// User type that components consume
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium: boolean;
  profileComplete: boolean;
  hasActiveTeam: boolean;
  activeCourse?: string;
  // Profile fields (maintained for backward compatibility with mockData.User)
  bio?: string;
  interests?: string[];
  languages?: Array<{ language: string; proficiency: string }>;
  weeklyHours?: number;
  availability?: string[];
  communicationMethods?: string[];
  level?: string;
  goal?: "Change careers" | "Have fun" | "Learn new skills" | "Start a new career";
  subject?: string;
  customSubject?: string;
  schedule?: { weekdays: string[]; weekend: string[] };
  birthDate?: { month: string; day: string; year: string };
  location?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  clearError: () => void;
  hasActiveEntitlement: (userId: string, roadmapId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Transform Supabase user + profile data into our User type
async function buildUserFromSupabase(supabaseUser: SupabaseUser): Promise<User> {
  console.log('🔍 [Auth] Building user from Supabase:', {
    id: supabaseUser.id,
    email: supabaseUser.email,
    metadata_full_name: supabaseUser.user_metadata?.full_name,
  });

  // Fetch profile data via service layer (efficient single-record query)
  const profile = await userProfileService.getProfileById(supabaseUser.id);

  console.log('🔍 [Auth] Profile from DB:', profile ? {
    id: profile.id,
    name: profile.name,
    profileComplete: profile.profileComplete,
    // JSONB-derived fields (these should be populated after onboarding)
    bio: profile.bio,
    subject: profile.subject,
    goal: profile.goal,
    level: profile.level,
    weeklyHours: profile.weeklyHours,
    interests: profile.interests,
    languages: profile.languages,
  } : 'NULL (profile not found)');

  // Check team membership (will be refactored to TeamService later)
  const { data: teamMembership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', supabaseUser.id)
    .limit(1);

  // CRITICAL: Always prefer auth metadata name as fallback
  // The DB trigger may fail to capture it, so we use metadata as source of truth
  const nameFromMetadata = supabaseUser.user_metadata?.full_name;

  // Handle null profile gracefully (e.g., race condition during signup)
  // Fall back to basic user data from Auth metadata
  if (!profile) {
    console.log('⚠️ [Auth] No profile found, using auth metadata. Name:', nameFromMetadata);
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: nameFromMetadata || 'User',
      avatar: undefined,
      isPremium: false,
      profileComplete: false,
      hasActiveTeam: (teamMembership?.length || 0) > 0,
      activeCourse: undefined,
    };
  }

  // Use profile name if set, otherwise fall back to auth metadata
  const resolvedName = profile.name || nameFromMetadata || 'User';
  console.log('✅ [Auth] Resolved name:', resolvedName, '(from profile:', profile.name, ', from metadata:', nameFromMetadata, ')');

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: resolvedName,
    avatar: profile.avatar || undefined,
    isPremium: profile.isPremium || false,
    profileComplete: profile.profileComplete, // Use DB flag directly instead of deriving
    hasActiveTeam: (teamMembership?.length || 0) > 0,
    activeCourse: profile.activeCourse,
    // Merge profile fields for backward compatibility
    bio: profile.bio,
    interests: profile.interests,
    languages: profile.languages,
    weeklyHours: profile.weeklyHours,
    communicationMethods: profile.communicationMethods,
    level: profile.level,
    goal: profile.goal as User['goal'],
    subject: profile.subject,
    schedule: profile.schedule,
    birthDate: profile.birthDate || undefined,
    location: profile.location,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (newSession?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(async () => {
            try {
              const appUser = await buildUserFromSupabase(newSession.user);
              setUser(appUser);
              
              // Track login event
              if (event === 'SIGNED_IN') {
                analyticsService.trackEvent(appUser.id, { eventType: 'login' });
              }
            } catch (err) {
              console.error('Failed to build user from session:', err);
              setUser(null);
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        try {
          const appUser = await buildUserFromSupabase(existingSession.user);
          setUser(appUser);
        } catch (err) {
          console.error('Failed to build user from existing session:', err);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    setError(null);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const friendlyMessage = getFriendlyAuthError(signInError.message);
      setError(friendlyMessage);
      return { error: new Error(friendlyMessage) };
    }

    return { error: null };
  };

  const signup = async (email: string, password: string, name: string): Promise<{ error: Error | null }> => {
    setError(null);
    console.log('🔐 [Auth] Signup initiated:', { email, name: name ? '✓ provided' : '❌ missing' });
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      console.error('❌ [Auth] Signup error:', signUpError.message);
      const friendlyMessage = getFriendlyAuthError(signUpError.message);
      setError(friendlyMessage);
      return { error: new Error(friendlyMessage) };
    }

    // Log what was returned to verify metadata was set
    console.log('✅ [Auth] Signup success:', {
      userId: data.user?.id,
      email: data.user?.email,
      metadata_full_name: data.user?.user_metadata?.full_name,
    });

    // Track signup
    if (data.user) {
      analyticsService.trackEvent(data.user.id, { eventType: 'signup' });
    }

    return { error: null };
  };

  const logout = async (): Promise<void> => {
    // Track logout before signing out
    if (user) {
      analyticsService.trackEvent(user.id, { eventType: 'logout' });
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    setError(null);
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    if (resetError) {
      const friendlyMessage = getFriendlyAuthError(resetError.message);
      setError(friendlyMessage);
      return { error: new Error(friendlyMessage) };
    }

    return { error: null };
  };

  const clearError = () => setError(null);

  // Check if user has entitlement to a roadmap (for paid content)
  const hasActiveEntitlement = (userId: string, roadmapId: string): boolean => {
    // TODO: Implement with Supabase query to user_entitlements table
    // For now, return true (allow access) - implement proper check in Phase 2
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      login,
      signup,
      logout,
      updateUser,
      resetPassword,
      clearError,
      hasActiveEntitlement,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper: Convert Supabase error messages to user-friendly messages
function getFriendlyAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please check your email and click the confirmation link.',
    'User already registered': 'An account with this email already exists. Try signing in.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Email rate limit exceeded': 'Too many attempts. Please try again in a few minutes.',
  };

  return errorMap[message] || message;
}
