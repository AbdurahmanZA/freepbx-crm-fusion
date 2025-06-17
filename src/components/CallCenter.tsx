
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { useAuth } from "@/contexts/AuthContext";
import { callRecordsService, CallRecord } from "@/services/callRecordsService";
import { simpleEmailService } from "@/services/simpleEmailService";
import CallHistory from "./call-center/CallHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallCenterProps {
  userRole: string;
}

interface EnhancedCallRecord extends CallRecord {
  emailCount?: number;
  lastEmailSent?: string;
  leadNotes?: string;
}

const CallCenter = ({ userRole }: CallCenterProps) => {
  const { user } = useAuth();
  const { isConnected, userExtension } = useAMIContext();
  const [callHistory, setCallHistory] = useState<EnhancedCallRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEnhancedCallHistory = () => {
    setLoading(true);
    try {
      const rawRecords = callRecordsService.getRecords().slice(0, 20);
      const emailLogs = simpleEmailService.getEmailLogs();
      const leads = JSON.parse(localStorage.getItem('leads') || '[]');

      const enhancedRecords: EnhancedCallRecord[] = rawRecords.map(record => {
        // Find matching lead
        const lead = leads.find((l: any) => 
          l.phone === record.phone || 
          l.name === record.leadName ||
          l.id === record.leadId
        );

        // Find emails sent to this contact
        const contactEmails = emailLogs.filter(email => 
          email.to === lead?.email || 
          email.leadId === lead?.id ||
          email.phone === record.phone
        );

        const lastEmail = contactEmails.length > 0 ? 
          contactEmails[0].dateSent : undefined;

        return {
          ...record,
          emailCount: contactEmails.length,
          lastEmailSent: lastEmail,
          leadNotes: lead?.notes || ''
        };
      });

      setCallHistory(enhancedRecords);
    } catch (error) {
      console.error('Error loading enhanced call history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to call records service and reload enhanced data
  useEffect(() => {
    const unsubscribe = callRecordsService.subscribe(() => {
      loadEnhancedCallHistory();
    });

    loadEnhancedCallHistory();
    return unsubscribe;
  }, []);

  // Display AMI connection status and user extension info
  useEffect(() => {
    if (user && userExtension) {
      console.log(`📞 [CallCenter] User ${user.name} assigned PJSIP extension: PJSIP/${userExtension}`);
      console.log(`🔗 [CallCenter] AMI Connection Status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    }
  }, [user, userExtension, isConnected]);

  return (
    <div className="space-y-6">
      {/* Compact Status Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium text-blue-900">
              Agent: {user?.name} | PJSIP/{userExtension}
            </span>
            <span className="ml-4 text-blue-700">
              AMI: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadEnhancedCallHistory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Call History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Activity & Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CallHistory calls={callHistory} showEnhancedInfo={true} />
        </CardContent>
      </Card>

      {/* Note: Unified dialer is now global and handled in Index.tsx */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
        <p>📞 Phone dialer is available at the bottom of the screen across all tabs</p>
      </div>
    </div>
  );
};

export default CallCenter;
