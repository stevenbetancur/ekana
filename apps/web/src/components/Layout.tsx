
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

import { Users, Home, Search, BookOpen, Crown, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { ScrollArea } from "@/components/ui/scroll-area";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Teams", path: "/teams" },
    { icon: Search, label: "Connect", path: "/connect" },
    { icon: BookOpen, label: "Courses", path: "/courses" },
    { icon: Crown, label: "Premium", path: "/premium" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Full-width top header */}
      <header className="bg-ekana-purple-dark shadow-sm z-10">
        <Header
          user={user}
          logout={logout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          navigationItems={navigationItems}
        />
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 bg-ekana-purple-light border-r border-ekana-purple-dark">
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1">
                <nav className="p-4 space-y-2">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? "default" : "ghost"}
                      className={`w-full justify-start text-ekana-white ${
                        location.pathname === item.path
                          ? "bg-ekana-purple-dark hover:bg-ekana-purple-dark/90"
                          : "hover:bg-ekana-purple-dark/50"
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-3 text-ekana-white" />
                      {item.label}
                      {item.label === "Premium" && !user?.isPremium && (
                        <Crown className="h-3 w-3 ml-auto text-ekana-orange-light" />
                      )}
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay and panel */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 z-50 w-64 h-full bg-ekana-purple-light border-r border-ekana-purple-dark lg:hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-end p-4 border-b border-ekana-purple-dark">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="text-ekana-white hover:bg-ekana-purple-dark"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <nav className="p-4 space-y-2">
                  {navigationItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location.pathname === item.path ? "default" : "ghost"}
                      className={`w-full justify-start text-ekana-white ${
                        location.pathname === item.path
                          ? "bg-ekana-purple-dark hover:bg-ekana-purple-dark/90"
                          : "hover:bg-ekana-purple-dark/50"
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-3 text-ekana-white" />
                      {item.label}
                      {item.label === "Premium" && !user?.isPremium && (
                        <Crown className="h-3 w-3 ml-auto text-ekana-orange-light" />
                      )}
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Layout;
