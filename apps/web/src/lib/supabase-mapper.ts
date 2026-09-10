import { UserProfile } from '@/services/userProfile/types';
import { Team, TeamMember, Message, Notification, NotificationType, NotificationLevel, CourseRoadmap, Unit, Subunit } from '@/lib/mockData';
import { Request, RequestType, RequestStatus } from '@/services/requests/types';

/**
 * Transforms a Supabase profiles table row to the app's UserProfile type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - JSONB column parsing (onboarding_data, preferences, schedule)
 * - Null handling for optional fields
 *
 * @param row - Raw database row from Supabase profiles table
 * @returns UserProfile object with camelCase properties
 * @throws {Error} If required fields (id) are missing
 */
export function mapProfile(row: Record<string, unknown>): UserProfile {
  // Debug: Log raw DB row to verify JSONB columns are populated
  console.log('📖 [Mapper] Raw DB Row:', row);
  console.log('📖 [Mapper] JSONB columns:', {
    onboarding_data: row.onboarding_data,
    preferences: row.preferences,
    schedule: row.schedule,
    bio: row.bio,
  });

  if (!row.id) {
    throw new Error('Profile row missing required field: id');
  }

  const onboardingData = (row.onboarding_data as Record<string, unknown>) || {};
  const preferences = (row.preferences as Record<string, unknown>) || {};
  const schedule = (row.schedule as Record<string, unknown>) || {};
  
  // Debug: Log extracted values from JSONB
  console.log('📖 [Mapper] Extracted from onboarding_data:', {
    subject: onboardingData.subject,
    goal: onboardingData.goal,
    level: onboardingData.level,
    weeklyHours: onboardingData.weeklyHours,
    communicationMethods: onboardingData.communicationMethods,
  });
  console.log('📖 [Mapper] Extracted from preferences:', {
    languages: preferences.languages,
    interests: preferences.interests,
    availability: preferences.availability,
  });

  return {
    id: row.id as string,
    name: (row.name as string) || '',
    avatar: (row.avatar_url as string) || '',
    bio: (row.bio as string) || '',
    location: (row.location as string) || '',
    birthDate: row.birth_date ? parseBirthDate(row.birth_date as string) : null,
    subject: (onboardingData.subject as string) || '',
    goal: (onboardingData.goal as string) || '',
    level: (onboardingData.level as string) || '',
    weeklyHours: (onboardingData.weeklyHours as number) || 5,
    communicationMethods: (onboardingData.communicationMethods as string[]) || [],
    languages: (preferences.languages as Array<{ language: string; proficiency: string }>) || [{ language: 'English', proficiency: 'Native' }],
    interests: (preferences.interests as string[]) || [],
    availability: (preferences.availability as string[]) || [],
    schedule: {
      weekdays: (schedule.weekdays as string[]) || [],
      weekend: (schedule.weekend as string[]) || [],
    },
    isPremium: Boolean(row.is_premium),
    profileComplete: Boolean((row as Record<string, unknown>).profile_complete),
    hasActiveTeam: Boolean((row as Record<string, unknown>).has_active_team),
    activeCourse: (row.active_course as string) || undefined,
  };
}

/**
 * Parse ISO date string (YYYY-MM-DD) to birthDate object.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Parsed birthDate object or null if invalid
 */
function parseBirthDate(dateStr: string): { month: string; day: string; year: string } | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
  };
}

/**
 * Convert a timestamp to relative time string (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Transforms a Supabase teams table row to the app's Team type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - JSONB column parsing (settings, resource_links)
 * - Null handling with sensible defaults
 *
 * @param row - Raw database row from Supabase teams table
 * @returns Team object with camelCase properties
 * @throws {Error} If required fields (id, name) are missing
 */
export function mapTeam(row: Record<string, unknown>): Team {
  if (!row.id) {
    throw new Error('Team row missing required field: id');
  }
  if (!row.name) {
    throw new Error('Team row missing required field: name');
  }

  // Safely extract settings JSONB (may be null/undefined)
  const settings = (row.settings as Record<string, unknown>) || {};
  
  // Safely extract resource_links JSONB array
  const resourceLinks = (row.resource_links as Array<{ name: string; url: string; description: string }>) || [];

  // Compute duration string from durationValue + durationType
  const durationValue = (settings.durationValue as number) || 8;
  const durationType = (settings.durationType as string) || 'weeks';
  const duration = `${durationValue} ${durationType}`;

  // Parse startDate from settings or fall back to created_at
  const startDateValue = settings.startDate || row.created_at;
  const startDate = startDateValue ? new Date(startDateValue as string) : new Date();

  // Capitalize first letter of activity_status for display
  const activityStatus = (row.activity_status as string) || 'active';
  const activity = activityStatus.charAt(0).toUpperCase() + activityStatus.slice(1);

  return {
    id: row.id as string,
    name: row.name as string,
    bio: (row.bio as string) || '',
    avatar: (row.avatar_url as string) || '',
    course: (row.course_name as string) || '',
    roadmapName: undefined, // Prefer deriving from currentRoadmapId
    duration,
    startDate,
    maxMembers: (settings.maxMembers as number) || 6,
    activity,
    lastActive: formatRelativeTime(row.last_active as string | null),
    resourceLinks,
    currentRoadmapId: (row.current_roadmap_id as string) || undefined,
    // Settings fields with safe defaults
    subject: (settings.subject as string) || 'aggregate',
    teamLevel: (settings.teamLevel as string | string[]) || 'aggregate',
    languages: (settings.languages as string | string[]) || 'aggregate',
    goals: (settings.goals as string | string[]) || 'aggregate',
    timeCommitments: (settings.timeCommitments as string) || 'aggregate',
    communicationPreferences: (settings.communicationPreferences as string | string[]) || 'aggregate',
    durationValue,
    durationType,
    archiveOnEnd: Boolean(settings.archiveOnEnd),
    onlyAdminsEditGoals: settings.onlyAdminsEditGoals !== false, // Default true
    onlyAdminsAcceptRequests: settings.onlyAdminsAcceptRequests !== false, // Default true
    onlyAdminsRemoveMembers: settings.onlyAdminsRemoveMembers !== false, // Default true
    allMembersAdmins: Boolean(settings.allMembersAdmins),
    allowSearch: settings.allowSearch !== false, // Default true
    showTeamStats: settings.showTeamStats !== false, // Default true
    showMemberList: settings.showMemberList !== false, // Default true
  };
}

/**
 * Transforms a Supabase team_members table row to the app's TeamMember type.
 *
 * @param row - Raw database row from Supabase team_members table
 * @returns TeamMember object with camelCase properties
 * @throws {Error} If required fields are missing
 */
export function mapTeamMember(row: Record<string, unknown>): TeamMember {
  if (!row.team_id) {
    throw new Error('TeamMember row missing required field: team_id');
  }
  if (!row.user_id) {
    throw new Error('TeamMember row missing required field: user_id');
  }

  return {
    teamId: row.team_id as string,
    userId: row.user_id as string,
    role: (row.role as 'admin' | 'member') || 'member',
  };
}

/**
 * Transforms a Supabase messages table row to the app's Message type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - Handle type mapping
 * - Null handling for optional fields
 *
 * @param row - Raw database row from Supabase messages table
 * @returns Message object with camelCase properties
 * @throws {Error} If required fields (id, text) are missing
 */
export function mapMessage(row: Record<string, unknown>): Message {
  if (!row.id) {
    throw new Error('Message row missing required field: id');
  }
  if (row.text === undefined || row.text === null) {
    throw new Error('Message row missing required field: text');
  }

  return {
    id: row.id as string,
    teamId: (row.team_id as string) || undefined,
    userId: row.user_id as string,
    senderId: (row.user_id as string) || undefined,
    receiverId: undefined, // Not stored in DB currently - handled at app level
    text: row.text as string,
    timestamp: (row.created_at as string) || new Date().toISOString(),
    threadId: (row.thread_id as string) || undefined,
    handle: (row.handle as Message['handle']) || null,
    bestResponseId: (row.best_response_id as string) || undefined,
  };
}

/**
 * Transforms a Supabase requests table row to the app's Request type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - Enum type mapping for request_type and request_status
 * - Null handling for optional fields
 *
 * @param row - Raw database row from Supabase requests table
 * @returns Request object with camelCase properties
 * @throws {Error} If required fields are missing
 */
export function mapRequest(row: Record<string, unknown>): Request {
  if (!row.id) {
    throw new Error('Request row missing required field: id');
  }
  if (!row.type) {
    throw new Error('Request row missing required field: type');
  }

  return {
    id: row.id as string,
    type: row.type as RequestType,
    senderId: row.sender_id as string,
    recipientId: (row.recipient_id as string) || '',
    recipientIds: undefined, // Not stored in DB - handled at app level for multi-recipient
    status: (row.status as RequestStatus) || 'pending',
    message: (row.message as string) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    teamId: (row.team_id as string) || undefined,
    roadmapId: (row.roadmap_id as string) || undefined,
    newTeamName: (row.new_team_name as string) || undefined,
    makeAdmin: (row.make_admin as boolean) || false,
    maxMembers: undefined, // Not stored in DB - settings handled separately
    duration: undefined, // Not stored in DB - settings handled separately
  };
}

/**
 * Transforms a Supabase notifications table row to the app's Notification type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - Enum type mapping for notification_type and notification_level
 * - JSONB metadata parsing
 * - Null handling for optional fields
 *
 * @param row - Raw database row from Supabase notifications table
 * @returns Notification object with camelCase properties
 * @throws {Error} If required fields are missing
 */
export function mapNotification(row: Record<string, unknown>): Notification {
  if (!row.id) {
    throw new Error('Notification row missing required field: id');
  }
  if (!row.type) {
    throw new Error('Notification row missing required field: type');
  }

  const metadata = (row.metadata as Record<string, unknown>) || {};

  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    level: (row.level as NotificationLevel) || 'info',
    title: (row.title as string) || '',
    message: (row.message as string) || '',
    read: (row.read as boolean) || false,
    createdAt: (row.created_at as string) || new Date().toISOString(),
    link: (row.link as string) || undefined,
    metadata: Object.keys(metadata).length > 0
      ? {
          teamId: (metadata.teamId as string) || undefined,
          senderId: (metadata.senderId as string) || undefined,
          points: (metadata.points as number) || undefined,
          badgeIcon: (metadata.badgeIcon as string) || undefined,
        }
      : undefined,
  };
}

/**
 * Transforms a Supabase roadmaps table row to the app's CourseRoadmap type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - JSONB metadata parsing for extra fields
 * - Enum mapping for owner_type
 *
 * @param row - Raw database row from Supabase roadmaps table
 * @returns CourseRoadmap object with camelCase properties
 * @throws {Error} If required fields (id, title, owner_id) are missing
 */
export function mapRoadmap(row: Record<string, unknown>): CourseRoadmap {
  if (!row.id) {
    throw new Error('Roadmap row missing required field: id');
  }
  if (!row.title) {
    throw new Error('Roadmap row missing required field: title');
  }
  if (!row.owner_id) {
    throw new Error('Roadmap row missing required field: owner_id');
  }

  const metadata = (row.metadata as Record<string, unknown>) || {};

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    ownerId: row.owner_id as string,
    ownerType: (row.owner_type as 'USER' | 'TEAM' | 'THIRD_PARTY') || 'USER',
    isPublic: Boolean(row.is_public),
    isPaid: Boolean(row.is_paid),
    createdAt: row.created_at ? (row.created_at as string).split('T')[0] : undefined,
    // Metadata fields
    level: (metadata.level as string) || undefined,
    totalUnits: (metadata.totalUnits as number) || undefined,
    estimatedTime: (metadata.estimatedTime as string) || undefined,
    rating: (metadata.rating as number) || undefined,
    students: (metadata.students as number) || undefined,
    price: (metadata.price as string) || undefined,
    copies: (metadata.copies as number) || undefined,
    ownerName: (metadata.ownerName as string) || undefined,
    originId: (metadata.originId as string) || undefined,
  };
}

/**
 * Transforms a Supabase units table row to the app's Unit type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - Embedding pre-mapped subunits array
 *
 * @param row - Raw database row from Supabase units table
 * @param subunits - Array of already-mapped Subunit objects
 * @returns Unit object with camelCase properties
 * @throws {Error} If required fields are missing
 */
export function mapUnit(row: Record<string, unknown>, subunits: Subunit[] = []): Unit {
  if (!row.id) {
    throw new Error('Unit row missing required field: id');
  }
  if (!row.roadmap_id) {
    throw new Error('Unit row missing required field: roadmap_id');
  }
  if (!row.title) {
    throw new Error('Unit row missing required field: title');
  }

  return {
    id: row.id as string,
    roadmapId: row.roadmap_id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    sequence_order: (row.sequence_order as number) || 0,
    subunits: subunits,
  };
}

/**
 * Transforms a Supabase subunits table row to the app's Subunit type.
 *
 * Handles:
 * - Snake_case → camelCase conversion
 * - Type mapping for subunit type enum
 *
 * @param row - Raw database row from Supabase subunits table
 * @returns Subunit object with camelCase properties
 * @throws {Error} If required fields are missing
 */
export function mapSubunit(row: Record<string, unknown>): Subunit & { sequence_order?: number } {
  if (!row.id) {
    throw new Error('Subunit row missing required field: id');
  }
  if (!row.title) {
    throw new Error('Subunit row missing required field: title');
  }
  if (!row.type) {
    throw new Error('Subunit row missing required field: type');
  }

  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as 'video' | 'article' | 'quiz' | 'exercise',
    contentUrl: (row.content_url as string) || undefined,
    duration: (row.duration as string) || undefined,
    sequence_order: (row.sequence_order as number) || 0,
  };
}

