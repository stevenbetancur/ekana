import { UserProfile, defaultProfile } from './types';
import { mockUsers, EKKY_AI_ID } from '@/lib/mockData';

const STORAGE_KEY = 'ekana_all_user_profiles';
const CURRENT_VERSION = 2; // Bumped to include name/avatar fields

interface StorageEnvelope {
  version: number;
  lastUpdated: number;
  data: UserProfile[];
}

// Transform mockUsers to UserProfile format for seeding
function seedFromMockUsers(): UserProfile[] {
  return mockUsers
    .filter(user => user.id !== EKKY_AI_ID) // Exclude AI user from profiles
    .map(user => ({
      id: user.id,
      name: user.name || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      location: user.location || '',
      birthDate: user.birthDate || null,
      subject: user.subject || '',
      goal: user.goal || '',
      level: user.level || '',
      weeklyHours: user.weeklyHours || 5,
      communicationMethods: user.communicationMethods || [],
      languages: user.languages || [{ language: 'English', proficiency: 'Native' }],
      interests: user.interests || [],
      schedule: user.schedule || { weekdays: [], weekend: [] },
    }));
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    try {
      const envelope: StorageEnvelope = JSON.parse(stored);
      
      // Version check - if mismatch, re-seed from mock data
      if (envelope.version !== CURRENT_VERSION) {
        console.log('🔄 Profile version mismatch, re-seeding from mock data');
        const seeded = seedFromMockUsers();
        await saveAllProfiles(seeded);
        return seeded;
      }
      
      return envelope.data;
    } catch (e) {
      console.warn('Invalid stored profiles, re-seeding', e);
    }
  }
  
  // No data or parse error - seed from mock users
  console.log('🌱 Seeding user profiles from mock data');
  const seeded = seedFromMockUsers();
  await saveAllProfiles(seeded);
  return seeded;
}

async function saveAllProfiles(profiles: UserProfile[]): Promise<void> {
  const envelope: StorageEnvelope = {
    version: CURRENT_VERSION,
    lastUpdated: Date.now(),
    data: profiles,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const profiles = await fetchAllProfiles();
  const index = profiles.findIndex(p => p.id === userId);
  
  if (index === -1) {
    // Create new profile if doesn't exist
    const newProfile: UserProfile = { ...defaultProfile, id: userId, ...updates };
    profiles.push(newProfile);
    await saveAllProfiles(profiles);
    return newProfile;
  }
  
  // Update existing profile
  const updatedProfile = { ...profiles[index], ...updates };
  profiles[index] = updatedProfile;
  await saveAllProfiles(profiles);
  return updatedProfile;
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  const profiles = await fetchAllProfiles();
  return profiles.find(p => p.id === id) || null;
}