
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Users, Bell, BellOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAMIContext } from "@/contexts/AMIContext";
import { useState, useEffect } from "react";

const Header = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useAMIContext();
  const [notificationsMuted, setNotificationsMuted] = useState(false);

  useEffect(() => {
    const muted = localStorage.getItem('notifications_muted') === 'true';
    setNotificationsMuted(muted);
  }, []);

  const toggleNotifications = () => {
    const newMutedState = !notificationsMuted;
    setNotificationsMuted(newMutedState);
    localStorage.setItem('notifications_muted', newMutedState.toString());
  };

  if (!user) return null;

  const canManageUsers = user.role === "Manager" || user.role === "Administrator";

  // Fires event to open User Management tab in dashboard
  const openUserManagement = () => {
    window.dispatchEvent(new Event("openUserManagement"));
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">JERICHO ONE</h1>
            <Badge 
              className={`text-xs ${
                isConnected 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {isConnected ? 'AMI Connected' : 'AMI Disconnected'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotifications}
              className="flex items-center gap-2"
              title={notificationsMuted ? "Enable notifications" : "Disable notifications"}
            >
              {notificationsMuted ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant="outline" className="text-xs">
                {user.role}
              </Badge>
              {canManageUsers && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 ml-2"
                  onClick={openUserManagement}
                  title="User Management"
                >
                  <Users className="h-4 w-4" />
                  Manage Users
                </Button>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
