
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, TestTube, Check, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: string;
  username: string;
  password: string;
  encryption: string;
  fromEmail: string;
  fromName: string;
}

interface SMTPConfigCardProps {
  config: SMTPConfig;
  onConfigUpdate: (field: string, value: any) => void;
  onTestConnection: () => Promise<boolean>;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
}

const SMTPConfigCard = ({ 
  config, 
  onConfigUpdate, 
  onTestConnection, 
  connectionStatus 
}: SMTPConfigCardProps) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const handleTestConnection = async () => {
    try {
      const success = await onTestConnection();
      if (success) {
        toast({
          title: "SMTP Connected",
          description: "Successfully connected to SMTP server.",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect to SMTP server. Check your configuration.",
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
          <Mail className="h-5 w-5" />
          SMTP Email Configuration
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
            id="smtp-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => onConfigUpdate('enabled', checked)}
          />
          <Label htmlFor="smtp-enabled">Enable SMTP Email</Label>
        </div>

        {config.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={config.host}
                  onChange={(e) => onConfigUpdate('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  value={config.port}
                  onChange={(e) => onConfigUpdate('port', e.target.value)}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-encryption">Encryption</Label>
              <Select value={config.encryption} onValueChange={(value) => onConfigUpdate('encryption', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select encryption" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Username/Email</Label>
                <Input
                  id="smtp-username"
                  value={config.username}
                  onChange={(e) => onConfigUpdate('username', e.target.value)}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Password/App Password</Label>
                <div className="relative">
                  <Input
                    id="smtp-password"
                    type={showPassword ? "text" : "password"}
                    value={config.password}
                    onChange={(e) => onConfigUpdate('password', e.target.value)}
                    placeholder="your-app-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  value={config.fromEmail}
                  onChange={(e) => onConfigUpdate('fromEmail', e.target.value)}
                  placeholder="noreply@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={config.fromName}
                  onChange={(e) => onConfigUpdate('fromName', e.target.value)}
                  placeholder="Company Name"
                />
              </div>
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing' || !config.host || !config.username}
              className="w-full"
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test SMTP Connection
            </Button>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> For Gmail, use an App Password instead of your regular password. 
                Enable 2-factor authentication and generate an App Password in your Google Account settings.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SMTPConfigCard;
