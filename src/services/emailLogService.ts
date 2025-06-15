
// Legacy email log service - kept for backward compatibility
// New code should use simpleEmailService instead

export interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  body: string;
  templateName?: string;
  dateSent: string; // ISO
  agent: string; // who sent the email
  leadId?: string;
  leadName?: string;
  phone?: string;
  extra?: any;
}

const EMAIL_LOG_KEY = "crm_email_logs";

export class EmailLogService {
  private key = EMAIL_LOG_KEY;

  logEmail(email: Omit<EmailLog, "id" | "dateSent"> & { dateSent?: string }) {
    console.warn("EmailLogService is deprecated. Use simpleEmailService instead.");
    const logs = this.getAll();
    const newLog: EmailLog = {
      ...email,
      id: `email_${Date.now()}`,
      dateSent: email.dateSent || new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(this.key, JSON.stringify(logs));
  }

  getAll(): EmailLog[] {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "[]");
    } catch {
      return [];
    }
  }

  getByLeadId(leadId: string): EmailLog[] {
    return this.getAll().filter(l => l.leadId === leadId);
  }

  getByEmail(email: string): EmailLog[] {
    return this.getAll().filter(l => l.to === email);
  }
}

export const emailLogService = new EmailLogService();
