
import React from "react";
import { User, Phone } from "lucide-react";

const UnifiedDialerAgentInfo = ({ user }: { user: any }) => (
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
);
export default UnifiedDialerAgentInfo;
