
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, ChevronDown, ChevronUp, Eye, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { simpleEmailService, EmailToSend } from "@/services/simpleEmailService";

interface SimpleEmailPanelProps {
  contactEmail: string;
  setContactEmail: (email: string) => void;
  contactName?: string;
  phoneNumber?: string;
  leadId?: string;
}

const SimpleEmailPanel: React.FC<SimpleEmailPanelProps> = ({
  contactEmail,
  setContactEmail,
  contactName,
  phoneNumber,
  leadId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<EmailToSend | null>(null);
  const [isSending, setIsSending] = useState(false);

  const templates = simpleEmailService.getTemplates();

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomBody(template.body);
    }
  };

  const handlePreview = () => {
    if (!contactEmail.trim()) {
      toast({
        title: "Missing Email",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTemplateId && !customSubject && !customBody) {
      toast({
        title: "Missing Content",
        description: "Please select a template or enter custom content.",
        variant: "destructive"
      });
      return;
    }

    let emailToPreview: EmailToSend;

    if (selectedTemplateId) {
      const prepared = simpleEmailService.prepareEmail(selectedTemplateId, contactEmail, {
        customerName: contactName,
        customSubject: customSubject || undefined,
        customBody: customBody || undefined
      });
      if (!prepared) {
        toast({
          title: "Error",
          description: "Failed to prepare email from template.",
          variant: "destructive"
        });
        return;
      }
      emailToPreview = prepared;
    } else {
      emailToPreview = {
        to: contactEmail,
        subject: customSubject || "No Subject",
        body: customBody || "No content",
        templateName: "Custom Email"
      };
    }

    setPreviewEmail(emailToPreview);
    setShowPreview(true);
  };

  const logEmailSent = (email: EmailToSend, status: 'sent' | 'failed', errorMessage?: string) => {
    const logs = JSON.parse(localStorage.getItem('email_send_logs') || '[]');
    const newLog = {
      id: `email_${Date.now()}`,
      timestamp: new Date().toISOString(),
      to: email.to,
      subject: email.subject,
      status,
      template: email.templateName,
      errorMessage
    };
    logs.unshift(newLog);
    localStorage.setItem('email_send_logs', JSON.stringify(logs.slice(0, 50))); // Keep last 50 logs
  };

  const handleSend = async () => {
    if (!previewEmail) return;

    setIsSending(true);
    
    try {
      console.log('📧 [SimpleEmailPanel] Starting email send process');
      console.log('📧 [SimpleEmailPanel] Preview email data:', previewEmail);
      console.log('📧 [SimpleEmailPanel] User data:', user);

      const emailPayload = {
        to: previewEmail.to,
        subject: previewEmail.subject,
        body: previewEmail.body,
        fromEmail: user?.email,
        fromName: user?.name
      };

      console.log('📧 [SimpleEmailPanel] Email payload:', emailPayload);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('📧 [SimpleEmailPanel] Response status:', response.status);
      console.log('📧 [SimpleEmailPanel] Response headers:', response.headers);

      const responseText = await response.text();
      console.log('📧 [SimpleEmailPanel] Raw response text:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📧 [SimpleEmailPanel] Parsed result:', result);
      } catch (parseError) {
        console.error('📧 [SimpleEmailPanel] JSON parse error:', parseError);
        console.error('📧 [SimpleEmailPanel] Response was not valid JSON:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (result.success) {
        // Log the email as sent
        simpleEmailService.logEmail({
          to: previewEmail.to,
          from: user?.email || "Unknown",
          subject: previewEmail.subject,
          body: previewEmail.body,
          templateName: previewEmail.templateName,
          agent: user?.name || "Unknown",
          leadId,
          leadName: contactName,
          phone: phoneNumber
        });

        logEmailSent(previewEmail, 'sent');

        toast({
          title: "Email Sent Successfully",
          description: `Email sent to ${previewEmail.to}`,
        });

        setShowPreview(false);
        setIsExpanded(false);
        
        // Reset form
        setSelectedTemplateId("");
        setCustomSubject("");
        setCustomBody("");
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('📧 [SimpleEmailPanel] Email send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logEmailSent(previewEmail, 'failed', errorMessage);
      
      toast({
        title: "Email Send Failed",
        description: `Could not send email: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Send Email</span>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-0">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-b-lg border-t-0 space-y-3">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Template (Optional)</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a template or write custom email" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={customBody}
                onChange={e => setCustomBody(e.target.value)}
                placeholder="Email content"
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={!contactEmail.trim()}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview & Send
              </Button>
            </div>

            {templates.length === 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700">
                No templates available. You can still send custom emails.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          
          {previewEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">To:</span>
                  <p className="bg-gray-50 p-2 rounded font-mono">{previewEmail.to}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Template:</span>
                  <p className="bg-gray-50 p-2 rounded">{previewEmail.templateName || "Custom"}</p>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Subject:</span>
                <p className="bg-gray-50 p-2 rounded mt-1">{previewEmail.subject}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Message:</span>
                <div className="bg-white border rounded mt-1 p-3 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {previewEmail.body}
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-sm text-green-700">
                  <strong>Ready to send:</strong> This email will be sent via SMTP to {previewEmail.to} and logged in your email history.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)} disabled={isSending}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimpleEmailPanel;
