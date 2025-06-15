
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock } from "lucide-react";
import { simpleEmailService, EmailSendLog } from "@/services/simpleEmailService";

interface SimpleEmailHistoryProps {
  contactEmail?: string;
  leadId?: string;
  maxItems?: number;
}

const SimpleEmailHistory: React.FC<SimpleEmailHistoryProps> = ({ 
  contactEmail, 
  leadId,
  maxItems = 10 
}) => {
  const allLogs = simpleEmailService.getEmailLogs();
  
  // Filter logs based on contact email or lead ID
  let filteredLogs = allLogs;
  if (contactEmail) {
    filteredLogs = filteredLogs.filter(log => 
      log.to.toLowerCase() === contactEmail.toLowerCase()
    );
  } else if (leadId) {
    filteredLogs = filteredLogs.filter(log => log.leadId === leadId);
  }
  
  const displayLogs = filteredLogs.slice(0, maxItems);

  if (displayLogs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm py-2 text-center">
            No emails sent yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email History
          <span className="text-sm font-normal text-muted-foreground">
            ({displayLogs.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayLogs.map((log) => (
            <div key={log.id} className="border-l-2 border-blue-200 pl-3 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{log.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    To: {log.to}
                  </div>
                  {log.templateName && (
                    <div className="text-xs text-blue-600 mt-1">
                      Template: {log.templateName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded">
                    {log.body.length > 150 ? `${log.body.slice(0, 150)}...` : log.body}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(log.dateSent).toLocaleString()}
                </span>
                <span>Sent by {log.agent}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleEmailHistory;
