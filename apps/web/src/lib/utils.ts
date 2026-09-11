import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDate: { day: string; month: string; year: string }): number {
  const today = new Date();
  const birth = new Date(parseInt(birthDate.year), parseInt(birthDate.month) - 1, parseInt(birthDate.day));
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Otros usuarios traen `age` calculada por el API; el propio usuario trae su fecha de nacimiento.
export function displayAge(
  user?: { age?: number | null; birthDate?: { day: string; month: string; year: string } } | null,
): number | null {
  if (!user) return null;
  if (user.age !== undefined && user.age !== null) return user.age;
  return user.birthDate ? calculateAge(user.birthDate) : null;
}

// Team aggregation utility functions
import { User } from '@/lib/mockData';

export function aggregateTopics(members: User[]): string {
  const uniqueSubjects = Array.from(new Set(members.map(m => m.subject).filter(Boolean)));
  
  if (uniqueSubjects.length > 2) {
    return `${uniqueSubjects[0]}, ${uniqueSubjects[1]} and more`;
  }
  
  return uniqueSubjects.join(", ");
}

export function aggregateLevels(members: User[]): string[] {
  return Array.from(new Set(members.map(m => m.level).filter(Boolean))) as string[];
}

export function aggregateWeeklyTime(members: User[]): string {
  const validHours = members.map(m => m.weeklyHours).filter(Boolean) as number[];
  if (validHours.length === 0) return 'Not specified';
  
  const sum = validHours.reduce((acc, hours) => acc + hours, 0);
  const average = Math.round(sum / validHours.length);
  return `${average} hours/week`;
}

export function aggregateLanguages(members: User[]): string[] {
  const allLanguages = members
    .flatMap(m => m.languages?.map(l => l.language) || [])
    .filter(Boolean);
  
  const uniqueLanguages = Array.from(new Set(allLanguages));
  return uniqueLanguages;
}

export function aggregateCommPreferences(members: User[]): string[] {
  const allPreferences = members
    .flatMap(m => m.communicationMethods || [])
    .filter(Boolean);
  
  const uniquePreferences = Array.from(new Set(allPreferences));
  return uniquePreferences.slice(0, 4);
}

export function aggregateLocations(members: User[]): string {
  const uniqueLocations = Array.from(new Set(members.map(m => m.location).filter(Boolean)));
  
  if (uniqueLocations.length > 2) {
    return "Several locations";
  }
  
  return uniqueLocations.join(", ");
}

export function aggregateGoals(members: User[]): string[] {
  const allGoals = members.map(m => m.goal).filter(Boolean);
  const uniqueGoals = Array.from(new Set(allGoals));
  return uniqueGoals.slice(0, 4);
}

export function aggregateSubjects(members: User[]): string {
  const uniqueSubjects = Array.from(new Set(members.map(m => m.subject).filter(Boolean)));
  return uniqueSubjects.join(", ");
}

// Find common roadmaps between two users
import { CourseRoadmap } from '@/lib/mockData';

export function findCommonRoadmaps(
  currentUserRoadmaps: CourseRoadmap[], 
  profileUserRoadmaps: CourseRoadmap[]
): CourseRoadmap | null {
  for (const currentRoadmap of currentUserRoadmaps) {
    for (const profileRoadmap of profileUserRoadmaps) {
      // Check if they're using the same roadmap
      if (currentRoadmap.id === profileRoadmap.id) {
        return currentRoadmap;
      }
      
      // Check if one is a copy of the other via originId
      if (currentRoadmap.originId && currentRoadmap.originId === profileRoadmap.id) {
        return profileRoadmap;
      }
      
      if (profileRoadmap.originId && profileRoadmap.originId === currentRoadmap.id) {
        return currentRoadmap;
      }
      
      // Check if they both share the same origin
      if (currentRoadmap.originId && profileRoadmap.originId && 
          currentRoadmap.originId === profileRoadmap.originId) {
        return currentRoadmap;
      }
    }
  }
  
  return null;
}
