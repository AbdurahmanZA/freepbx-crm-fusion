
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailJSConfigCard from "@/components/integration/EmailJSConfigCard";
import DiscordWebhookCard from "@/components/integration/DiscordWebhookCard";
import FreePBXAPICard from "@/components/integration/FreePBXAPICard";
import SMTPConfigCard from "@/components/integration/SMTPConfigCard";
import DatabaseConfigCard from "@/components/integration/DatabaseConfigCard";
import { Settings, Mail, Database, Webhook, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

const IntegrationSettings = () => {
  const [freepbxConnectionStatus, setFreepbxConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [smtpConnectionStatus, setSmtpConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [databaseConnectionStatus, setDatabaseConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  
  const [discordConfig, setDiscordConfig] = useState({
    url: localStorage.getItem('discord_webhook') || '',
    channelName: localStorage.getItem('discord_channel') || '#leads',
    enabled: localStorage.getItem('discord_webhook_enabled') === 'true'
  });

  const [freepbxConfig, setFreepbxConfig] = useState({
    host: localStorage.getItem('freepbx_host') || '192.168.0.5',
    port: localStorage.getItem('freepbx_port') || '80',
    username: localStorage.getItem('freepbx_username') || 'admin',
    password: localStorage.getItem('freepbx_password') || 'amp111',
    apiKey: localStorage.getItem('freepbx_api_secret') || '7ecfaa830f88e7475f1010b2e446d6f6'
  });

  const [smtpConfig, setSmtpConfig] = useState({
    enabled: localStorage.getItem('smtp_enabled') === 'true',
    host: localStorage.getItem('smtp_host') || '',
    port: localStorage.getItem('smtp_port') || '587',
    username: localStorage.getItem('smtp_username') || '',
    password: localStorage.getItem('smtp_password') || '',
    encryption: localStorage.getItem('smtp_encryption') || 'tls',
    fromEmail: localStorage.getItem('smtp_from_email') || '',
    fromName: localStorage.getItem('smtp_from_name') || ''
  });

  const [databaseConfig, setDatabaseConfig] = useState({
    host: localStorage.getItem('db_host') || '',
    port: localStorage.getItem('db_port') || '3306',
    name: localStorage.getItem('db_name') || '',
    username: localStorage.getItem('db_username') || '',
    password: localStorage.getItem('db_password') || ''
  });

  const handleTestFreePBXConnection = async () => {
    setFreepbxConnectionStatus('testing');
    
    try {
      const response = await fetch(`http://${freepbxConfig.host}:${freepbxConfig.port}/admin/api/api/channels`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${freepbxConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setFreepbxConnectionStatus('connected');
        console.log('FreePBX REST API connection successful');
      } else {
        setFreepbxConnectionStatus('disconnected');
        console.error('FreePBX REST API connection failed:', response.statusText);
      }
    } catch (error) {
      setFreepbxConnectionStatus('disconnected');
      console.error('FreePBX REST API connection error:', error);
    }
  };

  const handleTestSMTPConnection = async () => {
    setSmtpConnectionStatus('testing');
    setTimeout(() => {
      setSmtpConnectionStatus('disconnected');
    }, 2000);
    return false;
  };

  const handleTestDatabaseConnection = () => {
    setDatabaseConnectionStatus('testing');
    setTimeout(() => {
      setDatabaseConnectionStatus('disconnected');
    }, 2000);
  };

  const handleDiscordConfigUpdate = (field: string, value: string | boolean) => {
    if (field === 'enabled') {
      localStorage.setItem('discord_webhook_enabled', value.toString());
    } else if (field === 'url') {
      localStorage.setItem('discord_webhook', value as string);
    } else if (field === 'channelName') {
      localStorage.setItem('discord_channel', value as string);
    }
    
    setDiscordConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFreePBXConfigUpdate = (field: string, value: string) => {
    const storageKey = field === 'apiKey' ? 'freepbx_api_secret' : `freepbx_${field.toLowerCase()}`;
    localStorage.setItem(storageKey, value);
    setFreepbxConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSMTPConfigUpdate = (field: string, value: any) => {
    localStorage.setItem(`smtp_${field.toLowerCase()}`, value.toString());
    setSmtpConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDatabaseConfigUpdate = (field: string, value: string) => {
    localStorage.setItem(`db_${field.toLowerCase()}`, value);
    setDatabaseConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Integration Settings</h2>
        <p className="text-muted-foreground">
          Configure external services and integrations for your CRM system.
        </p>
      </div>

      <Tabs defaultValue="telephony" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="telephony" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telephony
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Service
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="telephony" className="space-y-4">
          <FreePBXAPICard 
            config={freepbxConfig}
            connectionStatus={freepbxConnectionStatus}
            onConfigUpdate={handleFreePBXConfigUpdate}
            onTestConnection={handleTestFreePBXConnection}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailJSConfigCard />
          <SMTPConfigCard 
            config={smtpConfig}
            onConfigUpdate={handleSMTPConfigUpdate}
            onTestConnection={handleTestSMTPConnection}
            connectionStatus={smtpConnectionStatus}
          />
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <DiscordWebhookCard 
            config={discordConfig}
            onConfigUpdate={handleDiscordConfigUpdate}
          />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseConfigCard 
            config={databaseConfig}
            connectionStatus={databaseConnectionStatus}
            onConfigUpdate={handleDatabaseConfigUpdate}
            onTestConnection={handleTestDatabaseConnection}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Webhook endpoints and integration settings will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationSettings;
