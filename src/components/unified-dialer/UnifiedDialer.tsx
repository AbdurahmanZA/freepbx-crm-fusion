
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { Phone, PhoneCall, PhoneOff, Clock, User } from "lucide-react";
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
}

const UnifiedDialer: React.FC<UnifiedDialerProps> = ({ onCallInitiated, disabled = false }) => {
  const { toast } = useToast();
  const { isConnected } = useAMIContext();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "dialing" | "connected" | "ended">("idle");
  const [callDuration, setCallDuration] = useState(0);

  // Auto-populate contact info when phone number changes
  useEffect(() => {
    if (phoneNumber.length >= 10) {
      const leads = JSON.parse(localStorage.getItem('leads') || '[]');
      const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const matchedLead = leads.find((lead: any) => {
        const leadPhone = (lead.phone || '').replace(/[\s\-\(\)]/g, '');
        return leadPhone === normalizedPhone;
      });
      
      if (matchedLead) {
        setContactName(matchedLead.name);
        setContactEmail(matchedLead.email || '');
      } else {
        setContactName('');
        setContactEmail('');
      }
    }
  }, [phoneNumber]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

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

    setIsDialing(true);
    setCallStatus("dialing");
    setCallDuration(0);

    try {
      // Simulate call initiation
      setTimeout(() => {
        setCallStatus("connected");
        setIsDialing(false);
        
        const callData = {
          id: `call_${Date.now()}`,
          leadName: contactName || "Unknown Contact",
          phone: phoneNumber,
          duration: "00:00",
          status: "connected" as const,
          startTime: new Date(),
          leadId: undefined
        };

        onCallInitiated(callData);

        toast({
          title: "Call Connected",
          description: `Connected to ${phoneNumber}`,
        });
      }, 2000);
    } catch (error) {
      setIsDialing(false);
      setCallStatus("idle");
      toast({
        title: "Call Failed",
        description: "Unable to connect the call.",
        variant: "destructive"
      });
    }
  };

  const handleHangup = () => {
    setCallStatus("ended");
    setIsDialing(false);
    
    toast({
      title: "Call Ended",
      description: `Call duration: ${formatDuration(callDuration)}`,
    });

    // Reset after a moment
    setTimeout(() => {
      setCallStatus("idle");
      setCallDuration(0);
    }, 2000);
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
      case "dialing":
        return <Badge variant="outline" className="text-yellow-700 bg-yellow-50">Dialing...</Badge>;
      case "connected":
        return <Badge variant="outline" className="text-green-700 bg-green-50">Connected</Badge>;
      case "ended":
        return <Badge variant="outline" className="text-gray-700 bg-gray-50">Call Ended</Badge>;
      default:
        return null;
    }
  };

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
                disabled={callStatus === "connected" || isDialing}
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
                <span className="text-blue-700 text-sm">Call in progress...</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {callStatus === "idle" && (
                <Button
                  onClick={handleCall}
                  disabled={disabled || !phoneNumber || !isConnected}
                  className="col-span-2 bg-green-600 hover:bg-green-700"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  {isDialing ? "Dialing..." : "Call"}
                </Button>
              )}
              
              {(callStatus === "connected" || callStatus === "dialing") && (
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
                disabled={callStatus === "connected" || isDialing}
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
                disabled={callStatus === "connected" || isDialing}
                className="h-10"
              >
                {digit}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Panel */}
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
