import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArrowRight, BookOpen, Clock, Copy, MoreVertical, Play, Star, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAllTeams, useUserTeams } from '@/hooks/useMockData';
import { useRoadmapPermissions } from '@/hooks/useRoadmapPermissions';
import { useCheckForExistingCopy } from '@/hooks/useCheckForExistingCopy';
import { RoadmapActionsDropdown } from '@/components/RoadmapActionsDropdown';
import { useProgressContext } from '@/contexts/ProgressContext';
import { toast } from "sonner";
import { useState } from "react";

interface CourseCardProps {
  course: any;
  variant: 'catalog' | 'active' | 'community';
  onAction?: (action: string, courseId: string) => void;
}

export const CourseCard = ({ course, variant, onAction }: CourseCardProps) => {
  const { user, hasActiveEntitlement } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { createActivation } = useProgressContext();
  
  // Get all teams and user's teams
  const teams = useAllTeams();
  const userTeams = useUserTeams(user?.id || '');

  // Helper function to get team name from normalized data
  const getTeamName = (ownerId: string) => {
    const team = teams.find(t => t.id === ownerId);
    return team?.name || 'Unknown Team';
  };

  const DescriptionWithReadMore = ({ description, className = "" }: { description: string, className?: string }) => {
    const shouldShowReadMore = description.length > 90;
    
    if (!shouldShowReadMore) {
      return <p className={className}>{description}</p>;
    }

    const displayText = isExpanded 
      ? description.slice(0, 150) + (description.length > 150 ? "..." : "")
      : description.slice(0, 90) + "...";

    return (
      <p className={className}>
        {displayText}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-primary hover:text-primary/80 ml-1 font-medium text-sm"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      </p>
    );
  };

  const handleCourseClick = (courseId: string) => {
    if (variant === 'active') {
      if (course.ownerType === 'TEAM') {
        navigate(`/team/${course.ownerId}/roadmap`);
      } else if (course.ownerType === 'THIRD_PARTY') {
        // Check if this third-party roadmap is being used by any of user's teams
        const teamUsingRoadmap = userTeams.find(team => team.currentRoadmapId === course.id);
        
        if (teamUsingRoadmap) {
          // Navigate to team view if a team is actively using this roadmap
          navigate(`/team/${teamUsingRoadmap.id}/roadmap`);
          return;
        }
        // Otherwise navigate to personal view
        navigate(`/roadmap/${courseId}`);
      } else {
        // Handle USER roadmaps
        navigate(`/roadmap/${courseId}`);
      }
    } else if (variant === 'community') {
      // Handle community roadmaps navigation
      navigate(`/roadmap/${courseId}`);
    }
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, course.id);
    }
  };

  const handleStartCourse = () => {
    if (!user) {
      toast.error("Please log in to start this course");
      return;
    }

    // Check if course is paid
    if (course.isPaid) {
      // Check if user has entitlement using AuthContext
      if (!hasActiveEntitlement(user.id, course.id.toString())) {
        toast.error("You need to purchase this course first");
        return;
      }
    }

    // Create activation
    console.log("🚀 Creating activation for course:", course.id);
    createActivation(user.id, course.id.toString());
    
    toast.success("Course started successfully!");
    
    // Trigger modal through parent callback
    if (onAction) {
      onAction('course-started', course.id);
    }
  };

  if (variant === 'catalog') {
    return (
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary">{course.level}</Badge>
            <Badge variant={course.price === 'Free' ? 'default' : 'secondary'}>
              {course.price}
            </Badge>
          </div>
          <CardTitle className="text-lg">{course.title}</CardTitle>
          <DescriptionWithReadMore description={course.description} className="text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3" />
              <span>{course.totalUnits} units</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{course.estimatedTime}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>{course.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{course.students}</span>
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-3">by {course.ownerName || 'Unknown Instructor'}</p>
            <Button 
              className="w-full" 
              variant={course.price === 'Premium' && !user?.isPremium ? 'outline' : 'default'}
              onClick={handleStartCourse}
            >
              {course.price === 'Premium' && !user?.isPremium ? 'Upgrade Required' : 'Start Course'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'community') {
    console.log("DEBUG: Checking permissions for Roadmap:", course.id, "User:", user);
    const permissions = useRoadmapPermissions({
      roadmap: course, 
      user: user ? {
        id: user.id,
        isAdmin: (user as any).isAdmin,
        isPremium: user.isPremium,
        hasActiveTeam: user.hasActiveTeam,
        teamId: (user as any).teamId
      } : null
    });

    const hasExistingCopy = useCheckForExistingCopy(user, course);
    const creatorName = course.ownerName || 'Unknown Creator';

    return (
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary">{course.level || 'Community'}</Badge>
            <TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <RoadmapActionsDropdown 
                  roadmap={course} 
                  permissions={permissions}
                  existingCopy={hasExistingCopy}
                  onAction={handleAction}
                />
              </DropdownMenu>
            </TooltipProvider>
          </div>
          <CardTitle className="text-lg">{course.title}</CardTitle>
          <DescriptionWithReadMore description={course.description} className="text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-3 w-3" />
              <span>{course.totalUnits || 0} units</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{course.estimatedTime || 'Self-paced'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>{course.rating || '4.5'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Copy className="h-3 w-3" />
              <span>{course.copies || 0} copies</span>
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-3">by {creatorName}</p>
            <Button className="w-full" onClick={() => handleCourseClick(course.id)}>
              Discover Roadmap
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'active') {
    console.log("DEBUG: Checking permissions for Roadmap:", course.id, "User:", user);
    const permissions = useRoadmapPermissions({
      roadmap: course, 
      user: user ? {
        id: user.id,
        isAdmin: (user as any).isAdmin,
        isPremium: user.isPremium,
        hasActiveTeam: user.hasActiveTeam,
        teamId: (user as any).teamId
      } : null
    });

    const hasExistingCopy = useCheckForExistingCopy(user, course);
    // Get owner display name using permissions hook
    const ownerDisplayName = permissions.ownershipLabel;

    return (
      <Card className="hover:shadow-md transition-shadow relative h-full flex flex-col">
        <CardHeader className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {ownerDisplayName}
            </Badge>
            <TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <RoadmapActionsDropdown 
                  roadmap={course} 
                  permissions={permissions}
                  existingCopy={hasExistingCopy}
                  onAction={handleAction}
                />
              </DropdownMenu>
            </TooltipProvider>
          </div>
          
          <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
          <DescriptionWithReadMore description={course.description} className="text-muted-foreground" />
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.completedUnits || 0}/{course.totalUnits || 0} units</span>
            </div>
            <span className="text-xs">
              Created {new Date(course.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{course.progress || 0}%</span>
            </div>
            <Progress value={course.progress || 0} className="h-2" />
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => handleCourseClick(course.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};