
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
import { emailService } from "@/services/emailService";

interface EmailPanelProps {
  contactEmail: string;
  setContactEmail: (email: string) => void;
  contactName?: string;
  phoneNumber?: string;
  leadId?: string;
}

const EmailPanel: React.FC<EmailPanelProps> = ({
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
  const [previewEmail, setPreviewEmail] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  const templates = emailService.getTemplates();

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

    if (!customSubject && !customBody) {
      toast({
        title: "Missing Content",
        description: "Please select a template or enter custom content.",
        variant: "destructive"
      });
      return;
    }

    let emailToPreview = {
      to: contactEmail,
      subject: customSubject || "No Subject",
      body: customBody || "No content",
      templateName: selectedTemplateId ? templates.find(t => t.id === selectedTemplateId)?.name : "Custom Email"
    };

    // Replace customer name if provided
    if (contactName) {
      emailToPreview.body = emailToPreview.body.replace(/Dear Customer/g, `Dear ${contactName}`);
    }

    setPreviewEmail(emailToPreview);
    setShowPreview(true);
  };

  const handleSend = async () => {
    if (!previewEmail) return;

    if (!emailService.isConfigured()) {
      toast({
        title: "Email Not Configured",
        description: "Please configure EmailJS in Integration Settings first.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      const result = await emailService.sendEmail({
        to: previewEmail.to,
        subject: previewEmail.subject,
        body: previewEmail.body,
        from_name: user?.name,
        from_email: user?.email
      });
      
      if (result.success) {
        emailService.logEmail(previewEmail, 'sent');

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
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      emailService.logEmail(previewEmail, 'failed', errorMessage);
      
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

            {!emailService.isConfigured() && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700">
                EmailJS not configured. Go to Integration Settings to set up email service.
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
                  <strong>Ready to send:</strong> This email will be sent via EmailJS to {previewEmail.to}
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

export default EmailPanel;
