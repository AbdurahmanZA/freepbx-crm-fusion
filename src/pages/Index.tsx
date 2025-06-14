
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
import EmailTemplateCard from "@/components/integration/EmailTemplateCard"; // NEW IMPORT
import { FileText } from "lucide-react";

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

  // Email templates state (mirroring IntegrationSettings for consistency)
  const [emailTemplates, setEmailTemplates] = useState(() => {
    const saved = localStorage.getItem('email_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const updateEmailTemplates = (templates: any[]) => {
    setEmailTemplates(templates);
    localStorage.setItem('email_templates', JSON.stringify(templates));
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name}
        </h1>
        <p className="text-muted-foreground">
          Manage your leads, calls, and team performance from your dashboard.
        </p>
      </div>

      <div className="pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-8' : 'grid-cols-7'}`}>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="calls">Call Center</TabsTrigger>
            <TabsTrigger value="calendar">Callback Calendar</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="email-templates">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Email Templates
              </span>
            </TabsTrigger>
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
            <DatabaseManagementCard userRole={user.role} />
            <IntegrationSettings />
          </TabsContent>

          <TabsContent value="knowledge">
            <KnowledgeBase userRole={user.role} />
          </TabsContent>

          <TabsContent value="email-templates">
            <div className="max-w-4xl mx-auto">
              <EmailTemplateCard templates={emailTemplates} onTemplateUpdate={updateEmailTemplates} />
            </div>
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
      {/* Global Unified Dialer - stays at bottom across all tabs */}
      <UnifiedDialer disabled={false} onCallInitiated={() => {}} />
    </div>
  );
};

export default IndexPage;

