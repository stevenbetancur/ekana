import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { MeResponse } from '@ekana/shared';
import { authClient } from '@/lib/auth-client';
import { api, ApiError } from '@/lib/api';
import { analyticsService } from '@/services/analytics';

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
  age?: number | null;
  location?: string;
}

export interface AuthResult {
  error: Error | null;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
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

const VERIFY_CALLBACK = '/onboarding';
const RESET_CALLBACK = '/auth/reset-password';

const FRIENDLY_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password. Please try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email first. We just sent you a new verification link.',
  USER_ALREADY_EXISTS: 'An account with this email already exists. Try signing in.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists. Try signing in.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_TOO_LONG: 'Password must be at most 128 characters long.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_TOKEN: 'This link is invalid or has expired. Please request a new one.',
  TOKEN_EXPIRED: 'This link is invalid or has expired. Please request a new one.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
};

function toFriendly(error: { code?: string; message?: string; status?: number }): { code?: string; message: string } {
  const code = error.code ?? (error.status === 429 ? 'RATE_LIMITED' : undefined);
  return { code, message: (code && FRIENDLY_MESSAGES[code]) || error.message || 'Something went wrong. Please try again.' };
}

function toUser({ user, profile }: MeResponse): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name || 'User',
    avatar: profile.avatar || undefined,
    isPremium: profile.isPremium,
    profileComplete: profile.profileComplete,
    hasActiveTeam: profile.hasActiveTeam,
    activeCourse: profile.activeCourse ?? undefined,
    bio: profile.bio,
    interests: profile.interests,
    languages: profile.languages,
    weeklyHours: profile.weeklyHours,
    availability: profile.availability,
    communicationMethods: profile.communicationMethods,
    level: profile.level,
    goal: profile.goal as User['goal'],
    subject: profile.subject,
    schedule: profile.schedule,
    birthDate: profile.birthDate ?? undefined,
    age: profile.age,
    location: profile.location,
  };
}

async function fetchCurrentUser(): Promise<User | null> {
  try {
    return toUser(await api.get<MeResponse>('/v1/me'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch((err) => console.error('Failed to load the current session:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fail = (err: { code?: string; message?: string; status?: number }): AuthResult => {
    const friendly = toFriendly(err);
    setError(friendly.message);
    return { error: new Error(friendly.message), code: friendly.code };
  };

  const refreshUser = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    if (signInError) return fail(signInError);
    const current = await fetchCurrentUser();
    setUser(current);
    if (current) analyticsService.trackEvent(current.id, { eventType: 'login' });
    return { error: null };
  };

  const signup = async (email: string, password: string, name: string): Promise<AuthResult> => {
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({ email, password, name, callbackURL: VERIFY_CALLBACK });
    if (signUpError) return fail(signUpError);
    return { error: null };
  };

  const logout = async (): Promise<void> => {
    if (user) analyticsService.trackEvent(user.id, { eventType: 'logout' });
    // Sin strictNullChecks los tipos de Better Auth vuelven obligatorio el argumento.
    await authClient.signOut({});
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    setError(null);
    const { error: resetError } = await authClient.requestPasswordReset({ email, redirectTo: RESET_CALLBACK });
    if (resetError) return fail(resetError);
    return { error: null };
  };

  const confirmPasswordReset = async (token: string, newPassword: string): Promise<AuthResult> => {
    setError(null);
    const { error: resetError } = await authClient.resetPassword({ token, newPassword });
    if (resetError) return fail(resetError);
    return { error: null };
  };

  const resendVerification = async (email: string): Promise<AuthResult> => {
    setError(null);
    const { error: sendError } = await authClient.sendVerificationEmail({ email, callbackURL: VERIFY_CALLBACK });
    if (sendError) return fail(sendError);
    return { error: null };
  };

  const clearError = () => setError(null);

  // Check if user has entitlement to a roadmap (for paid content). Se implementa en la fase de roadmaps.
  const hasActiveEntitlement = (_userId: string, _roadmapId: string): boolean => true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
        resetPassword,
        confirmPasswordReset,
        resendVerification,
        clearError,
        hasActiveEntitlement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
