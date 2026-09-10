import { mockRoadmaps, mockUnits } from '@/lib/mockData';
import { RoadmapService, CourseRoadmap, Unit, CreateRoadmapPayload, UpdateRoadmapPayload } from './types';

const ROADMAPS_STORAGE_KEY = 'ekana-roadmaps';
const UNITS_STORAGE_KEY = 'ekana-units';
const ROADMAPS_VERSION_KEY = 'ekana-roadmaps-version';
const CURRENT_ROADMAPS_VERSION = '1.2';

/**
 * Local (localStorage) implementation of RoadmapService.
 * 
 * Uses localStorage for persistence with mock data fallback.
 * This is the fallback implementation for development/testing.
 */
export const localRoadmapService: RoadmapService = {
  // ==================== READ OPERATIONS ====================

  async fetchAllRoadmaps(_userId?: string): Promise<CourseRoadmap[]> {
    console.log('🔍 [RoadmapsService.local] Fetching all roadmaps');
    
    try {
      const storedVersion = localStorage.getItem(ROADMAPS_VERSION_KEY);
      
      // If version doesn't match, clear old data and use mock data
      if (storedVersion !== CURRENT_ROADMAPS_VERSION) {
        console.log('🔄 [RoadmapsService.local] Version mismatch, using fresh mock data');
        localStorage.removeItem(ROADMAPS_STORAGE_KEY);
        localStorage.removeItem(UNITS_STORAGE_KEY);
        localStorage.setItem(ROADMAPS_VERSION_KEY, CURRENT_ROADMAPS_VERSION);
        return mockRoadmaps;
      }
      
      const stored = localStorage.getItem(ROADMAPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 [RoadmapsService.local] Loaded from localStorage:', parsed.length, 'roadmaps');
        return parsed;
      }
    } catch (error) {
      console.error('❌ [RoadmapsService.local] Failed to load from localStorage:', error);
    }
    
    console.log('📦 [RoadmapsService.local] Using mock roadmaps data');
    return mockRoadmaps;
  },

  async fetchRoadmap(roadmapId: string): Promise<CourseRoadmap | null> {
    const roadmaps = await this.fetchAllRoadmaps();
    return roadmaps.find(r => r.id === roadmapId) || null;
  },

  async fetchUnitsWithSubunits(roadmapId: string): Promise<Unit[]> {
    const allUnits = await this.fetchAllUnits();
    return allUnits.filter(u => u.roadmapId.toString() === roadmapId);
  },

  async fetchAllUnits(): Promise<Unit[]> {
    console.log('🔍 [RoadmapsService.local] Fetching all units');
    
    try {
      const storedVersion = localStorage.getItem(ROADMAPS_VERSION_KEY);
      
      if (storedVersion === CURRENT_ROADMAPS_VERSION) {
        const stored = localStorage.getItem(UNITS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('📦 [RoadmapsService.local] Loaded from localStorage:', parsed.length, 'units');
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ [RoadmapsService.local] Failed to load units from localStorage:', error);
    }
    
    console.log('📦 [RoadmapsService.local] Using mock units data');
    return mockUnits;
  },

  // ==================== WRITE OPERATIONS: roadmaps ====================

  async createRoadmap(roadmap: CreateRoadmapPayload): Promise<CourseRoadmap> {
    const newId = Date.now().toString();
    const newRoadmap: CourseRoadmap = {
      id: newId,
      title: roadmap.title || '',
      description: roadmap.description || '',
      totalUnits: roadmap.totalUnits || 0,
      createdAt: new Date().toISOString().split('T')[0],
      ownerType: roadmap.ownerType || 'USER',
      ownerId: roadmap.ownerId || '',
      isPublic: roadmap.isPublic || false,
      isPaid: roadmap.isPaid || false,
      ...roadmap,
    };
    
    const roadmaps = await this.fetchAllRoadmaps();
    roadmaps.push(newRoadmap);
    localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(roadmaps));
    
    console.log('✅ [RoadmapsService.local] Roadmap created:', newId);
    return newRoadmap;
  },

  async updateRoadmap(roadmapId: string, updates: UpdateRoadmapPayload): Promise<CourseRoadmap> {
    const roadmaps = await this.fetchAllRoadmaps();
    const index = roadmaps.findIndex(r => r.id === roadmapId);
    
    if (index === -1) {
      throw new Error(`Roadmap ${roadmapId} not found`);
    }
    
    const updated = { ...roadmaps[index], ...updates };
    roadmaps[index] = updated;
    localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(roadmaps));
    
    console.log('✅ [RoadmapsService.local] Roadmap updated:', roadmapId);
    return updated;
  },

  async deleteRoadmap(roadmapId: string): Promise<void> {
    const roadmaps = await this.fetchAllRoadmaps();
    const filtered = roadmaps.filter(r => r.id !== roadmapId);
    localStorage.setItem(ROADMAPS_STORAGE_KEY, JSON.stringify(filtered));
    
    // Also delete associated units
    const units = await this.fetchAllUnits();
    const filteredUnits = units.filter(u => u.roadmapId.toString() !== roadmapId);
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(filteredUnits));
    
    console.log('✅ [RoadmapsService.local] Roadmap deleted:', roadmapId);
  },

  // ==================== WRITE OPERATIONS: units ====================

  async syncUnitsForRoadmap(roadmapId: string, newUnits: Unit[]): Promise<void> {
    const allUnits = await this.fetchAllUnits();
    
    // Remove all existing units for this roadmap
    const otherUnits = allUnits.filter(unit => unit.roadmapId.toString() !== roadmapId);
    
    // Process new units
    const processedUnits: Unit[] = newUnits.map((unitData, index) => ({
      id: unitData.id || `unit-${Date.now()}-${index}`,
      roadmapId: roadmapId,
      title: unitData.title || '',
      description: unitData.description || '',
      sequence_order: unitData.sequence_order || index + 1,
      subunits: unitData.subunits || [],
    }));
    
    const updatedUnits = [...otherUnits, ...processedUnits];
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(updatedUnits));
    
    console.log('✅ [RoadmapsService.local] Units synced for roadmap:', roadmapId, 'count:', processedUnits.length);
  },
};

