import { supabase } from '@/integrations/supabase/client';
import { mapRoadmap, mapUnit, mapSubunit } from '@/lib/supabase-mapper';
import { RoadmapService, CourseRoadmap, Unit, CreateRoadmapPayload, UpdateRoadmapPayload } from './types';

/**
 * Supabase implementation of RoadmapService.
 * 
 * Fetches roadmap data from Supabase using cascading queries
 * for roadmaps → units → subunits.
 */
export const supabaseRoadmapService: RoadmapService = {
  // ==================== READ OPERATIONS ====================

  /**
   * Fetch all roadmaps accessible to the user.
   * Includes: public roadmaps, user's own roadmaps, team roadmaps user has access to.
   */
  async fetchAllRoadmaps(userId?: string): Promise<CourseRoadmap[]> {
    console.log('🔍 [RoadmapsService] Fetching all roadmaps for user:', userId);

    // Fetch all roadmaps - RLS policies will handle access control
    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [RoadmapsService] Failed to fetch roadmaps:', error);
      throw new Error(`Failed to fetch roadmaps: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [RoadmapsService] No roadmaps found');
      return [];
    }

    console.log('✅ [RoadmapsService] Raw roadmaps data:', data.length, 'roadmaps');
    const roadmaps = data.map((row) => mapRoadmap(row as Record<string, unknown>));
    console.log('✅ [RoadmapsService] Mapped roadmaps:', roadmaps.length);
    return roadmaps;
  },

  /**
   * Fetch a single roadmap by ID.
   */
  async fetchRoadmap(roadmapId: string): Promise<CourseRoadmap | null> {
    console.log('🔍 [RoadmapsService] Fetching roadmap:', roadmapId);

    const { data, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📭 [RoadmapsService] Roadmap not found:', roadmapId);
        return null;
      }
      console.error('❌ [RoadmapsService] Failed to fetch roadmap:', error);
      throw new Error(`Failed to fetch roadmap: ${error.message}`);
    }

    console.log('✅ [RoadmapsService] Raw roadmap data:', data);
    return mapRoadmap(data as Record<string, unknown>);
  },

  /**
   * Fetch all units for a roadmap with cascading subunits.
   * 
   * Query pattern: units → subunits (nested select)
   */
  async fetchUnitsWithSubunits(roadmapId: string): Promise<Unit[]> {
    console.log('🔍 [RoadmapsService] Fetching units for roadmap:', roadmapId);

    // Fetch units with nested subunits using Supabase's relationship syntax
    const { data, error } = await supabase
      .from('units')
      .select('*, subunits(*)')
      .eq('roadmap_id', roadmapId)
      .order('sequence_order', { ascending: true });

    if (error) {
      console.error('❌ [RoadmapsService] Failed to fetch units:', error);
      throw new Error(`Failed to fetch units: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [RoadmapsService] No units found for roadmap:', roadmapId);
      return [];
    }

    console.log('✅ [RoadmapsService] Raw units data:', data.length, 'units');

    // Map each unit with its subunits
    const units = data.map((unitRow) => {
      const subunitsData = (unitRow.subunits as Record<string, unknown>[]) || [];
      // Sort subunits by sequence_order
      const sortedSubunits = subunitsData
        .map((sub) => mapSubunit(sub))
        .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
      
      return mapUnit(unitRow as Record<string, unknown>, sortedSubunits);
    });

    console.log('✅ [RoadmapsService] Mapped units:', units.length);
    return units;
  },

  /**
   * Fetch all units across all roadmaps.
   * Used for initial data load.
   */
  async fetchAllUnits(): Promise<Unit[]> {
    console.log('🔍 [RoadmapsService] Fetching all units');

    const { data, error } = await supabase
      .from('units')
      .select('*, subunits(*)')
      .order('sequence_order', { ascending: true });

    if (error) {
      console.error('❌ [RoadmapsService] Failed to fetch all units:', error);
      throw new Error(`Failed to fetch all units: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('📭 [RoadmapsService] No units found');
      return [];
    }

    console.log('✅ [RoadmapsService] Raw all units data:', data.length, 'units');

    const units = data.map((unitRow) => {
      const subunitsData = (unitRow.subunits as Record<string, unknown>[]) || [];
      const sortedSubunits = subunitsData
        .map((sub) => mapSubunit(sub))
        .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
      
      return mapUnit(unitRow as Record<string, unknown>, sortedSubunits);
    });

    console.log('✅ [RoadmapsService] Mapped all units:', units.length);
    return units;
  },

  // ==================== WRITE OPERATIONS: roadmaps ====================

  /**
   * Create a new roadmap.
   */
  async createRoadmap(roadmap: CreateRoadmapPayload): Promise<CourseRoadmap> {
    console.log('🆕 [RoadmapsService] Creating roadmap:', roadmap.title);

    // Map camelCase to snake_case for Supabase
    const dbPayload = {
      title: roadmap.title,
      description: roadmap.description || '',
      owner_id: roadmap.ownerId,
      owner_type: roadmap.ownerType || 'USER',
      is_public: roadmap.isPublic || false,
      is_paid: roadmap.isPaid || false,
      metadata: {
        level: roadmap.level,
        totalUnits: roadmap.totalUnits,
        estimatedTime: roadmap.estimatedTime,
        rating: roadmap.rating,
        students: roadmap.students,
        price: roadmap.price,
        copies: roadmap.copies,
        ownerName: roadmap.ownerName,
        originId: roadmap.originId,
      },
    };

    const { data, error } = await supabase
      .from('roadmaps')
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error('❌ [RoadmapsService] Failed to create roadmap:', error);
      throw new Error(`Failed to create roadmap: ${error.message}`);
    }

    console.log('✅ [RoadmapsService] Roadmap created:', data);
    return mapRoadmap(data as Record<string, unknown>);
  },

  /**
   * Update a roadmap's properties.
   */
  async updateRoadmap(roadmapId: string, updates: UpdateRoadmapPayload): Promise<CourseRoadmap> {
    console.log('🔄 [RoadmapsService] Updating roadmap:', roadmapId, updates);

    // Build the update payload, mapping camelCase to snake_case
    const dbPayload: Record<string, unknown> = {};

    if (updates.title !== undefined) dbPayload.title = updates.title;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.isPublic !== undefined) dbPayload.is_public = updates.isPublic;
    if (updates.isPaid !== undefined) dbPayload.is_paid = updates.isPaid;
    if (updates.ownerType !== undefined) dbPayload.owner_type = updates.ownerType;
    if (updates.ownerId !== undefined) dbPayload.owner_id = updates.ownerId;

    // Handle metadata fields - need to merge with existing metadata
    const metadataUpdates: Record<string, unknown> = {};
    if (updates.level !== undefined) metadataUpdates.level = updates.level;
    if (updates.totalUnits !== undefined) metadataUpdates.totalUnits = updates.totalUnits;
    if (updates.estimatedTime !== undefined) metadataUpdates.estimatedTime = updates.estimatedTime;
    if (updates.rating !== undefined) metadataUpdates.rating = updates.rating;
    if (updates.students !== undefined) metadataUpdates.students = updates.students;
    if (updates.price !== undefined) metadataUpdates.price = updates.price;
    if (updates.copies !== undefined) metadataUpdates.copies = updates.copies;
    if (updates.ownerName !== undefined) metadataUpdates.ownerName = updates.ownerName;
    if (updates.originId !== undefined) metadataUpdates.originId = updates.originId;

    // If there are metadata updates, we need to fetch existing and merge
    if (Object.keys(metadataUpdates).length > 0) {
      const { data: existing } = await supabase
        .from('roadmaps')
        .select('metadata')
        .eq('id', roadmapId)
        .single();

      const existingMetadata = (existing?.metadata as Record<string, unknown>) || {};
      dbPayload.metadata = { ...existingMetadata, ...metadataUpdates };
    }

    console.log('📦 [RoadmapsService] DB payload:', dbPayload);

    const { data, error } = await supabase
      .from('roadmaps')
      .update(dbPayload)
      .eq('id', roadmapId)
      .select()
      .single();

    if (error) {
      console.error('❌ [RoadmapsService] Failed to update roadmap:', error);
      throw new Error(`Failed to update roadmap: ${error.message}`);
    }

    if (!data) {
      throw new Error('Update returned no data - roadmap may not exist or RLS blocked the operation');
    }

    console.log('✅ [RoadmapsService] Roadmap updated:', data);
    return mapRoadmap(data as Record<string, unknown>);
  },

  /**
   * Delete a roadmap.
   * Units and subunits will cascade delete via FK constraints.
   */
  async deleteRoadmap(roadmapId: string): Promise<void> {
    console.log('🗑️ [RoadmapsService] Deleting roadmap:', roadmapId);

    const { error } = await supabase
      .from('roadmaps')
      .delete()
      .eq('id', roadmapId);

    if (error) {
      console.error('❌ [RoadmapsService] Failed to delete roadmap:', error);
      throw new Error(`Failed to delete roadmap: ${error.message}`);
    }

    console.log('✅ [RoadmapsService] Roadmap deleted successfully');
  },

  // ==================== WRITE OPERATIONS: units ====================

  /**
   * Sync units for a roadmap.
   * This deletes all existing units and inserts the new list.
   * Subunits are handled within each unit.
   */
  async syncUnitsForRoadmap(roadmapId: string, units: Unit[]): Promise<void> {
    console.log('🔄 [RoadmapsService] Syncing units for roadmap:', roadmapId, 'count:', units.length);

    // 1. Delete all existing units for this roadmap (subunits cascade)
    const { error: deleteError } = await supabase
      .from('units')
      .delete()
      .eq('roadmap_id', roadmapId);

    if (deleteError) {
      console.error('❌ [RoadmapsService] Failed to delete existing units:', deleteError);
      throw new Error(`Failed to delete existing units: ${deleteError.message}`);
    }

    if (units.length === 0) {
      console.log('✅ [RoadmapsService] Units cleared, no new units to add');
      return;
    }

    // 2. Insert new units
    const unitPayloads = units.map((unit, index) => ({
      roadmap_id: roadmapId,
      title: unit.title,
      description: unit.description || '',
      sequence_order: unit.sequence_order || index + 1,
    }));

    const { data: insertedUnits, error: insertError } = await supabase
      .from('units')
      .insert(unitPayloads)
      .select();

    if (insertError) {
      console.error('❌ [RoadmapsService] Failed to insert units:', insertError);
      throw new Error(`Failed to insert units: ${insertError.message}`);
    }

    console.log('✅ [RoadmapsService] Inserted units:', insertedUnits?.length);

    // 3. Insert subunits for each unit
    if (insertedUnits) {
      for (let i = 0; i < insertedUnits.length; i++) {
        const dbUnit = insertedUnits[i];
        const originalUnit = units[i];

        if (originalUnit.subunits && originalUnit.subunits.length > 0) {
          const subunitPayloads = originalUnit.subunits.map((subunit, subIndex) => ({
            unit_id: dbUnit.id,
            title: subunit.title,
            type: subunit.type,
            content_url: subunit.contentUrl || null,
            duration: subunit.duration || null,
            sequence_order: subIndex + 1,
          }));

          const { error: subunitError } = await supabase
            .from('subunits')
            .insert(subunitPayloads);

          if (subunitError) {
            console.error('❌ [RoadmapsService] Failed to insert subunits for unit:', dbUnit.id, subunitError);
            throw new Error(`Failed to insert subunits: ${subunitError.message}`);
          }
        }
      }
    }

    console.log('✅ [RoadmapsService] Units synced successfully');
  },
};

