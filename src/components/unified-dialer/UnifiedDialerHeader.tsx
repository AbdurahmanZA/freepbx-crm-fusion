
import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Phone } from "lucide-react";

const UnifiedDialerHeader = ({ isConnected }: { isConnected: boolean }) => (
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
);
export default UnifiedDialerHeader;
