// Centralized mock data for courses, roadmaps, teams, and users
// This file serves as the single source of truth for all mock data

import { GOALS } from "./constants";
import { Request } from "@/contexts/RequestContext";

// Ekky AI User ID constant
export const EKKY_AI_ID = 'user-ekky-ai';

// Create a union type of all valid goal names
type Goal = (typeof GOALS)[number]["name"];

// Message interface for team chat and direct messages
export interface Message {
  id: string;
  teamId?: string; // For team messages
  userId: string; // Sender ID (kept for backward compatibility)
  senderId?: string; // Explicit sender ID for clarity
  receiverId?: string; // For direct messages
  text: string;
  timestamp: string;
  threadId?: string; // Reference to parent message for replies
  handle?: "question" | "support" | "motivation" | "exercise" | null;
  bestResponseId?: string; // ID of the best reply (only for parent messages)
}

export interface User {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  profileComplete: boolean;
  hasActiveTeam: boolean;
  activeCourse?: string;

  // Onboarding data
  subject?: string;
  customSubject?: string;
  goal?: Goal;
  level?: string;
  weeklyHours?: number;
  communicationMethods?: string[];
  languages?: Array<{ language: string; proficiency: string }>;

  // Bio setup data
  avatar?: string;
  bio?: string;
  interests?: string[];
  availability?: string[];
  schedule?: {
    weekdays: string[];
    weekend: string[];
  };
  birthDate?: {
    day: string;
    month: string;
    year: string;
  };
  location?: string;
  age?: number | null;
}

// Event-based tracking interfaces
export interface PointEvent {
  id: string;
  userId: string;
  teamId?: string;
  points: number;
  reason: string;
  timestamp: string;
  uniqueTriggerId?: string;
}

export interface BadgeEvent {
  id: string;
  userId: string;
  teamId?: string;
  reason: string;
  timestamp: string;
  uniqueTriggerId?: string;
}

export const mockUsers: User[] = [
  {
    id: "user-001",
    email: "sarah.johnson@example.com",
    name: "Sarah Johnson",
    isPremium: true,
    profileComplete: true,
    hasActiveTeam: true,
    activeCourse: "React Development",
    subject: "Frontend Development",
    goal: "Learn new skills",
    level: "Intermediate",
    weeklyHours: 20,
    communicationMethods: ["Video calls", "Text chat", "Voice calls"],
    languages: [
      { language: "Romanian", proficiency: "Native" },
      { language: "Spanish", proficiency: "Advanced" },
    ],
    avatar: "SJ",
    bio: "Passionate frontend developer with 2 years of experience. Looking to master React and modern development practices. I love collaborative learning and helping others grow.",
    interests: ["Programming", "Design", "Technology"],
    availability: ["Morning", "Evening"],
    schedule: {
      weekdays: ["Morning", "Evening"],
      weekend: ["Afternoon"],
    },
    birthDate: { day: "15", month: "3", year: "1995" },
    location: "San Francisco, CA",
  },
  {
    id: "user-002",
    email: "mike.chen@example.com",
    name: "Mike Chen",
    isPremium: false,
    profileComplete: true,
    hasActiveTeam: true,
    subject: "Data Science",
    goal: "Change careers",
    level: "Beginner",
    weeklyHours: 20,
    communicationMethods: ["Video calls", "Voice calls"],
    languages: [
      { language: "English", proficiency: "4" },
      { language: "Chinese", proficiency: "5" },
    ],
    avatar: "MC",
    bio: "Former marketing professional transitioning to tech. Dedicated learner with strong analytical skills seeking to build a career in web development.",
    interests: ["Programming", "Career Development", "Technology"],
    availability: ["Evening"],
    schedule: {
      weekdays: ["Evening"],
      weekend: ["Morning", "Afternoon"],
    },
    birthDate: { day: "22", month: "8", year: "1990" },
    location: "New York, NY",
  },
  {
    id: "user-003",
    email: "emma.wilson@example.com",
    name: "Emma Wilson",
    isPremium: false,
    profileComplete: true,
    hasActiveTeam: true,
    subject: "UI/UX Design",
    goal: "Learn new skills",
    level: "Intermediate",
    weeklyHours: 12,
    communicationMethods: ["Text chat", "Video calls"],
    languages: [
      { language: "English", proficiency: "5" },
      { language: "French", proficiency: "3" },
    ],
    avatar: "EW",
    bio: "Creative designer focused on user experience and interface design. Always eager to learn new design trends and collaborate on innovative projects.",
    interests: ["Design", "Art", "Psychology"],
    availability: ["Afternoon"],
    schedule: {
      weekdays: ["Afternoon"],
      weekend: ["Morning"],
    },
    birthDate: { day: "10", month: "12", year: "1993" },
    location: "Austin, TX",
  },
  {
    id: "user-004",
    email: "alex.rodriguez@example.com",
    name: "Alex Rodriguez",
    isPremium: true,
    profileComplete: true,
    hasActiveTeam: true,
    activeCourse: "Advanced React Development",
    subject: "Frontend Development",
    goal: "Learn new skills",
    level: "Advanced",
    weeklyHours: 18,
    communicationMethods: ["Video calls", "Text chat", "Voice calls"],
    languages: [
      { language: "English", proficiency: "5" },
      { language: "Spanish", proficiency: "5" },
    ],
    avatar: "AR",
    bio: "Senior developer passionate about React ecosystem and modern web technologies. Love mentoring others and building scalable applications.",
    interests: ["Programming", "Technology", "Mentoring"],
    availability: ["Morning", "Evening"],
    schedule: {
      weekdays: ["Morning", "Evening"],
      weekend: ["Morning"],
    },
    birthDate: { day: "5", month: "7", year: "1988" },
    location: "Seattle, WA",
  },
  {
    id: "user-005",
    email: "jordan.kim@example.com",
    name: "Jordan Kim",
    isPremium: false,
    profileComplete: true,
    hasActiveTeam: true,
    subject: "Data Science",
    goal: "Change careers",
    level: "Beginner",
    weeklyHours: 25,
    communicationMethods: ["Text chat"],
    languages: [
      { language: "English", proficiency: "4" },
      { language: "Korean", proficiency: "5" },
    ],
    avatar: "JK",
    bio: "Former finance analyst exploring data science and machine learning. Analytical mindset with strong mathematical background, excited to apply these skills in tech.",
    interests: ["Data Science", "Mathematics", "Finance"],
    availability: ["Evening"],
    schedule: {
      weekdays: ["Evening"],
      weekend: ["Afternoon", "Evening"],
    },
    birthDate: { day: "18", month: "4", year: "1992" },
    location: "Chicago, IL",
  },
  {
    id: "user-006",
    email: "sam.chen@example.com",
    name: "Sam Chen",
    isPremium: true,
    profileComplete: true,
    hasActiveTeam: true,
    subject: "Backend Development",
    goal: "Learn new skills",
    level: "Intermediate",
    weeklyHours: 14,
    communicationMethods: ["Video calls", "Voice calls"],
    languages: [
      { language: "English", proficiency: "5" },
      { language: "Chinese", proficiency: "4" },
    ],
    avatar: "SC",
    bio: "Backend developer specializing in Node.js and cloud technologies. Interested in microservices architecture and scalable system design.",
    interests: ["Programming", "Cloud Computing", "Architecture"],
    availability: ["Morning"],
    schedule: {
      weekdays: ["Morning"],
      weekend: ["Morning", "Afternoon"],
    },
    birthDate: { day: "28", month: "9", year: "1991" },
    location: "Los Angeles, CA",
  },
  {
    id: "1760380309996",
    email: "fedtamayo93@gmail.com",
    name: "EkiTrainee",
    isPremium: false,
    profileComplete: true,
    hasActiveTeam: true,
    subject: "UI/UX Design",
    goal: "Have fun",
    level: "Advanced",
    weeklyHours: 5,
    communicationMethods: ["Text chat", "Video calls", "Voice calls"],
    languages: [{ language: "French", proficiency: "" }],
    avatar: "FT",
    bio: "",
    interests: [],
    availability: [],
    location: "San Francisco, CA",
  },
  {
    id: "user-007",
    email: "maria.garcia@example.com",
    name: "Maria Garcia",
    isPremium: false,
    profileComplete: true,
    hasActiveTeam: false,
    subject: "Mobile Development",
    goal: "Start a new career",
    level: "Beginner",
    weeklyHours: 10,
    communicationMethods: ["Text chat", "Video calls"],
    languages: [
      { language: "Spanish", proficiency: "5" },
      { language: "English", proficiency: "4" },
    ],
    avatar: "MG",
    bio: "Computer science student passionate about mobile app development. Looking to build real-world applications and learn from experienced developers.",
    interests: ["Mobile Apps", "Programming", "Entrepreneurship"],
    availability: ["Afternoon", "Evening"],
    schedule: {
      weekdays: ["Evening"],
      weekend: ["Afternoon", "Evening"],
    },
    birthDate: { day: "7", month: "11", year: "1998" },
    location: "Miami, FL",
  },
  {
    id: "user-008",
    email: "david.brown@example.com",
    name: "David Brown",
    isPremium: true,
    profileComplete: true,
    hasActiveTeam: false,
    subject: "Machine Learning",
    goal: "Change careers",
    level: "Intermediate",
    weeklyHours: 22,
    communicationMethods: ["Video calls", "Text chat"],
    languages: [
      { language: "English", proficiency: "5" },
      { language: "German", proficiency: "3" },
    ],
    avatar: "DB",
    bio: "PhD researcher transitioning to industry. Strong background in mathematics and statistics, focusing on practical ML applications and deep learning.",
    interests: ["Machine Learning", "Research", "Mathematics"],
    availability: ["Morning", "Afternoon"],
    schedule: {
      weekdays: ["Morning", "Afternoon"],
      weekend: ["Morning"],
    },
    birthDate: { day: "13", month: "6", year: "1987" },
    location: "Boston, MA",
  },
  {
    id: "user-009",
    email: "lisa.taylor@example.com",
    name: "Lisa Taylor",
    isPremium: false,
    profileComplete: true,
    hasActiveTeam: false,
    subject: "Project Management",
    goal: "Learn new skills",
    level: "Beginner",
    weeklyHours: 8,
    communicationMethods: ["Voice calls", "Text chat"],
    languages: [{ language: "English", proficiency: "5" }],
    avatar: "LT",
    bio: "Team lead looking to formalize project management skills. Experience managing small teams, seeking to learn industry best practices and certification.",
    interests: ["Leadership", "Organization", "Team Building"],
    availability: ["Morning"],
    schedule: {
      weekdays: ["Morning"],
      weekend: ["Morning"],
    },
    birthDate: { day: "25", month: "2", year: "1989" },
    location: "Denver, CO",
  },
  {
    id: "user-010",
    email: "kevin.wong@example.com",
    name: "Kevin Wong",
    isPremium: true,
    profileComplete: true,
    hasActiveTeam: false,
    subject: "Data Science",
    goal: "Have fun",
    level: "Advanced",
    weeklyHours: 16,
    communicationMethods: ["Video calls", "Voice calls", "Text chat"],
    languages: [
      { language: "English", proficiency: "5" },
      { language: "Chinese", proficiency: "4" },
      { language: "Japanese", proficiency: "2" },
    ],
    avatar: "KW",
    bio: "Experienced data scientist exploring advanced topics like MLOps and AI ethics. Enjoy collaborating on challenging projects and sharing knowledge with the community.",
    interests: ["Data Science", "AI Ethics", "Gaming"],
    availability: ["Evening"],
    schedule: {
      weekdays: ["Evening"],
      weekend: ["Afternoon", "Evening"],
    },
    birthDate: { day: "3", month: "1", year: "1985" },
    location: "Portland, OR",
  },
  {
    id: EKKY_AI_ID,
    email: "ekky@ekana.ai",
    name: "Ekky AI",
    isPremium: true,
    profileComplete: true,
    hasActiveTeam: false,
    avatar: "/lovable-uploads/c3182074-9d3a-4af1-bf63-63ac9c6e5be8.png",
    bio: "Your personal learning assistant.",
    interests: ["AI", "Education", "Learning"],
    availability: ["Morning", "Afternoon", "Evening"],
    schedule: {
      weekdays: ["Morning", "Afternoon", "Evening"],
      weekend: ["Morning", "Afternoon", "Evening"],
    },
  },
];

export interface TeamMember {
  teamId: string;
  userId: string;
  role: "admin" | "member";
}

export interface TeamGoal {
  id: string;
  teamId: string;
  type: "units" | "points";
  amount: number;
  weeks: number;
  badges: number;
  description: string;
  startDate: string;
}

export interface Team {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  course: string;
  roadmapName?: string; // Optional - prefer deriving from currentRoadmapId
  duration: string;
  startDate: Date;
  maxMembers: number;
  activity: string;
  lastActive: string;
  resourceLinks: Array<{
    name: string;
    url: string;
    description: string;
  }>;
  currentRoadmapId?: string;
  // Team settings from TeamSettings.tsx
  subject?: string; // "aggregate" or specific subject/topic
  teamLevel: string | string[]; // "aggregate" or specific level
  languages: string | string[]; // "aggregate" or specific languages
  goals: string | string[]; // "aggregate" or specific goals
  timeCommitments: string; // "aggregate" or specific time commitment
  communicationPreferences: string | string[]; // "aggregate" or specific preferences
  durationValue: number;
  durationType: string; // "weeks", "months", etc.
  archiveOnEnd: boolean;
  onlyAdminsEditGoals: boolean;
  onlyAdminsAcceptRequests: boolean;
  onlyAdminsRemoveMembers: boolean;
  allMembersAdmins: boolean;
  allowSearch: boolean;
  showTeamStats: boolean;
  showMemberList: boolean;
}

export interface Partner {
  id: string;
  name: string;
}

export const mockPartners: Partner[] = [
  { id: "partner-001", name: "IzyAcademy" },
  { id: "partner-002", name: "Tison.ia" },
  { id: "partner-003", name: "AWS Training Partner" },
];

// Normalized team goals array
export const mockGoals: TeamGoal[] = [
  {
    id: "goal-001",
    teamId: "team-123",
    type: "units",
    amount: 8,
    weeks: 3,
    badges: 1,
    description: "8 units in 3 weeks",
    startDate: "2025-09-20T00:00:00Z",
  },
  {
    id: "goal-002",
    teamId: "team-current",
    type: "units",
    amount: 8,
    weeks: 4,
    badges: 1,
    description: "8 units in 4 weeks",
    startDate: "2025-09-15T00:00:00Z",
  },
  {
    id: "goal-003",
    teamId: "team-456",
    type: "units",
    amount: 6,
    weeks: 2,
    badges: 1,
    description: "6 units in 2 weeks",
    startDate: "2025-09-28T00:00:00Z",
  },
  {
    id: "goal-004",
    teamId: "team-789",
    type: "units",
    amount: 5,
    weeks: 1,
    badges: 1,
    description: "5 units in 1 week",
    startDate: "2025-10-01T00:00:00Z",
  },
  {
    id: "goal-005",
    teamId: "team-101",
    type: "units",
    amount: 12,
    weeks: 4,
    badges: 2,
    description: "12 units in 4 weeks",
    startDate: "2025-09-18T00:00:00Z",
  },
  {
    id: "goal-006",
    teamId: "team-202",
    type: "points",
    amount: 500,
    weeks: 2,
    badges: 1,
    description: "500 points in 2 weeks",
    startDate: "2025-09-25T00:00:00Z",
  },
  {
    id: "goal-007",
    teamId: "team-303",
    type: "units",
    amount: 10,
    weeks: 2,
    badges: 1,
    description: "10 units in 2 weeks",
    startDate: "2025-09-26T00:00:00Z",
  },
  {
    id: "goal-008",
    teamId: "team-404",
    type: "units",
    amount: 9,
    weeks: 3,
    badges: 1,
    description: "9 units in 3 weeks",
    startDate: "2025-09-12T00:00:00Z",
  },
  {
    id: "goal-009",
    teamId: "team-505",
    type: "units",
    amount: 3,
    weeks: 2,
    badges: 1,
    description: "3 units in 2 weeks",
    startDate: "2025-09-24T00:00:00Z",
  },
  {
    id: "goal-010",
    teamId: "team-606",
    type: "units",
    amount: 7,
    weeks: 1,
    badges: 1,
    description: "7 units in 1 week",
    startDate: "2025-10-02T00:00:00Z",
  },
];

// Helper function to detect subunit type based on content URL
const detectSubunitType = (contentUrl?: string): 'video' | 'article' => {
  if (!contentUrl) return 'article';
  const videoPatterns = ['youtube.com', 'youtu.be', 'vimeo.com'];
  return videoPatterns.some(pattern => contentUrl.includes(pattern)) ? 'video' : 'article';
};

export interface Subunit {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'exercise';
  contentUrl?: string;
  duration?: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  roadmapId: string;
  sequence_order: number;
  subunits: Subunit[];
}

export interface CourseRoadmap {
  id: string;
  title: string;
  description: string;
  level?: string;
  totalUnits?: number;
  estimatedTime?: string;
  rating?: number;
  students?: number;
  price?: string;
  createdAt?: string;
  isPaid?: boolean;
  isPublic?: boolean;
  copies?: number;

  // Ownership
  ownerId: string;
  ownerType: "USER" | "TEAM" | "THIRD_PARTY";
  ownerName?: string; // This will be denormalized for simplicity in the UI
  originId?: string; // ID of the original roadmap this was copied from

  // User-specific properties (calculated by hooks, NOT to be stored in mockRoadmaps)
  progress?: number;
  completedUnits?: number;
  hasUserAccess?: boolean;
}

export interface ProgressTracking {
  userId: string;
  activationId: string;
  subunitId: string;
  completedAt: string | null;
}

export const mockTeams: Team[] = [
  {
    id: "team-123",
    name: "Frontend Developers",
    bio: "A collaborative team focused on mastering React development and modern frontend technologies.",
    avatar: "FD",
    course: "React Development",
    roadmapName: "Team Frontend Mastery",
    duration: "8 weeks",
    startDate: new Date("2025-10-24T00:00:00Z"),
    maxMembers: 6,
    activity: "Active",
    lastActive: "2 hours ago",
    currentRoadmapId: "7",
    resourceLinks: [
      {
        name: "Team Google Drive",
        url: "https://drive.google.com",
        description: "Access our team's shared Google Drive folder for documents and resources",
      },
      {
        name: "Project Repository",
        url: "https://github.com",
        description: "View and contribute to our team's main project repository on GitHub",
      },
    ],
    subject: "aggregate",
    teamLevel: "aggregate",
    languages: "aggregate",
    goals: "aggregate",
    timeCommitments: "aggregate",
    communicationPreferences: "aggregate",
    durationValue: 8,
    durationType: "weeks",
    archiveOnEnd: false,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: true,
    onlyAdminsRemoveMembers: true,
    allMembersAdmins: false,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-current",
    name: "Advanced React Team",
    bio: "An advanced team diving deep into React patterns, performance optimization, and modern development practices.",
    avatar: "AR",
    course: "Advanced React Development",
    roadmapName: "Advanced React Development Roadmap",
    duration: "12 weeks",
    startDate: new Date("2025-10-28T00:00:00Z"),
    maxMembers: 6,
    activity: "Active",
    lastActive: "1 hour ago",
    currentRoadmapId: "8",
    resourceLinks: [
      {
        name: "Advanced React Resources",
        url: "https://drive.google.com",
        description: "Advanced patterns and performance resources",
      },
      { name: "Team Project", url: "https://github.com", description: "Advanced React showcase project" },
    ],
    subject: "Advanced React Patterns",
    teamLevel: ["Advanced", "Intermediate"],
    languages: ["English", "Spanish"],
    goals: ["Have fun", "Start a new career"],
    timeCommitments: "15 hours/week",
    communicationPreferences: ["Voice calls", "Video calls", "In-person meetups"],
    durationValue: 12,
    durationType: "weeks",
    archiveOnEnd: false,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: false,
    onlyAdminsRemoveMembers: false,
    allMembersAdmins: false,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-456",
    name: "Data Science Explorers",
    bio: "Learn data science fundamentals from Python basics to machine learning algorithms.",
    avatar: "DS",
    course: "Data Science Fundamentals",
    roadmapName: "Complete Data Science Path",
    duration: "12 weeks",
    startDate: new Date("2025-10-22T00:00:00Z"),
    maxMembers: 8,
    activity: "Active",
    lastActive: "45 minutes ago",
    currentRoadmapId: "team-copy-4",
    resourceLinks: [
      { name: "Jupyter Notebooks", url: "https://github.com", description: "Shared notebooks and datasets" },
      { name: "Kaggle Team", url: "https://kaggle.com", description: "Team competitions and practice datasets" },
    ],
    subject: "Data Science",
    teamLevel: "aggregate",
    languages: "aggregate",
    goals: "aggregate",
    timeCommitments: "aggregate",
    communicationPreferences: "aggregate",
    durationValue: 12,
    durationType: "weeks",
    archiveOnEnd: true,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: true,
    onlyAdminsRemoveMembers: true,
    allMembersAdmins: false,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-789",
    name: "Mobile Dev Squad",
    bio: "Building cross-platform mobile applications using React Native and modern development practices.",
    avatar: "MD",
    course: "React Native Development",
    roadmapName: "Mobile App Development",
    duration: "10 weeks",
    startDate: new Date("2025-10-30T00:00:00Z"),
    maxMembers: 4,
    activity: "Very Active",
    lastActive: "15 minutes ago",
    currentRoadmapId: "5",
    resourceLinks: [
      {
        name: "App Store Guidelines",
        url: "https://developer.apple.com",
        description: "iOS development guidelines and resources",
      },
      { name: "Team Figma", url: "https://figma.com", description: "UI/UX designs and prototypes" },
    ],
    subject: "aggregate",
    teamLevel: "aggregate",
    languages: "aggregate",
    goals: "aggregate",
    timeCommitments: "aggregate",
    communicationPreferences: "aggregate",
    durationValue: 10,
    durationType: "weeks",
    archiveOnEnd: false,
    onlyAdminsEditGoals: false,
    onlyAdminsAcceptRequests: true,
    onlyAdminsRemoveMembers: false,
    allMembersAdmins: true,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-101",
    name: "Backend Masters",
    bio: "Mastering server-side development with Node.js, databases, and cloud deployment.",
    avatar: "BM",
    course: "Backend Development",
    roadmapName: "Complete Backend Engineer",
    duration: "16 weeks",
    startDate: new Date("2025-11-01T00:00:00Z"),
    maxMembers: 6,
    activity: "Active",
    lastActive: "3 hours ago",
    currentRoadmapId: "2",
    resourceLinks: [
      {
        name: "API Documentation",
        url: "https://docs.api.com",
        description: "Team API specifications and documentation",
      },
      {
        name: "AWS Console",
        url: "https://aws.amazon.com",
        description: "Shared cloud infrastructure and deployments",
      },
    ],
    subject: "Backend Development",
    teamLevel: "Advanced",
    languages: "English, Mandarin",
    goals: "Change Careers",
    timeCommitments: "25 hours/week",
    communicationPreferences: "Voice calls, Text chat",
    durationValue: 16,
    durationType: "weeks",
    archiveOnEnd: true,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: true,
    onlyAdminsRemoveMembers: true,
    allMembersAdmins: false,
    allowSearch: false,
    showTeamStats: true,
    showMemberList: false,
  },
  {
    id: "team-202",
    name: "UX/UI Designers",
    bio: "Creating beautiful and functional user interfaces with modern design principles.",
    avatar: "UX",
    course: "UI/UX Design",
    roadmapName: "Complete Design System",
    duration: "6 weeks",
    startDate: new Date("2025-10-26T00:00:00Z"),
    maxMembers: 5,
    activity: "Moderately Active",
    lastActive: "1 day ago",
    currentRoadmapId: "3",
    resourceLinks: [
      {
        name: "Design System",
        url: "https://storybook.js.org",
        description: "Team component library and design tokens",
      },
      { name: "Inspiration Board", url: "https://pinterest.com", description: "Design inspiration and mood boards" },
    ],
    subject: "UI/UX Design",
    teamLevel: "Beginner",
    languages: "English, French",
    goals: "Learn Skills, Have Fun",
    timeCommitments: "aggregate",
    communicationPreferences: "Text chat",
    durationValue: 6,
    durationType: "weeks",
    archiveOnEnd: false,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: false,
    onlyAdminsRemoveMembers: false,
    allMembersAdmins: false,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-303",
    name: "DevOps Engineers",
    bio: "Learning infrastructure, CI/CD, monitoring, and cloud-native development practices.",
    avatar: "DO",
    course: "DevOps & Infrastructure",
    roadmapName: "Cloud Infrastructure Mastery",
    duration: "10 weeks",
    startDate: new Date("2025-10-21T00:00:00Z"),
    maxMembers: 7,
    activity: "Very Active",
    lastActive: "30 minutes ago",
    currentRoadmapId: "team-copy-6",
    resourceLinks: [
      { name: "Kubernetes Cluster", url: "https://kubernetes.io", description: "Team development and testing cluster" },
      { name: "Terraform Modules", url: "https://terraform.io", description: "Infrastructure as code templates" },
    ],
    subject: "aggregate",
    teamLevel: "aggregate",
    languages: "aggregate",
    goals: "aggregate",
    timeCommitments: "aggregate",
    communicationPreferences: "aggregate",
    durationValue: 10,
    durationType: "weeks",
    archiveOnEnd: false,
    onlyAdminsEditGoals: false,
    onlyAdminsAcceptRequests: false,
    onlyAdminsRemoveMembers: false,
    allMembersAdmins: true,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-404",
    name: "AI & Machine Learning",
    bio: "Exploring artificial intelligence, neural networks, and cutting-edge ML applications.",
    avatar: "AI",
    course: "Machine Learning",
    roadmapName: "AI Engineer Path",
    duration: "20 weeks",
    startDate: new Date("2025-11-03T00:00:00Z"),
    maxMembers: 10,
    activity: "Active",
    lastActive: "2 hours ago",
    currentRoadmapId: "team-copy-404",
    resourceLinks: [
      { name: "Research Papers", url: "https://arxiv.org", description: "Latest AI research and academic papers" },
      { name: "Model Repository", url: "https://huggingface.co", description: "Pre-trained models and datasets" },
    ],
    subject: "Machine Learning",
    teamLevel: "Advanced",
    languages: "English, Mandarin, Arabic",
    goals: "Change Careers, Learn Skills",
    timeCommitments: "30 hours/week",
    communicationPreferences: "Video calls, Voice calls",
    durationValue: 20,
    durationType: "weeks",
    archiveOnEnd: true,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: true,
    onlyAdminsRemoveMembers: true,
    allMembersAdmins: false,
    allowSearch: true,
    showTeamStats: true,
    showMemberList: true,
  },
  {
    id: "team-505",
    name: "Project Management Pros",
    bio: "Mastering agile methodologies, team leadership, and project delivery excellence.",
    avatar: "PM",
    course: "Project Management",
    roadmapName: "Agile Project Leadership",
    duration: "8 weeks",
    startDate: new Date("2025-10-27T00:00:00Z"),
    maxMembers: 6,
    activity: "Moderately Active",
    lastActive: "6 hours ago",
    currentRoadmapId: "team-copy-505",
    resourceLinks: [
      {
        name: "PMI Resources",
        url: "https://pmi.org",
        description: "Project Management Institute guidelines and tools",
      },
      {
        name: "Scrum Alliance",
        url: "https://scrumalliance.org",
        description: "Agile and Scrum certification resources",
      },
    ],
    subject: "Project Management",
    teamLevel: "Intermediate",
    languages: "English, Hindi, Spanish",
    goals: "Change Careers",
    timeCommitments: "12 hours/week",
    communicationPreferences: "Voice calls, Text chat",
    durationValue: 8,
    durationType: "weeks",
    archiveOnEnd: false,
    onlyAdminsEditGoals: true,
    onlyAdminsAcceptRequests: true,
    onlyAdminsRemoveMembers: true,
    allMembersAdmins: false,
    allowSearch: true,
    showTeamStats: false,
    showMemberList: true,
  },
  {
    id: "team-606",
    name: "Cybersecurity Warriors",
    bio: "Learning ethical hacking, network security, and digital forensics to protect digital assets.",
    avatar: "CY",
    course: "Cybersecurity",
    roadmapName: "Ethical Hacker Certification",
    duration: "14 weeks",
    startDate: new Date("2025-11-02T00:00:00Z"),
    maxMembers: 8,
    activity: "Very Active",
    lastActive: "1 hour ago",
    currentRoadmapId: "9",
    resourceLinks: [
      {
        name: "Penetration Testing Lab",
        url: "https://hackthebox.eu",
        description: "Hands-on hacking challenges and CTF events",
      },
      {
        name: "Security Tools",
        url: "https://kali.org",
        description: "Shared tools and security testing environments",
      },
    ],
    subject: "Cybersecurity",
    teamLevel: "Intermediate",
    languages: "English, Russian, Japanese",
    goals: "Learn Skills, Change Careers",
    timeCommitments: "22 hours/week",
    communicationPreferences: "Text chat, Voice calls",
    durationValue: 14,
    durationType: "weeks",
    archiveOnEnd: true,
    onlyAdminsEditGoals: false,
    onlyAdminsAcceptRequests: false,
    onlyAdminsRemoveMembers: true,
    allMembersAdmins: false,
    allowSearch: false,
    showTeamStats: true,
    showMemberList: false,
  },
];

// Normalized relational data arrays
export const mockTeamMembers: TeamMember[] = [
  // Frontend Developers team members (team-123)
  { teamId: "team-123", userId: "user-001", role: "admin" },
  { teamId: "team-123", userId: "user-002", role: "admin" },
  { teamId: "team-123", userId: "user-007", role: "admin" },
  { teamId: "team-123", userId: "1760380309996", role: "admin" },
  // Advanced React Team members (team-current)
  { teamId: "team-current", userId: "user-004", role: "admin" },
  { teamId: "team-current", userId: "user-007", role: "admin" },
  { teamId: "team-current", userId: "user-005", role: "member" },
  { teamId: "team-current", userId: "user-006", role: "member" },
  // Data Science Explorers members (team-456)
  { teamId: "team-456", userId: "user-001", role: "admin" },
  { teamId: "team-456", userId: "user-007", role: "admin" },
  { teamId: "team-456", userId: "user-008", role: "member" },
  { teamId: "team-456", userId: "user-009", role: "member" },
  { teamId: "team-456", userId: "user-010", role: "member" },
  // Mobile Dev Squad members (team-789)
  { teamId: "team-789", userId: "user-001", role: "admin" },
  { teamId: "team-789", userId: "user-007", role: "member" },
  // Backend Masters members (team-101)
  { teamId: "team-101", userId: "user-002", role: "admin" },
  { teamId: "team-101", userId: "user-006", role: "member" },
  { teamId: "team-101", userId: "user-008", role: "member" },
  // UX/UI Designers members (team-202)
  { teamId: "team-202", userId: "user-001", role: "admin" },
  { teamId: "team-202", userId: "user-003", role: "admin" },
  { teamId: "team-202", userId: "user-009", role: "member" },
  // DevOps Engineers members (team-303)
  { teamId: "team-303", userId: "user-006", role: "admin" },
  { teamId: "team-303", userId: "user-004", role: "member" },
  { teamId: "team-303", userId: "user-010", role: "member" },
  // AI & Machine Learning members (team-404)
  { teamId: "team-404", userId: "user-004", role: "admin" },
  { teamId: "team-404", userId: "user-008", role: "member" },
  { teamId: "team-404", userId: "user-002", role: "member" },
  // Project Management Pros members (team-505)
  { teamId: "team-505", userId: "user-009", role: "admin" },
  { teamId: "team-505", userId: "user-003", role: "member" },
  // Cybersecurity Warriors members (team-606)
  { teamId: "team-606", userId: "user-005", role: "admin" },
  { teamId: "team-606", userId: "user-010", role: "member" },
  { teamId: "team-606", userId: "user-007", role: "member" },
];

export interface Activation {
  id: string;
  userId: string;
  roadmapId: string;
  teamId?: string;
  startedAt: string;
}

export const mockActivations: Activation[] = [
  // Team-based activations - team-123 (Frontend Developers) using roadmap 1
  { id: "act-001", userId: "user-001", roadmapId: "1", teamId: "team-123", startedAt: "2024-03-15T11:30:00Z" },
  { id: "act-002", userId: "user-002", roadmapId: "1", teamId: "team-123", startedAt: "2024-03-15T11:30:00Z" },
  { id: "act-003", userId: "user-003", roadmapId: "1", teamId: "team-123", startedAt: "2024-03-16T09:00:00Z" },

  // Team-based activations - team-123 (Frontend Developers) using roadmap 7
  { id: "act-025", userId: "user-001", roadmapId: "7", teamId: "team-123", startedAt: "2024-04-01T08:00:00Z" },
  { id: "act-026", userId: "user-002", roadmapId: "7", teamId: "team-123", startedAt: "2024-04-01T09:00:00Z" },
  { id: "act-027", userId: "user-003", roadmapId: "7", teamId: "team-123", startedAt: "2024-04-02T10:00:00Z" },

  // Team-based activations - team-current (Advanced React Team) using roadmap 1
  { id: "act-004", userId: "user-004", roadmapId: "1", teamId: "team-current", startedAt: "2024-02-01T14:00:00Z" },
  { id: "act-005", userId: "user-005", roadmapId: "1", teamId: "team-current", startedAt: "2024-02-02T10:30:00Z" },
  { id: "act-006", userId: "user-006", roadmapId: "1", teamId: "team-current", startedAt: "2024-02-03T13:00:00Z" },

  // Team-based activations - team-456 (Data Science Explorers) using team-copy-4
  {
    id: "act-007",
    userId: "user-007",
    roadmapId: "team-copy-4",
    teamId: "team-456",
    startedAt: "2024-04-02T15:00:00Z",
  },
  {
    id: "act-008",
    userId: "user-008",
    roadmapId: "team-copy-4",
    teamId: "team-456",
    startedAt: "2024-04-03T09:30:00Z",
  },
  {
    id: "act-009",
    userId: "user-009",
    roadmapId: "team-copy-4",
    teamId: "team-456",
    startedAt: "2024-04-03T11:00:00Z",
  },
  {
    id: "act-010",
    userId: "user-010",
    roadmapId: "team-copy-4",
    teamId: "team-456",
    startedAt: "2024-04-04T08:00:00Z",
  },
  {
    id: "act-035",
    userId: "user-001",
    roadmapId: "team-copy-4",
    teamId: "team-456",
    startedAt: "2024-03-15T11:30:00Z",
  },

  // Team-based activations - team-789 (Mobile Dev Squad) using roadmap 5
  { id: "act-011", userId: "user-001", roadmapId: "5", teamId: "team-789", startedAt: "2024-03-20T12:00:00Z" },

  // Team-based activations - team-101 (Backend Masters) using roadmap 2
  { id: "act-012", userId: "user-002", roadmapId: "2", teamId: "team-101", startedAt: "2024-02-14T16:00:00Z" },

  // Team-based activations - team-202 (UX/UI Designers) using roadmap 3
  { id: "act-025", userId: "user-001", roadmapId: "3", teamId: "team-202", startedAt: "2024-04-01T08:00:00Z" },
  { id: "act-013", userId: "user-003", roadmapId: "3", teamId: "team-202", startedAt: "2024-04-10T10:00:00Z" },

  // Team-based activations - team-404 (AI & Machine Learning) using roadmap team-copy-404
  {
    id: "act-404-001",
    userId: "user-004",
    roadmapId: "team-copy-404",
    teamId: "team-404",
    startedAt: "2024-03-05T10:00:00Z",
  },
  {
    id: "act-404-002",
    userId: "user-008",
    roadmapId: "team-copy-404",
    teamId: "team-404",
    startedAt: "2024-03-05T11:00:00Z",
  },
  {
    id: "act-404-003",
    userId: "user-002",
    roadmapId: "team-copy-404",
    teamId: "team-404",
    startedAt: "2024-03-05T12:00:00Z",
  },

  // Team-based activations - team-303 (DevOps Engineers) using roadmap 6
  { id: "act-014", userId: "user-006", roadmapId: "6", teamId: "team-303", startedAt: "2024-01-25T09:00:00Z" },

  // Team-based activations - team-505 (Project Management Pros) using roadmap 8
  { id: "act-017", userId: "user-009", roadmapId: "8", teamId: "team-505", startedAt: "2024-04-08T13:00:00Z" },

  // Team-based activations - team-606 (Cybersecurity Warriors) using roadmap 9
  { id: "act-018", userId: "user-005", roadmapId: "9", teamId: "team-606", startedAt: "2024-02-28T15:00:00Z" },
  { id: "act-019", userId: "user-010", roadmapId: "9", teamId: "team-606", startedAt: "2024-03-01T10:00:00Z" },

  // Personal activations (no teamId) - these track individual user progress regardless of access method
  { id: "act-020", userId: "user-001", roadmapId: "6", startedAt: "2024-01-10T09:00:00Z" }, // Sarah's personal JavaScript journey
  { id: "act-021", userId: "user-007", roadmapId: "5", startedAt: "2024-02-15T14:00:00Z" }, // Maria's personal data science
  { id: "act-022", userId: "user-008", roadmapId: "9", startedAt: "2024-03-01T10:30:00Z" }, // David's personal AWS certification
  { id: "act-023", userId: "user-009", roadmapId: "3", startedAt: "2024-01-20T11:00:00Z" }, // Lisa's personal UI/UX design
  { id: "act-024", userId: "user-010", roadmapId: "4", startedAt: "2024-02-05T16:00:00Z" }, // Kevin's personal ML mastery
  { id: "act-028", userId: "user-001", roadmapId: "roadmap-010", startedAt: "2024-03-10T08:30:00Z" }, // Sarah's TypeScript Mastery
  { id: "act-029", userId: "user-001", roadmapId: "roadmap-011", startedAt: "2024-04-01T12:00:00Z" }, // Sarah's Full Stack Development Journey
  { id: "act-030", userId: "user-001", roadmapId: "5", startedAt: "2024-03-25T15:30:00Z" }, // Sarah's Data Science with Python
  { id: "act-032", userId: "user-001", roadmapId: "7", startedAt: "2024-04-01T08:00:00Z" }, // Sarah's personal progress on Team Frontend Mastery 1
  { id: "act-033", userId: "user-002", roadmapId: "1", startedAt: "2024-03-15T11:30:00Z" }, // Mike's personal progress on Frontend Development with React
  { id: "act-034", userId: "user-003", roadmapId: "1", startedAt: "2024-03-16T09:00:00Z" }, // Emma's personal progress on Frontend Development with React
];

export const mockUnits: Unit[] = [
  // Frontend Development with React (roadmapId: "1")
  {
    id: "unit-1",
    title: "React Component Architecture",
    description: "Learn component composition, props, and state management patterns",
    roadmapId: "1",
    sequence_order: 1,
    subunits: [{
      id: "sub-1-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/react-components"),
      contentUrl: "https://example.com/react-components",
      duration: "15 min"
    }]
  },
  {
    id: "unit-2",
    title: "Advanced Hooks and Context",
    description: "Master useEffect, useContext, and custom hooks for complex state management",
    roadmapId: "1",
    sequence_order: 2,
    subunits: [{
      id: "sub-2-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/react-hooks"),
      contentUrl: "https://example.com/react-hooks",
      duration: "20 min"
    }]
  },
  {
    id: "unit-3",
    title: "Testing React Applications",
    description: "Write comprehensive tests using Jest and React Testing Library",
    roadmapId: "1",
    sequence_order: 3,
    subunits: [{
      id: "sub-3-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/react-testing"),
      contentUrl: "https://example.com/react-testing",
      duration: "25 min"
    }]
  },

  // Full-Stack JavaScript Development (roadmapId: "2")
  {
    id: "unit-4",
    title: "Node.js Fundamentals",
    description: "Server-side JavaScript basics and npm ecosystem",
    roadmapId: "2",
    sequence_order: 1,
    subunits: [{
      id: "sub-4-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/nodejs-basics"),
      contentUrl: "https://example.com/nodejs-basics",
      duration: "18 min"
    }]
  },
  {
    id: "unit-5",
    title: "Express.js Framework",
    description: "Building RESTful APIs and middleware patterns",
    roadmapId: "2",
    sequence_order: 2,
    subunits: [{
      id: "sub-5-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/express-guide"),
      contentUrl: "https://example.com/express-guide",
      duration: "22 min"
    }]
  },
  {
    id: "unit-6",
    title: "MongoDB Integration",
    description: "Database design and Mongoose ODM implementation",
    roadmapId: "2",
    sequence_order: 3,
    subunits: [{
      id: "sub-6-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/mongodb-guide"),
      contentUrl: "https://example.com/mongodb-guide",
      duration: "20 min"
    }]
  },
  {
    id: "unit-7",
    title: "Authentication & Security",
    description: "JWT tokens, password hashing, and security best practices",
    roadmapId: "2",
    sequence_order: 4,
    subunits: [{
      id: "sub-7-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/auth-security"),
      contentUrl: "https://example.com/auth-security",
      duration: "28 min"
    }]
  },

  // UI/UX Design Fundamentals (roadmapId: "3")
  {
    id: "unit-8",
    title: "Design Principles & Theory",
    description: "Color theory, typography, and visual hierarchy fundamentals",
    roadmapId: "3",
    sequence_order: 1,
    subunits: [{
      id: "sub-8-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/design-principles"),
      contentUrl: "https://example.com/design-principles",
      duration: "15 min"
    }]
  },
  {
    id: "unit-9",
    title: "User Research Methods",
    description: "Conducting interviews, surveys, and usability testing",
    roadmapId: "3",
    sequence_order: 2,
    subunits: [{
      id: "sub-9-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/user-research"),
      contentUrl: "https://example.com/user-research",
      duration: "20 min"
    }]
  },
  {
    id: "unit-10",
    title: "Wireframing & Prototyping",
    description: "Creating low and high-fidelity prototypes using Figma",
    roadmapId: "3",
    sequence_order: 3,
    subunits: [{
      id: "sub-10-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/prototyping"),
      contentUrl: "https://example.com/prototyping",
      duration: "25 min"
    }]
  },

  // Python Machine Learning Mastery (roadmapId: "4")
  {
    id: "unit-11",
    title: "Python Machine Learning Fundamentals",
    description: "Introduction to ML concepts and Python libraries",
    roadmapId: "4",
    sequence_order: 1,
    subunits: [{
      id: "sub-11-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/python-ml-basics"),
      contentUrl: "https://example.com/python-ml-basics",
      duration: "30 min"
    }]
  },
  {
    id: "unit-12",
    title: "Data Preprocessing & Feature Engineering",
    description: "Cleaning data and preparing features for ML models",
    roadmapId: "4",
    sequence_order: 2,
    subunits: [{
      id: "sub-12-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/data-preprocessing"),
      contentUrl: "https://example.com/data-preprocessing",
      duration: "35 min"
    }]
  },
  {
    id: "unit-13",
    title: "Model Training & Evaluation",
    description: "Building, training, and evaluating ML models",
    roadmapId: "4",
    sequence_order: 3,
    subunits: [{
      id: "sub-13-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/model-training"),
      contentUrl: "https://example.com/model-training",
      duration: "40 min"
    }]
  },

  // Data Science with Python (roadmapId: "5")
  {
    id: "unit-14",
    title: "Python Data Analysis Basics",
    description: "NumPy, Pandas, and data manipulation fundamentals",
    roadmapId: "5",
    sequence_order: 1,
    subunits: [{
      id: "sub-14-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/python-data-basics"),
      contentUrl: "https://example.com/python-data-basics",
      duration: "25 min"
    }]
  },
  {
    id: "unit-15",
    title: "Data Visualization",
    description: "Creating compelling charts and graphs with Matplotlib and Seaborn",
    roadmapId: "5",
    sequence_order: 2,
    subunits: [{
      id: "sub-15-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/data-visualization"),
      contentUrl: "https://example.com/data-visualization",
      duration: "22 min"
    }]
  },
  {
    id: "unit-16",
    title: "Machine Learning Algorithms",
    description: "Supervised and unsupervised learning with Scikit-learn",
    roadmapId: "5",
    sequence_order: 3,
    subunits: [{
      id: "sub-16-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ml-algorithms"),
      contentUrl: "https://example.com/ml-algorithms",
      duration: "30 min"
    }]
  },

  // My JavaScript Journey (roadmapId: "6")
  {
    id: "unit-17",
    title: "JavaScript Fundamentals",
    description: "Master the core concepts of JavaScript including variables, functions, and scope.",
    roadmapId: "6",
    sequence_order: 1,
    subunits: [{
      id: "sub-17-1",
      title: "Main Lesson",
      type: 'article',
      duration: "20 min"
    }]
  },
  {
    id: "unit-18",
    title: "DOM Manipulation",
    description: "Learn to interact with web pages dynamically using JavaScript DOM methods.",
    roadmapId: "6",
    sequence_order: 2,
    subunits: [{
      id: "sub-18-1",
      title: "Main Lesson",
      type: 'article',
      duration: "18 min"
    }]
  },
  {
    id: "unit-19",
    title: "Asynchronous JavaScript",
    description: "Understand promises, async/await, and how to handle asynchronous operations.",
    roadmapId: "6",
    sequence_order: 3,
    subunits: [{
      id: "sub-19-1",
      title: "Main Lesson",
      type: 'article',
      duration: "25 min"
    }]
  },
  {
    id: "unit-20",
    title: "Modern JavaScript (ES6+)",
    description: "Explore modern JavaScript features and build a complete portfolio project.",
    roadmapId: "6",
    sequence_order: 4,
    subunits: [{
      id: "sub-20-1",
      title: "Main Lesson",
      type: 'article',
      duration: "30 min"
    }]
  },

  // Team Frontend Mastery (roadmapId: "7")
  {
    id: "unit-21",
    title: "Advanced Component Patterns",
    description: "Render props, higher-order components, and compound components",
    roadmapId: "7",
    sequence_order: 1,
    subunits: [{
      id: "sub-21-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/react-patterns"),
      contentUrl: "https://example.com/react-patterns",
      duration: "28 min"
    }]
  },
  {
    id: "unit-22",
    title: "State Management Architecture",
    description: "Redux, Zustand, and context patterns for complex applications",
    roadmapId: "7",
    sequence_order: 2,
    subunits: [{
      id: "sub-22-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/state-management"),
      contentUrl: "https://example.com/state-management",
      duration: "32 min"
    }]
  },

  // Advanced React Development Roadmap (roadmapId: "8")
  {
    id: "unit-23",
    title: "Fundamentals of AI - Part 1",
    description: "Learn the core concepts and principles of Artificial Intelligence.",
    roadmapId: "8",
    sequence_order: 1,
    subunits: [{
      id: "sub-23-1",
      title: "Main Lesson",
      type: 'article',
      duration: "20 min"
    }]
  },
  {
    id: "unit-24",
    title: "Fundamentals of AI - Part 2",
    description: "Dive deeper into AI applications and practical implementations.",
    roadmapId: "8",
    sequence_order: 2,
    subunits: [{
      id: "sub-24-1",
      title: "Main Lesson",
      type: 'article',
      duration: "22 min"
    }]
  },
  {
    id: "unit-25",
    title: "Practice project",
    description: "Apply your knowledge in a hands-on project to consolidate your learning.",
    roadmapId: "8",
    sequence_order: 3,
    subunits: [{
      id: "sub-25-1",
      title: "Main Lesson",
      type: 'article',
      duration: "40 min"
    }]
  },
  {
    id: "unit-26",
    title: "Next Workshop - Angular",
    description: "Explore Angular framework integration with AI concepts.",
    roadmapId: "8",
    sequence_order: 4,
    subunits: [{
      id: "sub-26-1",
      title: "Main Lesson",
      type: 'article',
      duration: "35 min"
    }]
  },

  // AWS Certification Path (roadmapId: "9")
  {
    id: "unit-27",
    title: "AWS Cloud Practitioner Essentials",
    description: "Core AWS services and cloud computing fundamentals",
    roadmapId: "9",
    sequence_order: 1,
    subunits: [{
      id: "sub-27-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/aws-essentials"),
      contentUrl: "https://example.com/aws-essentials",
      duration: "30 min"
    }]
  },
  {
    id: "unit-28",
    title: "EC2 and VPC Configuration",
    description: "Virtual servers and network setup in AWS",
    roadmapId: "9",
    sequence_order: 2,
    subunits: [{
      id: "sub-28-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/aws-infrastructure"),
      contentUrl: "https://example.com/aws-infrastructure",
      duration: "35 min"
    }]
  },
  {
    id: "unit-29",
    title: "AWS Security Best Practices",
    description: "IAM, security groups, and compliance frameworks",
    roadmapId: "9",
    sequence_order: 3,
    subunits: [{
      id: "sub-29-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/aws-security"),
      contentUrl: "https://example.com/aws-security",
      duration: "28 min"
    }]
  },

  // TypeScript Mastery (roadmapId: "roadmap-010")
  {
    id: "unit-30",
    title: "TypeScript Fundamentals",
    description: "Learn TypeScript basics, type annotations, and primitive types",
    roadmapId: "roadmap-010",
    sequence_order: 1,
    subunits: [{
      id: "sub-30-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-fundamentals"),
      contentUrl: "https://example.com/ts-fundamentals",
      duration: "25 min"
    }]
  },
  {
    id: "unit-31",
    title: "Advanced Types and Generics",
    description: "Master union types, intersection types, and generic programming",
    roadmapId: "roadmap-010",
    sequence_order: 2,
    subunits: [{
      id: "sub-31-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-advanced-types"),
      contentUrl: "https://example.com/ts-advanced-types",
      duration: "30 min"
    }]
  },
  {
    id: "unit-32",
    title: "TypeScript with React",
    description: "Build type-safe React applications with TypeScript",
    roadmapId: "roadmap-010",
    sequence_order: 3,
    subunits: [{
      id: "sub-32-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-react"),
      contentUrl: "https://example.com/ts-react",
      duration: "35 min"
    }]
  },
  {
    id: "unit-33",
    title: "TypeScript Design Patterns",
    description: "Implement common design patterns using TypeScript",
    roadmapId: "roadmap-010",
    sequence_order: 4,
    subunits: [{
      id: "sub-33-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-patterns"),
      contentUrl: "https://example.com/ts-patterns",
      duration: "28 min"
    }]
  },
  {
    id: "unit-34",
    title: "TypeScript Tooling and Configuration",
    description: "Master tsconfig, compiler options, and build tools",
    roadmapId: "roadmap-010",
    sequence_order: 5,
    subunits: [{
      id: "sub-34-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-tooling"),
      contentUrl: "https://example.com/ts-tooling",
      duration: "22 min"
    }]
  },
  {
    id: "unit-35",
    title: "Testing TypeScript Applications",
    description: "Write unit and integration tests for TypeScript code",
    roadmapId: "roadmap-010",
    sequence_order: 6,
    subunits: [{
      id: "sub-35-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-testing"),
      contentUrl: "https://example.com/ts-testing",
      duration: "30 min"
    }]
  },
  {
    id: "unit-36",
    title: "TypeScript Performance Optimization",
    description: "Optimize TypeScript compilation and runtime performance",
    roadmapId: "roadmap-010",
    sequence_order: 7,
    subunits: [{
      id: "sub-36-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-performance"),
      contentUrl: "https://example.com/ts-performance",
      duration: "25 min"
    }]
  },
  {
    id: "unit-37",
    title: "TypeScript Project Workshop",
    description: "Build a complete full-stack TypeScript application",
    roadmapId: "roadmap-010",
    sequence_order: 8,
    subunits: [{
      id: "sub-37-1",
      title: "Main Lesson",
      type: detectSubunitType("https://example.com/ts-workshop"),
      contentUrl: "https://example.com/ts-workshop",
      duration: "60 min"
    }]
  },

  // Full Stack Development Journey (roadmapId: "roadmap-011") - Units 38-52
  { id: "unit-38", title: "HTML & CSS Mastery", description: "Master semantic HTML and modern CSS techniques", roadmapId: "roadmap-011", sequence_order: 1, subunits: [{ id: "sub-38-1", title: "Main Lesson", type: detectSubunitType("https://example.com/html-css"), contentUrl: "https://example.com/html-css", duration: "25 min" }] },
  { id: "unit-39", title: "JavaScript ES6+ Features", description: "Modern JavaScript syntax and features", roadmapId: "roadmap-011", sequence_order: 2, subunits: [{ id: "sub-39-1", title: "Main Lesson", type: detectSubunitType("https://example.com/js-modern"), contentUrl: "https://example.com/js-modern", duration: "22 min" }] },
  { id: "unit-40", title: "React Fundamentals", description: "Build interactive UIs with React components and hooks", roadmapId: "roadmap-011", sequence_order: 3, subunits: [{ id: "sub-40-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-fundamentals"), contentUrl: "https://example.com/react-fundamentals", duration: "28 min" }] },
  { id: "unit-41", title: "State Management with Redux", description: "Manage complex application state with Redux", roadmapId: "roadmap-011", sequence_order: 4, subunits: [{ id: "sub-41-1", title: "Main Lesson", type: detectSubunitType("https://example.com/redux"), contentUrl: "https://example.com/redux", duration: "30 min" }] },
  { id: "unit-42", title: "Node.js Backend Development", description: "Build RESTful APIs with Node.js and Express", roadmapId: "roadmap-011", sequence_order: 5, subunits: [{ id: "sub-42-1", title: "Main Lesson", type: detectSubunitType("https://example.com/nodejs-backend"), contentUrl: "https://example.com/nodejs-backend", duration: "32 min" }] },
  { id: "unit-43", title: "Database Design with PostgreSQL", description: "Design and implement relational databases", roadmapId: "roadmap-011", sequence_order: 6, subunits: [{ id: "sub-43-1", title: "Main Lesson", type: detectSubunitType("https://example.com/postgresql"), contentUrl: "https://example.com/postgresql", duration: "28 min" }] },
  { id: "unit-44", title: "Authentication & Authorization", description: "Implement secure user authentication systems", roadmapId: "roadmap-011", sequence_order: 7, subunits: [{ id: "sub-44-1", title: "Main Lesson", type: detectSubunitType("https://example.com/auth-systems"), contentUrl: "https://example.com/auth-systems", duration: "35 min" }] },
  { id: "unit-45", title: "RESTful API Design", description: "Design scalable and maintainable APIs", roadmapId: "roadmap-011", sequence_order: 8, subunits: [{ id: "sub-45-1", title: "Main Lesson", type: detectSubunitType("https://example.com/api-design"), contentUrl: "https://example.com/api-design", duration: "25 min" }] },
  { id: "unit-46", title: "GraphQL Introduction", description: "Query and manipulate data with GraphQL", roadmapId: "roadmap-011", sequence_order: 9, subunits: [{ id: "sub-46-1", title: "Main Lesson", type: detectSubunitType("https://example.com/graphql"), contentUrl: "https://example.com/graphql", duration: "30 min" }] },
  { id: "unit-47", title: "Testing Full Stack Applications", description: "Write comprehensive tests for frontend and backend", roadmapId: "roadmap-011", sequence_order: 10, subunits: [{ id: "sub-47-1", title: "Main Lesson", type: detectSubunitType("https://example.com/fullstack-testing"), contentUrl: "https://example.com/fullstack-testing", duration: "32 min" }] },
  { id: "unit-48", title: "Docker & Containerization", description: "Containerize applications with Docker", roadmapId: "roadmap-011", sequence_order: 11, subunits: [{ id: "sub-48-1", title: "Main Lesson", type: detectSubunitType("https://example.com/docker"), contentUrl: "https://example.com/docker", duration: "28 min" }] },
  { id: "unit-49", title: "CI/CD Pipelines", description: "Automate testing and deployment workflows", roadmapId: "roadmap-011", sequence_order: 12, subunits: [{ id: "sub-49-1", title: "Main Lesson", type: detectSubunitType("https://example.com/cicd"), contentUrl: "https://example.com/cicd", duration: "30 min" }] },
  { id: "unit-50", title: "Cloud Deployment (AWS/Vercel)", description: "Deploy full stack applications to the cloud", roadmapId: "roadmap-011", sequence_order: 13, subunits: [{ id: "sub-50-1", title: "Main Lesson", type: detectSubunitType("https://example.com/cloud-deploy"), contentUrl: "https://example.com/cloud-deploy", duration: "35 min" }] },
  { id: "unit-51", title: "Performance Optimization", description: "Optimize frontend and backend performance", roadmapId: "roadmap-011", sequence_order: 14, subunits: [{ id: "sub-51-1", title: "Main Lesson", type: detectSubunitType("https://example.com/performance"), contentUrl: "https://example.com/performance", duration: "28 min" }] },
  { id: "unit-52", title: "Full Stack Capstone Project", description: "Build and deploy a complete full stack application", roadmapId: "roadmap-011", sequence_order: 15, subunits: [{ id: "sub-52-1", title: "Main Lesson", type: detectSubunitType("https://example.com/capstone"), contentUrl: "https://example.com/capstone", duration: "60 min" }] },

  // team-copy-4 units (53-55)
  { id: "unit-53", title: "Python & Data Analysis Fundamentals", description: "Setting up Python environment and data analysis basics", roadmapId: "team-copy-4", sequence_order: 1, subunits: [{ id: "sub-53-1", title: "Main Lesson", type: detectSubunitType("https://example.com/python-intro"), contentUrl: "https://example.com/python-intro", duration: "25 min" }] },
  { id: "unit-54", title: "Data Preprocessing & Feature Engineering", description: "Cleaning data and preparing features for ML models", roadmapId: "team-copy-4", sequence_order: 2, subunits: [{ id: "sub-54-1", title: "Main Lesson", type: detectSubunitType("https://example.com/data-preprocessing"), contentUrl: "https://example.com/data-preprocessing", duration: "30 min" }] },
  { id: "unit-55", title: "Model Training & Evaluation", description: "Building, training, and evaluating ML models", roadmapId: "team-copy-4", sequence_order: 3, subunits: [{ id: "sub-55-1", title: "Main Lesson", type: detectSubunitType("https://example.com/model-training"), contentUrl: "https://example.com/model-training", duration: "35 min" }] },

  // team-copy-6 units (56-59)
  { id: "unit-56", title: "JavaScript Fundamentals", description: "Master the core concepts of JavaScript including variables, functions, and scope.", roadmapId: "team-copy-6", sequence_order: 1, subunits: [{ id: "sub-56-1", title: "Main Lesson", type: 'article', duration: "20 min" }] },
  { id: "unit-57", title: "DOM Manipulation", description: "Learn to interact with web pages dynamically using JavaScript DOM methods.", roadmapId: "team-copy-6", sequence_order: 2, subunits: [{ id: "sub-57-1", title: "Main Lesson", type: 'article', duration: "18 min" }] },
  { id: "unit-58", title: "Asynchronous JavaScript", description: "Understand promises, async/await, and how to handle asynchronous operations.", roadmapId: "team-copy-6", sequence_order: 3, subunits: [{ id: "sub-58-1", title: "Main Lesson", type: 'article', duration: "25 min" }] },
  { id: "unit-59", title: "Modern JavaScript (ES6+)", description: "Explore modern JavaScript features and build a complete portfolio project.", roadmapId: "team-copy-6", sequence_order: 4, subunits: [{ id: "sub-59-1", title: "Main Lesson", type: 'article', duration: "30 min" }] },

  // team-copy-404 units (60-62)
  { id: "unit-60", title: "React Basics", description: "Introduction to React components, JSX, and the component lifecycle", roadmapId: "team-copy-404", sequence_order: 1, subunits: [{ id: "sub-60-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-basics"), contentUrl: "https://example.com/react-basics", duration: "20 min" }] },
  { id: "unit-61", title: "Components Deep Dive", description: "Props, state, and component composition patterns", roadmapId: "team-copy-404", sequence_order: 2, subunits: [{ id: "sub-61-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-components"), contentUrl: "https://example.com/react-components", duration: "25 min" }] },
  { id: "unit-62", title: "State Management & Hooks", description: "useState, useEffect, and modern React state patterns", roadmapId: "team-copy-404", sequence_order: 3, subunits: [{ id: "sub-62-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-hooks"), contentUrl: "https://example.com/react-hooks", duration: "28 min" }] },

  // team-copy-505 units (63-65)
  { id: "unit-63", title: "React Basics", description: "Introduction to React components, JSX, and the component lifecycle", roadmapId: "team-copy-505", sequence_order: 1, subunits: [{ id: "sub-63-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-basics"), contentUrl: "https://example.com/react-basics", duration: "20 min" }] },
  { id: "unit-64", title: "Components Deep Dive", description: "Props, state, and component composition patterns", roadmapId: "team-copy-505", sequence_order: 2, subunits: [{ id: "sub-64-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-components"), contentUrl: "https://example.com/react-components", duration: "25 min" }] },
  { id: "unit-65", title: "State Management & Hooks", description: "useState, useEffect, and modern React state patterns", roadmapId: "team-copy-505", sequence_order: 3, subunits: [{ id: "sub-65-1", title: "Main Lesson", type: detectSubunitType("https://example.com/react-hooks"), contentUrl: "https://example.com/react-hooks", duration: "28 min" }] },
];

export const mockProgressTracking: ProgressTracking[] = [
  // Progress tracking for team-123 members on roadmap 1
  { userId: "user-001", activationId: "act-001", subunitId: "sub-1-1", completedAt: "2024-03-20T10:30:00Z" },
  { userId: "user-001", activationId: "act-001", subunitId: "sub-2-1", completedAt: "2024-03-22T14:15:00Z" },
  { userId: "user-001", activationId: "act-001", subunitId: "sub-3-1", completedAt: null },
  { userId: "user-002", activationId: "act-002", subunitId: "sub-1-1", completedAt: "2024-03-21T09:45:00Z" },
  { userId: "user-002", activationId: "act-002", subunitId: "sub-2-1", completedAt: null },

  // Progress tracking for team-current members on roadmap 1
  { userId: "user-004", activationId: "act-004", subunitId: "sub-1-1", completedAt: "2024-02-15T11:00:00Z" },
  { userId: "user-004", activationId: "act-004", subunitId: "sub-2-1", completedAt: "2024-02-18T13:30:00Z" },
  { userId: "user-004", activationId: "act-004", subunitId: "sub-3-1", completedAt: "2024-02-20T09:15:00Z" },
  { userId: "user-005", activationId: "act-005", subunitId: "sub-1-1", completedAt: "2024-02-16T10:20:00Z" },
  { userId: "user-006", activationId: "act-006", subunitId: "sub-1-1", completedAt: "2024-02-17T14:45:00Z" },
  { userId: "user-006", activationId: "act-006", subunitId: "sub-2-1", completedAt: null },

  // Progress tracking for personal activations
  { userId: "user-001", activationId: "act-020", subunitId: "sub-17-1", completedAt: "2025-07-25T10:00:00Z" },
  { userId: "user-001", activationId: "act-020", subunitId: "sub-18-1", completedAt: "2025-07-28T15:30:00Z" },
  { userId: "user-001", activationId: "act-020", subunitId: "sub-19-1", completedAt: null },
  { userId: "user-007", activationId: "act-021", subunitId: "sub-14-1", completedAt: "2025-08-02T09:00:00Z" },
  { userId: "user-008", activationId: "act-022", subunitId: "sub-27-1", completedAt: "2025-03-15T11:30:00Z" },
  { userId: "user-008", activationId: "act-022", subunitId: "sub-28-1", completedAt: null },

  // Sarah's progress on TypeScript Mastery (roadmap-010)
  { userId: "user-001", activationId: "act-028", subunitId: "sub-30-1", completedAt: "2025-09-16T09:30:00Z" },
  { userId: "user-001", activationId: "act-028", subunitId: "sub-31-1", completedAt: "2025-09-18T14:20:00Z" },

  // Sarah's progress on Full Stack Development Journey (roadmap-011)
  { userId: "user-001", activationId: "act-029", subunitId: "sub-38-1", completedAt: "2025-09-21T10:15:00Z" },
  { userId: "user-001", activationId: "act-029", subunitId: "sub-39-1", completedAt: "2025-09-23T16:45:00Z" },

  // Sarah's progress on Data Science with Python (roadmap "5")
  { userId: "user-001", activationId: "act-030", subunitId: "sub-14-1", completedAt: "2025-09-21T10:15:00Z" },
  { userId: "user-001", activationId: "act-030", subunitId: "sub-15-1", completedAt: "2025-09-22T11:15:00Z" },
];

export const mockRoadmaps: CourseRoadmap[] = [
  // Community/Catalog Course 1
  {
    id: "1",
    title: "Frontend Development with React",
    description: "Master modern frontend development with React, TypeScript, and best practices",
    totalUnits: 3,
    estimatedTime: "6 weeks",
    level: "Intermediate",
    rating: 4.8,
    students: 1240,
    price: "Premium",
    isPaid: true,
    isPublic: false,
    createdAt: "2024-09-15T10:00:00Z",
    copies: 342,
    ownerId: "partner-001",
    ownerType: "THIRD_PARTY",
    ownerName: "IzyAcademy",
    originId: "1",
  },

  // Community/Catalog Course 2
  {
    id: "2",
    title: "Full-Stack JavaScript Development",
    description: "Build complete web applications using Node.js, Express, and MongoDB",
    totalUnits: 4,
    estimatedTime: "8 weeks",
    level: "Advanced",
    rating: 4.9,
    students: 856,
    price: "Free with Premium",
    isPaid: false,
    isPublic: true,
    createdAt: "2024-08-20T14:30:00Z",
    copies: 278,
    ownerId: "partner-002",
    ownerType: "THIRD_PARTY",
    ownerName: "Tison.ia",
    originId: "2",
  },

  // Community/Catalog Course 3
  {
    id: "3",
    title: "UI/UX Design Fundamentals",
    description: "Learn design principles, user research, and create beautiful interfaces",
    totalUnits: 3,
    estimatedTime: "5 weeks",
    level: "Beginner",
    rating: 4.7,
    students: 2103,
    price: "Free",
    isPaid: false,
    isPublic: true,
    createdAt: "2024-07-10T09:00:00Z",
    copies: 567,
    ownerId: "partner-001",
    ownerType: "THIRD_PARTY",
    ownerName: "Izyacademy",
    originId: "3",
  },

  // Community Course by User
  {
    id: "4",
    title: "Python Machine Learning Mastery",
    description: "Complete guide to ML algorithms, data preprocessing, and model deployment",
    totalUnits: 3,
    level: "Advanced",
    estimatedTime: "Self-paced",
    rating: 4.7,
    students: 324,
    price: "Free",
    isPaid: false,
    isPublic: true,
    createdAt: "2025-02-20T16:00:00Z",
    copies: 89,
    ownerId: "user-004",
    ownerType: "USER",
    ownerName: "Alex Rodriguez",
    originId: "1",
  },

  // Community/Catalog Course 4
  {
    id: "5",
    title: "Data Science with Python",
    description: "Analyze data, create visualizations, and build machine learning models",
    totalUnits: 3,
    estimatedTime: "10 weeks",
    level: "Intermediate",
    rating: 4.8,
    students: 1567,
    price: "Premium",
    isPaid: true,
    isPublic: true,
    createdAt: "2024-06-05T11:00:00Z",
    copies: 423,
    ownerId: "partner-002",
    ownerType: "THIRD_PARTY",
    ownerName: "Tison.ia",
    originId: "5",
  },

  // Personal Roadmap owned by user-001
  {
    id: "6",
    title: "My JavaScript Journey",
    description: "Custom roadmap for mastering JavaScript fundamentals and advanced concepts",
    totalUnits: 4,
    level: "Beginner",
    estimatedTime: "12 weeks",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: true,
    createdAt: "2025-07-22T14:00:00Z",
    copies: 0,
    ownerId: "user-001",
    ownerType: "USER",
    ownerName: "Sarah Johnson",
    originId: "2",
  },

  // Team Roadmap owned by team-123
  {
    id: "7",
    title: "Team Frontend Mastery",
    description: "Collaborative roadmap for frontend development team skills",
    totalUnits: 2,
    level: "Intermediate",
    estimatedTime: "Self-paced",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: false,
    createdAt: "2025-08-01T10:30:00Z",
    copies: 12,
    ownerId: "team-123",
    ownerType: "TEAM",
    ownerName: "Frontend Developers",
    originId: "1",
  },

  // Team Roadmap owned by team-current
  {
    id: "8",
    title: "Advanced React Development Roadmap",
    description:
      "A comprehensive team learning roadmap designed to master modern React development, including hooks, state management, testing, and performance optimization. This collaborative journey will take your team from intermediate to advanced React proficiency.",
    totalUnits: 4,
    level: "Advanced",
    estimatedTime: "Self-paced",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: true,
    createdAt: "2025-02-01T09:00:00Z",
    copies: 3,
    ownerId: "team-current",
    ownerType: "TEAM",
    ownerName: "Advanced React Team",
    originId: "1",
  },

  // Third Party Premium Content
  {
    id: "9",
    title: "AWS Certification Path",
    description: "Complete AWS certification roadmap by our content partner",
    totalUnits: 3,
    level: "Advanced",
    estimatedTime: "12 weeks",
    rating: 4.6,
    students: 542,
    price: "Premium",
    isPaid: true,
    isPublic: true,
    createdAt: "2025-03-10T10:00:00Z",
    copies: 156,
    ownerId: "partner-003",
    ownerType: "THIRD_PARTY",
    ownerName: "AWS Training Partner",
    originId: "9",
  },
  {
    id: "roadmap-010",
    title: "TypeScript Mastery",
    description: "Master TypeScript for building robust and scalable applications",
    totalUnits: 8,
    estimatedTime: "6 weeks",
    level: "Intermediate",
    rating: 4.5,
    students: 45,
    price: "Free",
    isPaid: false,
    isPublic: false,
    createdAt: "2025-09-15T09:00:00Z",
    copies: 2,
    ownerId: "user-001",
    ownerType: "USER",
    ownerName: "Sarah Johnson",
    originId: "5",
  },
  {
    id: "roadmap-011",
    title: "Full Stack Development Journey",
    description: "A comprehensive roadmap covering frontend, backend, and deployment",
    totalUnits: 15,
    estimatedTime: "12 weeks",
    level: "Advanced",
    rating: 4.8,
    students: 127,
    price: "Free",
    isPaid: false,
    isPublic: true,
    createdAt: "2025-09-20T11:30:00Z",
    copies: 8,
    ownerId: "user-001",
    ownerType: "USER",
    ownerName: "Sarah Johnson",
    originId: "2",
  },

  // Team copy of roadmap "4" for team-456 (Data Science Explorers)
  {
    id: "team-copy-4",
    title: "Python Machine Learning Mastery",
    description: "Complete guide to ML algorithms, data preprocessing, and model deployment",
    totalUnits: 3,
    level: "Advanced",
    estimatedTime: "Self-paced",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: false,
    createdAt: "2024-04-02T10:00:00Z",
    copies: 0,
    ownerId: "team-456",
    ownerType: "TEAM",
    ownerName: "Data Science Explorers",
    originId: "4",
  },

  // Team copy of roadmap "6" for team-303 (DevOps Engineers)
  {
    id: "team-copy-6",
    title: "My JavaScript Journey",
    description: "Custom roadmap for mastering JavaScript fundamentals and advanced concepts",
    totalUnits: 4,
    level: "Beginner",
    estimatedTime: "Self-paced",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: false,
    createdAt: "2024-01-25T10:00:00Z",
    copies: 0,
    ownerId: "team-303",
    ownerType: "TEAM",
    ownerName: "DevOps Engineers",
    originId: "6",
  },

  // Team copy of roadmap "1" for team-404 (AI & Machine Learning)
  {
    id: "team-copy-404",
    title: "Frontend Development with React",
    description: "Master modern frontend development with React, TypeScript, and best practices",
    totalUnits: 3,
    estimatedTime: "Self-paced",
    level: "Intermediate",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: false,
    createdAt: "2024-03-05T10:00:00Z",
    copies: 0,
    ownerId: "team-404",
    ownerType: "TEAM",
    ownerName: "AI & Machine Learning",
    originId: "1",
  },

  // Team copy of roadmap "1" for team-505 (Project Management Pros)
  {
    id: "team-copy-505",
    title: "Frontend Development with React",
    description: "Master modern frontend development with React, TypeScript, and best practices",
    totalUnits: 3,
    estimatedTime: "Self-paced",
    level: "Intermediate",
    rating: undefined,
    students: undefined,
    price: undefined,
    isPaid: false,
    isPublic: false,
    createdAt: "2024-04-08T10:00:00Z",
    copies: 0,
    ownerId: "team-505",
    ownerType: "TEAM",
    ownerName: "Project Management Pros",
    originId: "1",
  },
];

export interface UserEntitlement {
  userId: string;
  roadmapId: string;
  accessType: "purchase";
  grantedAt: string;
  isActive: boolean;
}

export const mockUserEntitlements: UserEntitlement[] = [
  // Roadmap "1" (THIRD_PARTY - IzyAcademy) entitlements
  { userId: "user-001", roadmapId: "1", accessType: "purchase", grantedAt: "2024-09-20T10:00:00Z", isActive: true },
  { userId: "user-002", roadmapId: "1", accessType: "purchase", grantedAt: "2024-09-20T10:00:00Z", isActive: true },
  { userId: "user-003", roadmapId: "1", accessType: "purchase", grantedAt: "2024-09-20T10:00:00Z", isActive: true },
  { userId: "user-004", roadmapId: "1", accessType: "purchase", grantedAt: "2024-09-15T08:00:00Z", isActive: true },
  { userId: "user-005", roadmapId: "1", accessType: "purchase", grantedAt: "2024-09-15T08:00:00Z", isActive: true },
  { userId: "user-006", roadmapId: "1", accessType: "purchase", grantedAt: "2024-09-15T08:00:00Z", isActive: true },

  // Roadmap "2" (THIRD_PARTY - Tison.ia) entitlements
  { userId: "user-002", roadmapId: "2", accessType: "purchase", grantedAt: "2024-08-25T12:00:00Z", isActive: true },

  // Roadmap "3" (THIRD_PARTY - Izyacademy) entitlements
  { userId: "user-003", roadmapId: "3", accessType: "purchase", grantedAt: "2024-07-15T10:00:00Z", isActive: true },
  { userId: "user-009", roadmapId: "3", accessType: "purchase", grantedAt: "2024-07-15T10:00:00Z", isActive: true },

  // Roadmap "5" (THIRD_PARTY - Tison.ia) entitlements
  { userId: "user-001", roadmapId: "5", accessType: "purchase", grantedAt: "2024-08-10T09:00:00Z", isActive: true },
  { userId: "user-002", roadmapId: "5", accessType: "purchase", grantedAt: "2024-08-10T09:00:00Z", isActive: true },
  { userId: "user-007", roadmapId: "5", accessType: "purchase", grantedAt: "2024-08-10T09:00:00Z", isActive: true },

  // Roadmap "9" (THIRD_PARTY - AWS Training Partner) entitlements
  { userId: "user-001", roadmapId: "9", accessType: "purchase", grantedAt: "2025-10-27T10:00:00Z", isActive: true },
  { userId: "user-005", roadmapId: "9", accessType: "purchase", grantedAt: "2025-03-15T14:30:00Z", isActive: true },
  { userId: "user-008", roadmapId: "9", accessType: "purchase", grantedAt: "2025-03-15T14:30:00Z", isActive: true },
  { userId: "user-010", roadmapId: "9", accessType: "purchase", grantedAt: "2025-03-15T14:30:00Z", isActive: true },
];

// Event-based tracking data
export const mockPointEvents: PointEvent[] = [
  // User 001 - Sarah Johnson (1250 total points)
  {
    id: "pe-001",
    userId: "user-001",
    points: 100,
    reason: "Completed React Basics unit",
    timestamp: "2024-09-15T10:30:00Z",
  },
  {
    id: "pe-002",
    userId: "user-001",
    points: 150,
    reason: "Completed Components Deep Dive unit",
    timestamp: "2024-09-18T14:20:00Z",
  },
  {
    id: "pe-003",
    userId: "user-001",
    teamId: "team-123",
    points: 200,
    reason: "Team goal completion bonus",
    timestamp: "2024-09-25T09:15:00Z",
  },
  {
    id: "pe-004",
    userId: "user-001",
    points: 100,
    reason: "Completed State Management unit",
    timestamp: "2024-10-02T16:45:00Z",
  },
  { id: "pe-005", userId: "user-001", points: 150, reason: "Completed Hooks unit", timestamp: "2024-10-08T11:30:00Z" },
  {
    id: "pe-006",
    userId: "user-001",
    teamId: "team-123",
    points: 100,
    reason: "Helped team member",
    timestamp: "2024-10-12T13:00:00Z",
  },
  {
    id: "pe-007",
    userId: "user-001",
    points: 200,
    reason: "Completed Advanced Patterns unit",
    timestamp: "2024-10-20T15:30:00Z",
  },
  {
    id: "pe-008",
    userId: "user-001",
    points: 150,
    reason: "Completed Performance Optimization unit",
    timestamp: "2024-10-28T10:00:00Z",
  },
  {
    id: "pe-009",
    userId: "user-001",
    points: 100,
    reason: "Daily challenge completion",
    timestamp: "2024-11-05T08:45:00Z",
  },

  // User 002 - Mike Chen (890 total points)
  {
    id: "pe-010",
    userId: "user-002",
    points: 100,
    reason: "Completed HTML Basics unit",
    timestamp: "2024-09-20T09:00:00Z",
  },
  {
    id: "pe-011",
    userId: "user-002",
    points: 100,
    reason: "Completed CSS Fundamentals unit",
    timestamp: "2024-09-25T14:30:00Z",
  },
  {
    id: "pe-012",
    userId: "user-002",
    teamId: "team-current",
    points: 150,
    reason: "First team contribution",
    timestamp: "2024-10-01T11:00:00Z",
  },
  {
    id: "pe-013",
    userId: "user-002",
    points: 100,
    reason: "Completed JavaScript Basics unit",
    timestamp: "2024-10-05T16:20:00Z",
  },
  {
    id: "pe-014",
    userId: "user-002",
    points: 100,
    reason: "Completed DOM Manipulation unit",
    timestamp: "2024-10-12T10:45:00Z",
  },
  {
    id: "pe-015",
    userId: "user-002",
    points: 150,
    reason: "Completed ES6 Features unit",
    timestamp: "2024-10-18T13:15:00Z",
  },
  {
    id: "pe-016",
    userId: "user-002",
    teamId: "team-current",
    points: 90,
    reason: "Team collaboration bonus",
    timestamp: "2024-10-25T15:00:00Z",
  },
  {
    id: "pe-017",
    userId: "user-002",
    points: 100,
    reason: "Completed Async JavaScript unit",
    timestamp: "2024-11-02T09:30:00Z",
  },

  // User 003 - Emma Wilson (650 total points)
  {
    id: "pe-018",
    userId: "user-003",
    points: 100,
    reason: "Completed Design Principles unit",
    timestamp: "2024-09-22T10:00:00Z",
  },
  {
    id: "pe-019",
    userId: "user-003",
    points: 150,
    reason: "Completed User Research unit",
    timestamp: "2024-09-28T14:00:00Z",
  },
  {
    id: "pe-020",
    userId: "user-003",
    teamId: "team-456",
    points: 100,
    reason: "Team design critique session",
    timestamp: "2024-10-05T11:30:00Z",
  },
  {
    id: "pe-021",
    userId: "user-003",
    points: 100,
    reason: "Completed Wireframing unit",
    timestamp: "2024-10-10T15:45:00Z",
  },
  {
    id: "pe-022",
    userId: "user-003",
    points: 100,
    reason: "Completed Prototyping unit",
    timestamp: "2024-10-18T09:20:00Z",
  },
  {
    id: "pe-023",
    userId: "user-003",
    points: 100,
    reason: "Completed Usability Testing unit",
    timestamp: "2024-10-26T13:00:00Z",
  },

  // User 004 - Alex Rodriguez (1680 total points)
  {
    id: "pe-024",
    userId: "user-004",
    points: 150,
    reason: "Completed Advanced React Patterns unit",
    timestamp: "2024-08-15T10:00:00Z",
  },
  {
    id: "pe-025",
    userId: "user-004",
    points: 200,
    reason: "Completed Performance Mastery unit",
    timestamp: "2024-08-22T14:30:00Z",
  },
  {
    id: "pe-026",
    userId: "user-004",
    teamId: "team-789",
    points: 250,
    reason: "Led team to goal completion",
    timestamp: "2024-08-30T16:00:00Z",
  },
  {
    id: "pe-027",
    userId: "user-004",
    points: 150,
    reason: "Completed Testing Strategies unit",
    timestamp: "2024-09-05T11:15:00Z",
  },
  {
    id: "pe-028",
    userId: "user-004",
    points: 200,
    reason: "Completed Architecture Patterns unit",
    timestamp: "2024-09-12T13:45:00Z",
  },
  {
    id: "pe-029",
    userId: "user-004",
    points: 150,
    reason: "Completed Advanced TypeScript unit",
    timestamp: "2024-09-20T10:30:00Z",
  },
  {
    id: "pe-030",
    userId: "user-004",
    teamId: "team-789",
    points: 180,
    reason: "Mentoring team members bonus",
    timestamp: "2024-09-28T15:00:00Z",
  },
  {
    id: "pe-031",
    userId: "user-004",
    points: 200,
    reason: "Completed SSR & SSG unit",
    timestamp: "2024-10-05T09:00:00Z",
  },
  {
    id: "pe-032",
    userId: "user-004",
    points: 200,
    reason: "Completed State Management Advanced unit",
    timestamp: "2024-10-15T14:20:00Z",
  },

  // User 005 - Jordan Kim (420 total points)
  {
    id: "pe-033",
    userId: "user-005",
    points: 100,
    reason: "Completed Python Basics unit",
    timestamp: "2024-10-01T10:00:00Z",
  },
  {
    id: "pe-034",
    userId: "user-005",
    points: 100,
    reason: "Completed Data Structures unit",
    timestamp: "2024-10-08T14:30:00Z",
  },
  {
    id: "pe-035",
    userId: "user-005",
    teamId: "team-101",
    points: 70,
    reason: "First team project contribution",
    timestamp: "2024-10-15T11:00:00Z",
  },
  {
    id: "pe-036",
    userId: "user-005",
    points: 100,
    reason: "Completed NumPy Fundamentals unit",
    timestamp: "2024-10-22T16:00:00Z",
  },
  { id: "pe-037", userId: "user-005", points: 50, reason: "Daily coding challenge", timestamp: "2024-10-29T09:30:00Z" },

  // User 006 - Sam Chen (980 total points)
  {
    id: "pe-038",
    userId: "user-006",
    points: 150,
    reason: "Completed Node.js Basics unit",
    timestamp: "2024-09-10T10:00:00Z",
  },
  {
    id: "pe-039",
    userId: "user-006",
    points: 150,
    reason: "Completed Express.js unit",
    timestamp: "2024-09-17T14:00:00Z",
  },
  {
    id: "pe-040",
    userId: "user-006",
    teamId: "team-202",
    points: 130,
    reason: "Backend architecture contribution",
    timestamp: "2024-09-24T11:30:00Z",
  },
  {
    id: "pe-041",
    userId: "user-006",
    points: 150,
    reason: "Completed Database Design unit",
    timestamp: "2024-10-01T15:45:00Z",
  },
  {
    id: "pe-042",
    userId: "user-006",
    points: 150,
    reason: "Completed REST API Design unit",
    timestamp: "2024-10-10T09:20:00Z",
  },
  {
    id: "pe-043",
    userId: "user-006",
    points: 150,
    reason: "Completed Authentication & Security unit",
    timestamp: "2024-10-18T13:00:00Z",
  },
  {
    id: "pe-044",
    userId: "user-006",
    teamId: "team-202",
    points: 100,
    reason: "Team code review bonus",
    timestamp: "2024-10-25T16:00:00Z",
  },

  // User 007 - Maria Garcia (320 total points)
  {
    id: "pe-045",
    userId: "user-007",
    points: 100,
    reason: "Completed Mobile Dev Intro unit",
    timestamp: "2024-10-05T10:00:00Z",
  },
  {
    id: "pe-046",
    userId: "user-007",
    points: 100,
    reason: "Completed React Native Basics unit",
    timestamp: "2024-10-12T14:30:00Z",
  },
  {
    id: "pe-047",
    userId: "user-007",
    points: 70,
    reason: "Completed UI Components unit",
    timestamp: "2024-10-20T11:00:00Z",
  },
  {
    id: "pe-048",
    userId: "user-007",
    points: 50,
    reason: "Practice exercise completion",
    timestamp: "2024-10-28T16:00:00Z",
  },

  // User 008 - David Brown (1420 total points)
  {
    id: "pe-049",
    userId: "user-008",
    points: 200,
    reason: "Completed Linear Algebra for ML unit",
    timestamp: "2024-08-20T10:00:00Z",
  },
  {
    id: "pe-050",
    userId: "user-008",
    points: 200,
    reason: "Completed Statistics & Probability unit",
    timestamp: "2024-08-28T14:00:00Z",
  },
  {
    id: "pe-051",
    userId: "user-008",
    points: 200,
    reason: "Completed Supervised Learning unit",
    timestamp: "2024-09-05T11:30:00Z",
  },
  {
    id: "pe-052",
    userId: "user-008",
    points: 200,
    reason: "Completed Neural Networks unit",
    timestamp: "2024-09-15T15:45:00Z",
  },
  {
    id: "pe-053",
    userId: "user-008",
    points: 200,
    reason: "Completed Deep Learning unit",
    timestamp: "2024-09-25T09:20:00Z",
  },
  {
    id: "pe-054",
    userId: "user-008",
    points: 220,
    reason: "Completed Advanced ML Algorithms unit",
    timestamp: "2024-10-05T13:00:00Z",
  },
  {
    id: "pe-055",
    userId: "user-008",
    points: 200,
    reason: "Completed Model Deployment unit",
    timestamp: "2024-10-18T16:00:00Z",
  },

  // User 009 - Lisa Taylor (560 total points)
  {
    id: "pe-056",
    userId: "user-009",
    points: 100,
    reason: "Completed Agile Fundamentals unit",
    timestamp: "2024-09-25T10:00:00Z",
  },
  {
    id: "pe-057",
    userId: "user-009",
    points: 100,
    reason: "Completed Scrum Framework unit",
    timestamp: "2024-10-02T14:00:00Z",
  },
  {
    id: "pe-058",
    userId: "user-009",
    points: 100,
    reason: "Completed Team Leadership unit",
    timestamp: "2024-10-10T11:30:00Z",
  },
  {
    id: "pe-059",
    userId: "user-009",
    points: 100,
    reason: "Completed Risk Management unit",
    timestamp: "2024-10-18T15:45:00Z",
  },
  {
    id: "pe-060",
    userId: "user-009",
    points: 100,
    reason: "Completed Stakeholder Communication unit",
    timestamp: "2024-10-28T09:20:00Z",
  },
  {
    id: "pe-061",
    userId: "user-009",
    points: 60,
    reason: "PM certification prep milestone",
    timestamp: "2024-11-05T13:00:00Z",
  },

  // User 010 - Kevin Wong (720 total points)
  {
    id: "pe-062",
    userId: "user-010",
    points: 150,
    reason: "Completed Advanced Statistics unit",
    timestamp: "2024-09-12T10:00:00Z",
  },
  {
    id: "pe-063",
    userId: "user-010",
    points: 150,
    reason: "Completed Feature Engineering unit",
    timestamp: "2024-09-20T14:00:00Z",
  },
  {
    id: "pe-064",
    userId: "user-010",
    points: 120,
    reason: "Completed MLOps Basics unit",
    timestamp: "2024-09-28T11:30:00Z",
  },
  {
    id: "pe-065",
    userId: "user-010",
    points: 150,
    reason: "Completed Model Monitoring unit",
    timestamp: "2024-10-08T15:45:00Z",
  },
  {
    id: "pe-066",
    userId: "user-010",
    points: 150,
    reason: "Completed AI Ethics unit",
    timestamp: "2024-10-18T09:20:00Z",
  },
];

export const mockBadgeEvents: BadgeEvent[] = [
  // User 001 - Sarah Johnson (12 badges)
  { id: "be-001", userId: "user-001", reason: "Achievement earned", timestamp: "2024-09-15T10:30:00Z" },
  { id: "be-002", userId: "user-001", reason: "Achievement earned", timestamp: "2024-09-18T14:20:00Z" },
  { id: "be-003", userId: "user-001", teamId: "team-123", reason: "Team achievement", timestamp: "2024-09-25T09:15:00Z" },
  { id: "be-004", userId: "user-001", reason: "Achievement earned", timestamp: "2024-10-02T16:45:00Z" },
  { id: "be-005", userId: "user-001", reason: "Achievement earned", timestamp: "2024-10-08T11:30:00Z" },
  { id: "be-006", userId: "user-001", teamId: "team-123", reason: "Team achievement", timestamp: "2024-10-12T13:00:00Z" },
  { id: "be-007", userId: "user-001", reason: "Achievement earned", timestamp: "2024-10-20T15:30:00Z" },
  { id: "be-008", userId: "user-001", reason: "Achievement earned", timestamp: "2024-10-28T10:00:00Z" },
  { id: "be-009", userId: "user-001", reason: "Achievement earned", timestamp: "2024-11-01T08:45:00Z" },
  { id: "be-010", userId: "user-001", reason: "Achievement earned", timestamp: "2024-11-05T14:20:00Z" },
  { id: "be-011", userId: "user-001", teamId: "team-123", reason: "Team achievement", timestamp: "2024-11-08T16:00:00Z" },
  { id: "be-012", userId: "user-001", reason: "Achievement earned", timestamp: "2024-11-12T10:30:00Z" },

  // User 002 - Mike Chen (8 badges)
  { id: "be-013", userId: "user-002", reason: "Achievement earned", timestamp: "2024-09-20T09:00:00Z" },
  { id: "be-014", userId: "user-002", reason: "Achievement earned", timestamp: "2024-09-25T14:30:00Z" },
  { id: "be-015", userId: "user-002", teamId: "team-current", reason: "Team achievement", timestamp: "2024-10-01T11:00:00Z" },
  { id: "be-016", userId: "user-002", reason: "Achievement earned", timestamp: "2024-10-05T16:20:00Z" },
  { id: "be-017", userId: "user-002", reason: "Achievement earned", timestamp: "2024-10-12T10:45:00Z" },
  { id: "be-018", userId: "user-002", reason: "Achievement earned", timestamp: "2024-10-18T13:15:00Z" },
  { id: "be-019", userId: "user-002", teamId: "team-current", reason: "Team achievement", timestamp: "2024-10-25T15:00:00Z" },
  { id: "be-020", userId: "user-002", reason: "Achievement earned", timestamp: "2024-11-02T09:30:00Z" },

  // User 003 - Emma Wilson (6 badges)
  { id: "be-021", userId: "user-003", reason: "Achievement earned", timestamp: "2024-09-22T10:00:00Z" },
  { id: "be-022", userId: "user-003", reason: "Achievement earned", timestamp: "2024-09-28T14:00:00Z" },
  { id: "be-023", userId: "user-003", teamId: "team-456", reason: "Team achievement", timestamp: "2024-10-05T11:30:00Z" },
  { id: "be-024", userId: "user-003", reason: "Achievement earned", timestamp: "2024-10-10T15:45:00Z" },
  { id: "be-025", userId: "user-003", reason: "Achievement earned", timestamp: "2024-10-18T09:20:00Z" },
  { id: "be-026", userId: "user-003", reason: "Achievement earned", timestamp: "2024-10-26T13:00:00Z" },

  // User 004 - Alex Rodriguez (18 badges)
  { id: "be-027", userId: "user-004", reason: "Achievement earned", timestamp: "2024-08-15T10:00:00Z" },
  { id: "be-028", userId: "user-004", reason: "Achievement earned", timestamp: "2024-08-22T14:30:00Z" },
  { id: "be-029", userId: "user-004", teamId: "team-789", reason: "Team achievement", timestamp: "2024-08-30T16:00:00Z" },
  { id: "be-030", userId: "user-004", reason: "Achievement earned", timestamp: "2024-09-05T11:15:00Z" },
  { id: "be-031", userId: "user-004", reason: "Achievement earned", timestamp: "2024-09-12T13:45:00Z" },
  { id: "be-032", userId: "user-004", reason: "Achievement earned", timestamp: "2024-09-20T10:30:00Z" },
  { id: "be-033", userId: "user-004", teamId: "team-789", reason: "Team achievement", timestamp: "2024-09-28T15:00:00Z" },
  { id: "be-034", userId: "user-004", reason: "Achievement earned", timestamp: "2024-10-05T09:00:00Z" },
  { id: "be-035", userId: "user-004", reason: "Achievement earned", timestamp: "2024-10-15T14:20:00Z" },
  { id: "be-036", userId: "user-004", reason: "Achievement earned", timestamp: "2024-10-22T10:45:00Z" },
  { id: "be-037", userId: "user-004", teamId: "team-789", reason: "Team achievement", timestamp: "2024-10-28T16:30:00Z" },
  { id: "be-038", userId: "user-004", reason: "Achievement earned", timestamp: "2024-11-02T11:00:00Z" },
  { id: "be-039", userId: "user-004", reason: "Achievement earned", timestamp: "2024-11-08T14:15:00Z" },
  { id: "be-040", userId: "user-004", reason: "Achievement earned", timestamp: "2024-11-12T09:30:00Z" },
  { id: "be-041", userId: "user-004", reason: "Achievement earned", timestamp: "2024-11-18T15:45:00Z" },
  { id: "be-042", userId: "user-004", reason: "Achievement earned", timestamp: "2024-11-22T10:20:00Z" },
  { id: "be-043", userId: "user-004", teamId: "team-789", reason: "Team achievement", timestamp: "2024-11-28T13:00:00Z" },
  { id: "be-044", userId: "user-004", reason: "Achievement earned", timestamp: "2024-12-02T16:00:00Z" },

  // User 005 - Jordan Kim (4 badges)
  { id: "be-045", userId: "user-005", reason: "Achievement earned", timestamp: "2024-10-01T10:00:00Z" },
  { id: "be-046", userId: "user-005", reason: "Achievement earned", timestamp: "2024-10-08T14:30:00Z" },
  { id: "be-047", userId: "user-005", teamId: "team-101", reason: "Team achievement", timestamp: "2024-10-15T11:00:00Z" },
  { id: "be-048", userId: "user-005", reason: "Achievement earned", timestamp: "2024-10-22T16:00:00Z" },

  // User 006 - Sam Chen (10 badges)
  { id: "be-049", userId: "user-006", reason: "Achievement earned", timestamp: "2024-09-10T10:00:00Z" },
  { id: "be-050", userId: "user-006", reason: "Achievement earned", timestamp: "2024-09-17T14:00:00Z" },
  { id: "be-051", userId: "user-006", teamId: "team-202", reason: "Team achievement", timestamp: "2024-09-24T11:30:00Z" },
  { id: "be-052", userId: "user-006", reason: "Achievement earned", timestamp: "2024-10-01T15:45:00Z" },
  { id: "be-053", userId: "user-006", reason: "Achievement earned", timestamp: "2024-10-10T09:20:00Z" },
  { id: "be-054", userId: "user-006", reason: "Achievement earned", timestamp: "2024-10-18T13:00:00Z" },
  { id: "be-055", userId: "user-006", teamId: "team-202", reason: "Team achievement", timestamp: "2024-10-25T16:00:00Z" },
  { id: "be-056", userId: "user-006", reason: "Achievement earned", timestamp: "2024-11-01T10:30:00Z" },
  { id: "be-057", userId: "user-006", reason: "Achievement earned", timestamp: "2024-11-08T14:15:00Z" },
  { id: "be-058", userId: "user-006", reason: "Achievement earned", timestamp: "2024-11-15T09:45:00Z" },

  // User 007 - Maria Garcia (3 badges)
  { id: "be-059", userId: "user-007", reason: "Achievement earned", timestamp: "2024-10-05T10:00:00Z" },
  { id: "be-060", userId: "user-007", reason: "Achievement earned", timestamp: "2024-10-12T14:30:00Z" },
  { id: "be-061", userId: "user-007", reason: "Achievement earned", timestamp: "2024-10-20T11:00:00Z" },

  // User 008 - David Brown (15 badges)
  { id: "be-062", userId: "user-008", reason: "Achievement earned", timestamp: "2024-08-20T10:00:00Z" },
  { id: "be-063", userId: "user-008", reason: "Achievement earned", timestamp: "2024-08-28T14:00:00Z" },
  { id: "be-064", userId: "user-008", reason: "Achievement earned", timestamp: "2024-09-05T11:30:00Z" },
  { id: "be-065", userId: "user-008", reason: "Achievement earned", timestamp: "2024-09-15T15:45:00Z" },
  { id: "be-066", userId: "user-008", reason: "Achievement earned", timestamp: "2024-09-25T09:20:00Z" },
  { id: "be-067", userId: "user-008", reason: "Achievement earned", timestamp: "2024-10-05T13:00:00Z" },
  { id: "be-068", userId: "user-008", reason: "Achievement earned", timestamp: "2024-10-18T16:00:00Z" },
  { id: "be-069", userId: "user-008", reason: "Achievement earned", timestamp: "2024-10-25T10:30:00Z" },
  { id: "be-070", userId: "user-008", reason: "Achievement earned", timestamp: "2024-11-02T14:15:00Z" },
  { id: "be-071", userId: "user-008", reason: "Achievement earned", timestamp: "2024-11-10T09:45:00Z" },
  { id: "be-072", userId: "user-008", reason: "Achievement earned", timestamp: "2024-11-18T15:20:00Z" },
  { id: "be-073", userId: "user-008", reason: "Achievement earned", timestamp: "2024-11-25T11:00:00Z" },
  { id: "be-074", userId: "user-008", reason: "Achievement earned", timestamp: "2024-12-02T16:30:00Z" },
  { id: "be-075", userId: "user-008", reason: "Achievement earned", timestamp: "2024-12-10T10:15:00Z" },
  { id: "be-076", userId: "user-008", reason: "Achievement earned", timestamp: "2024-12-18T14:45:00Z" },

  // User 009 - Lisa Taylor (5 badges)
  { id: "be-077", userId: "user-009", reason: "Achievement earned", timestamp: "2024-09-25T10:00:00Z" },
  { id: "be-078", userId: "user-009", reason: "Achievement earned", timestamp: "2024-10-02T14:00:00Z" },
  { id: "be-079", userId: "user-009", reason: "Achievement earned", timestamp: "2024-10-10T11:30:00Z" },
  { id: "be-080", userId: "user-009", reason: "Achievement earned", timestamp: "2024-10-18T15:45:00Z" },
  { id: "be-081", userId: "user-009", reason: "Achievement earned", timestamp: "2024-10-28T09:20:00Z" },

  // User 010 - Kevin Wong (7 badges)
  { id: "be-082", userId: "user-010", reason: "Achievement earned", timestamp: "2024-09-12T10:00:00Z" },
  { id: "be-083", userId: "user-010", reason: "Achievement earned", timestamp: "2024-09-20T14:00:00Z" },
  { id: "be-084", userId: "user-010", reason: "Achievement earned", timestamp: "2024-09-28T11:30:00Z" },
  { id: "be-085", userId: "user-010", reason: "Achievement earned", timestamp: "2024-10-08T15:45:00Z" },
  { id: "be-086", userId: "user-010", reason: "Achievement earned", timestamp: "2024-10-18T09:20:00Z" },
  { id: "be-087", userId: "user-010", reason: "Achievement earned", timestamp: "2024-10-28T14:00:00Z" },
  { id: "be-088", userId: "user-010", reason: "Achievement earned", timestamp: "2024-11-08T10:30:00Z" },
];

// Team Request Data
export const mockRequests: Request[] = [
  // Request to Sarah Johnson (user-001) - Form new team with roadmap
  {
    id: "req-001",
    type: "CREATE_TEAM",
    senderId: "user-002",
    recipientId: "user-001",
    status: "pending",
    message:
      "Hey Sarah! I saw you're interested in React Development. I've been working on some side projects and would love to team up with someone who shares the same passion. Want to form a team?",
    createdAt: "2025-01-25T10:30:00Z",
    roadmapId: "1",
    newTeamName: "React Explorers",
    maxMembers: 4,
    duration: "8 weeks",
    makeAdmin: true,
  },
  // Request to Sarah Johnson - Join existing team
  {
    id: "req-002",
    type: "INVITE_TO_TEAM",
    senderId: "user-003",
    recipientId: "user-001",
    status: "pending",
    message:
      "Hi! I'm Alex and I'm leading a team focused on Frontend Development. Your profile shows great experience and I think you'd be a perfect fit for our group. Would you like to join us?",
    createdAt: "2025-01-26T14:20:00Z",
    teamId: "team-456",
    roadmapId: "3",
    maxMembers: 5,
    duration: "10 weeks",
    makeAdmin: false,
  },
  // Request to Sarah Johnson - Form new team without roadmap
  {
    id: "req-003",
    type: "CREATE_TEAM",
    senderId: "user-005",
    recipientId: "user-001",
    status: "pending",
    message:
      "Hey! I noticed we have similar learning goals. I'm thinking of starting a study group to keep each other accountable. Interested in teaming up?",
    createdAt: "2025-01-24T09:15:00Z",
    roadmapId: "4",
    newTeamName: "Accountability Partners",
    maxMembers: 3,
    duration: "12 weeks",
    makeAdmin: true,
  },
  // Request to join team-123 (REQUEST_TO_JOIN)
  {
    id: "req-004",
    type: "REQUEST_TO_JOIN",
    senderId: "user-007",
    recipientId: "team-123",
    status: "pending",
    message:
      "Hello team! I've been following your progress on the Machine Learning roadmap and I'm really impressed. I have experience in Python and data analysis and would love to contribute to the team. Can I join?",
    createdAt: "2025-01-27T16:45:00Z",
    teamId: "team-123",
    roadmapId: "5",
    maxMembers: 6,
    duration: "14 weeks",
    makeAdmin: false,
  },
  // Another INVITE_TO_TEAM for Sarah - Join with admin privileges
  {
    id: "req-005",
    type: "INVITE_TO_TEAM",
    senderId: "user-006",
    recipientId: "user-001",
    status: "pending",
    message:
      "Hi Sarah! I'm building a collaborative team for the Advanced JavaScript course and I need a co-admin who really knows their stuff. Your experience with React would be invaluable. Interested in joining as an admin?",
    createdAt: "2025-01-23T11:00:00Z",
    teamId: "team-789",
    roadmapId: "6",
    maxMembers: 4,
    duration: "12 weeks",
    makeAdmin: true,
  },
  // Request to join team-456 (REQUEST_TO_JOIN)
  {
    id: "req-006",
    type: "REQUEST_TO_JOIN",
    senderId: "user-009",
    recipientId: "team-456",
    status: "pending",
    message:
      "Hey everyone! I've been learning UI/UX design for about 6 months now and I'm looking for a team to collaborate with. I saw your team is working on frontend projects and I think I could contribute with design insights. Would love to join!",
    createdAt: "2025-01-26T08:30:00Z",
    teamId: "team-456",
    roadmapId: "3",
    maxMembers: 5,
    duration: "8 weeks",
    makeAdmin: false,
  },
  // Form new team with roadmap - to Sarah
  {
    id: "req-007",
    type: "CREATE_TEAM",
    senderId: "user-008",
    recipientId: "user-001",
    status: "pending",
    message:
      "Hi! I'm David and I'm planning to go through the Full Stack Development roadmap. I learn better with a partner and your profile suggests we'd work well together. Want to start this journey as a team?",
    createdAt: "2025-01-22T13:45:00Z",
    roadmapId: "2",
    newTeamName: "Full Stack Warriors",
    maxMembers: 5,
    duration: "16 weeks",
    makeAdmin: true,
  },
];

// Team Chat Messages Data
export const mockMessages: Message[] = [
  // Team-123 messages
  {
    id: "msg-001",
    teamId: "team-123",
    userId: "user-001",
    text: "Hey everyone! Ready for today's React lesson?",
    timestamp: "2025-01-27T10:30:00Z",
  },
  {
    id: "msg-002",
    teamId: "team-123",
    userId: "user-002",
    text: "Yes! I finished the useState exercises last night. The concept is finally clicking!",
    timestamp: "2025-01-27T10:35:00Z",
  },
  {
    id: "msg-003",
    teamId: "team-123",
    userId: "user-003",
    text: "That's awesome! useState was tricky for me too at first.",
    timestamp: "2025-01-27T10:37:00Z",
    threadId: "msg-002",
  },
  {
    id: "msg-004",
    teamId: "team-123",
    userId: "user-004",
    text: "@question How do we handle multiple state updates in a single function?",
    timestamp: "2025-01-27T11:00:00Z",
    handle: "question",
  },
  {
    id: "msg-005",
    teamId: "team-123",
    userId: "user-001",
    text: "Great question! You can batch multiple setState calls. React will batch them automatically in event handlers.",
    timestamp: "2025-01-27T11:05:00Z",
    threadId: "msg-004",
  },
  {
    id: "msg-006",
    teamId: "team-123",
    userId: "user-002",
    text: "You can also use the functional update form: setState(prev => prev + 1). This ensures you're working with the latest state.",
    timestamp: "2025-01-27T11:07:00Z",
    threadId: "msg-004",
  },
  {
    id: "msg-007",
    teamId: "team-123",
    userId: "user-003",
    text: "Should we schedule a study session for useEffect tomorrow?",
    timestamp: "2025-01-27T11:15:00Z",
  },
  {
    id: "msg-008",
    teamId: "team-123",
    userId: "user-001",
    text: "@motivation Keep up the great work everyone! We're making excellent progress! 🚀",
    timestamp: "2025-01-27T14:30:00Z",
    handle: "motivation",
  },

  // Team-456 messages
  {
    id: "msg-101",
    teamId: "team-456",
    userId: "user-005",
    text: "Welcome to the Frontend Development team!",
    timestamp: "2025-01-26T09:00:00Z",
  },
  {
    id: "msg-102",
    teamId: "team-456",
    userId: "user-006",
    text: "@exercise Here's today's challenge: Build a responsive navbar with mobile menu",
    timestamp: "2025-01-26T10:00:00Z",
    handle: "exercise",
  },
  {
    id: "msg-103",
    teamId: "team-456",
    userId: "user-007",
    text: "I'll use flexbox for this!",
    timestamp: "2025-01-26T10:15:00Z",
    threadId: "msg-102",
  },
  {
    id: "msg-104",
    teamId: "team-456",
    userId: "user-008",
    text: "I'm going with CSS Grid. Let's compare our approaches later!",
    timestamp: "2025-01-26T10:20:00Z",
    threadId: "msg-102",
  },

  // Team-789 messages
  {
    id: "msg-201",
    teamId: "team-789",
    userId: "user-009",
    text: "@support Can someone help me understand closures?",
    timestamp: "2025-01-25T13:00:00Z",
    handle: "support",
  },
  {
    id: "msg-202",
    teamId: "team-789",
    userId: "user-010",
    text: "Sure! A closure is when a function remembers variables from its outer scope even after that scope has finished executing.",
    timestamp: "2025-01-25T13:10:00Z",
    threadId: "msg-201",
  },
  {
    id: "msg-203",
    teamId: "team-789",
    userId: "user-001",
    text: "Here's a practical example: function outer() { let count = 0; return function inner() { count++; return count; } }",
    timestamp: "2025-01-25T13:15:00Z",
    threadId: "msg-201",
  },
  // Ekky AI seed conversations
  {
    id: "msg-ekky-001",
    userId: "user-001",
    senderId: "user-001",
    receiverId: EKKY_AI_ID,
    text: "Can you explain useEffect?",
    timestamp: "2025-01-26T09:00:00Z",
  },
  {
    id: "msg-ekky-002",
    userId: EKKY_AI_ID,
    senderId: EKKY_AI_ID,
    receiverId: "user-001",
    text: "Certainly! useEffect is a hook that handles side effects in React components. It runs after every render by default, but you can control when it runs using a dependency array. For example, useEffect(() => { console.log('Component mounted'); }, []) runs only once after the initial render.",
    timestamp: "2025-01-26T09:00:15Z",
  },
  {
    id: "msg-ekky-003",
    userId: "user-003",
    senderId: "user-003",
    receiverId: EKKY_AI_ID,
    text: "Generate a color palette for a fintech app.",
    timestamp: "2025-01-26T14:30:00Z",
  },
  {
    id: "msg-ekky-004",
    userId: EKKY_AI_ID,
    senderId: EKKY_AI_ID,
    receiverId: "user-003",
    text: "Here is a professional palette based on Trust Blue:\n\nPrimary: #1E3A8A (Deep Trust Blue)\nSecondary: #10B981 (Success Green)\nAccent: #F59E0B (Warning Amber)\nNeutral: #64748B (Slate Gray)\nBackground: #F8FAFC (Light Gray)\n\nThis palette conveys trust, stability, and professionalism while maintaining visual interest.",
    timestamp: "2025-01-26T14:30:15Z",
  },
  {
    id: "msg-ekky-005",
    userId: "user-007",
    senderId: "user-007",
    receiverId: EKKY_AI_ID,
    text: "How do I center a div?",
    timestamp: "2025-01-27T11:00:00Z",
  },
  {
    id: "msg-ekky-006",
    userId: EKKY_AI_ID,
    senderId: EKKY_AI_ID,
    receiverId: "user-007",
    text: "You can use Flexbox to center a div:\n\n.container {\n  display: flex;\n  justify-content: center; /* horizontal */\n  align-items: center; /* vertical */\n  height: 100vh; /* full viewport height */\n}\n\nAlternatively, you can use CSS Grid:\n\n.container {\n  display: grid;\n  place-items: center;\n  height: 100vh;\n}",
    timestamp: "2025-01-27T11:00:15Z",
  },
];

// =====================================================
// NOTIFICATIONS
// =====================================================

export type NotificationType = 'TEAM_INVITE' | 'NEW_MESSAGE' | 'GOAL_COMPLETED' | 'BADGE_EARNED' | 'POINTS_EARNED';
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  level: NotificationLevel;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: {
    teamId?: string;
    senderId?: string;
    points?: number;
    badgeIcon?: string;
  };
}

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: 'user-001',
    type: 'POINTS_EARNED',
    level: 'success',
    title: 'Points Earned!',
    message: 'You earned 25 points for completing "Introduction to React Hooks"',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    metadata: {
      points: 25,
    },
  },
  {
    id: 'notif-002',
    userId: 'user-001',
    type: 'TEAM_INVITE',
    level: 'info',
    title: 'Team Invitation',
    message: 'Fernando invited you to join "React Masters"',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    link: '/inbox',
    metadata: {
      teamId: 'team-001',
      senderId: 'user-002',
    },
  },
  {
    id: 'notif-003',
    userId: 'user-001',
    type: 'BADGE_EARNED',
    level: 'success',
    title: 'New Badge Unlocked!',
    message: 'You earned the "First Steps" badge for completing your first unit',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    metadata: {
      badgeIcon: '🏆',
    },
  },
];
