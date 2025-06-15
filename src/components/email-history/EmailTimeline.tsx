
import React from "react";
import { EmailLog } from "@/services/emailLogService";
import { Mail } from "lucide-react";

interface EmailTimelineProps {
  emailLogs: EmailLog[];
}

const EmailTimeline: React.FC<EmailTimelineProps> = ({ emailLogs }) => {
  if (!emailLogs.length) {
    return <div className="text-muted-foreground text-sm py-2">No emails sent to this contact yet.</div>;
  }
  return (
    <div className="space-y-4 border-l-2 border-blue-200 pl-3">
      {emailLogs.map((log, idx) => (
        <div key={log.id} className="relative pl-5 pb-2">
          <span className="absolute left-[-21px] top-0">
            <Mail className="h-4 w-4 text-blue-500 bg-white" />
          </span>
          <div className="text-xs text-gray-500">
            {new Date(log.dateSent).toLocaleString()}
          </div>
          <div className="font-medium text-sm">{log.subject}</div>
          <div className="text-xs text-gray-700 mb-1">
            <span className="font-semibold">To:</span> {log.to}
          </div>
          {log.templateName && (
            <div className="text-xs text-blue-600">Template: {log.templateName}</div>
          )}
          <div className="bg-gray-50 border p-2 text-xs rounded">{log.body.slice(0, 200)}</div>
          <div className="text-[10px] text-right text-muted-foreground italic">Sent by {log.agent}</div>
        </div>
      ))}
    </div>
  );
};

export default EmailTimeline;
