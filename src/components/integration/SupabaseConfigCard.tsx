
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Database, TestTube, Check, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
  enabled: boolean;
  googleAuthEnabled: boolean;
}

interface SupabaseConfigCardProps {
  config: SupabaseConfig;
  onConfigUpdate: (field: string, value: any) => void;
  onTestConnection: () => Promise<boolean>;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
}

const SupabaseConfigCard = ({ 
  config, 
  onConfigUpdate, 
  onTestConnection, 
  connectionStatus 
}: SupabaseConfigCardProps) => {
  const { toast } = useToast();
  const [showServiceKey, setShowServiceKey] = useState(false);

  const handleTestConnection = async () => {
    try {
      const success = await onTestConnection();
      if (success) {
        toast({
          title: "Supabase Connected",
          description: "Successfully connected to Supabase project.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Supabase. Check your configuration.",
        variant: "destructive"
      });
    }
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
          <Database className="h-5 w-5" />
          Supabase Configuration
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
            id="supabase-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => onConfigUpdate('enabled', checked)}
          />
          <Label htmlFor="supabase-enabled">Enable Supabase Integration</Label>
        </div>

        {config.enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase Project URL</Label>
              <Input
                id="supabase-url"
                type="url"
                value={config.url}
                onChange={(e) => onConfigUpdate('url', e.target.value)}
                placeholder="https://your-project.supabase.co"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-anon-key">Anonymous Key</Label>
              <Input
                id="supabase-anon-key"
                value={config.anonKey}
                onChange={(e) => onConfigUpdate('anonKey', e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-service-key">Service Role Key (Optional)</Label>
              <div className="relative">
                <Input
                  id="supabase-service-key"
                  type={showServiceKey ? "text" : "password"}
                  value={config.serviceKey}
                  onChange={(e) => onConfigUpdate('serviceKey', e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowServiceKey(!showServiceKey)}
                >
                  {showServiceKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="google-auth-enabled"
                checked={config.googleAuthEnabled}
                onCheckedChange={(checked) => onConfigUpdate('googleAuthEnabled', checked)}
              />
              <Label htmlFor="google-auth-enabled">Enable Google Authentication</Label>
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing' || !config.url || !config.anonKey}
              className="w-full"
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Supabase Connection
            </Button>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> The service role key is only required for admin operations. 
                Keep it secure and only use it for server-side operations.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConfigCard;
