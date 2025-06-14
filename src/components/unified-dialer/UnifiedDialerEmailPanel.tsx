
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Mail, ChevronUp, ChevronDown, Eye, Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type EmailPanelProps = {
  isEmailExpanded: boolean;
  setIsEmailExpanded: (v: boolean) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (v: string) => void;
  getEmailTemplates: () => any[];
  prepareEmailPreview: () => void;
  showEmailPreview: boolean;
  setShowEmailPreview: (v: boolean) => void;
  emailPreviewData: any;
  sendEmailTemplate: () => void;
  contactName?: string;
  phoneNumber?: string;
};

const UnifiedDialerEmailPanel: React.FC<EmailPanelProps> = ({
  isEmailExpanded,
  setIsEmailExpanded,
  contactEmail,
  setContactEmail,
  selectedTemplate,
  setSelectedTemplate,
  getEmailTemplates,
  prepareEmailPreview,
  showEmailPreview,
  setShowEmailPreview,
  emailPreviewData,
  sendEmailTemplate,
  contactName,
  phoneNumber,
}) => {
  // Auto-populate email field when contact name or phone changes
  React.useEffect(() => {
    if (phoneNumber && !contactEmail) {
      // Try to find lead with this phone number and get their email
      const leads = JSON.parse(localStorage.getItem('leads') || '[]');
      const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const matchedLead = leads.find((lead: any) => {
        const leadPhone = (lead.phone || '').replace(/[\s\-\(\)]/g, '');
        return leadPhone === normalizedPhone;
      });
      
      if (matchedLead && matchedLead.email) {
        setContactEmail(matchedLead.email);
      }
    }
  }, [phoneNumber, contactEmail, setContactEmail]);

  return (
    <Collapsible open={isEmailExpanded} onOpenChange={setIsEmailExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-between p-3 h-auto">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Send Email Template</span>
          </div>
          {isEmailExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-b-lg border-t-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="Email address"
              className="text-sm"
            />
            <div className="relative">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent side="top" className="z-50 bg-white shadow-lg border">
                  {getEmailTemplates().map((template: any) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={prepareEmailPreview}
              disabled={!contactEmail || !selectedTemplate}
              className="w-full"
              size="sm"
              variant="outline"
            >
              <Eye className="h-3 w-3 mr-2" />
              Preview
            </Button>
            <Button
              onClick={prepareEmailPreview}
              disabled={!contactEmail || !selectedTemplate}
              className="w-full"
              size="sm"
            >
              <Send className="h-3 w-3 mr-2" />
              Send Email
            </Button>
          </div>
          {getEmailTemplates().length === 0 && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-700">
              No email templates found. Please create templates in Integration Settings first.
            </div>
          )}
          {contactEmail && contactName && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <strong>Contact:</strong> {contactName} ({contactEmail})
            </div>
          )}
        </div>
      </CollapsibleContent>
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview
            </DialogTitle>
          </DialogHeader>
          {emailPreviewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">To:</span>
                  <p className="bg-gray-50 p-2 rounded">{emailPreviewData.to}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Template:</span>
                  <p className="bg-gray-50 p-2 rounded">{emailPreviewData.templateName}</p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Subject:</span>
                <p className="bg-gray-50 p-2 rounded mt-1">{emailPreviewData.subject}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Message:</span>
                <div className="bg-white border rounded mt-1 p-3 max-h-64 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: emailPreviewData.body.replace(/\n/g, "<br/>") }} />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> A copy of this email notification will be sent to Discord with sender and recipient information.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmailPreview(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={sendEmailTemplate}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
};

export default UnifiedDialerEmailPanel;
