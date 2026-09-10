import { createContext, useContext, useState, ReactNode } from 'react';
import { mockProgressTracking, mockActivations, ProgressTracking, Activation } from '@/lib/mockData';
import { useGamificationContext } from './GamificationContext';

interface ProgressContextType {
  progressTracking: ProgressTracking[];
  activations: Activation[];
  toggleSubunitCompletion: (userId: string, roadmapId: string, subunitId: string, teamId?: string) => void;
  removeProgressForRoadmap: (userId: string, roadmapId: string) => void;
  removeActivation: (userId: string, roadmapId: string) => void;
  createActivation: (userId: string, roadmapId: string, teamId?: string) => string;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [progressTracking, setProgressTracking] = useState<ProgressTracking[]>(mockProgressTracking);
  const [activations, setActivations] = useState<Activation[]>(mockActivations);
  const { awardPoints } = useGamificationContext();

  const createActivation = (userId: string, roadmapId: string, teamId?: string): string => {
    // Check if activation already exists for this user, roadmap, and team combination
    const existingActivation = activations.find(
      act => act.userId === userId && 
             act.roadmapId === roadmapId && 
             act.teamId === teamId
    );
    
    if (existingActivation) {
      console.log("⚠️ createActivation: Activation already exists, returning existing ID", {
        activationId: existingActivation.id,
        userId,
        roadmapId,
        teamId
      });
      return existingActivation.id;
    }
    
    console.log("DEBUG: Before setActivations", activations);
    
    const newId = `act-${Date.now()}`;
    const newActivation: Activation = {
      id: newId,
      userId,
      roadmapId,
      teamId,
      startedAt: new Date().toISOString()
    };
    
    console.log("✨ createActivation: Creating new activation", {
      activation: newActivation,
      currentActivationsCount: activations.length
    });
    
    setActivations(prevActivations => {
      const updated = [...prevActivations, newActivation];
      console.log("DEBUG: After setActivations", updated);
      console.log("📋 createActivation: Activation state updated", {
        newActivationId: newId,
        totalActivations: updated.length,
        newActivation
      });
      return updated;
    });
    
    console.log("✅ createActivation: Activation created and returned", { newId });
    
    return newId;
  };

  const toggleSubunitCompletion = (userId: string, roadmapId: string, subunitId: string, teamId?: string) => {
    console.log("🎯 toggleSubunitCompletion called:", { userId, roadmapId, subunitId, teamId });
    
    // Find the activation for this user and roadmap from state
    // When teamId is provided, match on it to ensure we get the correct activation
    let activation = activations.find(
      act => 
        act.userId === userId && 
        act.roadmapId === roadmapId &&
        (teamId ? act.teamId === teamId : true)
    );

    if (!activation) {
      console.warn("⚠️ No activation found, auto-creating:", { userId, roadmapId, teamId });
      const newActivationId = createActivation(userId, roadmapId, teamId);
      // Find the newly created activation
      activation = { id: newActivationId, userId, roadmapId, teamId, startedAt: new Date().toISOString() };
      console.log("✅ Auto-created activation:", activation);
    }

    console.log("✅ Found activation:", activation);

    // Step 2: Find or create the progress record
    setProgressTracking(prevTracking => {
      const existingIndex = prevTracking.findIndex(
        progress => progress.activationId === activation.id && progress.subunitId === subunitId
      );

      if (existingIndex !== -1) {
        // Update existing record
        const updatedTracking = [...prevTracking];
        const currentRecord = updatedTracking[existingIndex];
        const newCompletedAt = currentRecord.completedAt ? null : new Date().toISOString();
        
        updatedTracking[existingIndex] = {
          ...currentRecord,
          completedAt: newCompletedAt
        };

        console.log("✅ Updated progress record:", updatedTracking[existingIndex]);

        // Award points when marking as complete (not when marking as incomplete)
        if (newCompletedAt) {
          awardPoints(
            userId, 
            10, 
            "Completed a subunit", 
            activation.teamId, 
            `subunit-${roadmapId}-${subunitId}`
          );
        }

        return updatedTracking;
      } else {
        // Create new progress record
        const newRecord: ProgressTracking = {
          userId,
          activationId: activation.id,
          subunitId,
          completedAt: new Date().toISOString()
        };

        console.log("✅ Created new progress record:", newRecord);

        // Award points for new completion
        awardPoints(
          userId, 
          10, 
          "Completed a subunit", 
          activation.teamId, 
          `subunit-${roadmapId}-${subunitId}`
        );

        return [...prevTracking, newRecord];
      }
    });
  };

  const removeProgressForRoadmap = (userId: string, roadmapId: string) => {
    console.log("🗑️ removeProgressForRoadmap called:", { userId, roadmapId });
    
    // Find all activations for this user and roadmap from state
    const relevantActivationIds = activations
      .filter(act => act.userId === userId && act.roadmapId === roadmapId)
      .map(act => act.id);
    
    if (relevantActivationIds.length === 0) {
      console.warn("⚠️ No activations found for:", { userId, roadmapId });
      return;
    }

    console.log("✅ Found activation IDs to remove:", relevantActivationIds);

    // Remove all progress records matching these activation IDs
    setProgressTracking(prevTracking => 
      prevTracking.filter(progress => !relevantActivationIds.includes(progress.activationId))
    );

    console.log("✅ Progress records removed for roadmap:", roadmapId);
  };

  const removeActivation = (userId: string, roadmapId: string) => {
    console.log("🗑️ removeActivation called:", { userId, roadmapId });
    
    setActivations(prevActivations => {
      const filtered = prevActivations.filter(
        act => !(act.userId === userId && act.roadmapId === roadmapId)
      );
      console.log("✅ Activation removed. Remaining activations:", filtered.length);
      return filtered;
    });
  };

  return (
    <ProgressContext.Provider value={{ progressTracking, activations, toggleSubunitCompletion, removeProgressForRoadmap, removeActivation, createActivation }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgressContext = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgressContext must be used within a ProgressProvider');
  }
  return context;
};
