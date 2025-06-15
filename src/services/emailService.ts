
// Simple frontend email service using EmailJS
// No backend required - works directly from the browser

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  from_name?: string;
  from_email?: string;
}

class EmailService {
  private config: EmailConfig | null = null;

  // Initialize EmailJS configuration
  setConfig(config: EmailConfig) {
    this.config = config;
    localStorage.setItem('email_config', JSON.stringify(config));
  }

  getConfig(): EmailConfig | null {
    if (this.config) return this.config;
    
    try {
      const stored = localStorage.getItem('email_config');
      if (stored) {
        this.config = JSON.parse(stored);
        return this.config;
      }
    } catch (error) {
      console.error('Error loading email config:', error);
    }
    
    return null;
  }

  // Check if EmailJS is configured
  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config?.serviceId && config?.templateId && config?.publicKey);
  }

  // Send email using EmailJS
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Email service not configured. Please set up EmailJS in Integration Settings.'
      };
    }

    try {
      // Load EmailJS dynamically
      if (!window.emailjs) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
          window.emailjs.init(this.config!.publicKey);
        };
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise(resolve => {
          script.onload = resolve;
        });
      }

      const config = this.getConfig()!;
      
      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.body,
        from_name: emailData.from_name || 'CRM System',
        from_email: emailData.from_email || 'noreply@company.com',
        reply_to: emailData.from_email || 'noreply@company.com'
      };

      const response = await window.emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams
      );

      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  // Log email for history
  logEmail(emailData: EmailData, status: 'sent' | 'failed', error?: string) {
    try {
      const logs = JSON.parse(localStorage.getItem('email_logs') || '[]');
      const newLog = {
        id: `email_${Date.now()}`,
        timestamp: new Date().toISOString(),
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        status,
        error
      };
      logs.unshift(newLog);
      localStorage.setItem('email_logs', JSON.stringify(logs.slice(0, 100))); // Keep last 100
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  // Get email logs
  getEmailLogs() {
    try {
      return JSON.parse(localStorage.getItem('email_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Get email templates
  getTemplates(): EmailTemplate[] {
    try {
      const stored = localStorage.getItem('email_templates');
      return stored ? JSON.parse(stored) : this.getDefaultTemplates();
    } catch {
      return this.getDefaultTemplates();
    }
  }

  // Save email templates
  saveTemplates(templates: EmailTemplate[]) {
    localStorage.setItem('email_templates', JSON.stringify(templates));
  }

  private getDefaultTemplates(): EmailTemplate[] {
    return [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to Our Service',
        body: `Dear Customer,

Thank you for your interest in our services. We're excited to work with you!

Best regards,
Our Team`,
        category: 'welcome'
      },
      {
        id: '2',
        name: 'Follow-up Email',
        subject: 'Following Up on Your Inquiry',
        body: `Dear Customer,

We wanted to follow up on your recent inquiry. Please let us know if you have any questions.

Best regards,
Our Team`,
        category: 'follow-up'
      }
    ];
  }
}

// Global email service instance
export const emailService = new EmailService();

// Extend window object for EmailJS
declare global {
  interface Window {
    emailjs: any;
  }
}
