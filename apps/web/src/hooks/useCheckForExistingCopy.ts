import { useRoadmapsContext } from '@/contexts/RoadmapsContext';
import { User, CourseRoadmap } from '@/lib/mockData';

export interface ExistingCopyResult {
  hasCopy: boolean;
  copyId: string | null;
  copyTitle: string | null;
}

export const useCheckForExistingCopy = (user: User | null, roadmap: CourseRoadmap | null | undefined): ExistingCopyResult => {
  const { getPersonalRoadmaps } = useRoadmapsContext();
  
  if (!user || !roadmap || !(roadmap as any).id) {
    return { hasCopy: false, copyId: null, copyTitle: null };
  }

  const personalRoadmaps = getPersonalRoadmaps(user);
  
  // Find the personal roadmap that has an originId matching this roadmap's id
  const existingCopy = personalRoadmaps.find(
    personalRoadmap => 
      (personalRoadmap as any).originId && 
      (personalRoadmap as any).originId.toString() === (roadmap as any).id.toString()
  );
  
  if (existingCopy) {
    return {
      hasCopy: true,
      copyId: existingCopy.id.toString(),
      copyTitle: existingCopy.title
    };
  }
  
  return { hasCopy: false, copyId: null, copyTitle: null };
};
