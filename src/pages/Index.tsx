
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadManagement from "@/components/LeadManagement";
import CallbackCalendar from "@/components/callback-calendar/CallbackCalendar";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import IntegrationSettings from "@/components/IntegrationSettings";
import UserManagement from "@/components/UserManagement";
import KnowledgeBase from "@/components/knowledge-base/KnowledgeBase";
import UnifiedDialer from "@/components/unified-dialer/UnifiedDialer";
import CallHistory from "@/components/call-center/CallHistory";
import { callRecordsService, CallRecord } from "@/services/callRecordsService";
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
  Mail,
  Clock,
  Phone,
  ChevronUp,
  X as CloseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const IndexPage = () => {
  const { user } = useAuth();
  const { connect, isConnected } = useAMIContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leads");

  // BOTTOM BAR STATE: which tab is open? ("dialer" | "email" | "calls" | null)
  const [bottomBarTab, setBottomBarTab] = useState<null | "dialer" | "email" | "calls">(null);

  // Initial data to pass to dialer (if opened from lead, etc)
  const [dialerInitialData, setDialerInitialData] = useState<any>(null);

  // Call history state
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [callRecordsLoading, setCallRecordsLoading] = useState(false);

  useEffect(() => {
    console.log("IndexPage: Loading call records...");
    setCallRecordsLoading(true);
    try {
      // Initial fetch
      const records = callRecordsService.getRecords();
      console.log("IndexPage: Loaded call records:", records.length);
      setCallRecords(records);
      
      // Subscribe for updates
      const unsubscribe = callRecordsService.subscribe((records) => {
        console.log("IndexPage: Call records updated:", records.length);
        setCallRecords(records);
      });
      
      setCallRecordsLoading(false);
      return unsubscribe;
    } catch (error) {
      console.error("IndexPage: Error loading call records:", error);
      setCallRecordsLoading(false);
    }
  }, []);

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

  // Listen for dialer open requests from lead management
  useEffect(() => {
    const handleDialerRequest = (event: CustomEvent) => {
      if (event.detail?.autoOpenDrawer) {
        setDialerInitialData(event.detail); // Set data for the dialer
        setBottomBarTab("dialer");
        toast({
          title: "Dialer Opened",
          description: `Ready to call ${event.detail.contactName || 'contact'}`,
        });
      }
    };

    window.addEventListener('unifiedDialerCall', handleDialerRequest as EventListener);
    return () => window.removeEventListener('unifiedDialerCall', handleDialerRequest as EventListener);
  }, [toast]);

  const handleCallUpdate = (callData: {
    id: string; // from dialer
    leadName: string;
    phone: string;
    duration: string;
    status: "connected" | "ringing" | "on-hold" | "ended";
    startTime: Date;
    leadId?: string;
  }) => {
    const records = callRecordsService.getRecords();
    const existingRecord = records.find(r => r.dialerCallId === callData.id);

    const outcomeMap = {
      ringing: "Ringing",
      connected: "Answered",
      "on-hold": "On Hold",
      ended: "Ended",
    };

    if (existingRecord) {
      // Update existing record
      callRecordsService.updateRecord(existingRecord.id, {
        duration: callData.duration,
        outcome: outcomeMap[callData.status],
      });
    } else {
      // Add new record
      callRecordsService.addRecord({
        dialerCallId: callData.id,
        leadName: callData.leadName,
        phone: callData.phone,
        duration: callData.duration,
        outcome: outcomeMap[callData.status],
        timestamp: callData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: callData.startTime.toISOString().split('T')[0],
        hasRecording: false,
        notes: "Call initiated from dialer.",
        agent: user?.name || "Unknown",
        callType: 'outgoing',
        leadId: callData.leadId,
      });
    }
  };

  // Handle bottom bar tab clicks with proper state management
  const handleBottomBarTabClick = (tab: "dialer" | "email" | "calls") => {
    console.log("IndexPage: Bottom bar tab clicked:", tab);
    setBottomBarTab(tab);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    console.log("IndexPage: Closing drawer");
    setBottomBarTab(null);
  };

  // --- BOTTOM BAR DRAWER PANELS ---
  const renderDrawerPanel = () => {
    console.log("IndexPage: Rendering drawer panel for tab:", bottomBarTab);
    
    if (bottomBarTab === "dialer") {
      return (
        <div className="px-4 space-y-6 overflow-y-auto">
          <UnifiedDialer 
            disabled={false} 
            onCallInitiated={handleCallUpdate}
            initialData={dialerInitialData}
          />
        </div>
      );
    }
    if (bottomBarTab === "email") {
      return (
        <div className="px-4 py-3 space-y-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <EmailTemplateCard templates={emailTemplates} onTemplateUpdate={updateEmailTemplates} />
          </div>
        </div>
      );
    }
    if (bottomBarTab === "calls") {
      console.log("IndexPage: Rendering calls panel, loading:", callRecordsLoading, "records:", callRecords.length);
      return (
        <div className="px-4 py-3 space-y-6 overflow-y-auto">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {callRecordsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading calls...</p>
                </div>
              ) : (
                <CallHistory calls={callRecords.slice(0, 10)} />
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    // No tab open
    return null;
  };

  // --- END DRAWER PANELS ---

  return (
    <div className="space-y-8 pb-24">
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

      {/* --- BOTTOM BAR DRAWER --- */}
      <Drawer open={!!bottomBarTab} onOpenChange={(open) => {
        console.log("IndexPage: Drawer onOpenChange:", open);
        if (!open) {
          handleDrawerClose();
        }
      }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bottomBarTab === "dialer" && (
                  <>
                    <Phone className="h-5 w-5" />
                    Unified Dialer
                  </>
                )}
                {bottomBarTab === "email" && (
                  <>
                    <FileText className="h-5 w-5" />
                    Email Templates
                  </>
                )}
                {bottomBarTab === "calls" && (
                  <>
                    <Clock className="h-5 w-5" />
                    Recent Calls
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDrawerClose}
                className="h-6 w-6"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </DrawerTitle>
            <DrawerDescription>
              {bottomBarTab === "dialer" && "Make calls and manage contact information"}
              {bottomBarTab === "email" && "Create, preview and edit your email templates"}
              {bottomBarTab === "calls" && "View your most recent calls"}
            </DrawerDescription>
          </DrawerHeader>
          {renderDrawerPanel()}
        </DrawerContent>
      </Drawer>

      {/* --- FIXED BOTTOM BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-card border-t px-4 py-2 flex items-center justify-center shadow-lg">
          <div className="flex gap-2">
            {/* Dialer */}
            <Button
              size="icon"
              variant={bottomBarTab === "dialer" ? "default" : "ghost"}
              onClick={() => handleBottomBarTabClick("dialer")}
              className={cn("rounded-full", bottomBarTab === "dialer" ? "bg-primary text-primary-foreground" : "")}
              aria-label="Open Dialer"
            >
              <Phone className="h-5 w-5" />
            </Button>
            {/* Email Templates */}
            <Button
              size="icon"
              variant={bottomBarTab === "email" ? "default" : "ghost"}
              onClick={() => handleBottomBarTabClick("email")}
              className={cn("rounded-full", bottomBarTab === "email" ? "bg-primary text-primary-foreground" : "")}
              aria-label="Email Templates"
            >
              <FileText className="h-5 w-5" />
            </Button>
            {/* Recent Calls */}
            <Button
              size="icon"
              variant={bottomBarTab === "calls" ? "default" : "ghost"}
              onClick={() => handleBottomBarTabClick("calls")}
              className={cn("rounded-full", bottomBarTab === "calls" ? "bg-primary text-primary-foreground" : "")}
              aria-label="Recent Calls"
            >
              <Clock className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      {/* --- END BOTTOM BAR --- */}
    </div>
  );
};

export default IndexPage;
