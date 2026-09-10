import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CourseRoadmap, Unit, User } from '@/lib/mockData';
import { useProgressContext } from './ProgressContext';
import { useAuth } from './AuthContext';
import { useTeamContext } from './TeamContext';
import { roadmapService } from '@/services/roadmaps';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type for user entitlements from Supabase
interface UserEntitlement {
  id: string;
  userId: string;
  roadmapId: string;
  accessType: string | null;
  expiresAt: string | null;
}

interface RoadmapsContextType {
  roadmaps: CourseRoadmap[];
  units: Unit[];
  isLoading: boolean;
  updateRoadmapVisibility: (roadmapId: string) => Promise<void>;
  editRoadmap: (roadmapId: string, updatedData: Partial<CourseRoadmap>) => Promise<void>;
  syncUnitsForRoadmap: (roadmapId: string, finalUnitsList: Unit[]) => Promise<void>;
  addRoadmap: (newRoadmapData: Partial<CourseRoadmap>) => Promise<string>;
  deleteRoadmap: (roadmapId: string) => Promise<void>;
  unenrollFromRoadmap: (userId: string, roadmapId: string) => void;
  enrichRoadmapWithProgress: (roadmap: CourseRoadmap, user: User, teamId?: string) => CourseRoadmap;
  getPersonalRoadmaps: (currentUser: User) => CourseRoadmap[];
  getCommunityRoadmaps: (currentUser: User) => CourseRoadmap[];
  getCatalogRoadmaps: (currentUser: User) => CourseRoadmap[];
  copyRoadmapForTeam: (originalRoadmapId: string, newTeamId: string, newTeamName: string) => Promise<string>;
  copyRoadmapForUser: (originalRoadmapId: string, newOwnerId: string, newOwnerName: string) => Promise<string>;
  hasValidEntitlement: (userId: string, roadmapId: string) => boolean;
}

const RoadmapsContext = createContext<RoadmapsContextType | undefined>(undefined);

export const RoadmapsProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from Supabase (empty until fetched)
  const [roadmaps, setRoadmaps] = useState<CourseRoadmap[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [userEntitlements, setUserEntitlements] = useState<UserEntitlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { progressTracking, activations, removeProgressForRoadmap, removeActivation, createActivation } = useProgressContext();
  const { teams, teamMembers } = useTeamContext();

  // Fetch roadmaps, units, and entitlements from Supabase when user is available
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      console.log('🔍 [RoadmapsContext] Fetching roadmaps, units, and entitlements');

      try {
        // Fetch all roadmaps (RLS will handle access control)
        const fetchedRoadmaps = await roadmapService.fetchAllRoadmaps(user?.id);
        console.log('✅ [RoadmapsContext] Fetched roadmaps:', fetchedRoadmaps.length);
        setRoadmaps(fetchedRoadmaps);

        // Fetch all units with subunits
        const fetchedUnits = await roadmapService.fetchAllUnits();
        console.log('✅ [RoadmapsContext] Fetched units:', fetchedUnits.length);
        setUnits(fetchedUnits);

        // Fetch user entitlements for paid roadmap access
        if (user?.id) {
          const { data: entitlementsData, error: entitlementsError } = await supabase
            .from('user_entitlements')
            .select('*')
            .eq('user_id', user.id);

          if (entitlementsError) {
            console.error('❌ [RoadmapsContext] Failed to fetch entitlements:', entitlementsError);
          } else if (entitlementsData) {
            const mappedEntitlements: UserEntitlement[] = entitlementsData.map(row => ({
              id: row.id,
              userId: row.user_id || '',
              roadmapId: row.roadmap_id || '',
              accessType: row.access_type,
              expiresAt: row.expires_at,
            }));
            console.log('✅ [RoadmapsContext] Fetched entitlements:', mappedEntitlements.length);
            setUserEntitlements(mappedEntitlements);
          }
        }
      } catch (error) {
        console.error('❌ [RoadmapsContext] Failed to fetch roadmaps:', error);
        toast.error('Failed to load roadmaps. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Helper function to refetch data
  const refetchData = useCallback(async () => {
    try {
      const [fetchedRoadmaps, fetchedUnits] = await Promise.all([
        roadmapService.fetchAllRoadmaps(user?.id),
        roadmapService.fetchAllUnits(),
      ]);
      setRoadmaps(fetchedRoadmaps);
      setUnits(fetchedUnits);

      // Also refetch entitlements
      if (user?.id) {
        const { data: entitlementsData } = await supabase
          .from('user_entitlements')
          .select('*')
          .eq('user_id', user.id);

        if (entitlementsData) {
          const mappedEntitlements: UserEntitlement[] = entitlementsData.map(row => ({
            id: row.id,
            userId: row.user_id || '',
            roadmapId: row.roadmap_id || '',
            accessType: row.access_type,
            expiresAt: row.expires_at,
          }));
          setUserEntitlements(mappedEntitlements);
        }
      }
    } catch (error) {
      console.error('❌ [RoadmapsContext] Failed to refetch data:', error);
    }
  }, [user?.id]);

  // Centralized helper to enrich a roadmap with user-specific progress data
  const enrichRoadmapWithProgress = (roadmap: CourseRoadmap, user: User, teamId?: string): CourseRoadmap => {
    // Find the activation for this user and roadmap from state
    // When teamId is provided, match on it to ensure correct team context
    const activation = activations.find(
      act => 
        act.userId === user.id && 
        act.roadmapId === roadmap.id.toString() &&
        (teamId ? act.teamId === teamId : true)
    );
    
    if (!activation) {
      console.log(`🔍 enrichRoadmapWithProgress: No activation for roadmap ${roadmap.id} (${roadmap.title}), user ${user.id}, team ${teamId || 'none'}`);
      return { ...roadmap, progress: 0, completedUnits: 0 };
    }
    
    const filteredProgress = progressTracking.filter(
      progress => progress.activationId === activation.id && progress.completedAt !== null
    );
    
    const completedSubunits = filteredProgress.length;
    
    console.log(`🔍 enrichRoadmapWithProgress: Roadmap ${roadmap.id} (${roadmap.title}), User ${user.id}`, {
      activationId: activation.id,
      filteredProgressRecords: filteredProgress,
      completedSubunits,
      totalProgressTrackingRecords: progressTracking.length
    });
    
    // Count total subunits for this roadmap
    const roadmapUnits = units.filter(u => u.roadmapId.toString() === roadmap.id.toString());
    const totalSubunits = roadmapUnits.reduce((sum, unit) => sum + unit.subunits.length, 0);
    const progress = totalSubunits > 0 ? Math.round((completedSubunits / totalSubunits) * 100) : 0;
    
    return { ...roadmap, progress, completedUnits: completedSubunits };
  };

  // Helper to check if user has a valid entitlement for a roadmap
  const hasValidEntitlement = (userId: string, roadmapId: string): boolean => {
    return userEntitlements.some(entitlement => {
      if (entitlement.userId !== userId || entitlement.roadmapId !== roadmapId) {
        return false;
      }
      // Check if not expired
      if (entitlement.expiresAt) {
        const expiryDate = new Date(entitlement.expiresAt);
        if (expiryDate < new Date()) {
          return false;
        }
      }
      return true;
    });
  };

  // Helper function to get personal roadmaps (owned, purchased, or team access)
  const getPersonalRoadmaps = (currentUser: User): CourseRoadmap[] => {
    // Part 1: Find roadmaps owned directly by the user
    const directRoadmaps = roadmaps.filter(
      roadmap => roadmap.ownerId === currentUser.id
    );
    
    // Part 2: Find third-party roadmaps with activations
    // Only check entitlements for paid roadmaps
    const thirdPartyWithActivation = roadmaps
      .filter(roadmap => roadmap.ownerType === 'THIRD_PARTY')
      .filter(roadmap => {
        // Must have activation
        const hasActivation = activations.some(
          act => act.userId === currentUser.id && act.roadmapId === roadmap.id.toString()
        );
        
        if (!hasActivation) {
          return false;
        }
        
        // If paid, also check for entitlement from Supabase
        if (roadmap.isPaid) {
          return hasValidEntitlement(currentUser.id, roadmap.id.toString());
        }
        
        // Free roadmaps only need activation
        return true;
      });
    
    // Part 3: Find roadmaps accessible through team membership
    // Now using TeamContext data instead of mock data
    const userTeamIds = teamMembers
      .filter(tm => tm.userId === currentUser.id)
      .map(tm => tm.teamId);
    
    const userTeams = teams.filter(team => userTeamIds.includes(team.id));
    const teamRoadmapIds = userTeams
      .map(team => team.currentRoadmapId)
      .filter((id): id is string => id != null);
    
    const teamRoadmaps = roadmaps.filter(roadmap => 
      teamRoadmapIds.includes(roadmap.id.toString())
    );
    
    // Enforce third-party activation requirement for team roadmaps
    // Only check entitlements for paid roadmaps
    const validTeamRoadmaps = teamRoadmaps.filter(roadmap => {
      if (roadmap.ownerType !== 'THIRD_PARTY') {
        return true;
      }
      
      // Must have activation
      const hasActivation = activations.some(
        act => act.userId === currentUser.id && act.roadmapId === roadmap.id.toString()
      );
      
      if (!hasActivation) {
        return false;
      }
      
      // If paid, also check for entitlement from Supabase
      if (roadmap.isPaid) {
        return hasValidEntitlement(currentUser.id, roadmap.id.toString());
      }
      
      // Free roadmaps only need activation
      return true;
    });
    
    // Combine all roadmap IDs (de-duplicated)
    const allRoadmapIds = new Set<string>([
      ...directRoadmaps.map(r => r.id.toString()),
      ...thirdPartyWithActivation.map(r => r.id.toString()),
      ...validTeamRoadmaps.map(r => r.id.toString())
    ]);
    
    // Get the complete list of roadmaps and enrich with progress data
    const baseRoadmaps = roadmaps.filter(roadmap => 
      allRoadmapIds.has(roadmap.id.toString())
    );
    
    // Enrich with personal progress data
    return baseRoadmaps.map(roadmap => {
      return enrichRoadmapWithProgress(roadmap, currentUser);
    });
  };

  // Helper function to get community roadmaps (public, not owned by user)
  const getCommunityRoadmaps = (currentUser: User): CourseRoadmap[] => {
    return roadmaps.filter(roadmap => {
      // Must be public and not third-party
      if (!roadmap.isPublic || roadmap.ownerType === 'THIRD_PARTY') {
        return false;
      }
      
      // Must not be owned directly by the user
      if (roadmap.ownerId === currentUser.id) {
        return false;
      }
      
      // If team-owned, user must not be a member of that team
      // Now using TeamContext data instead of mock data
      if (roadmap.ownerType === 'TEAM') {
        const isMemberOfTeam = teamMembers.some(
          tm => tm.teamId === roadmap.ownerId && tm.userId === currentUser.id
        );
        if (isMemberOfTeam) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Helper function to get catalog roadmaps (third-party, not yet owned)
  const getCatalogRoadmaps = (currentUser: User): CourseRoadmap[] => {
    // Get all third-party roadmaps
    const thirdPartyRoadmaps = roadmaps.filter(
      roadmap => roadmap.ownerType === 'THIRD_PARTY'
    );
    
    // Exclude roadmaps that have an active activation for this user
    return thirdPartyRoadmaps.filter(roadmap => {
      const hasActivation = activations.some(
        act => act.userId === currentUser.id && act.roadmapId === roadmap.id.toString()
      );
      return !hasActivation;
    });
  };

  // ==================== WRITE OPERATIONS WITH OPTIMISTIC UPDATES ====================

  const updateRoadmapVisibility = async (roadmapId: string): Promise<void> => {
    const roadmap = roadmaps.find(r => r.id === roadmapId);
    if (!roadmap) return;

    const newVisibility = !roadmap.isPublic;
    
    // Store previous state for rollback
    const previousRoadmaps = [...roadmaps];

    // 1. Optimistic update
    setRoadmaps(prevRoadmaps =>
      prevRoadmaps.map(r =>
        r.id === roadmapId
          ? { ...r, isPublic: newVisibility }
          : r
      )
    );
    console.log('🟢 [RoadmapsContext] Optimistic visibility update');

    try {
      // 2. Service call
      await roadmapService.updateRoadmap(roadmapId, { isPublic: newVisibility });
      console.log('✅ [RoadmapsContext] Visibility updated in DB:', roadmapId);
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [RoadmapsContext] Failed to update visibility:', error);
      setRoadmaps(previousRoadmaps);
      toast.error('Failed to update roadmap visibility. Please try again.');
      throw error;
    }
  };

  const editRoadmap = async (roadmapId: string, updatedData: Partial<CourseRoadmap>): Promise<void> => {
    // Store previous state for rollback
    const previousRoadmaps = [...roadmaps];

    // 1. Optimistic update
    setRoadmaps(prevRoadmaps =>
      prevRoadmaps.map(roadmap =>
        roadmap.id.toString() === roadmapId
          ? { ...roadmap, ...updatedData }
          : roadmap
      )
    );
    console.log('🟢 [RoadmapsContext] Optimistic roadmap edit');

    try {
      // 2. Service call
      await roadmapService.updateRoadmap(roadmapId, updatedData);
      console.log('✅ [RoadmapsContext] Roadmap updated in DB:', roadmapId);
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [RoadmapsContext] Failed to update roadmap:', error);
      setRoadmaps(previousRoadmaps);
      toast.error('Failed to update roadmap. Please try again.');
      throw error;
    }
  };

  const syncUnitsForRoadmap = async (roadmapId: string, finalUnitsList: Unit[]): Promise<void> => {
    console.log("DEBUG: syncUnits called with roadmapId:", roadmapId, "finalUnitsList:", finalUnitsList);
    
    // Store previous state for rollback
    const previousUnits = [...units];

    // 1. Optimistic update
    setUnits(prevUnits => {
      const otherUnits = prevUnits.filter(unit => unit.roadmapId.toString() !== roadmapId);
      const processedUnits: Unit[] = finalUnitsList.map((unitData, index) => ({
        id: unitData.id || `unit-${Date.now()}-${index}`,
        roadmapId: roadmapId,
        title: unitData.title || '',
        description: unitData.description || '',
        sequence_order: unitData.sequence_order || index + 1,
        subunits: unitData.subunits || [],
      }));
      return [...otherUnits, ...processedUnits];
    });
    console.log('🟢 [RoadmapsContext] Optimistic units sync');

    try {
      // 2. Service call
      await roadmapService.syncUnitsForRoadmap(roadmapId, finalUnitsList);
      console.log('✅ [RoadmapsContext] Units synced in DB:', roadmapId);
      
      // 3. Refetch to get server-generated IDs
      await refetchData();
    } catch (error) {
      // 4. Rollback on error
      console.error('❌ [RoadmapsContext] Failed to sync units:', error);
      setUnits(previousUnits);
      toast.error('Failed to save units. Please try again.');
      throw error;
    }
  };

  const addRoadmap = async (newRoadmapData: Partial<CourseRoadmap>): Promise<string> => {
    console.log('🚀 [RoadmapsContext] Adding new roadmap:', newRoadmapData.title);

    try {
      // Create roadmap in database
      const newRoadmap = await roadmapService.createRoadmap({
        title: newRoadmapData.title || '',
        description: newRoadmapData.description || '',
        ownerId: newRoadmapData.ownerId || '',
        ownerType: newRoadmapData.ownerType || 'USER',
        ownerName: newRoadmapData.ownerName,
        isPublic: newRoadmapData.isPublic || false,
        isPaid: newRoadmapData.isPaid || false,
        totalUnits: newRoadmapData.totalUnits || 0,
        level: newRoadmapData.level,
        estimatedTime: newRoadmapData.estimatedTime,
        rating: newRoadmapData.rating,
        students: newRoadmapData.students,
        price: newRoadmapData.price,
        copies: newRoadmapData.copies,
        originId: newRoadmapData.originId,
      });
      console.log('✅ [RoadmapsContext] Roadmap created in DB:', newRoadmap.id);

      // Update local state
      setRoadmaps(prevRoadmaps => [...prevRoadmaps, newRoadmap]);

      // Auto-create activation for the owner
      const existingActivation = activations.find(
        act => act.userId === newRoadmap.ownerId && act.roadmapId === newRoadmap.id
      );
      
      if (!existingActivation) {
        console.log('🚀 [RoadmapsContext] Creating activation for new roadmap');
        createActivation(newRoadmap.ownerId, newRoadmap.id);
      }

      return newRoadmap.id;
    } catch (error) {
      console.error('❌ [RoadmapsContext] Failed to create roadmap:', error);
      toast.error('Failed to create roadmap. Please try again.');
      throw error;
    }
  };

  const deleteRoadmap = async (roadmapId: string): Promise<void> => {
    // Store previous state for rollback
    const previousRoadmaps = [...roadmaps];
    const previousUnits = [...units];

    // 1. Optimistic update
    setRoadmaps(prevRoadmaps => 
      prevRoadmaps.filter(roadmap => roadmap.id.toString() !== roadmapId)
    );
    setUnits(prevUnits => 
      prevUnits.filter(unit => unit.roadmapId.toString() !== roadmapId)
    );
    console.log('🟢 [RoadmapsContext] Optimistic roadmap delete');

    try {
      // 2. Service call
      await roadmapService.deleteRoadmap(roadmapId);
      console.log('✅ [RoadmapsContext] Roadmap deleted from DB:', roadmapId);
    } catch (error) {
      // 3. Rollback on error
      console.error('❌ [RoadmapsContext] Failed to delete roadmap:', error);
      setRoadmaps(previousRoadmaps);
      setUnits(previousUnits);
      toast.error('Failed to delete roadmap. Please try again.');
      throw error;
    }
  };

  const unenrollFromRoadmap = (userId: string, roadmapId: string) => {
    console.log("🚪 unenrollFromRoadmap called:", { userId, roadmapId });
    
    // Remove the activation record first
    removeActivation(userId, roadmapId);
    
    // Then remove all progress for this roadmap
    removeProgressForRoadmap(userId, roadmapId);
    
    console.log("✅ User unenrolled from roadmap:", roadmapId);
  };

  const copyRoadmapForTeam = async (originalRoadmapId: string, newTeamId: string, newTeamName: string): Promise<string> => {
    console.log("📋 copyRoadmapForTeam called:", { originalRoadmapId, newTeamId, newTeamName });
    
    // Find the original roadmap
    const originalRoadmap = roadmaps.find(r => r.id.toString() === originalRoadmapId);
    if (!originalRoadmap) {
      console.error("❌ Original roadmap not found:", originalRoadmapId);
      throw new Error(`Roadmap ${originalRoadmapId} not found`);
    }
    
    // Find the original units
    const originalUnits = units.filter(u => u.roadmapId.toString() === originalRoadmapId);
    
    try {
      // Create new roadmap with TEAM ownership
      const newRoadmapId = await addRoadmap({
        ...originalRoadmap,
        ownerId: newTeamId,
        ownerType: 'TEAM',
        ownerName: newTeamName,
        originId: originalRoadmapId,
        isPublic: false,
        copies: 0,
        rating: 0,
        students: 0,
      });
      
      console.log("🚀 Created team roadmap copy:", newRoadmapId);
      
      // Copy units to new roadmap
      if (originalUnits.length > 0) {
        const newUnitsData: Unit[] = originalUnits.map(unit => ({
          ...unit,
          id: `unit-${Date.now()}-${Math.random()}`,
          roadmapId: newRoadmapId,
        }));
        
        console.log("📚 Copying units for team roadmap:", { count: newUnitsData.length, newRoadmapId });
        await syncUnitsForRoadmap(newRoadmapId, newUnitsData);
      }
      
      console.log("✅ Roadmap copied successfully for team:", newRoadmapId);
      return newRoadmapId;
    } catch (error) {
      console.error('❌ [RoadmapsContext] Failed to copy roadmap:', error);
      toast.error('Failed to copy roadmap for team. Please try again.');
      throw error;
    }
  };

  const copyRoadmapForUser = async (originalRoadmapId: string, newOwnerId: string, newOwnerName: string): Promise<string> => {
    console.log("📋 copyRoadmapForUser called:", { originalRoadmapId, newOwnerId, newOwnerName });
    console.log("📋 Available roadmaps:", roadmaps.length);
    console.log("📋 Available units:", units.length);
    
    // Find the original roadmap
    const originalRoadmap = roadmaps.find(r => r.id.toString() === originalRoadmapId);
    if (!originalRoadmap) {
      console.error("❌ Original roadmap not found:", originalRoadmapId);
      console.error("❌ Roadmap IDs available:", roadmaps.map(r => r.id));
      throw new Error(`Roadmap ${originalRoadmapId} not found`);
    }
    
    console.log("📋 Found original roadmap:", {
      id: originalRoadmap.id,
      title: originalRoadmap.title,
      ownerType: originalRoadmap.ownerType
    });
    
    // Find the original units
    const originalUnits = units.filter(u => u.roadmapId.toString() === originalRoadmapId);
    console.log("📋 Found original units:", originalUnits.length);
    
    try {
      // Create new roadmap with USER ownership
      console.log("📋 Creating new roadmap with data:", {
        title: originalRoadmap.title,
        ownerId: newOwnerId,
        ownerType: 'USER',
        ownerName: newOwnerName,
        originId: originalRoadmapId,
      });
      
      const newRoadmapId = await addRoadmap({
        title: originalRoadmap.title,
        description: originalRoadmap.description,
        ownerId: newOwnerId,
        ownerType: 'USER',
        ownerName: newOwnerName,
        originId: originalRoadmapId,
        isPublic: false,
        isPaid: false,
        totalUnits: originalRoadmap.totalUnits,
        level: originalRoadmap.level,
        estimatedTime: originalRoadmap.estimatedTime,
        copies: 0,
        rating: 0,
        students: 0,
      });
      
      console.log("🚀 Created user roadmap copy:", newRoadmapId);
      
      // Copy units to new roadmap
      if (originalUnits.length > 0) {
        const newUnitsData: Unit[] = originalUnits.map(unit => ({
          ...unit,
          id: `unit-${Date.now()}-${Math.random()}`,
          roadmapId: newRoadmapId,
        }));
        
        console.log("📚 Copying units for user roadmap:", { count: newUnitsData.length, newRoadmapId });
        await syncUnitsForRoadmap(newRoadmapId, newUnitsData);
      }
      
      console.log("✅ Roadmap copied successfully for user:", newRoadmapId);
      return newRoadmapId;
    } catch (error) {
      console.error('❌ [RoadmapsContext] Failed to copy roadmap for user:', error);
      toast.error('Failed to copy roadmap. Please try again.');
      throw error;
    }
  };

  return (
    <RoadmapsContext.Provider value={{ 
      roadmaps,
      units,
      isLoading,
      updateRoadmapVisibility,
      editRoadmap,
      syncUnitsForRoadmap,
      addRoadmap,
      deleteRoadmap,
      unenrollFromRoadmap,
      enrichRoadmapWithProgress,
      getPersonalRoadmaps,
      getCommunityRoadmaps,
      getCatalogRoadmaps,
      copyRoadmapForTeam,
      copyRoadmapForUser,
      hasValidEntitlement
    }}>
      {children}
    </RoadmapsContext.Provider>
  );
};

export const useRoadmapsContext = () => {
  const context = useContext(RoadmapsContext);
  if (context === undefined) {
    throw new Error('useRoadmapsContext must be used within a RoadmapsProvider');
  }
  return context;
};
