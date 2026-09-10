// UserProfile interface - must match User.id from mockData
// Includes identity fields (name, avatar) that can be updated by users
export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  birthDate: { month: string; day: string; year: string } | null;
  subject: string;
  goal: string;
  level: string;
  weeklyHours: number;
  communicationMethods: string[];
  languages: { language: string; proficiency: string }[];
  interests: string[];
  availability?: string[];
  schedule: { weekdays: string[]; weekend: string[] };
  isPremium?: boolean;
  profileComplete?: boolean;
  hasActiveTeam?: boolean;
  activeCourse?: string;
}

/**
 * Service interface for user profile operations.
 * Implementations: local (mock data) and supabase (production).
 */
export interface UserProfileService {
  /** Fetch all user profiles */
  fetchAllProfiles(): Promise<UserProfile[]>;
  
  /** Update a user's profile by ID */
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  
  /** 
   * Fetch a single profile by user ID.
   * Returns null if the profile doesn't exist (e.g., race condition during signup).
   */
  getProfileById(id: string): Promise<UserProfile | null>;
}

export const defaultProfile: UserProfile = {
  id: '',
  name: '',
  avatar: '',
  bio: '',
  location: '',
  birthDate: null,
  subject: '',
  goal: '',
  level: '',
  weeklyHours: 5,
  communicationMethods: [],
  languages: [{ language: 'English', proficiency: 'Native' }],
  interests: [],
  schedule: { weekdays: [], weekend: [] },
};
