import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from './types';
import { mapProfile } from '@/lib/supabase-mapper';

/**
 * DESIGN DECISION: Empty String Handling
 * 
 * We allow empty strings ("") to be saved to the database because:
 * 1. User Intent: If a user deletes their bio text, we respect that action
 * 2. Distinction: Forms should send `undefined` for fields they don't touch
 * 3. Explicitness: To clear a field, send "" or null, not undefined
 * 
 * Example:
 * - updateProfile(id, { bio: "" })        → Clears bio field ✅
 * - updateProfile(id, { bio: undefined }) → Leaves bio unchanged ✅
 * - updateProfile(id, { bio: "New bio" }) → Updates to new value ✅
 */

/**
 * Filters update payload to only include explicitly set values.
 * 
 * Rules:
 * - undefined → SKIP (field not provided, don't touch DB)
 * - null → INCLUDE (user wants to clear field)
 * - "" → INCLUDE (user cleared text field)
 * - 0 → INCLUDE (valid number)
 * - false → INCLUDE (valid boolean)
 */
function filterUpdatePayload(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
}

// Convert birthDate object to YYYY-MM-DD
function formatBirthDate(birthDate: { month: string; day: string; year: string } | null): string | null {
  if (!birthDate) return null;
  return `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Failed to fetch profiles:', error);
    throw error;
  }

  return (data || []).map(row => mapProfile(row as Record<string, unknown>));
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  console.log('🔄 [Service] updateProfile ENTRY:', { userId, updates });

  // Race condition protection: Verify profile exists before updating
  const { data: profileExists, error: existsError } = await supabase
    .from('profiles')
    .select('id, onboarding_data, preferences, schedule, profile_complete, has_active_team')
    .eq('id', userId)
    .single();

  if (existsError || !profileExists) {
    console.error('❌ [Service] Profile not found:', existsError);
    throw new Error('Profile not initialized. Please wait and try again.');
  }

  console.log('✅ [Service] Profile exists, current JSONB:', {
    onboarding_data: profileExists.onboarding_data,
    preferences: profileExists.preferences,
    schedule: profileExists.schedule,
    profile_complete: profileExists.profile_complete,
    has_active_team: profileExists.has_active_team,
  });

  // Parse existing JSONB columns (or default to empty objects)
  const currentOnboarding = (profileExists.onboarding_data as Record<string, unknown>) || {};
  const currentPreferences = (profileExists.preferences as Record<string, unknown>) || {};
  const currentSchedule = (profileExists.schedule as Record<string, unknown>) || {};

  // Build the update payload
  const dbPayload: Record<string, unknown> = {};

  // === Flat field mappings (allow empty strings and null) ===
  if (updates.name !== undefined) dbPayload.name = updates.name;
  if (updates.avatar !== undefined) dbPayload.avatar_url = updates.avatar;
  if (updates.bio !== undefined) dbPayload.bio = updates.bio;
  if (updates.location !== undefined) dbPayload.location = updates.location;
  if (updates.isPremium !== undefined) dbPayload.is_premium = updates.isPremium;
  if (updates.activeCourse !== undefined) dbPayload.active_course = updates.activeCourse;
  if (updates.profileComplete !== undefined) dbPayload.profile_complete = updates.profileComplete;
  if (updates.hasActiveTeam !== undefined) dbPayload.has_active_team = updates.hasActiveTeam;

  // Map birthDate to snake_case
  if (updates.birthDate !== undefined) {
    dbPayload.birth_date = updates.birthDate
      ? `${updates.birthDate.year}-${updates.birthDate.month.padStart(2, '0')}-${updates.birthDate.day.padStart(2, '0')}`
      : null;
  }

  // === JSONB: onboarding_data (merge with existing) ===
  const onboardingUpdates = filterUpdatePayload({
    subject: updates.subject,
    goal: updates.goal,
    level: updates.level,
    weeklyHours: updates.weeklyHours,
    communicationMethods: updates.communicationMethods,
  });

  if (Object.keys(onboardingUpdates).length > 0) {
    dbPayload.onboarding_data = {
      ...currentOnboarding,
      ...onboardingUpdates
    };
    console.log('📦 [Service] Packing onboarding_data:', dbPayload.onboarding_data);
  }

  // === JSONB: preferences (merge with existing) ===
  const preferencesUpdates = filterUpdatePayload({
    languages: updates.languages,
    interests: updates.interests,
    availability: updates.availability,
  });

  if (Object.keys(preferencesUpdates).length > 0) {
    dbPayload.preferences = {
      ...currentPreferences,
      ...preferencesUpdates
    };
    console.log('📦 [Service] Packing preferences:', dbPayload.preferences);
  }

  // === JSONB: schedule (merge with existing) ===
  if (updates.schedule !== undefined) {
    dbPayload.schedule = {
      ...currentSchedule,
      ...updates.schedule,
    };
    console.log('📦 [Service] Packing schedule:', dbPayload.schedule);
  }

  console.log('📦 [Service] Final DB Payload:', dbPayload);
  console.log('🧾 [Service] JSON Stringify Payload:', JSON.stringify(dbPayload, null, 2));

  // Verify auth user matches target ID to avoid silent RLS block
  const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
  const authUserId = authUserData?.user?.id;
  if (authUserError || !authUserId) {
    console.warn('⚠️ [Service] Could not fetch auth user before update:', authUserError);
  } else if (authUserId !== userId) {
    console.error('❌ [Service] Auth user mismatch detected:', { userId, authUserId });
    throw new Error('Authenticated user mismatch; update will be blocked by RLS.');
  } else {
    console.log('✅ [Service] Auth user matches target profile:', { userId, authUserId });
  }

  // Execute the update
  const { data, error } = await supabase
    .from('profiles')
    .update(dbPayload)
    .eq('id', userId)
    .select();

  if (error) {
    console.error('❌ [Service] Supabase error:', error);
    throw new Error(`Profile update failed: ${error.message}`);
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    console.error('❌ [Service] Update returned no data. Possible RLS block or ID mismatch.', { data });
    throw new Error('Update returned no data');
  }

  const updatedRow = Array.isArray(data) ? data[0] : data;
  console.log('✅ [Service] Profile Updated Successfully:', updatedRow);

  return mapProfile(updatedRow as Record<string, unknown>);
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = "Row not found" - expected for new signups before profile is created
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Failed to fetch profile by ID:', error);
    throw error;
  }

  return mapProfile(data as Record<string, unknown>);
}
