
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Mic, MicOff, Play, Pause, PhoneOff } from "lucide-react";

interface ActiveCall {
  id: string;
  leadName: string;
  phone: string;
  duration: string;
  status: 'connected' | 'ringing' | 'on-hold';
  startTime: Date;
  leadId?: string;
}
interface Props {
  activeCall: ActiveCall;
  isMuted: boolean;
  onMute: () => void;
  onHold: () => void;
  onHangup: () => void;
}

const ActiveCallDisplay: React.FC<Props> = ({
  activeCall,
  isMuted,
  onMute,
  onHold,
  onHangup,
}) => (
  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <div className="font-medium">{activeCall.leadName}</div>
          <div className="text-sm text-gray-600">{activeCall.phone}</div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3" />
            <span className="text-sm font-mono font-bold text-green-700">
              {activeCall.duration}
            </span>
            <Badge className={`text-xs ${
              activeCall.status === 'connected' ? 'bg-green-100 text-green-800' :
              activeCall.status === 'ringing' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {activeCall.status === 'ringing' ? 'Ringing' :
               activeCall.status === 'on-hold' ? 'On Hold' : 'Connected'}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={isMuted ? "destructive" : "outline"}
          onClick={onMute}
        >
          {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
        </Button>
        <Button
          size="sm"
          variant={activeCall.status === 'on-hold' ? "default" : "outline"}
          onClick={onHold}
        >
          {activeCall.status === 'on-hold' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onHangup}
        >
          <PhoneOff className="h-3 w-3" />
        </Button>
      </div>
    </div>
  </div>
);

export default ActiveCallDisplay;
