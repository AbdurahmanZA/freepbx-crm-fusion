
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink, Check, X, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailService } from "@/services/emailService";

const EmailJSConfigCard = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState(emailService.getConfig() || {
    serviceId: '',
    templateId: '',
    publicKey: ''
  });
  const [isTestSending, setIsTestSending] = useState(false);

  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const saveConfig = () => {
    if (!config.serviceId || !config.templateId || !config.publicKey) {
      toast({
        title: "Missing Information",
        description: "Please fill in all EmailJS configuration fields.",
        variant: "destructive"
      });
      return;
    }

    emailService.setConfig(config);
    toast({
      title: "Configuration Saved",
      description: "EmailJS configuration has been saved successfully."
    });
  };

  const testEmailService = async () => {
    if (!emailService.isConfigured()) {
      toast({
        title: "Not Configured",
        description: "Please configure EmailJS first.",
        variant: "destructive"
      });
      return;
    }

    setIsTestSending(true);
    try {
      const result = await emailService.sendEmail({
        to: 'test@example.com', // This won't actually send, just tests the connection
        subject: 'Test Email from CRM',
        body: 'This is a test email to verify EmailJS configuration.',
        from_name: 'CRM System'
      });

      if (result.success) {
        toast({
          title: "Test Successful",
          description: "EmailJS is configured correctly."
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test email configuration.",
        variant: "destructive"
      });
    } finally {
      setIsTestSending(false);
    }
  };

  const isConfigured = emailService.isConfigured();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          EmailJS Configuration
          <div className="flex items-center gap-1 ml-auto">
            {isConfigured ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                  Configured
                </Badge>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-500" />
                <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
                  Not Configured
                </Badge>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">EmailJS Setup</h4>
          <p className="text-sm text-blue-700 mb-3">
            EmailJS allows you to send emails directly from your frontend application without a backend server.
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <div>1. Create a free account at <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="underline">emailjs.com</a></div>
            <div>2. Create an email service (Gmail, Outlook, etc.)</div>
            <div>3. Create an email template with variables: to_email, subject, message, from_name</div>
            <div>4. Get your Service ID, Template ID, and Public Key</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.open('https://emailjs.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open EmailJS
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="serviceId">Service ID</Label>
            <Input
              id="serviceId"
              value={config.serviceId}
              onChange={(e) => handleConfigChange('serviceId', e.target.value)}
              placeholder="service_xxxxxxx"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="templateId">Template ID</Label>
            <Input
              id="templateId"
              value={config.templateId}
              onChange={(e) => handleConfigChange('templateId', e.target.value)}
              placeholder="template_xxxxxxx"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="publicKey">Public Key</Label>
            <Input
              id="publicKey"
              value={config.publicKey}
              onChange={(e) => handleConfigChange('publicKey', e.target.value)}
              placeholder="Your EmailJS public key"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={saveConfig} className="flex-1">
              Save Configuration
            </Button>
            <Button 
              onClick={testEmailService} 
              variant="outline"
              disabled={!isConfigured || isTestSending}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestSending ? 'Testing...' : 'Test'}
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Benefits of EmailJS</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• No backend server required</li>
            <li>• Free tier available (200 emails/month)</li>
            <li>• Works directly from the browser</li>
            <li>• Simple setup and configuration</li>
            <li>• Reliable email delivery</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailJSConfigCard;
