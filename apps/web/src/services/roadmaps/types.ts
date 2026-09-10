import { CourseRoadmap, Unit, Subunit } from '@/lib/mockData';

/**
 * Payload for creating a new roadmap.
 * Omits 'id' as it will be generated, and computed fields.
 */
export type CreateRoadmapPayload = Omit<CourseRoadmap, 'id' | 'progress' | 'completedUnits' | 'hasUserAccess'>;

/**
 * Payload for updating a roadmap.
 * All fields optional except immutable ones are excluded.
 */
export type UpdateRoadmapPayload = Partial<Omit<CourseRoadmap, 'id' | 'createdAt'>>;

/**
 * Payload for creating a new unit (without subunits, which are handled separately).
 */
export type CreateUnitPayload = Omit<Unit, 'id'>;

/**
 * Payload for updating a unit.
 */
export type UpdateUnitPayload = Partial<Omit<Unit, 'id' | 'roadmapId'>>;

/**
 * Roadmap Service Interface
 * 
 * Defines the contract for roadmap data operations.
 * Implementations exist for both localStorage (local) and Supabase backends.
 */
export interface RoadmapService {
  // ==================== READ OPERATIONS ====================
  
  /**
   * Fetch all roadmaps.
   * For Supabase, this fetches public roadmaps and those owned by/accessible to the user.
   * 
   * @param userId - Optional user ID to filter accessible roadmaps
   * @returns Array of roadmaps
   */
  fetchAllRoadmaps(userId?: string): Promise<CourseRoadmap[]>;

  /**
   * Fetch a single roadmap by its ID.
   * 
   * @param roadmapId - The roadmap's ID
   * @returns The roadmap object or null if not found
   */
  fetchRoadmap(roadmapId: string): Promise<CourseRoadmap | null>;

  /**
   * Fetch all units for a roadmap, including their subunits.
   * Implements cascading query: roadmap → units → subunits
   * 
   * @param roadmapId - The roadmap's ID
   * @returns Array of units with embedded subunits
   */
  fetchUnitsWithSubunits(roadmapId: string): Promise<Unit[]>;

  /**
   * Fetch all units across all roadmaps.
   * Used for initial data load.
   * 
   * @returns Array of all units with embedded subunits
   */
  fetchAllUnits(): Promise<Unit[]>;

  // ==================== WRITE OPERATIONS: roadmaps ====================

  /**
   * Create a new roadmap.
   * 
   * @param roadmap - The roadmap data (without ID)
   * @returns The created roadmap with generated ID
   */
  createRoadmap(roadmap: CreateRoadmapPayload): Promise<CourseRoadmap>;

  /**
   * Update a roadmap's properties.
   * 
   * @param roadmapId - The roadmap's ID
   * @param updates - Partial roadmap object with fields to update
   * @returns The updated roadmap
   */
  updateRoadmap(roadmapId: string, updates: UpdateRoadmapPayload): Promise<CourseRoadmap>;

  /**
   * Delete a roadmap and all its units/subunits (cascade).
   * 
   * @param roadmapId - The roadmap's ID to delete
   */
  deleteRoadmap(roadmapId: string): Promise<void>;

  // ==================== WRITE OPERATIONS: units ====================

  /**
   * Sync units for a roadmap.
   * Replaces all existing units with the provided list.
   * 
   * @param roadmapId - The roadmap's ID
   * @param units - The complete list of units to set
   */
  syncUnitsForRoadmap(roadmapId: string, units: Unit[]): Promise<void>;
}

export type { CourseRoadmap, Unit, Subunit };

