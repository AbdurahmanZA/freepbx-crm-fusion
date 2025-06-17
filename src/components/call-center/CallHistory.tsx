
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Play, Phone, Mail, FileText, Calendar } from "lucide-react";

interface CallRecord {
  id: number;
  leadName: string;
  phone: string;
  duration: string;
  outcome: string;
  timestamp: string;
  hasRecording: boolean;
  notes: string;
  agent: string;
  emailCount?: number;
  lastEmailSent?: string;
  leadNotes?: string;
}

interface CallHistoryProps {
  calls: CallRecord[];
  showEnhancedInfo?: boolean;
}

const CallHistory = ({ calls, showEnhancedInfo = false }: CallHistoryProps) => {
  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "qualified": return "bg-green-100 text-green-800";
      case "callback scheduled": return "bg-blue-100 text-blue-800";
      case "answered": return "bg-green-100 text-green-800";
      case "not interested": return "bg-red-100 text-red-800";
      case "no answer": return "bg-gray-100 text-gray-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatLastEmailDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleCallAgain = (call: CallRecord) => {
    // Dispatch event to open dialer with lead info
    const event = new CustomEvent('openDialerForLead', {
      detail: {
        phone: call.phone,
        name: call.leadName,
        email: '' // Could be enhanced to include email if available
      }
    });
    window.dispatchEvent(event);
  };

  if (!calls || calls.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No recent calls to display.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <Card key={call.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{call.leadName}</h3>
                    <Badge className={`text-xs ${getOutcomeColor(call.outcome)}`}>
                      {call.outcome}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap mb-2">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {call.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {call.timestamp}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {call.duration}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      by {call.agent}
                    </span>
                  </div>

                  {/* Enhanced Information */}
                  {showEnhancedInfo && (
                    <div className="space-y-2 mb-2">
                      {/* Email Information */}
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600">
                          Emails sent: {call.emailCount || 0}
                        </span>
                        {call.lastEmailSent && (
                          <span className="text-gray-500">
                            • Last: {formatLastEmailDate(call.lastEmailSent)}
                          </span>
                        )}
                      </div>

                      {/* Lead Notes */}
                      {call.leadNotes && (
                        <div className="flex items-start gap-2 text-xs">
                          <FileText className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 bg-green-50 p-2 rounded text-xs leading-relaxed">
                            <strong>Lead Notes:</strong> {call.leadNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Call Notes */}
                  {call.notes && (
                    <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      <strong>Call Notes:</strong> {call.notes}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                {call.hasRecording && (
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Play
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1"
                  onClick={() => handleCallAgain(call)}
                >
                  <Phone className="h-3 w-3" />
                  Call Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CallHistory;
