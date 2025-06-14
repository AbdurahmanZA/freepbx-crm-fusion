import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar, TestTube, Check, X, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleCalendarConfig {
  enabled: boolean;
  syncCallbacks: boolean;
  syncMeetings: boolean;
  defaultCalendar: string;
  clientId?: string;
}

interface GoogleCalendarCardProps {
  config: GoogleCalendarConfig;
  onConfigUpdate: (field: string, value: any) => void;
  onTestConnection: () => Promise<boolean>;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  showClientIdInput?: boolean;
}

const GoogleCalendarCard = ({
  config, 
  onConfigUpdate, 
  onTestConnection, 
  connectionStatus,
  showClientIdInput = true
}: GoogleCalendarCardProps) => {
  const { toast } = useToast();

  const handleTestConnection = async () => {
    try {
      const success = await onTestConnection();
      if (success) {
        toast({
          title: "Google Calendar Connected",
          description: "Successfully connected to Google Calendar API.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Google Calendar. Check your configuration.",
        variant: "destructive"
      });
    }
  };

  const handleConnectGoogle = () => {
    if (!config.clientId) {
      toast({
        title: "Configuration Missing",
        description: "Google Calendar integration has not been configured by an administrator.",
        variant: "destructive"
      });
      return;
    }

    const redirectUri = window.location.origin;
    console.log("Using redirect URI for Google Auth:", redirectUri, "Please add this to your Authorized redirect URIs in Google Cloud Console.");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("prompt", "consent select_account");
    
    console.log("Full Google Auth URL:", authUrl.toString());

    toast({
      title: "Redirecting to Google account sign-in...",
      description: "You will be able to connect your account for calendar sync.",
    });

    window.open(authUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'testing':
        return <TestTube className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'testing':
        return 'Testing...';
      default:
        return 'Disconnected';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
          <div className="flex items-center gap-1 ml-auto">
            {getStatusIcon()}
            <span className={`text-sm ${
              connectionStatus === 'connected' ? 'text-green-500' : 
              connectionStatus === 'testing' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="google-calendar-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => onConfigUpdate('enabled', checked)}
          />
          <Label htmlFor="google-calendar-enabled">Enable Google Calendar Integration</Label>
        </div>

        {config.enabled && (
          <>
            {showClientIdInput && (
              <div className="space-y-2">
                <Label htmlFor="google-client-id">Google Client ID</Label>
                <Input
                  id="google-client-id"
                  value={config.clientId || ''}
                  onChange={(e) => onConfigUpdate('clientId', e.target.value)}
                  placeholder="Enter your Google OAuth Client ID"
                />
                 <p className="text-xs text-muted-foreground">
                  You can get this from your project in the Google Cloud Console.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-fit flex items-center gap-2"
                onClick={handleConnectGoogle}
                disabled={!config.clientId}
              >
                <Globe className="h-4 w-4" /> Connect Google Account
              </Button>
              <span className="text-xs text-muted-foreground ml-1">
                Connect your Gmail/Google account to allow syncing with Callback Calendar.
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-calendar">Default Calendar Name</Label>
              <Input
                id="default-calendar"
                value={config.defaultCalendar}
                onChange={(e) => onConfigUpdate('defaultCalendar', e.target.value)}
                placeholder="Primary"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sync-callbacks"
                checked={config.syncCallbacks}
                onCheckedChange={(checked) => onConfigUpdate('syncCallbacks', checked)}
              />
              <Label htmlFor="sync-callbacks">Sync Callback Appointments</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sync-meetings"
                checked={config.syncMeetings}
                onCheckedChange={(checked) => onConfigUpdate('syncMeetings', checked)}
              />
              <Label htmlFor="sync-meetings">Sync Meeting Events</Label>
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="w-full"
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Google Calendar Connection
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarCard;
