import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DialerPanel from "./DialerPanel";
import ActiveCallDisplay from "./ActiveCallDisplay";
import CallActivityPanel from "./CallActivityPanel";
import UnifiedDialerEmailPanel from "./UnifiedDialerEmailPanel";
import { findMatchedLead, buildTemplateVars, Lead } from "./leadUtils";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { useAuth } from "@/contexts/AuthContext";
import { callRecordsService } from "@/services/callRecordsService";
import DiscordChat from "@/components/discord-chat/DiscordChat";
import {
  Phone,
  MessageCircle,
  Activity,
  Maximize2,
  Minimize2,
  Mail,
  X,
  Send,
} from "lucide-react";

interface ActiveCall {
  id: string;
  leadName: string;
  phone: string;
  duration: string;
  status: 'connected' | 'ringing' | 'on-hold';
  startTime: Date;
  leadId?: string;
}

interface UnifiedDialerProps {
  onLeadCreated?: (leadData: { name: string; phone: string; notes: string }) => void;
}

const UnifiedDialer = ({ onLeadCreated }: UnifiedDialerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isConnected, originateCall, callEvents } = useAMIContext();
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const [isEmailExpanded, setIsEmailExpanded] = useState(false);
  const [showCallActivity, setShowCallActivity] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailPreviewData, setEmailPreviewData] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  // Get email templates from localStorage with proper parsing
  const getEmailTemplates = () => {
    try {
      const templates = localStorage.getItem('email_templates');
      console.log('📧 [UnifiedDialer] Raw templates from localStorage:', templates);
      
      if (!templates) {
        console.log('📧 [UnifiedDialer] No templates found in localStorage');
        return [];
      }
      
      const parsed = JSON.parse(templates);
      console.log('📧 [UnifiedDialer] Parsed templates:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('📧 [UnifiedDialer] Error parsing email templates:', error);
      return [];
    }
  };

  // Enhanced listener for calls from anywhere in the app
  useEffect(() => {
    const handleUnifiedDialerCall = async (event: CustomEvent) => {
      const callData = event.detail;
      console.log('📞 [UnifiedDialer] Received call request:', callData);
      
      // Expand dialer when call is requested
      setIsMinimized(false);
      
      // Populate dialer fields from the incoming call data
      const targetPhone = callData.phone || callData.phoneNumber || '';
      const targetName = callData.name || callData.leadName || callData.contactName || 'Unknown Contact';
      
      setPhoneNumber(targetPhone);
      setContactName(targetName);
      
      // Show notification
      toast({
        title: "Call Request Received",
        description: `Preparing to call ${targetName}`,
      });
      
      // Auto-initiate call immediately with enhanced logging
      console.log('📞 [UnifiedDialer] Auto-initiating call with data:', {
        phone: targetPhone,
        name: targetName,
        leadId: callData.leadId || callData.id,
        source: callData.source || 'unknown'
      });
      
      await performCall(
        targetPhone, 
        targetName, 
        callData.leadId || callData.id
      );
    };

    // Listen for multiple event types for better compatibility
    const eventTypes = ['unifiedDialerCall', 'initiateCall', 'dialLead', 'callLead'];
    
    eventTypes.forEach(eventType => {
      console.log(`📞 [UnifiedDialer] Registering listener for: ${eventType}`);
      window.addEventListener(eventType, handleUnifiedDialerCall as EventListener);
    });

    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handleUnifiedDialerCall as EventListener);
      });
    };
  }, [toast]);

  // Real-time call timer - starts immediately when call begins
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeCall && callStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const newDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        console.log('📞 [UnifiedDialer] Updating call duration:', newDuration);
        
        setActiveCall(prev => prev ? {
          ...prev,
          duration: newDuration
        } : null);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeCall, callStartTime]);

  // Listen for real AMI call events
  useEffect(() => {
    if (callEvents.length > 0 && activeCall) {
      const latestEvent = callEvents[0];
      console.log('📞 [UnifiedDialer] Processing AMI event:', latestEvent);
      
      // Check if this event relates to our user's extension
      const userExtension = user?.extension;
      const isUserChannel = userExtension && (
        latestEvent.channel?.includes(`PJSIP/${userExtension}`) ||
        latestEvent.destchannel?.includes(`PJSIP/${userExtension}`) ||
        latestEvent.calleridnum === userExtension
      );

      if (!isUserChannel) {
        console.log('📞 [UnifiedDialer] Event not for our extension, ignoring');
        return;
      }
      
      // Handle hangup events to end active calls
      if (latestEvent.event === 'Hangup') {
        console.log('📞 [UnifiedDialer] Call hangup detected, ending call');
        endCall();
      }
      
      // Handle call answer events - switch to connected status
      if (latestEvent.event === 'DialEnd' && latestEvent.dialstatus === 'ANSWER') {
        console.log('📞 [UnifiedDialer] Call answered, switching to connected');
        setActiveCall(prev => prev ? { 
          ...prev, 
          status: 'connected'
        } : null);
        
        toast({
          title: "Call Connected",
          description: `Connected to ${activeCall.leadName}`,
        });
      }

      // Handle call failure events
      if (latestEvent.event === 'DialEnd' && 
          (latestEvent.dialstatus === 'BUSY' || 
           latestEvent.dialstatus === 'NOANSWER' || 
           latestEvent.dialstatus === 'CONGESTION')) {
        console.log('📞 [UnifiedDialer] Call failed:', latestEvent.dialstatus);
        endCall();
      }
    }
  }, [callEvents, activeCall, user?.extension]);

  const createLeadFromManualCall = (phone: string, name: string) => {
    const newLead = {
      name: name || 'Unknown Contact',
      phone: phone,
      notes: `Manual call initiated from UnifiedDialer on ${new Date().toLocaleString()}`
    };

    // Always dispatch custom event to notify LeadManagement component
    const event = new CustomEvent('newLeadCreated', { detail: newLead });
    window.dispatchEvent(event);

    console.log('📞 [UnifiedDialer] Created lead from manual call:', newLead);

    // Also call the optional callback if provided
    if (onLeadCreated) {
      onLeadCreated(newLead);
    }

    toast({
      title: "Lead Created",
      description: `New lead created for ${newLead.name}`,
    });

    return newLead;
  };

  const performCall = async (phone: string, name: string, leadId?: string) => {
    if (!user?.extension || !phone) {
      toast({
        title: "Missing Information",
        description: !user?.extension 
          ? "No extension assigned. Contact administrator."
          : "Please enter phone number to call.",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "AMI Not Connected",
        description: "Please connect to FreePBX AMI in Integration Settings first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Use exact PJSIP format confirmed from your FreePBX output
      const channelFormat = `PJSIP/${user.extension}`;
      const dialContext = 'from-internal';
      
      console.log('📞 [UnifiedDialer] Initiating call with verified format:', {
        channel: channelFormat,
        extension: phone,
        context: dialContext,
        userExtension: user.extension,
        targetPhone: phone,
        contactName: name,
        leadId: leadId
      });

      const success = await originateCall(
        channelFormat,
        phone,
        dialContext
      );

      if (success) {
        const startTime = new Date();
        const newCall: ActiveCall = {
          id: `call_${Date.now()}`,
          leadName: name || 'Unknown Contact',
          phone: phone,
          duration: '00:00',
          status: 'ringing',
          startTime: startTime,
          leadId: leadId
        };

        console.log('📞 [UnifiedDialer] ✅ Call initiated successfully, starting timer');
        setActiveCall(newCall);
        setCallStartTime(startTime);
        setIsMinimized(false);
        
        toast({
          title: "Call Initiated",
          description: `Calling ${newCall.leadName} from PJSIP/${user.extension}`,
        });

        // Create lead for ALL manual calls (when no leadId is provided)
        if (!leadId) {
          createLeadFromManualCall(phone, name || 'Unknown Contact');
        }
      } else {
        throw new Error('AMI originate call was rejected by Asterisk');
      }
    } catch (error) {
      console.error('❌ [UnifiedDialer] Call origination error:', error);
      toast({
        title: "Call Failed",
        description: `Could not initiate call: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const initiateCall = async () => {
    await performCall(phoneNumber, contactName);
  };

  const sendDiscordEmailNotification = async (emailData: any) => {
    try {
      const webhookUrl = localStorage.getItem('discord_webhook_url');
      if (!webhookUrl) return;

      const currentUser = user?.name || localStorage.getItem('current_user') || 'Unknown User';
      const timestamp = new Date().toLocaleString();

      const discordPayload = {
        embeds: [{
          title: "📧 Email Sent from CRM",
          color: 0x0099ff,
          fields: [
            { name: "👤 Sent by", value: currentUser, inline: true },
            { name: "📧 To", value: emailData.to, inline: true },
            { name: "📋 Template", value: emailData.templateName, inline: true },
            { name: "📄 Subject", value: emailData.subject, inline: false },
            { name: "👤 Contact", value: emailData.contactName || 'Unknown', inline: true },
            { name: "📞 Phone", value: emailData.phone || 'N/A', inline: true },
            { name: "🕒 Sent at", value: timestamp, inline: false }
          ],
          footer: { text: "CRM Email System" }
        }]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });

      console.log('📧 Discord notification sent for email');
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  };

  // --- Simulated leads array (same as before, consider using a prop or context for real data) ---
  const allLeads: Lead[] = [
    {
      id: "1",
      name: "John Smith",
      company: "Acme Corp",
      phone: "+1-555-0123",
      email: "john@acme.com",
      status: "new",
      priority: "high",
      source: "Website",
      assignedAgent: "Sarah Wilson",
      lastContact: "Never",
      notes: "Interested in enterprise solution"
    },
    {
      id: "2",
      name: "Sarah Johnson",
      company: "Tech Solutions",
      phone: "+1-555-0456",
      email: "sarah@techsol.com",
      status: "contacted",
      priority: "medium",
      source: "Referral",
      assignedAgent: "Mike Davis",
      lastContact: "2024-06-09",
      notes: "Requested callback for pricing"
    },
    // ... You can add more sample leads, or ideally, fetch from a shared source
  ];
  // ---

  // --- Helper for matching lead moved to leadUtils.ts ---
  // function findMatchedLead ...
  // use: findMatchedLead({ leads: allLeads, phoneNumber, leadId: ... })

  const prepareEmailPreview = () => {
    if (!contactEmail || !selectedTemplate) {
      toast({
        title: "Missing Information",
        description: "Please enter email address and select a template.",
        variant: "destructive"
      });
      return;
    }

    try {
      const templates = getEmailTemplates();
      const template = templates.find((t: any) => t.id === selectedTemplate);

      if (!template) {
        toast({
          title: "Template Not Found",
          description: "Selected email template could not be found.",
          variant: "destructive"
        });
        return;
      }

      // Get matched lead for enhanced variable filling
      const matchedLead = findMatchedLead({ leads: allLeads, phoneNumber, leadId: emailPreviewData?.leadId });
      const templateVars = buildTemplateVars({
        lead: matchedLead,
        userName: user?.name,
        fallbackName: contactName,
        fallbackPhone: phoneNumber,
        fallbackEmail: contactEmail,
        fallbackCompany: localStorage.getItem('smtp_from_name') || undefined,
        contactEmail,
        phoneNumber
      });

      // Replace all template variables in subject/body
      let subject = template.subject;
      let body = template.body;
      Object.entries(templateVars).forEach(([key, value]) => {
        const reg = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        subject = subject.replace(reg, value as string);
        body = body.replace(reg, value as string);
      });

      setEmailPreviewData({
        to: templateVars.email,
        subject,
        body,
        templateName: template.name,
        contactName: templateVars.customerName,
        phone: templateVars.phone,
        leadId: matchedLead?.id,
      });

      setShowEmailPreview(true);
    } catch (error) {
      console.error('Email preview error:', error);
      toast({
        title: "Preview Failed",
        description: "Could not generate email preview.",
        variant: "destructive"
      });
    }
  };

  const sendEmailTemplate = async () => {
    if (!emailPreviewData) return;

    const smtpEnabled = localStorage.getItem('smtp_enabled') === 'true';
    const smtpHost = localStorage.getItem('smtp_host');
    const smtpUsername = localStorage.getItem('smtp_username');

    if (!smtpEnabled || !smtpHost || !smtpUsername) {
      toast({
        title: "SMTP Not Configured",
        description: "Please configure SMTP settings in Integration Settings first.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('📧 [UnifiedDialer] Sending email:', emailPreviewData);

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send Discord notification
      await sendDiscordEmailNotification(emailPreviewData);

      toast({
        title: "Email Sent",
        description: `${emailPreviewData.templateName} sent to ${emailPreviewData.to}`,
      });

      // Clear email fields and close preview
      setContactEmail('');
      setSelectedTemplate('');
      setShowEmailPreview(false);
      setEmailPreviewData(null);

    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: "Email Failed",
        description: "Could not send email. Please check your SMTP configuration.",
        variant: "destructive"
      });
    }
  };

  const endCall = async () => {
    if (!activeCall) return;

    try {
      // Record the call with final duration
      const currentUser = localStorage.getItem('current_user') || 'Unknown Agent';
      callRecordsService.addRecord({
        leadName: activeCall.leadName,
        phone: activeCall.phone,
        duration: activeCall.duration,
        outcome: 'Call Completed',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        hasRecording: isRecording,
        notes: 'Call ended by user',
        agent: currentUser,
        callType: 'outgoing',
        leadId: activeCall.leadId
      });

      console.log('📞 [UnifiedDialer] Call ended, final duration:', activeCall.duration);

      setActiveCall(null);
      setCallStartTime(null);
      setIsRecording(false);
      setIsMuted(false);
      setPhoneNumber('');
      setContactName('');
      
      toast({
        title: "Call Ended",
        description: `Call with ${activeCall.leadName} ended. Duration: ${activeCall.duration}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end call properly",
        variant: "destructive"
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Microphone active" : "Microphone muted",
    });
  };

  const holdCall = () => {
    if (activeCall) {
      const newStatus = activeCall.status === 'on-hold' ? 'connected' : 'on-hold';
      setActiveCall({ ...activeCall, status: newStatus });
      toast({
        title: newStatus === 'on-hold' ? "Call On Hold" : "Call Resumed",
        description: newStatus === 'on-hold' ? "Call placed on hold" : "Call resumed",
      });
    }
  };

  const getEventStatusColor = (event: any) => {
    switch (event.event) {
      case 'Newchannel': return 'bg-blue-100 text-blue-800';
      case 'Hangup': return 'bg-red-100 text-red-800';
      case 'DialBegin': return 'bg-yellow-100 text-yellow-800';
      case 'DialEnd': return event.dialstatus === 'ANSWER' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      case 'Bridge': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isMinimized && !activeCall && isChatMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setIsChatMinimized(false)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
      isMinimized && isChatMinimized ? 'translate-y-full' : 'translate-y-0'
    }`}>
      <div className="flex justify-between items-end p-4 gap-4">
        {/* Phone Dialer */}
        <Card className={`flex-1 max-w-3xl rounded-t-lg border-b-0 shadow-lg ${isMinimized ? 'hidden' : ''}`}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Phone</span>
                {user?.extension && (
                  <Badge variant="outline" className="text-xs">
                    Ext: {user.extension}
                  </Badge>
                )}
                {isConnected ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">Connected</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Disconnected</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showCallActivity ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowCallActivity(!showCallActivity)}
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Activity
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatMinimized(!isChatMinimized)}
                >
                  Chat {isChatMinimized ? <Maximize2 className="h-3 w-3 ml-1" /> : <Minimize2 className="h-3 w-3 ml-1" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Call Activity Section (refactored) */}
            <CallActivityPanel
              show={showCallActivity}
              onToggle={() => setShowCallActivity(!showCallActivity)}
              callEvents={callEvents}
              isConnected={isConnected}
            />

            {/* Active Call Display (refactored) */}
            {activeCall && (
              <ActiveCallDisplay
                activeCall={activeCall}
                isMuted={isMuted}
                onMute={toggleMute}
                onHold={holdCall}
                onHangup={endCall}
              />
            )}

            {/* Dialer Interface and Email Panel (refactored) */}
            {!activeCall && (
              <div className="space-y-4">
                <DialerPanel
                  phoneNumber={phoneNumber}
                  setPhoneNumber={setPhoneNumber}
                  contactName={contactName}
                  setContactName={setContactName}
                  userExt={user?.extension}
                  isConnected={isConnected}
                  onCall={initiateCall}
                />

                {/* Collapsible Email Section */}
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
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discord Chat */}
        <DiscordChat 
          isMinimized={isChatMinimized} 
          onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)} 
        />
      </div>

      {/* Email Preview Modal */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          
          {emailPreviewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">To:</span>
                  <p className="bg-gray-50 p-2 rounded">{emailPreviewData.to}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Template:</span>
                  <p className="bg-gray-50 p-2 rounded">{emailPreviewData.templateName}</p>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Subject:</span>
                <p className="bg-gray-50 p-2 rounded mt-1">{emailPreviewData.subject}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Message:</span>
                <div className="bg-white border rounded mt-1 p-3 max-h-64 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: emailPreviewData.body.replace(/\n/g, '<br/>') }} />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> A copy of this email notification will be sent to Discord with sender and recipient information.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailPreview(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={sendEmailTemplate}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedDialer;
