
export interface SimpleEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'form-link' | 'quote-request' | 'follow-up' | 'service' | 'billing' | 'custom';
}

export interface EmailToSend {
  to: string;
  subject: string;
  body: string;
  templateName?: string;
}

export interface EmailSendLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  templateName?: string;
  dateSent: string;
  agent: string;
  leadId?: string;
  leadName?: string;
  phone?: string;
}

const EMAIL_TEMPLATES_KEY = "simple_email_templates";
const EMAIL_LOGS_KEY = "simple_email_logs";

export class SimpleEmailService {
  
  // Template Management
  getTemplates(): SimpleEmailTemplate[] {
    try {
      const saved = localStorage.getItem(EMAIL_TEMPLATES_KEY);
      return saved ? JSON.parse(saved) : this.getDefaultTemplates();
    } catch {
      return this.getDefaultTemplates();
    }
  }

  saveTemplates(templates: SimpleEmailTemplate[]) {
    localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(templates));
  }

  private getDefaultTemplates(): SimpleEmailTemplate[] {
    return [
      {
        id: '1',
        name: 'Customer Information Form',
        subject: 'Please Complete Your Information',
        body: `Dear Customer,

Thank you for your interest in our services. Please complete the customer information form using the link below:

[FORM LINK WILL BE PROVIDED]

This will help us provide you with the best possible service tailored to your needs.

Best regards,
Our Team`,
        category: 'form-link'
      },
      {
        id: '2',
        name: 'Quote Request Follow-up',
        subject: 'Your Quote Request - Next Steps',
        body: `Dear Customer,

Thank you for requesting a quote from us. We've prepared a customized proposal based on your requirements.

Please review the information and let us know if you have any questions.

We look forward to working with you!

Best regards,
Our Team`,
        category: 'quote-request'
      },
      {
        id: '3',
        name: 'Service Follow-up',
        subject: 'Thank you for choosing our services',
        body: `Dear Customer,

Thank you for choosing our services. We wanted to follow up and ensure everything is meeting your expectations.

If you have any questions or need assistance, please don't hesitate to reach out.

Best regards,
Our Team`,
        category: 'follow-up'
      }
    ];
  }

  // Email Preparation
  prepareEmail(templateId: string, recipientEmail: string, customizations?: {
    customerName?: string;
    customSubject?: string;
    customBody?: string;
  }): EmailToSend | null {
    const templates = this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) return null;
    
    let subject = customizations?.customSubject || template.subject;
    let body = customizations?.customBody || template.body;
    
    // Simple replacements if customer name is provided
    if (customizations?.customerName) {
      body = body.replace(/Dear Customer/g, `Dear ${customizations.customerName}`);
    }
    
    return {
      to: recipientEmail,
      subject,
      body,
      templateName: template.name
    };
  }

  // Email Logging
  logEmail(emailData: Omit<EmailSendLog, 'id' | 'dateSent'> & { dateSent?: string }) {
    const logs = this.getEmailLogs();
    const newLog: EmailSendLog = {
      ...emailData,
      id: `email_${Date.now()}`,
      dateSent: emailData.dateSent || new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(logs));
    return newLog;
  }

  getEmailLogs(): EmailSendLog[] {
    try {
      return JSON.parse(localStorage.getItem(EMAIL_LOGS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  getEmailLogsForContact(email: string): EmailSendLog[] {
    return this.getEmailLogs().filter(log => log.to.toLowerCase() === email.toLowerCase());
  }
}

export const simpleEmailService = new SimpleEmailService();
