
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Radio } from "lucide-react";

interface CallActivityPanelProps {
  show: boolean;
  onToggle: () => void;
  callEvents: any[];
  isConnected: boolean;
}

const getEventStatusColor = (event: any) => {
  switch (event.event) {
    case 'Newchannel': return 'bg-blue-100 text-blue-800';
    case 'Hangup': return 'bg-red-100 text-red-800';
    case 'DialBegin': return 'bg-yellow-100 text-yellow-800';
    case 'DialEnd': return event.dialstatus === 'ANSWER' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    case 'Bridge': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const CallActivityPanel: React.FC<CallActivityPanelProps> = ({
  show,
  onToggle,
  callEvents,
  isConnected
}) => (
  <div>
    <Button
      variant={show ? "default" : "ghost"}
      size="sm"
      onClick={onToggle}
      className="mb-2"
    >
      <Activity className="h-3 w-3 mr-1" />
      Activity
    </Button>
    {show && (
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm">PBX Call Activity</span>
          {isConnected ? (
            <Badge className="bg-green-100 text-green-800 text-xs">Live</Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">Offline</Badge>
          )}
        </div>
        {isConnected ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {callEvents.length > 0 ? (
              callEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getEventStatusColor(event)}`}>
                        {event.event}
                      </Badge>
                      {event.channel && (
                        <span className="text-gray-600 truncate max-w-24">
                          {event.channel.split('/').pop()}
                        </span>
                      )}
                      {event.calleridnum && (
                        <span className="text-gray-800">
                          {event.calleridnum}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {event.dialstatus && (
                    <div className="mt-1 text-gray-600">
                      Status: {event.dialstatus}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                No recent call activity
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 text-center py-2">
            Connect to AMI to see call activity
          </div>
        )}
      </div>
    )}
  </div>
);

export default CallActivityPanel;
