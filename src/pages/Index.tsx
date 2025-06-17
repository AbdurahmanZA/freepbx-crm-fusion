
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Phone, Target } from "lucide-react";
import CallCenter from "@/components/CallCenter";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import UserManagement from "@/components/UserManagement";
import LeadManagement from "@/components/LeadManagement";
import IntegrationSettings from "@/components/IntegrationSettings";
import { useAuth } from "@/contexts/AuthContext";
import UnifiedDialerDrawer from "@/components/unified-dialer/UnifiedDialerDrawer";

// Simple Dashboard component
const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold text-card-foreground">1,234</p>
                <p className="text-xs text-green-600">+12% from last week</p>
              </div>
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leads</p>
                <p className="text-2xl font-bold text-card-foreground">856</p>
                <p className="text-xs text-green-600">+8% from last week</p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-card-foreground">12.5%</p>
                <p className="text-xs text-red-600">-2% from last week</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-card-foreground">$45.2K</p>
                <p className="text-xs text-green-600">+18% from last week</p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>
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
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-muted border-border">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Lead Management</TabsTrigger>
            <TabsTrigger value="call-center" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Call Center</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reports</TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Integrations</TabsTrigger>
            {(user?.role === "Manager" || user?.role === "Administrator") && (
              <TabsTrigger value="user-management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">User Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 bg-background">
            <Dashboard />
          </TabsContent>
          <TabsContent value="leads" className="space-y-4 bg-background">
            <LeadManagement />
          </TabsContent>
          <TabsContent value="call-center" className="space-y-4 bg-background">
            <CallCenter userRole={user?.role || "Agent"} />
          </TabsContent>
          <TabsContent value="reports" className="space-y-4 bg-background">
            <ReportsAnalytics userRole={user?.role || "Agent"} />
          </TabsContent>
          <TabsContent value="integrations" className="space-y-4 bg-background">
            <IntegrationSettings />
          </TabsContent>
          {(user?.role === "Manager" || user?.role === "Administrator") && (
            <TabsContent value="user-management" className="space-y-4 bg-background">
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
    </div>
  );
};

export default Index;
