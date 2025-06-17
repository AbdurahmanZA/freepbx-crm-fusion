
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, TestTube, CheckCircle, AlertTriangle, RefreshCw, Info } from "lucide-react";

interface FreePBXAPICardProps {
  config: {
    host: string;
    port: string;
    username: string;
    password: string;
    apiKey: string;
  };
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  onConfigUpdate: (field: string, value: string) => void;
  onTestConnection: () => void;
}

const FreePBXAPICard = ({ 
  config, 
  connectionStatus, 
  onConfigUpdate, 
  onTestConnection 
}: FreePBXAPICardProps) => {
  const getStatusBadge = (status: 'connected' | 'disconnected' | 'testing') => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'testing':
        return (
          <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Testing...
          </Badge>
        );
      default:
        return (
          <Badge className="flex items-center gap-1 bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3" />
            Disconnected
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-4 w-4" />
          FreePBX REST API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            FreePBX REST API provides call origination and system management.
            API endpoints: /admin/api/api/originate, /admin/api/api/channels
          </AlertDescription>
        </Alert>
        
        <div>
          <Label htmlFor="api-host">FreePBX Host/IP</Label>
          <Input 
            id="api-host" 
            value={config.host}
            onChange={(e) => onConfigUpdate('host', e.target.value)}
            placeholder="192.168.0.5"
          />
        </div>
        <div>
          <Label htmlFor="api-port">HTTP Port</Label>
          <Input 
            id="api-port" 
            value={config.port}
            onChange={(e) => onConfigUpdate('port', e.target.value)}
            placeholder="80"
          />
        </div>
        <div>
          <Label htmlFor="api-secret">API Secret</Label>
          <Input 
            id="api-secret" 
            value={config.apiKey}
            onChange={(e) => onConfigUpdate('apiKey', e.target.value)}
            placeholder="7ecfaa830f88e7475f1010b2e446d6f6"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Primary authentication method for REST API calls
          </p>
        </div>
        <div>
          <Label htmlFor="api-username">Admin Username (Fallback)</Label>
          <Input 
            id="api-username" 
            value={config.username}
            onChange={(e) => onConfigUpdate('username', e.target.value)}
            placeholder="admin"
          />
        </div>
        <div>
          <Label htmlFor="api-password">Admin Password (Fallback)</Label>
          <Input 
            id="api-password" 
            type="password" 
            value={config.password}
            onChange={(e) => onConfigUpdate('password', e.target.value)}
            placeholder="amp111"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used when API secret is not available
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">REST API Status</span>
          {getStatusBadge(connectionStatus)}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
          <div className="font-medium text-blue-900 mb-1">API Endpoints:</div>
          <div className="text-blue-700 space-y-1">
            <div>• POST /admin/api/api/originate - Initiate calls</div>
            <div>• GET /admin/api/api/channels - Active channels</div>
            <div>• GET /admin/api/api/cdr - Call detail records</div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={onTestConnection}
          disabled={connectionStatus === 'testing'}
          className="w-full"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test REST API Connection
        </Button>
      </CardContent>
    </Card>
  );
};

export default FreePBXAPICard;
