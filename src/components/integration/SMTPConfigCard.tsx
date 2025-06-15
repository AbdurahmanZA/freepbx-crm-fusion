import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, TestTube, Check, X, Eye, EyeOff, Clock, Send, AlertCircle } from "lucide-react";
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

interface EmailLog {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  template?: string;
  errorMessage?: string;
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
  
  // Get the current server URL for email service
  const getEmailServiceUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:3002/api/test-smtp`;
  };

  // Get email logs from localStorage
  const getEmailLogs = (): EmailLog[] => {
    try {
      return JSON.parse(localStorage.getItem('email_send_logs') || '[]');
    } catch {
      return [];
    }
  };

  const [emailLogs] = useState<EmailLog[]>(getEmailLogs());

  const handleTestConnection = async () => {
    try {
      // Use the correct URL for your email service
      const response = await fetch(getEmailServiceUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          encryption: config.encryption,
          fromEmail: config.fromEmail,
          fromName: config.fromName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "SMTP Connected",
          description: "Successfully connected to SMTP server and saved configuration.",
        });
        return true;
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Connection Failed",
        description: `Could not connect to SMTP server: ${errorMessage}`,
        variant: "destructive"
      });
      return false;
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

  const getEmailStatusBadge = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200"><Check className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200"><X className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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

            {/* Email Sending Logs Section */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                <Label className="text-base font-medium">Email Sending Logs</Label>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {emailLogs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No emails sent yet. Email logs will appear here when emails are sent.
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getEmailStatusBadge(log.status)}
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="font-medium text-sm truncate">{log.subject}</p>
                          <p className="text-xs text-gray-600">To: {log.to}</p>
                          {log.template && (
                            <p className="text-xs text-blue-600">Template: {log.template}</p>
                          )}
                        </div>
                      </div>
                      
                      {log.status === 'failed' && log.errorMessage && (
                        <div className="flex items-center gap-1 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <AlertCircle className="h-3 w-3" />
                          <span>{log.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Real-time email sending logs from your Ubuntu server.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SMTPConfigCard;
