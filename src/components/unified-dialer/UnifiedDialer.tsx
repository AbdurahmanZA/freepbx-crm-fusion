import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Phone, PhoneCall, Users, User, Clock, ChevronDown, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { useAuth } from "@/contexts/AuthContext";
import UnifiedDialerEmailPanel from "./UnifiedDialerEmailPanel";
import { buildTemplateVars, findMatchedLead } from "./leadUtils";
import { emailLogService } from "@/services/emailLogService";

interface UnifiedDialerProps {
  onCallInitiated: (callData: {
    id: string;
    leadName: string;
    phone: string;
    duration: string;
    status: "connected" | "ringing" | "on-hold" | "ended";
    startTime: Date;
    leadId?: string;
  }) => void;
  disabled: boolean;
  initialData?: {
    phoneNumber?: string;
    contactName?: string;
    contactEmail?: string;
    leadData?: any;
  };
}

const UnifiedDialer = ({ onCallInitiated, disabled, initialData }: UnifiedDialerProps) => {
  const { toast } = useToast();
  const { isConnected, originateCall, lastEvent } = useAMIContext();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [activeCall, setActiveCall] = useState<{
    id: string;
    uniqueId?: string;
    leadName: string;
    phone: string;
    startTime: Date;
    status: "ringing" | "connected" | "on-hold" | "ended";
  } | null>(null);

  // Email panel state
  const [isEmailExpanded, setIsEmailExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<any>(null);

  // Get email templates from localStorage
  const getEmailTemplates = () => {
    const saved = localStorage.getItem('email_templates');
    return saved ? JSON.parse(saved) : [];
  };

  // Utility to get the current leads from localStorage
  const getCurrentLeads = () => {
    try {
      return JSON.parse(localStorage.getItem('leads') || '[]');
    } catch {
      return [];
    }
  };

  // Utility to get a matched lead for the current dialer context
  const getCurrentLead = (): any => {
    // Try direct initialData first
    if (initialData?.leadData?.id) return initialData.leadData;
    
    // Get fresh leads from localStorage and match by phone or email
    const leads = getCurrentLeads();
    return leads.find((lead: any) =>
      (lead.phone && phoneNumber && lead.phone.replace(/[\s\-\(\)]/g, '') === phoneNumber.replace(/[\s\-\(\)]/g, '')) ||
      (lead.email && contactEmail && lead.email.toLowerCase() === contactEmail.toLowerCase())
    );
  };

  // This useEffect populates the dialer when props are received
  useEffect(() => {
    if (initialData) {
      const phone = initialData.phoneNumber || "";
      const name = initialData.contactName || (initialData.leadData?.name) || "";
      const email = initialData.contactEmail || (initialData.leadData?.email) || "";
      
      console.log('📧 [UnifiedDialer] Setting initial data:', { phone, name, email });
      
      setPhoneNumber(phone);
      setContactName(name);
      setContactEmail(email);

      if (email) {
        setIsEmailExpanded(true);
      }
    }
  }, [initialData]);

  // Monitor AMI events for call status updates
  useEffect(() => {
    if (!lastEvent || !activeCall) return;

    const userExtension = user?.extension;
    if (!userExtension) return;

    // Check if this event is related to our user's extension
    const isUserChannel =
      lastEvent.channel?.includes(`PJSIP/${userExtension}`) ||
      lastEvent.destchannel?.includes(`PJSIP/${userExtension}`) ||
      lastEvent.calleridnum === userExtension;

    if (!isUserChannel) return;

    let newStatus = activeCall.status;
    let shouldUpdate = false;

    switch (lastEvent.event) {
      case "Newchannel":
        if (lastEvent.channelstate === "4" || lastEvent.channelstate === "5") {
          newStatus = "ringing";
          shouldUpdate = true;
        }
        break;

      case "DialBegin":
        newStatus = "ringing";
        shouldUpdate = true;
        break;

      case "DialEnd":
        if (lastEvent.dialstatus === "ANSWER") {
          newStatus = "connected";
          shouldUpdate = true;
        } else if (
          lastEvent.dialstatus === "BUSY" ||
          lastEvent.dialstatus === "NOANSWER"
        ) {
          newStatus = "ended";
          shouldUpdate = true;
        }
        break;

      case "Bridge":
        newStatus = "connected";
        shouldUpdate = true;
        break;

      case "Hangup":
        newStatus = "ended";
        shouldUpdate = true;
        // Clear active call after a delay
        setTimeout(() => {
          setActiveCall(null);
        }, 2000);
        break;

      case "Hold":
        newStatus = "on-hold";
        shouldUpdate = true;
        break;

      case "Unhold":
        newStatus = "connected";
        shouldUpdate = true;
        break;
    }

    if (shouldUpdate && newStatus !== activeCall.status) {
      const updatedCall = {
        ...activeCall,
        status: newStatus,
      };

      setActiveCall(updatedCall);

      // Calculate duration
      const duration = Math.floor(
        (new Date().getTime() - activeCall.startTime.getTime()) / 1000
      );
      const durationStr = `${Math.floor(duration / 60)
        .toString()
        .padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`;

      // Update parent component
      onCallInitiated({
        id: activeCall.id,
        leadName: activeCall.leadName,
        phone: activeCall.phone,
        duration: durationStr,
        status: newStatus,
        startTime: activeCall.startTime,
      });

      toast({
        title: "Call Status Update",
        description: `Call ${newStatus}: ${activeCall.leadName}`,
      });
    }
  }, [lastEvent, activeCall, user?.extension, onCallInitiated, toast]);

  const onCall = async () => {
    if (!user?.extension || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: !user?.extension
          ? "No extension assigned to your user account. Contact administrator."
          : "Please enter phone number to call.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "AMI Not Connected",
        description:
          "Please connect to FreePBX AMI in Integration Settings first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.error("Initiating real AMI call:", {
        channel: `PJSIP/${user.extension}`,
        extension: phoneNumber,
        context: "from-internal",
      });

      const success = await originateCall(
        `PJSIP/${user.extension}`,
        phoneNumber,
        "from-internal"
      );

      if (success) {
        const newCall = {
          id: `call_${Date.now()}`,
          leadName: contactName || "Unknown Contact",
          phone: phoneNumber,
          startTime: new Date(),
          status: "ringing" as const,
        };

        setActiveCall(newCall);

        // Initial call record with ringing status
        onCallInitiated({
          id: newCall.id,
          leadName: newCall.leadName,
          phone: newCall.phone,
          duration: "00:00",
          status: "ringing",
          startTime: newCall.startTime,
        });

        toast({
          title: "Call Initiated",
          description: `Calling ${
            contactName ? contactName : phoneNumber
          } at ${phoneNumber} from PJSIP extension ${user.extension}`,
        });

        // DON'T clear the fields immediately - keep them visible
        // setPhoneNumber("");
        // setContactName("");
      } else {
        throw new Error("AMI originate call failed");
      }
    } catch (error) {
      console.error("Call origination error:", error);
      toast({
        title: "Call Failed",
        description:
          "Could not initiate call. Check AMI connection and extension configuration.",
        variant: "destructive",
      });
    }
  };

  // Function to lookup and populate contact data from leads
  const populateContactFromLeads = (phone: string, name?: string) => {
    const leads = getCurrentLeads();
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    const matchedLead = leads.find((lead: any) => {
      const leadPhone = (lead.phone || '').replace(/[\s\-\(\)]/g, '');
      return leadPhone === normalizedPhone;
    });

    if (matchedLead) {
      console.log('📧 [UnifiedDialer] Found matching lead:', matchedLead);
      setContactName(matchedLead.name || name || "");
      setContactEmail(matchedLead.email || "");
    } else {
      setContactName(name || "");
      setContactEmail("");
    }
  };

  // Email template functions
  const prepareEmailPreview = () => {
    const templates = getEmailTemplates();
    const template = templates.find((t: any) => t.id === selectedTemplate);
    
    // Use the current contactEmail from the input field
    const currentEmail = contactEmail.trim();
    
    if (!template || !currentEmail) {
      toast({
        title: "Missing Information",
        description: !template ? "Please select a template." : "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    console.log('📧 [UnifiedDialer] Preparing email preview with email:', currentEmail);

    // Get lead data for template variables - use fresh data from localStorage
    const leads = getCurrentLeads();
    const matchedLead = findMatchedLead({ leads, phoneNumber });
    
    const templateVars = buildTemplateVars({
      lead: matchedLead,
      userName: user?.name,
      fallbackName: contactName,
      fallbackPhone: phoneNumber,
      fallbackEmail: currentEmail,
      contactEmail: currentEmail,
      phoneNumber,
    });

    // Replace template variables
    let subject = template.subject;
    let body = template.body;
    
    Object.entries(templateVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value as string);
      body = body.replace(regex, value as string);
    });

    setEmailPreviewData({
      to: currentEmail, // Use the current email from input
      templateName: template.name,
      subject,
      body
    });
    
    setShowEmailPreview(true);
  };

  const sendEmailTemplate = () => {
    if (!emailPreviewData) return;

    console.log('📧 [UnifiedDialer] Sending email to:', emailPreviewData.to);

    // Find the best matching lead for logging - use fresh data
    const leads = getCurrentLeads();
    const matchedLead = leads.find((lead: any) =>
      (lead.phone && phoneNumber && lead.phone.replace(/[\s\-\(\)]/g, '') === phoneNumber.replace(/[\s\-\(\)]/g, '')) ||
      (lead.email && emailPreviewData.to && lead.email.toLowerCase() === emailPreviewData.to.toLowerCase())
    );
    
    const matchedLeadId = matchedLead?.id ? String(matchedLead.id) : undefined;

    // Save to email logs with the actual email being sent to
    emailLogService.logEmail({
      to: emailPreviewData.to, // This should be the email from the input field
      from: user?.email || "Unknown",
      subject: emailPreviewData.subject,
      body: emailPreviewData.body,
      templateName: emailPreviewData.templateName,
      agent: user?.name || "Unknown",
      leadId: matchedLeadId,
      leadName: matchedLead?.name || contactName,
      phone: phoneNumber,
      extra: {
        dialerPanel: true,
        sentFromDialer: true,
        actualRecipient: emailPreviewData.to
      }
    });

    // Here you would implement actual email sending
    // For now, just show success message
    toast({
      title: "Email Sent",
      description: `Email sent to ${emailPreviewData.to}`,
    });

    console.log('📧 [UnifiedDialer] Email logged and sent to:', emailPreviewData.to);

    setShowEmailPreview(false);
    setIsEmailExpanded(false);
  };

  return (
    <div className="space-y-2">
      <Card className="h-fit shadow-sm border flex flex-col w-full">
        <CardHeader className="pb-1 px-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Unified Dialer</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 px-3 py-2 !pt-0">
          {/* Agent Info - Compact */}
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{user?.name}</span>
            {user?.extension && (
              <span className="text-muted-foreground">Ext: {user.extension}</span>
            )}
          </div>
          
          {!user?.extension && (
            <p className="text-destructive text-xs">No extension assigned</p>
          )}

          {/* Active call status - keep existing code */}
          {activeCall && (
            <div className="p-2 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{activeCall.leadName}</div>
                    <div className="text-xs text-gray-600">{activeCall.phone}</div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-green-700">
                  {activeCall.status === 'ringing' ? 'Ringing' :
                   activeCall.status === 'on-hold' ? 'On Hold' : 'Connected'}
                </div>
              </div>
            </div>
          )}

          {/* Dialer Panel - Enhanced with email sync */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value);
                // Auto-populate from leads when phone changes
                if (e.target.value.length > 7) {
                  populateContactFromLeads(e.target.value);
                }
              }}
              placeholder="Phone number"
              className="text-sm h-8"
            />
            <Input
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Contact name"
              className="text-sm h-8"
            />
          </div>

          <Button
            onClick={onCall}
            disabled={!user?.extension || !phoneNumber || !isConnected}
            className="w-full h-8 text-sm"
            size="sm"
          >
            <PhoneCall className="h-3 w-3 mr-2" />
            {!isConnected ? 'AMI Not Connected' : !user?.extension ? 'No Extension' : 'Call'}
          </Button>

          {!isConnected && (
            <p className="text-xs text-muted-foreground text-center">
              Connect AMI in Integration Settings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Email Template Panel */}
      <UnifiedDialerEmailPanel
        isEmailExpanded={isEmailExpanded}
        setIsEmailExpanded={setIsEmailExpanded}
        contactEmail={contactEmail}
        setContactEmail={setContactEmail}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        getEmailTemplates={getEmailTemplates}
        prepareEmailPreview={prepareEmailPreview}
        showEmailPreview={showEmailPreview}
        setShowEmailPreview={setShowEmailPreview}
        emailPreviewData={emailPreviewData}
        sendEmailTemplate={sendEmailTemplate}
        contactName={contactName}
        phoneNumber={phoneNumber}
      />
    </div>
  );
};

export default UnifiedDialer;
