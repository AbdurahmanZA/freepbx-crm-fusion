
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFreePBX } from "@/contexts/FreePBXContext";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, PhoneCall, PhoneOff, Clock, User, X, Mic, MicOff } from "lucide-react";
import EmailPanel from "./EmailPanel";

interface UnifiedDialerFreePBXProps {
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

const UnifiedDialerFreePBX: React.FC<UnifiedDialerFreePBXProps> = ({ 
  onCallInitiated, 
  disabled = false, 
  initialData = {} 
}) => {
  const { toast } = useToast();
  const { isConnected, originateCall, hangupCall, currentCall, callStatus } = useFreePBX();
  const { user } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  // Set initial data when component receives it
  useEffect(() => {
    if (initialData.phone) {
      setPhoneNumber(initialData.phone);
    }
    if (initialData.name) {
      setContactName(initialData.name);
    }
    if (initialData.email) {
      setContactEmail(initialData.email);
    }
  }, [initialData]);

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

  // Monitor call status changes
  useEffect(() => {
    if (callStatus === 'connecting' && currentCall) {
      setCallStartTime(new Date());
      setCallDuration(0);
      
      onCallInitiated({
        id: currentCall.sessionId || `call_${Date.now()}`,
        leadName: contactName || "Unknown Contact",
        phone: phoneNumber,
        duration: '00:00',
        status: 'ringing',
        startTime: new Date()
      });
      
      toast({
        title: "Call Initiated",
        description: `Calling ${contactName || phoneNumber}`,
      });
    } else if (callStatus === 'connected') {
      onCallInitiated({
        id: currentCall?.sessionId || `call_${Date.now()}`,
        leadName: contactName || "Unknown Contact",
        phone: phoneNumber,
        duration: formatDuration(callDuration),
        status: 'connected',
        startTime: callStartTime || new Date()
      });
      
      toast({
        title: "Call Connected",
        description: `Connected to ${contactName || phoneNumber}`,
      });
    } else if (callStatus === 'ended') {
      toast({
        title: "Call Ended",
        description: `Call duration: ${formatDuration(callDuration)}`,
      });
      
      setTimeout(() => {
        setCallStartTime(null);
        setCallDuration(0);
      }, 2000);
    }
  }, [callStatus, currentCall, contactName, phoneNumber, callDuration, callStartTime, onCallInitiated, toast]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "connected" && callStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus, callStartTime]);

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
        title: "FreePBX Not Connected",
        description: "Cannot make calls - FreePBX connection is not available.",
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
      console.log('Initiating call via FreePBX REST API + WebRTC:', {
        channel: `PJSIP/${user.extension}`,
        extension: phoneNumber,
        context: 'from-internal'
      });

      const success = await originateCall(
        `PJSIP/${user.extension}`,
        phoneNumber,
        'from-internal'
      );

      if (!success) {
        throw new Error('Call origination failed');
      }
    } catch (error) {
      console.error('Call origination error:', error);
      toast({
        title: "Call Failed",
        description: "Could not initiate call. Check FreePBX connection.",
        variant: "destructive"
      });
    }
  };

  const handleHangup = async () => {
    try {
      await hangupCall();
    } catch (error) {
      console.error('Hangup error:', error);
      toast({
        title: "Hangup Failed",
        description: "Could not end call properly.",
        variant: "destructive"
      });
    }
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, this would mute/unmute the audio stream
    toast({
      title: isMuted ? "Unmuted" : "Muted",
      description: isMuted ? "Microphone enabled" : "Microphone disabled",
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
    switch (callStatus) {
      case "connecting":
        return <Badge variant="outline" className="text-yellow-700 bg-yellow-50">Ringing...</Badge>;
      case "connected":
        return <Badge variant="outline" className="text-green-700 bg-green-50">Connected</Badge>;
      case "ended":
        return <Badge variant="outline" className="text-gray-700 bg-gray-50">Call Ended</Badge>;
      default:
        return null;
    }
  };

  const canMakeCall = callStatus === 'idle';
  const isInCall = callStatus === 'connecting' || callStatus === 'connected';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Phone className="h-5 w-5" />
            FreePBX WebRTC Dialer
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
                disabled={isInCall}
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

            {callStatus === "connected" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-mono">{formatDuration(callDuration)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isMuted ? "destructive" : "outline"}
                    onClick={handleMute}
                  >
                    {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </Button>
                </div>
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
                  {!isConnected ? "FreePBX Not Connected" : !user?.extension ? "No Extension" : "Call"}
                </Button>
              )}
              
              {isInCall && (
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
                disabled={isInCall}
              >
                Clear
              </Button>
            </div>

            {!isConnected && (
              <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700">
                FreePBX WebRTC connection required for calling functionality.
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
                disabled={isInCall}
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

export default UnifiedDialerFreePBX;
