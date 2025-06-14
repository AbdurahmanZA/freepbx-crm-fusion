
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadManagement from "@/components/LeadManagement";
import CallbackCalendar from "@/components/callback-calendar/CallbackCalendar";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import IntegrationSettings from "@/components/IntegrationSettings";
import UserManagement from "@/components/UserManagement";
import KnowledgeBase from "@/components/knowledge-base/KnowledgeBase";
import UnifiedDialer from "@/components/unified-dialer/UnifiedDialer";
import { useAuth } from "@/contexts/AuthContext";
import { useAMIContext } from "@/contexts/AMIContext";
import DatabaseManagementCard from "@/components/integration/DatabaseManagementCard";
import EmailTemplateCard from "@/components/integration/EmailTemplateCard";
import {
  FileText,
  Calendar,
  BarChart2,
  Settings as SettingsIcon,
  BookText,
  Users,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

const IndexPage = () => {
  const { user } = useAuth();
  const { connect, isConnected } = useAMIContext();
  const [activeTab, setActiveTab] = useState("leads");

  const [showUnifiedDialer, setShowUnifiedDialer] = useState(true);

  if (!user) return null;

  const canManageUsers = user.role === "Manager" || user.role === "Administrator";

  // Listen for request to open User Management from header
  useEffect(() => {
    const handler = () => setActiveTab("users");
    window.addEventListener("openUserManagement", handler);
    return () => window.removeEventListener("openUserManagement", handler);
  }, []);

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
          <TabsList className={`grid w-full gap-1 ${canManageUsers ? 'grid-cols-6' : 'grid-cols-5'} p-1`}>
            <TabsTrigger value="leads" className="flex-1 flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 shrink-0" />
              Callback Calendar
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 shrink-0" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex-1 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 shrink-0" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex-1 flex items-center gap-2">
              <BookText className="w-4 h-4 shrink-0" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="flex-1 flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              Email Templates
            </TabsTrigger>
            {canManageUsers && (
              // User Management tab removed - open via header button instead
              <TabsTrigger value="users" style={{ display: "none" }}>
                <Users className="w-4 h-4 shrink-0" />
                User Management
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="leads">
            <LeadManagement userRole={user.role} />
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
            <div className="max-w-4xl mx-auto px-1">
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

      {/* Global Unified Dialer - collapsible at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        {/* Collapse/Expand Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnifiedDialer(!showUnifiedDialer)}
            className="rounded-b-none border-b-0"
          >
            {showUnifiedDialer ? (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                Hide Dialer
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                Show Dialer
              </>
            )}
          </Button>
        </div>
        
        {/* Unified Dialer Content */}
        {showUnifiedDialer && (
          <div className="p-4">
            <UnifiedDialer disabled={false} onCallInitiated={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPage;

