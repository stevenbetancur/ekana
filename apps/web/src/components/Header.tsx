import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Settings, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import NotificationDropdown from "./NotificationDropdown";

interface HeaderProps {
  user: any;
  logout: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  navigationItems: Array<{
    icon: any;
    label: string;
    path: string;
  }>;
}

const Header = ({ user, logout, setSidebarOpen }: HeaderProps) => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-full px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between">
      {/* Left side - Logo and mobile menu */}
      <div className="flex items-center space-x-3">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSidebarOpen?.(true)}
          className="lg:hidden text-ekana-white hover:bg-ekana-purple-light"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo */}
        <img 
          src="/lovable-uploads/fe7a9ac3-0671-468a-9300-47562a79f0b9.png" 
          alt="Ekana Logo" 
          className="w-[153px] h-auto"
        />
      </div>

      {/* Right side - Notifications, Messages, User */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Notifications */}
        <NotificationDropdown />

        {/* Messages */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-ekana-white hover:bg-ekana-purple-light"
          onClick={() => navigate('/inbox')}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* User dropdown - desktop only */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 text-ekana-white hover:bg-ekana-purple-light">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-ekana-white text-ekana-purple-dark">{profile.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="hidden md:block">{profile.name}</span>
              {user?.isPremium && <Badge variant="secondary" className="bg-ekana-orange-light text-ekana-white">Premium</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Header;