
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
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerMiniTab 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Phone, Mail, FileText } from "lucide-react";
import CallHistory from "@/components/call-center/CallHistory";

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCard, setDrawerCard] = useState<"dialer" | "email" | "callLogs">("dialer");

  const userRole = user?.role || "agent";

  const handleCallInitiated = (callData: {
    id: string;
    leadName: string;
    phone: string;
    duration: string;
    status: "connected" | "ringing" | "on-hold" | "ended";
    startTime: Date;
    leadId?: string;
  }) => {
    console.log(`Call initiated:`, callData);
  };

  const handleTestComplete = (results: { freepbx: boolean; database: boolean }) => {
    console.log('Connection test completed:', results);
  };

  // Close drawer when clicking on the main content
  const handleMainContentClick = () => {
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  };

  // Mock call history data
  const mockCallHistory = [
    {
      id: 1,
      leadName: "John Doe",
      phone: "+1234567890",
      duration: "3:45",
      outcome: "Qualified",
      timestamp: "2024-01-15 10:30 AM",
      hasRecording: true,
      notes: "Interested in premium package",
      agent: user?.name || "Agent"
    },
    {
      id: 2,
      leadName: "Jane Smith",
      phone: "+1987654321",
      duration: "2:15",
      outcome: "Callback Scheduled",
      timestamp: "2024-01-15 09:15 AM",
      hasRecording: false,
      notes: "Will call back on Friday",
      agent: user?.name || "Agent"
    }
  ];

  const tabs = [
    { id: "leads", label: "Lead Management", component: <LeadManagement /> },
    { id: "call-center", label: "Call Center", component: <CallCenter userRole={userRole} /> },
    { id: "contacts", label: "Contact Manager", component: <ContactManager /> },
    { id: "callback-calendar", label: "Callback Calendar", component: <CallbackCalendar userRole={userRole} /> },
    { id: "email-history", label: "Email History", component: <SimpleEmailHistory /> },
    { id: "call-logs", label: "Call Logs", component: <CallLogs /> },
    { id: "reports", label: "Reports & Analytics", component: <ReportsAnalytics userRole={userRole} /> },
    { id: "knowledge-base", label: "Knowledge Base", component: <KnowledgeBase userRole={userRole} /> },
    { id: "integrations", label: "Integration Settings", component: <IntegrationSettings /> },
  ];

  // Admin-only tabs
  const adminTabs = [
    { id: "users", label: "User Management", component: <UserManagement /> },
    { id: "system", label: "System Status", component: <SystemStatus /> },
    { id: "database", label: "Database Viewer", component: <DatabaseViewer /> },
    { id: "connection", label: "Connection Test", component: <ConnectionTest onTestComplete={handleTestComplete} /> },
  ];

  const allTabs = userRole === "admin" ? [...tabs, ...adminTabs] : tabs;

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="container mx-auto p-4 space-y-6"
        onClick={handleMainContentClick}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">FreePBX CRM Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name} ({userRole})
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 xl:grid-cols-9 gap-1">
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

      {/* Mini tab to open drawer when closed */}
      {!drawerOpen && (
        <DrawerMiniTab onClick={() => setDrawerOpen(true)} />
      )}

      {/* Bottom Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[400px]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">Quick Tools</DrawerTitle>
            
            {/* Card switcher buttons */}
            <div className="flex justify-center gap-2 mt-2">
              <Button
                size="sm"
                variant={drawerCard === "dialer" ? "default" : "outline"}
                onClick={() => setDrawerCard("dialer")}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Unified Dialer
              </Button>
              <Button
                size="sm"
                variant={drawerCard === "email" ? "default" : "outline"}
                onClick={() => setDrawerCard("email")}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                size="sm"
                variant={drawerCard === "callLogs" ? "default" : "outline"}
                onClick={() => setDrawerCard("callLogs")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Call Logs
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-4">
            {drawerCard === "dialer" && (
              <div className="max-w-md mx-auto">
                <UnifiedDialer onCallInitiated={handleCallInitiated} disabled={false} />
              </div>
            )}
            
            {drawerCard === "email" && (
              <div className="max-w-2xl mx-auto">
                <SimpleEmailHistory />
              </div>
            )}
            
            {drawerCard === "callLogs" && (
              <div className="max-w-4xl mx-auto">
                <CallHistory calls={mockCallHistory} />
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Index;
