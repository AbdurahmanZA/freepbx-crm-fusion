
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

  const [showUnifiedDialer, setShowUnifiedDialer] = useState(false);

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

      {/* Floating Unified Dialer - compact floating menu */}
      <div className="fixed bottom-4 right-4 z-50">
        {/* Floating Toggle Button */}
        {!showUnifiedDialer && (
          <Button
            onClick={() => setShowUnifiedDialer(true)}
            className="rounded-full w-14 h-14 shadow-lg"
            size="icon"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </Button>
        )}

        {/* Expanded Dialer Panel */}
        {showUnifiedDialer && (
          <div className="bg-background border rounded-lg shadow-xl w-[400px] max-h-[600px] overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm">Unified Dialer</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnifiedDialer(false)}
                className="h-6 w-6 p-0"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            {/* Dialer Content */}
            <div className="p-3 space-y-4">
              <UnifiedDialer disabled={false} onCallInitiated={() => { }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPage;
