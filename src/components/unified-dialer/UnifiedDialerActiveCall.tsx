
import React from "react";

type ActiveCall = {
  leadName: string;
  status: "ringing" | "connected" | "on-hold" | "ended";
  phone: string;
};

const UnifiedDialerActiveCall = ({
  activeCall,
}: {
  activeCall: ActiveCall;
}) => {
  if (!activeCall) return null;
  return (
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
  );
};
export default UnifiedDialerActiveCall;
