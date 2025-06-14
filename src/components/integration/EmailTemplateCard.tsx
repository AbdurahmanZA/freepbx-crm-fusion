
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'form-link' | 'quote-request' | 'follow-up' | 'service-signup' | 'details-update' | 'invoice-statement' | 'custom';
}

interface EmailTemplateCardProps {
  templates: EmailTemplate[];
  onTemplateUpdate: (templates: EmailTemplate[]) => void;
}

const EmailTemplateCard = ({ templates, onTemplateUpdate }: EmailTemplateCardProps) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});

  const defaultTemplates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Customer Information Form',
      subject: 'Please Complete Your Information',
      body: `Dear {{customerName}},

Thank you for your interest in our services. Please complete the customer information form using the link below:

{{formLink}}

This will help us provide you with the best possible service tailored to your needs.

Best regards,
{{companyName}}`,
      type: 'form-link'
    },
    {
      id: '2',
      name: 'Quote Request Follow-up',
      subject: 'Your Quote Request - Next Steps',
      body: `Dear {{customerName}},

Thank you for requesting a quote from us. We've prepared a customized proposal based on your requirements.

Please review the attached quote and let us know if you have any questions: {{formLink}}

We look forward to working with you!

Best regards,
{{companyName}}`,
      type: 'quote-request'
    },
    {
      id: '3',
      name: 'New Service Sign Up',
      subject: 'Welcome! Complete Your Service Registration',
      body: `Dear {{customerName}},

Welcome to {{companyName}}! We're excited to have you as a new customer.

To complete your service registration and get started, please fill out the form below:

{{formLink}}

Our team will review your information and contact you within 24 hours to finalize your service setup.

If you have any questions, feel free to reach out to us at {{phone}} or {{email}}.

Best regards,
{{companyName}} Team`,
      type: 'service-signup'
    },
    {
      id: '4',
      name: 'Details Update Form',
      subject: 'Please Update Your Account Information',
      body: `Dear {{customerName}},

We need to update your account information to ensure uninterrupted service.

Please take a moment to review and update your details using the secure form below:

{{formLink}}

This will only take a few minutes and helps us serve you better.

Thank you for your prompt attention to this matter.

Best regards,
{{companyName}} Customer Service`,
      type: 'details-update'
    },
    {
      id: '5',
      name: 'Latest Invoice and Statement Balance',
      subject: 'Your Latest Invoice and Account Statement',
      body: `Dear {{customerName}},

Your latest invoice and account statement are now available for review.

Please access your account information and current balance using the secure link below:

{{formLink}}

Current Account Summary:
- Account Number: {{accountNumber}}
- Statement Date: {{statementDate}}
- Total Balance: {{totalBalance}}

If you have any questions about your statement or need assistance with payment options, please contact us at {{phone}} or {{email}}.

Thank you for choosing {{companyName}}.

Best regards,
{{companyName}} Billing Department`,
      type: 'invoice-statement'
    }
  ];

  const currentTemplates = templates.length > 0 ? templates : defaultTemplates;

  const handleAddTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      subject: 'Subject Line',
      body: 'Email body content...',
      type: 'custom'
    };
    setSelectedTemplate(newTemplate);
    setEditForm(newTemplate);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm(template);
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (!editForm.name || !editForm.subject || !editForm.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const updatedTemplate = { ...editForm } as EmailTemplate;
    let updatedTemplates;

    if (selectedTemplate && currentTemplates.find(t => t.id === selectedTemplate.id)) {
      // Update existing template
      updatedTemplates = currentTemplates.map(t => 
        t.id === selectedTemplate.id ? updatedTemplate : t
      );
    } else {
      // Add new template
      updatedTemplates = [...currentTemplates, updatedTemplate];
    }

    onTemplateUpdate(updatedTemplates);
    setIsEditing(false);
    setSelectedTemplate(null);
    setEditForm({});

    toast({
      title: "Template Saved",
      description: "Email template has been saved successfully.",
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = currentTemplates.filter(t => t.id !== templateId);
    onTemplateUpdate(updatedTemplates);
    
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
      setEditForm({});
      setIsEditing(false);
    }

    toast({
      title: "Template Deleted",
      description: "Email template has been deleted.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Email Templates
          <Button size="sm" onClick={handleAddTemplate} className="ml-auto">
            <Plus className="h-4 w-4 mr-1" />
            Add Template
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label>Available Templates</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currentTemplates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.type}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={template.id === '1' || template.id === '2' || template.id === '3' || template.id === '4' || template.id === '5'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="Template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Type</Label>
                <Select value={editForm.type} onValueChange={(value) => setEditForm(prev => ({...prev, type: value as any}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form-link">Form Link</SelectItem>
                    <SelectItem value="quote-request">Quote Request</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="service-signup">Service Sign Up</SelectItem>
                    <SelectItem value="details-update">Details Update</SelectItem>
                    <SelectItem value="invoice-statement">Invoice Statement</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-subject">Subject</Label>
                <Input
                  id="template-subject"
                  value={editForm.subject || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, subject: e.target.value}))}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-body">Email Body</Label>
                <Textarea
                  id="template-body"
                  value={editForm.body || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, body: e.target.value}))}
                  placeholder="Email content... Use template variables like {{customerName}}, {{formLink}}, etc."
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Template
                </Button>
                <Button variant="outline" onClick={() => {setIsEditing(false); setEditForm({}); setSelectedTemplate(null);}}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700">
            <strong>Available Variables:</strong> {`{{customerName}}, {{formLink}}, {{companyName}}, {{phone}}, {{email}}, {{accountNumber}}, {{statementDate}}, {{totalBalance}}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateCard;
