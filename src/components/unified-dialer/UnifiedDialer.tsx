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
import { Phone, PhoneCall, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAMIContext } from "@/contexts/AMIContext";
import { useAuth } from "@/contexts/AuthContext";
import DialerPanel from "./DialerPanel";

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
}

const UnifiedDialer = ({ onCallInitiated, disabled }: UnifiedDialerProps) => {
  const { toast } = useToast();
  const { isConnected, originateCall, lastEvent, callEvents } = useAMIContext();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [activeCall, setActiveCall] = useState<{
    id: string;
    uniqueId?: string;
    leadName: string;
    phone: string;
    startTime: Date;
    status: "ringing" | "connected" | "on-hold" | "ended";
  } | null>(null);

  // Monitor AMI events for call status updates
  useEffect(() => {
    if (!lastEvent || !activeCall) return;

    const userExtension = user?.extension;
    if (!userExtension) return;

    console.log("📞 [UnifiedDialer] Processing AMI event:", lastEvent);
    console.log("📞 [UnifiedDialer] Active call:", activeCall);
    console.log("📞 [UnifiedDialer] User extension:", userExtension);

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
      console.log(
        `📞 [UnifiedDialer] Status change: ${activeCall.status} -> ${newStatus}`
      );

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
      console.log("Initiating real AMI call:", {
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

        setPhoneNumber("");
        setContactName("");
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

  // Event handler for "click to dial" from lead management
  useEffect(() => {
    // Handler for the event
    const handleUnifiedDialerCall = (event: CustomEvent) => {
      const detail = event.detail || {};
      // Expecting: { phone, name, leadId, contactName, phoneNumber, notes, ... }
      const phone = detail.phoneNumber || detail.phone;
      const name = detail.contactName || detail.name || "";
      // Set state for phone number & contact name in dialer (use available setters)
      if (typeof setPhoneNumber === "function") setPhoneNumber(phone || "");
      if (typeof setContactName === "function") setContactName(name || "");
      // Optionally: Initiate the call
      if (typeof onCall === "function" && phone) {
        setTimeout(() => {
          onCall();
          toast({
            title: "Dialer Triggered",
            description: `Calling ${name ? name : phone}`,
          });
        }, 100); // slight delay to ensure state updates
      }
    };

    // Listen for event
    window.addEventListener(
      "unifiedDialerCall",
      handleUnifiedDialerCall as EventListener
    );

    // Clean up
    return () => {
      window.removeEventListener(
        "unifiedDialerCall",
        handleUnifiedDialerCall as EventListener
      );
    };
  }, [setPhoneNumber, setContactName, onCall, toast]);

  return (
    <Card className="h-fit shadow-sm border flex flex-col min-w-[275px] max-w-md mx-auto">
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Phone className="h-4 w-4" />
          Dialer
          {!isConnected && (
            <span className="text-xs text-destructive font-normal ml-2">
              (AMI Not Connected)
            </span>
          )}
        </CardTitle>
        {/* Optional: condensed description */}
        <CardDescription className="text-xs leading-tight !mt-1">
          Make a call from the CRM.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 px-3 py-2 !pt-0">
        {/* Compact agent info */}
        <div className="bg-muted p-1 rounded text-xs flex justify-between items-center mb-1">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {user?.name}
          </span>
          {user?.extension && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              PJSIP/{user.extension}
            </span>
          )}
        </div>
        {!user?.extension && (
          <p className="text-destructive mt-1 text-xs text-center">No extension assigned</p>
        )}

        {/* Active call status */}
        {activeCall && (
          <div className="bg-blue-50 border border-blue-200 rounded p-1 text-xs mb-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">{activeCall.leadName}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  activeCall.status === "connected"
                    ? "bg-green-100 text-green-800"
                    : activeCall.status === "ringing"
                    ? "bg-yellow-100 text-yellow-800"
                    : activeCall.status === "on-hold"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {activeCall.status}
              </span>
            </div>
            <div className="text-blue-700 mt-0.5">{activeCall.phone}</div>
          </div>
        )}

        <div className="pb-1">
          <DialerPanel
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            contactName={contactName}
            setContactName={setContactName}
            userExt={user?.extension}
            isConnected={isConnected}
            onCall={onCall}
          />
        </div>

        {!isConnected && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Connect AMI in Integration Settings
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedDialer;
