import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadManagement from "@/components/LeadManagement";
import CallCenter from "@/components/CallCenter";
import CallbackCalendar from "@/components/callback-calendar/CallbackCalendar";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import IntegrationSettings from "@/components/IntegrationSettings";
import UserManagement from "@/components/UserManagement";
import KnowledgeBase from "@/components/knowledge-base/KnowledgeBase";
import UnifiedDialer from "@/components/unified-dialer/UnifiedDialer";
import { useAuth } from "@/contexts/AuthContext";
import { useAMIContext } from "@/contexts/AMIContext";
import DatabaseManagementCard from "@/components/integration/DatabaseManagementCard";

const IndexPage = () => {
  const { user } = useAuth();
  const { connect, isConnected } = useAMIContext();
  const [activeTab, setActiveTab] = useState("leads");

  if (!user) return null;

  const canManageUsers = user.role === "Manager" || user.role === "Administrator";

  // Auto-connect to AMI Bridge on login
  useEffect(() => {
    if (user && !isConnected) {
      console.log('Auto-connecting to AMI Bridge on login...');
      connect();
    }
  }, [user, isConnected, connect]);

  const handleLeadCreated = (leadData: { name: string; phone: string; notes: string }) => {
    console.log('New lead created from call:', leadData);
  };

  return (
    <div className="space-y-8">
      {/* --- Database Management always at the top of the dashboard --- */}
      <DatabaseManagementCard />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name}
        </h1>
        <p className="text-muted-foreground">
          Manage your leads, calls, and team performance from your dashboard.
        </p>
      </div>

      <div className="pb-32"> {/* Add padding for fixed dialer */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="calls">Call Center</TabsTrigger>
            <TabsTrigger value="calendar">Callback Calendar</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="users">User Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="leads">
            <LeadManagement userRole={user.role} />
          </TabsContent>

          <TabsContent value="calls">
            <CallCenter userRole={user.role} />
          </TabsContent>

          <TabsContent value="calendar">
            <CallbackCalendar userRole={user.role} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsAnalytics userRole={user.role} />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationSettings />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeBase userRole={user.role} />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Global Unified Dialer - stays at bottom across all tabs */}
      <UnifiedDialer onLeadCreated={handleLeadCreated} />
    </div>
  );
};

export default IndexPage;
