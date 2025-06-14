
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
import EmailTemplateCard from "@/components/integration/EmailTemplateCard";
import { 
  FileText, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Users, 
  Phone, 
  Calendar, 
  BarChart2, 
  Settings as SettingsIcon,
  BookText 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const IndexPage = () => {
  const { user } = useAuth();
  const { connect, isConnected } = useAMIContext();
  const [activeTab, setActiveTab] = useState("leads");

  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [showUnifiedDialer, setShowUnifiedDialer] = useState(true);

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
          <TabsList className={`grid w-full gap-1 ${canManageUsers ? 'grid-cols-6' : 'grid-cols-5'} p-1`}>
            <TabsTrigger value="leads" className="flex-1 flex items-center gap-2">
              <Users className="w-4 h-4 shrink-0" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger value="calls" className="flex-1 flex items-center gap-2">
              <Phone className="w-4 h-4 shrink-0" />
              Call Center
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
            {canManageUsers && (
              <TabsTrigger value="users" className="flex-1 flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0" />
                User Management
              </TabsTrigger>
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
                <ChevronDown className="h-4 w-4 mr-1" />
                Hide Dialer
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
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

      {/* Floating Email Templates Button & Card - positioned to avoid dialer overlap */}
      <div>
        {/* Email Templates FAB: positioned higher to avoid unified dialer */}
        {!showEmailTemplates && (
          <button
            aria-label="Open Email Templates"
            className="fixed z-50 bottom-32 right-6 rounded-full shadow-lg bg-white border border-gray-300 hover:shadow-xl flex items-center gap-2 px-4 py-2 text-sm font-medium transition hover:bg-muted"
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
            className="fixed z-50 bottom-36 right-6 w-[90vw] max-w-4xl bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col"
            style={{ minHeight: "420px", maxHeight: "70vh" }}
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

