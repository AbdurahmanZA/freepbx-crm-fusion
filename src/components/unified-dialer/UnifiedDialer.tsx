import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, PhoneCall, PhoneOff, Clock, User, X } from "lucide-react";
import EmailPanel from "./EmailPanel";

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
  disabled?: boolean;
  initialData?: {
    phone?: string;
    name?: string;
    email?: string;
  };
}

interface ActiveCallState {
  id: string;
  leadName: string;
  phone: string;
  startTime: Date;
  status: "ringing" | "connected" | "on-hold" | "ended";
}

const ACTIVE_CALL_STORAGE_KEY = 'unified_dialer_active_call';

const UnifiedDialer: React.FC<UnifiedDialerProps> = ({ 
  onCallInitiated, 
  disabled = false, 
  initialData = {} 
}) => {
  const { toast } = useToast();
  const { isConnected, originateCall, lastEvent } = useAMIContext();
  const { user } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [activeCall, setActiveCall] = useState<{
    id: string;
    leadName: string;
    phone: string;
    startTime: Date;
    status: "ringing" | "connected" | "on-hold" | "ended";
  } | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Load persisted call state on component mount
  useEffect(() => {
    const persistedCall = sessionStorage.getItem(ACTIVE_CALL_STORAGE_KEY);
    if (persistedCall) {
      try {
        const callState: ActiveCallState = JSON.parse(persistedCall);
        const callAge = Date.now() - new Date(callState.startTime).getTime();
        
        // Clear old call states (older than 5 minutes)
        if (callAge > 5 * 60 * 1000) {
          sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
          return;
        }
        
        setActiveCall({
          ...callState,
          startTime: new Date(callState.startTime)
        });
        
        const elapsed = Math.floor(callAge / 1000);
        setCallDuration(elapsed);
        
        console.log('📞 [UnifiedDialer] Restored active call from storage:', callState);
      } catch (error) {
        console.error('Failed to restore active call state:', error);
        sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
      }
    }
  }, []);

  // Persist call state whenever activeCall changes
  useEffect(() => {
    if (activeCall && activeCall.status !== 'ended') {
      const callState: ActiveCallState = {
        ...activeCall,
        startTime: activeCall.startTime.toISOString()
      };
      sessionStorage.setItem(ACTIVE_CALL_STORAGE_KEY, JSON.stringify(callState));
    } else {
      sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
    }
  }, [activeCall]);

  // Set initial data when component receives it and clear any ended calls
  useEffect(() => {
    // Clear any ended calls when new lead data comes in
    if (initialData.phone && activeCall?.status === 'ended') {
      setActiveCall(null);
      setCallDuration(0);
    }
    
    if (initialData.phone) {
      setPhoneNumber(initialData.phone);
    }
    if (initialData.name) {
      setContactName(initialData.name);
    }
    if (initialData.email) {
      setContactEmail(initialData.email);
    }
  }, [initialData, activeCall?.status]);

  // Auto-populate contact info when phone number changes
  useEffect(() => {
    if (phoneNumber.length >= 10) {
      const leads = JSON.parse(localStorage.getItem('leads') || '[]');
      const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const matchedLead = leads.find((lead: any) => {
        const leadPhone = (lead.phone || '').replace(/[\s\-\(\)]/g, '');
        return leadPhone === normalizedPhone;
      });
      
      if (matchedLead && !initialData.name) {
        setContactName(matchedLead.name);
        setContactEmail(matchedLead.email || '');
      }
    }
  }, [phoneNumber, initialData.name]);

  // Monitor AMI events for call status updates with improved hangup detection
  useEffect(() => {
    if (!lastEvent || !activeCall) return;

    const userExtension = user?.extension;
    if (!userExtension) return;

    console.log('📞 [UnifiedDialer] Processing AMI event:', lastEvent);

    // Improved event filtering - check multiple fields for user/call relationship
    const isUserRelated = 
      lastEvent.channel?.includes(`PJSIP/${userExtension}`) ||
      lastEvent.destchannel?.includes(`PJSIP/${userExtension}`) ||
      lastEvent.calleridnum === userExtension ||
      lastEvent.connectedlinenum === activeCall.phone ||
      lastEvent.calleridnum === activeCall.phone ||
      (lastEvent.calleridnum && activeCall.phone.includes(lastEvent.calleridnum.slice(-4))) ||
      (lastEvent.connectedlinenum && activeCall.phone.includes(lastEvent.connectedlinenum.slice(-4))) ||
      (lastEvent.uniqueid && activeCall.id.includes(lastEvent.uniqueid)) ||
      // Check for any channel that contains our extension
      (lastEvent.channel && lastEvent.channel.includes(userExtension)) ||
      (lastEvent.destchannel && lastEvent.destchannel.includes(userExtension));

    if (!isUserRelated) {
      console.log('📞 [UnifiedDialer] Event not related to user/call, ignoring');
      return;
    }

    let newStatus = activeCall.status;
    let shouldUpdate = false;

    switch (lastEvent.event) {
      case 'DialBegin':
        if (activeCall.status === 'ringing') {
          console.log('📞 [UnifiedDialer] Call dialing started');
        }
        break;

      case 'DialEnd':
        console.log('📞 [UnifiedDialer] DialEnd status:', lastEvent.dialstatus);
        if (lastEvent.dialstatus === 'ANSWER') {
          newStatus = 'connected';
          shouldUpdate = true;
        } else if (['BUSY', 'NOANSWER', 'CONGESTION', 'CHANUNAVAIL', 'CANCEL'].includes(lastEvent.dialstatus || '')) {
          newStatus = 'ended';
          shouldUpdate = true;
          setTimeout(() => {
            setActiveCall(null);
            setCallDuration(0);
          }, 2000);
        }
        break;

      case 'Bridge':
        if (activeCall.status !== 'connected') {
          newStatus = 'connected';
          shouldUpdate = true;
        }
        break;

      case 'Hangup':
        console.log('📞 [UnifiedDialer] Hangup event detected - ending call');
        newStatus = 'ended';
        shouldUpdate = true;
        setTimeout(() => {
          setActiveCall(null);
          setCallDuration(0);
        }, 2000);
        break;

      // Additional hangup scenarios
      case 'SoftHangupRequest':
      case 'HangupRequest':
        console.log('📞 [UnifiedDialer] Hangup request - ending call');
        newStatus = 'ended';
        shouldUpdate = true;
        setTimeout(() => {
          setActiveCall(null);
          setCallDuration(0);
        }, 2000);
        break;
    }

    if (shouldUpdate && newStatus !== activeCall.status) {
      console.log(`📞 [UnifiedDialer] Status change: ${activeCall.status} -> ${newStatus}`);
      
      const updatedCall = {
        ...activeCall,
        status: newStatus
      };
      
      setActiveCall(updatedCall);
      
      const duration = Math.floor((new Date().getTime() - activeCall.startTime.getTime()) / 1000);
      const durationStr = `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`;
      
      onCallInitiated({
        id: activeCall.id,
        leadName: activeCall.leadName,
        phone: activeCall.phone,
        duration: durationStr,
        status: newStatus,
        startTime: activeCall.startTime
      });

      toast({
        title: "Call Status Update",
        description: `Call ${newStatus}: ${activeCall.leadName}`,
      });
    }
  }, [lastEvent, activeCall, user?.extension, onCallInitiated, toast]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall?.status === "connected") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  const handleCall = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to dial.",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "AMI Not Connected",
        description: "Cannot make calls - AMI connection is not available.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.extension) {
      toast({
        title: "No Extension Assigned",
        description: "No extension assigned to your user account. Contact administrator.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Initiating call from UnifiedDialer:', {
        channel: `PJSIP/${user.extension}`,
        extension: phoneNumber,
        context: 'from-internal'
      });

      const success = await originateCall(
        `PJSIP/${user.extension}`,
        phoneNumber,
        'from-internal'
      );

      if (success) {
        const newCall = {
          id: `call_${Date.now()}`,
          leadName: contactName || "Unknown Contact",
          phone: phoneNumber,
          startTime: new Date(),
          status: 'ringing' as const
        };

        setActiveCall(newCall);
        setCallDuration(0);
        
        // Dispatch event for AMI call record handler
        const dialerEvent = new CustomEvent('dialerCallInitiated', {
          detail: {
            id: newCall.id,
            leadName: newCall.leadName,
            phone: phoneNumber,
            startTime: newCall.startTime
          }
        });
        window.dispatchEvent(dialerEvent);
        
        onCallInitiated({
          id: newCall.id,
          leadName: newCall.leadName,
          phone: phoneNumber,
          duration: '00:00',
          status: 'ringing',
          startTime: newCall.startTime
        });
        
        toast({
          title: "Call Initiated",
          description: `Calling ${contactName || phoneNumber}`,
        });
      } else {
        throw new Error('Call origination failed');
      }
    } catch (error) {
      console.error('Call origination error:', error);
      toast({
        title: "Call Failed",
        description: "Could not initiate call. Check AMI connection.",
        variant: "destructive"
      });
    }
  };

  const handleHangup = () => {
    if (activeCall) {
      setActiveCall({
        ...activeCall,
        status: 'ended'
      });
      
      toast({
        title: "Call Ended",
        description: `Call duration: ${formatDuration(callDuration)}`,
      });

      setTimeout(() => {
        setActiveCall(null);
        setCallDuration(0);
      }, 2000);
    }
  };

  const handleClearCall = () => {
    setActiveCall(null);
    setCallDuration(0);
    sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
    
    toast({
      title: "Call Cleared",
      description: "Dialer reset and ready for new calls",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNumberPadClick = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
  };

  const clearNumber = () => {
    setPhoneNumber("");
    setContactName("");
    setContactEmail("");
  };

  const getStatusBadge = () => {
    if (!activeCall) return null;
    
    switch (activeCall.status) {
      case "ringing":
        return <Badge variant="outline" className="text-yellow-700 bg-yellow-50">Ringing...</Badge>;
      case "connected":
        return <Badge variant="outline" className="text-green-700 bg-green-50">Connected</Badge>;
      case "on-hold":
        return <Badge variant="outline" className="text-orange-700 bg-orange-50">On Hold</Badge>;
      case "ended":
        return (
          <Badge variant="outline" className="text-gray-700 bg-gray-50 flex items-center gap-1">
            Call Ended
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearCall}
              className="h-4 w-4 p-0 ml-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      default:
        return null;
    }
  };

  const canMakeCall = !activeCall || activeCall.status === 'ended';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Unified Dialer
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                disabled={activeCall && activeCall.status !== 'ended'}
                className="text-lg"
              />
            </div>

            {contactName && (
              <div className="p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  <strong>{contactName}</strong> {contactEmail && `(${contactEmail})`}
                </span>
              </div>
            )}

            {activeCall && activeCall.status === "connected" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-mono">{formatDuration(callDuration)}</span>
                </div>
                <span className="text-blue-700 text-sm">Call in progress...</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {canMakeCall && (
                <Button
                  onClick={handleCall}
                  disabled={disabled || !phoneNumber || !isConnected || !user?.extension}
                  className="col-span-2 bg-green-600 hover:bg-green-700"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  {!isConnected ? "AMI Not Connected" : !user?.extension ? "No Extension" : "Call"}
                </Button>
              )}
              
              {activeCall && (activeCall.status === "connected" || activeCall.status === "ringing") && (
                <Button
                  onClick={handleHangup}
                  className="col-span-2 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Hang Up
                </Button>
              )}

              <Button
                onClick={clearNumber}
                variant="outline"
                disabled={activeCall && activeCall.status !== 'ended'}
              >
                Clear
              </Button>
            </div>

            {!isConnected && (
              <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700">
                AMI connection required for calling functionality.
              </div>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                onClick={() => handleNumberPadClick(digit)}
                disabled={activeCall && activeCall.status !== 'ended'}
                className="h-10"
              >
                {digit}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <EmailPanel
        contactEmail={contactEmail}
        setContactEmail={setContactEmail}
        contactName={contactName}
        phoneNumber={phoneNumber}
      />
    </div>
  );
};

export default UnifiedDialer;
