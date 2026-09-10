import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockPointEvents, mockBadgeEvents, PointEvent, BadgeEvent } from '@/lib/mockData';

const STORAGE_KEY = 'ekana-point-events';
const BADGE_STORAGE_KEY = 'ekana-badge-events';

interface GamificationContextType {
  pointEvents: PointEvent[];
  badgeEvents: BadgeEvent[];
  awardPoints: (userId: string, points: number, reason: string, teamId?: string, uniqueTriggerId?: string) => void;
  awardBadge: (userId: string, reason: string, teamId: string, uniqueTriggerId: string) => void;
  getUserPoints: (userId: string) => number;
  getTeamPoints: (teamId: string) => number;
  getTeamUserPoints: (userId: string, teamId: string, startDate?: string) => number;
  getUserBadges: (userId: string) => number;
  getTeamBadges: (teamId: string) => number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  // Initialize point events from localStorage or use mock data
  const [pointEvents, setPointEvents] = useState<PointEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Loaded point events from localStorage:', parsed.length, 'events');
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to load point events from localStorage:', error);
    }
    console.log('📦 Using mock point events data');
    return mockPointEvents;
  });

  // Initialize badge events from localStorage or use mock data
  const [badgeEvents, setBadgeEvents] = useState<BadgeEvent[]>(() => {
    try {
      const stored = localStorage.getItem(BADGE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🏅 Loaded badge events from localStorage:', parsed.length, 'events');
        return parsed;
      }
    } catch (error) {
      console.error('❌ Failed to load badge events from localStorage:', error);
    }
    console.log('🏅 Using mock badge events data');
    return mockBadgeEvents;
  });

  // Persist point events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pointEvents));
      console.log('💾 Saved point events to localStorage:', pointEvents.length, 'events');
    } catch (error) {
      console.error('❌ Failed to save point events to localStorage:', error);
    }
  }, [pointEvents]);

  // Persist badge events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(badgeEvents));
      console.log('💾 Saved badge events to localStorage:', badgeEvents.length, 'events');
    } catch (error) {
      console.error('❌ Failed to save badge events to localStorage:', error);
    }
  }, [badgeEvents]);

  const awardPoints = (
    userId: string, 
    points: number, 
    reason: string, 
    teamId?: string, 
    uniqueTriggerId?: string
  ) => {
    // Uniqueness check
    if (uniqueTriggerId) {
      const existingEvent = pointEvents.find(
        event => event.userId === userId && event.uniqueTriggerId === uniqueTriggerId
      );
      
      if (existingEvent) {
        console.log('⚠️ Points already awarded for this trigger:', { userId, uniqueTriggerId });
        return;
      }
    }

    // Create new point event
    const newEvent: PointEvent = {
      id: `pe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      teamId,
      points,
      reason,
      timestamp: new Date().toISOString(),
      uniqueTriggerId
    };

    setPointEvents(prevEvents => [...prevEvents, newEvent]);
    console.log('✅ Points awarded:', newEvent);
  };

  const getUserPoints = (userId: string): number => {
    return pointEvents
      .filter(event => event.userId === userId)
      .reduce((sum, event) => sum + event.points, 0);
  };

  const getTeamPoints = (teamId: string): number => {
    return pointEvents
      .filter(event => event.teamId === teamId)
      .reduce((sum, event) => sum + event.points, 0);
  };

  const getTeamUserPoints = (userId: string, teamId: string, startDate?: string): number => {
    return pointEvents
      .filter(event => {
        const matchesUser = event.userId === userId && event.teamId === teamId;
        if (!matchesUser) return false;
        
        // If startDate is provided, only include events on or after that date
        if (startDate && event.timestamp) {
          return new Date(event.timestamp) >= new Date(startDate);
        }
        
        // If no startDate or no timestamp, include the event (legacy behavior)
        return !startDate;
      })
      .reduce((sum, event) => sum + event.points, 0);
  };

  const awardBadge = (
    userId: string, 
    reason: string, 
    teamId: string, 
    uniqueTriggerId: string
  ) => {
    // Uniqueness check - critical to prevent duplicate awards
    const existingBadge = badgeEvents.find(
      event => event.userId === userId && event.uniqueTriggerId === uniqueTriggerId
    );
    
    if (existingBadge) {
      console.log('⚠️ Badge already awarded for this trigger:', { userId, uniqueTriggerId });
      return;
    }

    // Create new badge event
    const newBadge: BadgeEvent = {
      id: `be-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      teamId,
      reason,
      timestamp: new Date().toISOString(),
      uniqueTriggerId
    };

    setBadgeEvents(prevEvents => [...prevEvents, newBadge]);
    console.log('🏅 Badge awarded:', newBadge);
  };

  const getUserBadges = (userId: string): number => {
    return badgeEvents.filter(event => event.userId === userId).length;
  };

  const getTeamBadges = (teamId: string): number => {
    return badgeEvents.filter(event => event.teamId === teamId).length;
  };

  return (
    <GamificationContext.Provider
      value={{
        pointEvents,
        badgeEvents,
        awardPoints,
        awardBadge,
        getUserPoints,
        getTeamPoints,
        getTeamUserPoints,
        getUserBadges,
        getTeamBadges
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamificationContext = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamificationContext must be used within a GamificationProvider');
  }
  return context;
};