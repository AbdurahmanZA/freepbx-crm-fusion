import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/dashboard/Dashboard";
import LeadManagement from "@/components/lead-management/LeadManagement";
import CallCenter from "@/components/call-center/CallCenter";
import Reports from "@/components/reports/Reports";
import Integrations from "@/components/integrations/Integrations";
import UserManagement from "@/components/user-management/UserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import { Lead } from "@/types";
import UnifiedDialerDrawer from "@/components/unified-dialer/UnifiedDialerDrawer";

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

    window.addEventListener("openUserManagement", handleOpenUserManagement);

    return () => {
      window.removeEventListener("openUserManagement", handleOpenUserManagement);
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
        <AppSidebar />
        <SidebarInset>
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
                <LeadManagement setDialerInitialData={setDialerInitialData} />
              </TabsContent>
              <TabsContent value="call-center" className="space-y-4">
                <CallCenter setDialerInitialData={setDialerInitialData} />
              </TabsContent>
              <TabsContent value="reports" className="space-y-4">
                <Reports />
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
