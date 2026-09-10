// Import icons for options that need them
import frontendIcon from "/lovable-uploads/056bacb1-ad28-4df1-adf5-e9a17fca27d6.png";
import backendIcon from "@/assets/icons/backend-development.png";
import dataScienceIcon from "@/assets/icons/data-science.png";
import javascriptIcon from "@/assets/icons/javascript.png";
import machineLearningIcon from "@/assets/icons/machine-learning.png";
import mobileDevIcon from "/lovable-uploads/18f082dc-eb0a-496a-94d9-9841ca873d7b.png";
import uiUxIcon from "@/assets/icons/ui-ux-design.png";
import projectMgmtIcon from "@/assets/icons/project-management.png";
import otherIcon from "@/assets/icons/other.png";
import newCareerIcon from "/lovable-uploads/53a534ab-903a-4b98-b085-5d4ea4dae22b.png";
import learnSkillsIcon from "/lovable-uploads/e5d41dd3-a81a-4fad-b790-29d1dc24d5ef.png";
import haveFunIcon from "/lovable-uploads/6d728354-253a-4b9e-a015-65dd2fdca3f6.png";
import changeCareersIcon from "/lovable-uploads/ca354335-31fb-4952-9eb5-f0d1406f0f5b.png";
import beginnerIcon from "/lovable-uploads/80a467a6-4bc3-456e-ac65-cbb2ac4db8cf.png";
import intermediateIcon from "/lovable-uploads/a9aca70c-59ae-4012-ba43-5895a8a15ef5.png";
import advancedIcon from "/lovable-uploads/2930d3bd-f5c3-4442-a6e2-bcd380e62aa2.png";
import videoCallsIcon from "/lovable-uploads/1652babb-bc02-419a-9252-5ae33c7d023f.png";
import voiceCallsIcon from "/lovable-uploads/094c8fbe-6cc9-4e42-a299-87f0c8e2de6b.png";
import textChatIcon from "/lovable-uploads/261d4494-f59f-4825-978b-38755b66baec.png";
import inPersonIcon from "/lovable-uploads/50d04db3-a08e-4176-aa21-4b96d94bc0fe.png";

// Request limits
export const MAX_FREE_REQUESTS = 10;

// Learning subjects with icons
export const SUBJECTS = [
  { name: "Front-end Development", icon: frontendIcon },
  { name: "Back-end Development", icon: backendIcon },
  { name: "Data Science", icon: dataScienceIcon },
  { name: "Machine Learning", icon: machineLearningIcon },
  { name: "UI/UX Design", icon: uiUxIcon },
  { name: "Other", icon: otherIcon },
];

// Learning goals with icons
export const GOALS = [
  { name: "Start a new career", icon: newCareerIcon },
  { name: "Learn new skills", icon: learnSkillsIcon },
  { name: "Have fun", icon: haveFunIcon },
  { name: "Change careers", icon: changeCareersIcon },
] as const;

// Skill levels with icons
export const LEVELS = [
  { name: "Beginner", icon: beginnerIcon },
  { name: "Intermediate", icon: intermediateIcon },
  { name: "Advanced", icon: advancedIcon },
];

// Communication methods with icons (for onboarding)
export const COMMUNICATION_OPTIONS = [
  { name: "Video calls", icon: videoCallsIcon },
  { name: "Voice calls", icon: voiceCallsIcon },
  { name: "Text chat", icon: textChatIcon },
  { name: "In-person", icon: inPersonIcon },
];

// Interest options (from BioSetupModal)
export const INTEREST_OPTIONS = [
  "Languages",
  "Travel",
  "Management",
  "Work",
  "Process",
  "Reading",
  "Courses",
  "Workshop",
  "Books",
  "History",
  "Volunteering",
  "Cooking",
  "Politics",
  "Philosophy",
  "Science",
  "Art",
  "Drawing",
  "Marketing",
  "Business",
  "AI",
  "Data Analysis",
  "Code",
  "Programming",
  "Design",
  "Technology",
  "Dancing in the rain",
];

// Schedule/Availability options (from BioSetupModal)
export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];
export const DAY_TYPES = ["Weekdays", "Weekend"];

// Available languages (used in team settings)
export const AVAILABLE_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Chinese",
  "Japanese",
  "Dutch",
  "Russian",
  "Romanian",
  "Korean",
  "Arabic",
  "Hindi",
];
