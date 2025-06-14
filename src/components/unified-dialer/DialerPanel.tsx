
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneCall } from "lucide-react";

type DialerPanelProps = {
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  contactName: string;
  setContactName: (v: string) => void;
  userExt: string | undefined;
  isConnected: boolean;
  onCall: () => void;
};

const DialerPanel: React.FC<DialerPanelProps> = ({
  phoneNumber,
  setPhoneNumber,
  contactName,
  setContactName,
  userExt,
  isConnected,
  onCall,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="space-y-2">
      <Input
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        placeholder="Phone number"
        className="text-sm"
      />
    </div>
    <div className="space-y-2">
      <Input
        value={contactName}
        onChange={e => setContactName(e.target.value)}
        placeholder="Contact name (optional)"
        className="text-sm"
      />
    </div>
    <div className="space-y-2">
      <Button
        onClick={onCall}
        disabled={!userExt || !phoneNumber || !isConnected}
        className="w-full"
        size="sm"
      >
        <PhoneCall className="h-3 w-3 mr-2" />
        {!isConnected ? 'AMI Not Connected' : !userExt ? 'No Extension' : 'Call'}
      </Button>
    </div>
  </div>
);

export default DialerPanel;
