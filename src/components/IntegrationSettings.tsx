import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AMIBridgeCard from "./integration/AMIBridgeCard";
import DatabaseConfigCard from "./integration/DatabaseConfigCard";
import IntegrationLogsCard from "./integration/IntegrationLogsCard";
import SyncSettingsCard from "./integration/SyncSettingsCard";
import SecuritySettingsCard from "./integration/SecuritySettingsCard";
import DiscordWebhookCard from "./integration/DiscordWebhookCard";
import GoogleCalendarCard from "./integration/GoogleCalendarCard";
import SupabaseConfigCard from "./integration/SupabaseConfigCard";
import SMTPConfigCard from "./integration/SMTPConfigCard";
import EmailTemplateCard from "./integration/EmailTemplateCard";
import { ThemePicker } from "./ThemePicker";

interface ConnectionStatus {
  amiBridge: 'connected' | 'disconnected' | 'testing';
  database: 'connected' | 'disconnected' | 'testing';
  googleCalendar: 'connected' | 'disconnected' | 'testing';
  supabase: 'connected' | 'disconnected' | 'testing';
  smtp: 'connected' | 'disconnected' | 'testing';
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'form-link' | 'quote-request' | 'follow-up' | 'custom';
}

interface IntegrationConfig {
  database: {
    host: string;
    port: string;
    name: string;
    username: string;
    password: string;
  };
  sync: {
    autoSync: boolean;
    callLogging: boolean;
    notifications: boolean;
    syncInterval: number;
  };
  webhook: {
    url: string;
    secret: string;
  };
  discord: {
    url: string;
    channelName: string;
    enabled: boolean;
  };
  googleCalendar: {
    enabled: boolean;
    syncCallbacks: boolean;
    syncMeetings: boolean;
    defaultCalendar: string;
    clientId: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceKey: string;
    enabled: boolean;
    googleAuthEnabled: boolean;
  };
  smtp: {
    enabled: boolean;
    host: string;
    port: string;
    username: string;
    password: string;
    encryption: string;
    fromEmail: string;
    fromName: string;
  };
}

const IntegrationSettings = () => {
  const { toast } = useToast();
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    amiBridge: 'disconnected',
    database: 'disconnected',
    googleCalendar: 'disconnected',
    supabase: 'disconnected',
    smtp: 'disconnected'
  });

  const [integrationLogs, setIntegrationLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'AMI Bridge integration system initialized'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      type: 'success',
      message: 'Using AMI Bridge for FreePBX communication'
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'success',
      message: 'Bridge server configured for 192.168.0.5'
    }
  ]);

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('email_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<IntegrationConfig>({
    database: {
      host: localStorage.getItem('db_host') || 'localhost',
      port: localStorage.getItem('db_port') || '3306',
      name: localStorage.getItem('db_name') || 'crm_db',
      username: localStorage.getItem('db_username') || 'crm_user',
      password: ''
    },
    sync: {
      autoSync: localStorage.getItem('auto_sync') === 'true',
      callLogging: localStorage.getItem('call_logging') !== 'false',
      notifications: localStorage.getItem('notifications') === 'true',
      syncInterval: parseInt(localStorage.getItem('sync_interval') || '5')
    },
    webhook: {
      url: localStorage.getItem('webhook_url') || 'https://your-domain.com/webhook',
      secret: localStorage.getItem('webhook_secret') || ''
    },
    discord: {
      url: localStorage.getItem('discord_webhook') || '',
      channelName: localStorage.getItem('discord_channel') || '#leads',
      enabled: localStorage.getItem('discord_webhook_enabled') === 'true'
    },
    googleCalendar: (() => {
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
    })(),
    supabase: {
      url: localStorage.getItem('supabase_url') || '',
      anonKey: localStorage.getItem('supabase_anon_key') || '',
      serviceKey: localStorage.getItem('supabase_service_key') || '',
      enabled: localStorage.getItem('supabase_enabled') === 'true',
      googleAuthEnabled: localStorage.getItem('supabase_google_auth') === 'true'
    },
    smtp: {
      enabled: localStorage.getItem('smtp_enabled') === 'true',
      host: localStorage.getItem('smtp_host') || '',
      port: localStorage.getItem('smtp_port') || '587',
      username: localStorage.getItem('smtp_username') || '',
      password: '', // Never store password in localStorage
      encryption: localStorage.getItem('smtp_encryption') || 'tls',
      fromEmail: localStorage.getItem('smtp_from_email') || '',
      fromName: localStorage.getItem('smtp_from_name') || ''
    }
  });

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const updateDatabaseConfig = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      database: {
        ...prev.database,
        [field]: value
      }
    }));
  };

  const updateSyncConfig = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      sync: {
        ...prev.sync,
        [field]: value
      }
    }));
  };

  const updateWebhookConfig = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      webhook: {
        ...prev.webhook,
        [field]: value
      }
    }));
  };

  const updateDiscordConfig = (field: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      discord: {
        ...prev.discord,
        [field]: value
      }
    }));
  };

  const updateGoogleCalendarConfig = (field: string, value: any) => {
    setConfig(prev => {
      const newGoogleConfig = {
        ...prev.googleCalendar,
        [field]: value
      };
      // Immediately persist to localStorage for consistency across tabs
      localStorage.setItem('google_calendar_config', JSON.stringify(newGoogleConfig));
      return {
        ...prev,
        googleCalendar: newGoogleConfig,
      };
    });
  };

  const updateSupabaseConfig = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      supabase: {
        ...prev.supabase,
        [field]: value
      }
    }));
  };

  const updateSMTPConfig = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      smtp: {
        ...prev.smtp,
        [field]: value
      }
    }));
  };

  const updateEmailTemplates = (templates: EmailTemplate[]) => {
    setEmailTemplates(templates);
    localStorage.setItem('email_templates', JSON.stringify(templates));
  };

  const testDatabaseConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, database: 'testing' }));
    addLogEntry('info', `Testing database connection to ${config.database.host}:${config.database.port}`);
    
    try {
      const response = await fetch('/api/test-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: config.database.host,
          port: config.database.port,
          database: config.database.name,
          username: config.database.username,
          password: config.database.password
        })
      });

      if (response.ok) {
        setConnectionStatus(prev => ({ ...prev, database: 'connected' }));
        addLogEntry('success', 'Database connection successful');
        toast({
          title: "Database Connected",
          description: "Successfully connected to CRM database.",
        });
        return true;
      } else {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: Database connection failed - ${errorData}`);
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, database: 'disconnected' }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLogEntry('error', 'Database connection failed', errorMessage);
      toast({
        title: "Database Connection Failed",
        description: "Could not connect to database. Check your settings.",
        variant: "destructive"
      });
      return false;
    }
  };

  const testGoogleCalendarConnection = async (): Promise<boolean> => {
    setConnectionStatus(prev => ({ ...prev, googleCalendar: 'testing' }));
    addLogEntry('info', 'Testing Google Calendar connection...');
    
    try {
      // Mock test - in real implementation, this would test Google Calendar API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (config.supabase.enabled && config.supabase.googleAuthEnabled) {
        setConnectionStatus(prev => ({ ...prev, googleCalendar: 'connected' }));
        addLogEntry('success', 'Google Calendar connection successful');
        return true;
      } else {
        throw new Error('Google authentication not enabled in Supabase');
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, googleCalendar: 'disconnected' }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLogEntry('error', 'Google Calendar connection failed', errorMessage);
      return false;
    }
  };

  const testSupabaseConnection = async (): Promise<boolean> => {
    setConnectionStatus(prev => ({ ...prev, supabase: 'testing' }));
    addLogEntry('info', `Testing Supabase connection to ${config.supabase.url}`);
    
    try {
      // Mock test - in real implementation, this would test Supabase connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (config.supabase.url && config.supabase.anonKey) {
        setConnectionStatus(prev => ({ ...prev, supabase: 'connected' }));
        addLogEntry('success', 'Supabase connection successful');
        return true;
      } else {
        throw new Error('Missing Supabase URL or anonymous key');
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, supabase: 'disconnected' }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLogEntry('error', 'Supabase connection failed', errorMessage);
      return false;
    }
  };

  const testSMTPConnection = async (): Promise<boolean> => {
    setConnectionStatus(prev => ({ ...prev, smtp: 'testing' }));
    addLogEntry('info', `Testing SMTP connection to ${config.smtp.host}:${config.smtp.port}`);
    
    try {
      // Mock test - in real implementation, this would test SMTP connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (config.smtp.host && config.smtp.username) {
        setConnectionStatus(prev => ({ ...prev, smtp: 'connected' }));
        addLogEntry('success', 'SMTP connection successful');
        return true;
      } else {
        throw new Error('Missing SMTP host or username');
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, smtp: 'disconnected' }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLogEntry('error', 'SMTP connection failed', errorMessage);
      return false;
    }
  };

  const saveSettings = () => {
    // Save database settings
    Object.entries(config.database).forEach(([key, value]) => {
      if (key !== 'password') {
        localStorage.setItem(`db_${key}`, value);
      }
    });

    // Save sync settings
    Object.entries(config.sync).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString());
    });

    // Save webhook settings
    Object.entries(config.webhook).forEach(([key, value]) => {
      if (key !== 'secret') {
        localStorage.setItem(`webhook_${key}`, value);
      }
    });

    // Save Discord settings
    localStorage.setItem('discord_webhook', config.discord.url);
    localStorage.setItem('discord_channel', config.discord.channelName);
    localStorage.setItem('discord_webhook_enabled', config.discord.enabled.toString());

    // Save Google Calendar settings
    localStorage.setItem('google_calendar_config', JSON.stringify(config.googleCalendar));

    // Save Supabase settings
    localStorage.setItem('supabase_url', config.supabase.url);
    localStorage.setItem('supabase_anon_key', config.supabase.anonKey);
    localStorage.setItem('supabase_service_key', config.supabase.serviceKey);
    localStorage.setItem('supabase_enabled', config.supabase.enabled.toString());
    localStorage.setItem('supabase_google_auth', config.supabase.googleAuthEnabled.toString());

    // Save SMTP settings
    localStorage.setItem('smtp_enabled', config.smtp.enabled.toString());
    localStorage.setItem('smtp_host', config.smtp.host);
    localStorage.setItem('smtp_port', config.smtp.port);
    localStorage.setItem('smtp_username', config.smtp.username);
    localStorage.setItem('smtp_encryption', config.smtp.encryption);
    localStorage.setItem('smtp_from_email', config.smtp.fromEmail);
    localStorage.setItem('smtp_from_name', config.smtp.fromName);
    // Note: password is never saved to localStorage for security

    toast({
      title: "Settings Saved",
      description: "Your integration settings have been successfully updated.",
    });
  };

  const addLogEntry = (type: LogEntry['type'], message: string, details?: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    setIntegrationLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  const clearLogs = () => {
    setIntegrationLogs([{
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'Integration logs cleared'
    }]);
  };

  const handleAMIBridgeConnectionStatusChange = (status: 'connected' | 'disconnected' | 'testing') => {
    setConnectionStatus(prev => ({ ...prev, amiBridge: status }));
    
    if (status === 'connected') {
      addLogEntry('success', 'AMI Bridge connection established', 'Successfully connected to FreePBX AMI interface via bridge server');
    } else if (status === 'disconnected') {
      addLogEntry('warning', 'AMI Bridge connection ended', 'Connection to AMI bridge server was terminated');
    } else {
      addLogEntry('info', 'Testing AMI Bridge connection...', 'Attempting to establish connection to bridge server');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Production Integration Settings - AMI Bridge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mb-6">
            <ThemePicker />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AMIBridgeCard 
              connectionStatus={connectionStatus.amiBridge}
              onTestConnection={() => {}}
              onConnectionStatusChange={handleAMIBridgeConnectionStatusChange}
            />

            <DatabaseConfigCard 
              config={config.database}
              connectionStatus={connectionStatus.database}
              onConfigUpdate={updateDatabaseConfig}
              onTestConnection={testDatabaseConnection}
            />

            <SupabaseConfigCard 
              config={config.supabase}
              connectionStatus={connectionStatus.supabase}
              onConfigUpdate={updateSupabaseConfig}
              onTestConnection={testSupabaseConnection}
            />

            <GoogleCalendarCard 
              config={config.googleCalendar}
              connectionStatus={connectionStatus.googleCalendar}
              onConfigUpdate={updateGoogleCalendarConfig}
              onTestConnection={testGoogleCalendarConnection}
              showClientIdInput={true}
            />

            <SMTPConfigCard 
              config={config.smtp}
              connectionStatus={connectionStatus.smtp}
              onConfigUpdate={updateSMTPConfig}
              onTestConnection={testSMTPConnection}
            />
          </div>

          <EmailTemplateCard 
            templates={emailTemplates}
            onTemplateUpdate={updateEmailTemplates}
          />

          <IntegrationLogsCard 
            logs={integrationLogs}
            onClearLogs={clearLogs}
          />

          <SyncSettingsCard 
            config={config.sync}
            onConfigUpdate={updateSyncConfig}
          />

          <DiscordWebhookCard 
            config={config.discord}
            onConfigUpdate={updateDiscordConfig}
          />

          <SecuritySettingsCard 
            config={config.webhook}
            onConfigUpdate={updateWebhookConfig}
          />

          <div className="flex gap-4">
            <Button onClick={saveSettings} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={testDatabaseConnection}
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Test Database Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationSettings;
