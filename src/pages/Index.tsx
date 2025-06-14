
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
import DiscordChat from "@/components/discord-chat/DiscordChat";
import { useAuth } from "@/contexts/AuthContext";
import { useAMIContext } from "@/contexts/AMIContext";
import DatabaseManagementCard from "@/components/integration/DatabaseManagementCard";
import EmailTemplateCard from "@/components/integration/EmailTemplateCard";
import { FileText, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const IndexPage = () => {
  const { user } = useAuth();
  const { connect, isConnected } = useAMIContext();
  const [activeTab, setActiveTab] = useState("leads");

  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [showDiscordChat, setShowDiscordChat] = useState(false);

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
          <TabsList className={`grid w-full ${canManageUsers ? 'grid-cols-6' : 'grid-cols-5'}`}>
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
            <DatabaseManagementCard userRole={user.role} />
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-4">
        <UnifiedDialer disabled={false} onCallInitiated={() => {}} />
      </div>

      {/* Floating Discord Chat Button & Card */}
      <div>
        {/* Discord Chat FAB: show only if not open */}
        {!showDiscordChat && (
          <button
            aria-label="Open Discord Chat"
            className="fixed z-50 bottom-24 left-6 rounded-full shadow-lg bg-white border border-gray-300 hover:shadow-xl flex items-center gap-2 px-4 py-2 text-sm font-medium transition hover:bg-muted"
            onClick={() => setShowDiscordChat(true)}
            style={{ boxShadow: "0px 2px 8px 1px rgba(0,0,0,0.10)" }}
          >
            <MessageCircle className="h-5 w-5 text-purple-600" />
            Discord Chat
          </button>
        )}

        {/* Floating Discord Chat Card */}
        {showDiscordChat && (
          <div className="fixed z-50 bottom-28 left-6">
            <DiscordChat
              isMinimized={false}
              onToggleMinimize={() => setShowDiscordChat(false)}
            />
          </div>
        )}
      </div>

      {/* Floating Email Templates Button & Card */}
      <div>
        {/* Email Templates FAB: show only if not open */}
        {!showEmailTemplates && (
          <button
            aria-label="Open Email Templates"
            className="fixed z-50 bottom-24 right-6 rounded-full shadow-lg bg-white border border-gray-300 hover:shadow-xl flex items-center gap-2 px-4 py-2 text-sm font-medium transition hover:bg-muted"
            onClick={() => setShowEmailTemplates(true)}
            style={{ boxShadow: "0px 2px 8px 1px rgba(0,0,0,0.10)" }}
          >
            <FileText className="h-5 w-5 text-blue-600" />
            Email Templates
          </button>
        )}

        {/* Floating Email Templates Card */}
        {showEmailTemplates && (
          <div
            className="fixed z-50 bottom-28 right-6 w-[90vw] max-w-4xl bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col"
            style={{ minHeight: "420px", maxHeight: "80vh" }}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2 font-semibold text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Email Templates
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowEmailTemplates(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-muted">
              <EmailTemplateCard templates={emailTemplates} onTemplateUpdate={updateEmailTemplates} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexPage;
