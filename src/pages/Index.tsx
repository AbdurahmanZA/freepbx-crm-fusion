
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Phone, Target } from "lucide-react";
import CallCenter from "@/components/CallCenter";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import UserManagement from "@/components/UserManagement";
import LeadManagement from "@/components/LeadManagement";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import UnifiedDialerDrawer from "@/components/unified-dialer/UnifiedDialerDrawer";

// Simple Dashboard component
const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-green-600">+12% from last week</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold">856</p>
                <p className="text-xs text-green-600">+8% from last week</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">12.5%</p>
                <p className="text-xs text-red-600">-2% from last week</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">$45.2K</p>
                <p className="text-xs text-green-600">+18% from last week</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Simple Integrations component
const Integrations = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Integration settings and configurations will be shown here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Lead interface
interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
}

const Index: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dialerInitialData, setDialerInitialData] = useState<{
    phone?: string;
    name?: string;
    email?: string;
  }>({});

  useEffect(() => {
    const handleOpenUserManagement = () => {
      setActiveTab("user-management");
    };

    const handleOpenDialerForLead = (event: CustomEvent) => {
      setDialerInitialData({
        phone: event.detail.phone,
        name: event.detail.name,
        email: event.detail.email,
      });
    };

    window.addEventListener("openUserManagement", handleOpenUserManagement);
    window.addEventListener("openDialerForLead", handleOpenDialerForLead as EventListener);

    return () => {
      window.removeEventListener("openUserManagement", handleOpenUserManagement);
      window.removeEventListener("openDialerForLead", handleOpenDialerForLead as EventListener);
    };
  }, []);

  const handleCallInitiated = (callData: {
    id: string;
    leadName: string;
    phone: string;
    duration: string;
    status: "connected" | "ringing" | "on-hold" | "ended";
    startTime: Date;
    leadId?: string;
  }) => {
    // Find the lead by phone number
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    const lead = leads.find((l: Lead) => l.phone === callData.phone);

    // If lead is found, update the dialerInitialData
    if (lead) {
      setDialerInitialData({
        phone: lead.phone,
        name: lead.name,
        email: lead.email,
      });
    } else {
      // Clear the dialerInitialData if no lead is found
      setDialerInitialData({});
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onCallInitiated={handleCallInitiated} />
        <SidebarInset className="flex-1">
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="leads">Lead Management</TabsTrigger>
                <TabsTrigger value="call-center">Call Center</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                {(user?.role === "Manager" || user?.role === "Administrator") && (
                  <TabsTrigger value="user-management">User Management</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="dashboard" className="space-y-4">
                <Dashboard />
              </TabsContent>
              <TabsContent value="leads" className="space-y-4">
                <LeadManagement />
              </TabsContent>
              <TabsContent value="call-center" className="space-y-4">
                <CallCenter userRole={user?.role || "Agent"} />
              </TabsContent>
              <TabsContent value="reports" className="space-y-4">
                <ReportsAnalytics userRole={user?.role || "Agent"} />
              </TabsContent>
              <TabsContent value="integrations" className="space-y-4">
                <Integrations />
              </TabsContent>
              {(user?.role === "Manager" || user?.role === "Administrator") && (
                <TabsContent value="user-management" className="space-y-4">
                  <UserManagement />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Unified Dialer Drawer - always available */}
          <UnifiedDialerDrawer
            onCallInitiated={handleCallInitiated}
            initialData={dialerInitialData}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
