
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Phone, CheckCircle, AlertCircle, Wifi, WifiOff, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { amiBridgeClient } from "@/services/amiBridgeClient";

interface PJSIPPeer {
  objectName: string;
  endpoint: string;
  status: string;
  contact?: string;
}

interface ExtensionSelectorProps {
  value: string;
  onChange: (extension: string) => void;
  disabled?: boolean;
  isConnected: boolean;
}

const ExtensionSelector = ({ value, onChange, disabled, isConnected }: ExtensionSelectorProps) => {
  const { toast } = useToast();
  const [extensions, setExtensions] = useState<PJSIPPeer[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const [manualExtension, setManualExtension] = useState('');

  const fetchExtensions = async () => {
    if (!isConnected) {
      console.log('[ExtensionSelector] Cannot fetch - AMI not connected');
      toast({
        title: "AMI Not Connected",
        description: "Connect to AMI Bridge first to fetch extensions",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('[ExtensionSelector] Fetching PJSIP endpoints from bridge...');
    
    try {
      const endpoints = await amiBridgeClient.getPJSIPEndpoints();
      console.log('[ExtensionSelector] Received endpoints:', endpoints);
      
      setExtensions(endpoints);
      setLastFetchTime(new Date().toLocaleTimeString());
      
      if (endpoints.length === 0) {
        console.log('[ExtensionSelector] No endpoints found');
        toast({
          title: "No Extensions Found",
          description: "No PJSIP endpoints found. You can manually enter an extension.",
          variant: "destructive"
        });
        // Auto-switch to manual mode if no extensions found
        setManualMode(true);
      } else {
        console.log(`[ExtensionSelector] Successfully loaded ${endpoints.length} extensions`);
        toast({
          title: "Extensions Loaded",
          description: `Found ${endpoints.length} PJSIP extensions`,
        });
      }
    } catch (error) {
      console.error('[ExtensionSelector] Failed to fetch extensions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error Fetching Extensions",
        description: `Failed to fetch PJSIP extensions: ${errorMessage}. You can manually enter an extension.`,
        variant: "destructive"
      });
      setExtensions([]);
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      console.log('[ExtensionSelector] AMI connected, auto-fetching extensions');
      fetchExtensions();
    } else {
      console.log('[ExtensionSelector] AMI disconnected, clearing extensions');
      setExtensions([]);
    }
  }, [isConnected]);

  const handleManualSave = () => {
    if (manualExtension.trim()) {
      onChange(manualExtension.trim());
      
      // Save to localStorage for persistence
      localStorage.setItem('user_extension', manualExtension.trim());
      
      toast({
        title: "Extension Saved",
        description: `Extension ${manualExtension.trim()} has been saved`,
      });
      
      setManualMode(false);
      setManualExtension('');
    }
  };

  const getStatusBadge = (status: string) => {
    const isOnline = status.toLowerCase().includes('not_inuse') || 
                     status.toLowerCase().includes('inuse') || 
                     status.toLowerCase().includes('available');
    return (
      <Badge 
        variant={isOnline ? "default" : "secondary"}
        className={`ml-2 text-xs ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
      >
        {isOnline ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="extension">PJSIP Extension</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center" title={isConnected ? "AMI Connected" : "AMI Disconnected"}>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-600" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-600" />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManualMode(!manualMode)}
            className="h-7 px-2"
            title="Toggle manual entry mode"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExtensions}
            disabled={loading || !isConnected}
            className="h-7 px-2"
            title="Refresh PJSIP extensions"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {manualMode ? (
        <div className="flex gap-2">
          <Input
            value={manualExtension}
            onChange={(e) => setManualExtension(e.target.value)}
            placeholder="Enter extension number (e.g., 1000)"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={!manualExtension.trim()}
            className="px-3"
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setManualMode(false);
              setManualExtension('');
            }}
            className="px-3"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={
              !isConnected ? "AMI not connected - click edit to enter manually" : 
              loading ? "Loading extensions..." :
              extensions.length === 0 ? "No extensions found - click edit to enter manually" :
              "Select your extension"
            } />
          </SelectTrigger>
          <SelectContent>
            {extensions.length === 0 && isConnected && !loading ? (
              <SelectItem value="no-extensions" disabled>
                No extensions found - use manual entry
              </SelectItem>
            ) : (
              extensions.map((ext) => (
                <SelectItem key={ext.endpoint} value={ext.endpoint}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>PJSIP/{ext.endpoint}</span>
                    </div>
                    {getStatusBadge(ext.status)}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
      
      <div className="text-xs text-muted-foreground space-y-1">
        {manualMode && (
          <p className="text-blue-600">
            Manual Entry Mode: Enter your extension number and click save
          </p>
        )}
        
        {!manualMode && !isConnected && (
          <p className="text-red-600">Connect to AMI Bridge to load available PJSIP extensions or use manual entry</p>
        )}
        
        {!manualMode && isConnected && extensions.length > 0 && (
          <p className="text-green-600">
            {extensions.length} PJSIP extensions available
            {lastFetchTime && ` (last updated: ${lastFetchTime})`}
          </p>
        )}
        
        {!manualMode && isConnected && extensions.length === 0 && !loading && (
          <div className="text-yellow-600">
            <p>No extensions found. Use manual entry or check configuration.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionSelector;
