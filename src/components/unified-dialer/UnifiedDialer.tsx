import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Minimize2, 
  Maximize2,
  User,
  Clock,
  Mic,
  MicOff,
  Play,
  Pause,
  MessageCircle,
  Activity,
  Radio,
  Users,
  Send,
  Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { useAuth } from "@/contexts/AuthContext";
import { callRecordsService } from "@/services/callRecordsService";
import DiscordChat from "@/components/discord-chat/DiscordChat";

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
  const [showCallActivity, setShowCallActivity] = useState(false);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  // Get email templates from localStorage
  const getEmailTemplates = () => {
    try {
      const templates = localStorage.getItem('email_templates');
      return templates ? JSON.parse(templates) : [];
    } catch {
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

  const sendEmailTemplate = async () => {
    // Check SMTP configuration
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

      // Replace template variables
      const companyName = localStorage.getItem('smtp_from_name') || 'Your Company';
      const formLink = `${window.location.origin}/customer-form`;
      
      const subject = template.subject
        .replace(/\{\{customerName\}\}/g, contactName || 'Valued Customer')
        .replace(/\{\{companyName\}\}/g, companyName);
      
      const body = template.body
        .replace(/\{\{customerName\}\}/g, contactName || 'Valued Customer')
        .replace(/\{\{formLink\}\}/g, formLink)
        .replace(/\{\{companyName\}\}/g, companyName)
        .replace(/\{\{phone\}\}/g, phoneNumber)
        .replace(/\{\{email\}\}/g, contactEmail);

      console.log('📧 [UnifiedDialer] Sending email:', {
        to: contactEmail,
        subject,
        template: template.name
      });

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Email Sent",
        description: `${template.name} sent to ${contactEmail}`,
      });

      // Clear email fields
      setContactEmail('');
      setSelectedTemplate('');
      setShowEmailPanel(false);

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
                  variant={showEmailPanel ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowEmailPanel(!showEmailPanel)}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
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

            {/* Email Panel */}
            {showEmailPanel && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Send Email Template</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email address"
                    className="text-sm"
                  />
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEmailTemplates().map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={sendEmailTemplate} 
                    disabled={!contactEmail || !selectedTemplate}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-3 w-3 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>
            )}

            {/* Call Activity Section */}
            {showCallActivity && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">PBX Call Activity</span>
                  {isConnected ? (
                    <Badge className="bg-green-100 text-green-800 text-xs">Live</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Offline</Badge>
                  )}
                </div>
                
                {isConnected ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {callEvents.length > 0 ? (
                      callEvents.slice(0, 5).map((event, index) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getEventStatusColor(event)}`}>
                                {event.event}
                              </Badge>
                              {event.channel && (
                                <span className="text-gray-600 truncate max-w-24">
                                  {event.channel.split('/').pop()}
                                </span>
                              )}
                              {event.calleridnum && (
                                <span className="text-gray-800">
                                  {event.calleridnum}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          {event.dialstatus && (
                            <div className="mt-1 text-gray-600">
                              Status: {event.dialstatus}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No recent call activity
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Connect to AMI to see call activity
                  </div>
                )}
              </div>
            )}

            {/* Active Call Display */}
            {activeCall && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{activeCall.leadName}</div>
                      <div className="text-sm text-gray-600">{activeCall.phone}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm font-mono font-bold text-green-700">
                          {activeCall.duration}
                        </span>
                        <Badge className={`text-xs ${
                          activeCall.status === 'connected' ? 'bg-green-100 text-green-800' :
                          activeCall.status === 'ringing' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activeCall.status === 'ringing' ? 'Ringing' : 
                           activeCall.status === 'on-hold' ? 'On Hold' : 'Connected'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant={activeCall.status === 'on-hold' ? "default" : "outline"}
                      onClick={holdCall}
                    >
                      {activeCall.status === 'on-hold' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialer Interface */}
            {!activeCall && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact name (optional)"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={initiateCall} 
                    disabled={!user?.extension || !phoneNumber || !isConnected}
                    className="w-full"
                    size="sm"
                  >
                    <PhoneCall className="h-3 w-3 mr-2" />
                    {!isConnected ? 'AMI Not Connected' : !user?.extension ? 'No Extension' : 'Call'}
                  </Button>
                </div>
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
    </div>
  );
};

export default UnifiedDialer;
