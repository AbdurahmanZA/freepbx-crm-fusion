
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import LeadManagement from "@/components/LeadManagement";
import CallCenter from "@/components/CallCenter";
import ContactManager from "@/components/ContactManager";
import UserManagement from "@/components/UserManagement";
import IntegrationSettings from "@/components/IntegrationSettings";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import SystemStatus from "@/components/SystemStatus";
import CallLogs from "@/components/CallLogs";
import DatabaseViewer from "@/components/DatabaseViewer";
import ConnectionTest from "@/components/ConnectionTest";
import UnifiedDialer from "@/components/unified-dialer/UnifiedDialer";
import KnowledgeBase from "@/components/knowledge-base/KnowledgeBase";
import CallbackCalendar from "@/components/callback-calendar/CallbackCalendar";
import SimpleEmailHistory from "@/components/email-history/SimpleEmailHistory";
import { ThemePicker } from "@/components/ThemePicker";

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("unified-dialer");

  const userRole = user?.role || "agent";

  const handleCallInitiated = (phoneNumber: string, contactName?: string) => {
    console.log(`Call initiated to ${phoneNumber}`, contactName ? `for ${contactName}` : '');
  };

  const handleTestComplete = (results: { freepbx: boolean; database: boolean }) => {
    console.log('Connection test completed:', results);
  };

  const tabs = [
    { id: "unified-dialer", label: "Unified Dialer", component: <UnifiedDialer onCallInitiated={handleCallInitiated} disabled={false} /> },
    { id: "leads", label: "Lead Management", component: <LeadManagement /> },
    { id: "call-center", label: "Call Center", component: <CallCenter userRole={userRole} /> },
    { id: "contacts", label: "Contact Manager", component: <ContactManager /> },
    { id: "callback-calendar", label: "Callback Calendar", component: <CallbackCalendar userRole={userRole} /> },
    { id: "email-history", label: "Email History", component: <SimpleEmailHistory /> },
    { id: "call-logs", label: "Call Logs", component: <CallLogs /> },
    { id: "reports", label: "Reports & Analytics", component: <ReportsAnalytics userRole={userRole} /> },
    { id: "knowledge-base", label: "Knowledge Base", component: <KnowledgeBase userRole={userRole} /> },
  ];

  // Admin-only tabs
  const adminTabs = [
    { id: "users", label: "User Management", component: <UserManagement /> },
    { id: "integrations", label: "Integration Settings", component: <IntegrationSettings /> },
    { id: "system", label: "System Status", component: <SystemStatus /> },
    { id: "database", label: "Database Viewer", component: <DatabaseViewer /> },
    { id: "connection", label: "Connection Test", component: <ConnectionTest onTestComplete={handleTestComplete} /> },
  ];

  const allTabs = userRole === "admin" ? [...tabs, ...adminTabs] : tabs;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">FreePBX CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name} ({userRole})
          </p>
        </div>
        <ThemePicker />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 xl:grid-cols-9 gap-1">
          {allTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-xs lg:text-sm whitespace-nowrap"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {allTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.component}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Index;
