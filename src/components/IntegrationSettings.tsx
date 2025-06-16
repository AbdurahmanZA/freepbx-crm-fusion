
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailJSConfigCard from "@/components/integration/EmailJSConfigCard";
import AsteriskAMICard from "@/components/integration/AsteriskAMICard";
import AMIBridgeCard from "@/components/integration/AMIBridgeCard";
import DiscordWebhookCard from "@/components/integration/DiscordWebhookCard";
import FreePBXAPICard from "@/components/integration/FreePBXAPICard";
import SMTPConfigCard from "@/components/integration/SMTPConfigCard";
import DatabaseConfigCard from "@/components/integration/DatabaseConfigCard";
import { Settings, Mail, Database, Webhook, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

const IntegrationSettings = () => {
  const [amiConnectionStatus, setAmiConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [discordConfig, setDiscordConfig] = useState({
    url: localStorage.getItem('discord_webhook') || '',
    channelName: localStorage.getItem('discord_channel') || '#leads',
    enabled: localStorage.getItem('discord_webhook_enabled') === 'true'
  });

  const handleTestAMIConnection = () => {
    console.log('Testing AMI connection...');
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
          <AsteriskAMICard 
            connectionStatus={amiConnectionStatus}
            onTestConnection={handleTestAMIConnection}
            onConnectionStatusChange={setAmiConnectionStatus}
          />
          <AMIBridgeCard 
            connectionStatus={amiConnectionStatus}
            onTestConnection={handleTestAMIConnection}
            onConnectionStatusChange={setAmiConnectionStatus}
          />
          <FreePBXAPICard />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <EmailJSConfigCard />
          <SMTPConfigCard />
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <DiscordWebhookCard 
            config={discordConfig}
            onConfigUpdate={handleDiscordConfigUpdate}
          />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseConfigCard />
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
