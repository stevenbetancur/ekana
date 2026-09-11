import * as apiService from './userProfile.api';

export const userProfileService = apiService;

// Re-export types
export type { UserProfile } from './types';
export { defaultProfile } from './types';
