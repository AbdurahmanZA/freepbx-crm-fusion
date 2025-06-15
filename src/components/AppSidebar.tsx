
import { Phone, Settings, User, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAMIContext } from "@/contexts/AMIContext";
import UnifiedDialer from "@/components/unified-dialer/UnifiedDialer";
import { ThemePicker } from "@/components/ThemePicker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppSidebarProps {
  onCallInitiated: (callData: {
    id: string;
    leadName: string;
    phone: string;
    duration: string;
    status: "connected" | "ringing" | "on-hold" | "ended";
    startTime: Date;
    leadId?: string;
  }) => void;
}

export function AppSidebar({ onCallInitiated }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { isConnected } = useAMIContext();

  const canManageUsers = user?.role === "Manager" || user?.role === "Administrator";

  const openUserManagement = () => {
    window.dispatchEvent(new Event("openUserManagement"));
  };

  return (
    <Sidebar className="w-80">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">JERICHO ONE</h1>
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
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dialer</SidebarGroupLabel>
          <SidebarGroupContent>
            <UnifiedDialer onCallInitiated={onCallInitiated} disabled={false} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-3">
              <ThemePicker />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {canManageUsers && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={openUserManagement}>
                    <Users className="h-4 w-4" />
                    <span>Manage Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name}</span>
              <Badge variant="outline" className="text-xs self-start">
                {user?.role}
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
