import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Phone, 
  Clock,
  User,
  Building,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AddCallbackDialog from "./AddCallbackDialog";
import { callbackService, Callback } from "@/services/callbackService";
import GoogleCalendarCard from "@/components/integration/GoogleCalendarCard";

interface CallbackCalendarProps {
  userRole: string;
}

const CallbackCalendar = ({ userRole }: CallbackCalendarProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);

  // Google Calendar integration state
  const [googleCalendarConfig, setGoogleCalendarConfig] = useState(() => {
    const saved = localStorage.getItem('google_calendar_config');
    const defaultConfig = {
      enabled: false,
      syncCallbacks: true,
      syncMeetings: false,
      defaultCalendar: 'Primary',
      clientId: ''
    };
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse google_calendar_config from localStorage", e);
        return defaultConfig;
      }
    }
    return defaultConfig;
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  // Load callbacks on component mount
  useEffect(() => {
    loadCallbacks();
  }, []);

  const loadCallbacks = () => {
    try {
      const loadedCallbacks = callbackService.getAllCallbacks();
      setCallbacks(loadedCallbacks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load callbacks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCallbacksForDate = (date: Date) => {
    return callbackService.getCallbacksForDate(date);
  };

  const getDatesWithCallbacks = () => {
    return callbacks.map(callback => callback.scheduledDate);
  };

  const handleAddCallback = (callbackData: Omit<Callback, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCallback = callbackService.saveCallback(callbackData);
      setCallbacks(prev => [...prev, newCallback]);
      
      toast({
        title: "Callback Scheduled",
        description: `Callback for ${newCallback.leadName} scheduled for ${format(newCallback.scheduledDate, 'PPP')} at ${newCallback.scheduledTime}`,
      });

      // Send Discord notification if available
      if ((window as any).sendDiscordNotification) {
        (window as any).sendDiscordNotification(
          newCallback.leadName,
          'callback scheduled',
          `Callback scheduled for ${format(newCallback.scheduledDate, 'PPP')} at ${newCallback.scheduledTime} - assigned to ${newCallback.assignedAgent}`
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save callback",
        variant: "destructive"
      });
    }
  };

  const markCallbackComplete = (callbackId: string) => {
    try {
      const updated = callbackService.updateCallback(callbackId, { status: 'completed' });
      if (updated) {
        setCallbacks(prev => 
          prev.map(callback => 
            callback.id === callbackId ? updated : callback
          )
        );

        toast({
          title: "Callback Completed",
          description: `Callback for ${updated.leadName} marked as completed`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update callback",
        variant: "destructive"
      });
    }
  };

  const handleCallLead = (callback: Callback) => {
    // Dispatch event to unified dialer
    const callEvent = new CustomEvent('unifiedDialerCall', {
      detail: {
        name: callback.leadName,
        phone: callback.leadPhone,
        leadId: callback.id,
        source: 'callback_calendar'
      }
    });
    window.dispatchEvent(callEvent);

    toast({
      title: "Initiating Call",
      description: `Calling ${callback.leadName}...`,
    });
  };

  const handleGoogleCalendarConfigUpdate = (field: string, value: any) => {
    const newConfig = { ...googleCalendarConfig, [field]: value };
    setGoogleCalendarConfig(newConfig);
    localStorage.setItem('google_calendar_config', JSON.stringify(newConfig));
  };

  const handleTestGoogleCalendarConnection = async () => {
    setConnectionStatus('testing');
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.3; // 70% success rate for demo
    setConnectionStatus(success ? 'connected' : 'disconnected');
    return success;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedDateCallbacks = getCallbacksForDate(selectedDate);

  if (loading) {
    return <div className="flex justify-center p-8">Loading callbacks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Callback Calendar
          </h2>
          <p className="text-muted-foreground">Schedule and manage callback appointments with leads</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Schedule Callback
        </Button>
      </div>

      {/* Google Calendar Integration */}
      <GoogleCalendarCard
        config={googleCalendarConfig}
        onConfigUpdate={handleGoogleCalendarConfigUpdate}
        onTestConnection={handleTestGoogleCalendarConnection}
        connectionStatus={connectionStatus}
        showClientIdInput={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{
                hasCallbacks: getDatesWithCallbacks()
              }}
              modifiersStyles={{
                hasCallbacks: { 
                  backgroundColor: 'rgb(59 130 246 / 0.1)',
                  color: 'rgb(59 130 246)',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Callbacks for Selected Date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Callbacks for {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              <Badge variant="outline" className="ml-2">
                {selectedDateCallbacks.length} scheduled
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateCallbacks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No callbacks scheduled for this date</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  Schedule a Callback
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateCallbacks.map((callback) => (
                  <Card key={callback.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{callback.leadName}</h3>
                            <Badge className={`text-xs ${getPriorityColor(callback.priority)}`}>
                              {callback.priority}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(callback.status)}`}>
                              {callback.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {callback.leadCompany}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {callback.leadPhone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {callback.scheduledTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {callback.assignedAgent}
                            </div>
                          </div>
                          <p className="text-sm mt-2 text-gray-600">{callback.notes}</p>
                        </div>
                        <div className="flex gap-2">
                          {callback.status === 'scheduled' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex items-center gap-1"
                                onClick={() => handleCallLead(callback)}
                              >
                                <Phone className="h-3 w-3" />
                                Call Now
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => markCallbackComplete(callback.id)}
                                className="flex items-center gap-1"
                              >
                                Mark Complete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddCallbackDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddCallback={handleAddCallback}
        userRole={userRole}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CallbackCalendar;
