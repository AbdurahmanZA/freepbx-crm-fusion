
/**
 * Utilities for matching lead/contact data and filling email template variables.
 */
export interface Lead {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  status?: string;
  priority?: string;
  source?: string;
  assignedAgent?: string;
  lastContact?: string;
  notes?: string;
}

export interface TemplateVarsArgs {
  lead?: Lead | null;
  userName?: string;
  fallbackName?: string;
  fallbackPhone?: string;
  fallbackEmail?: string;
  fallbackCompany?: string;
  contactEmail?: string;
  phoneNumber?: string;
}

/**
 * Create a variable replacements object for email templates.
 */
export function buildTemplateVars({
  lead,
  userName,
  fallbackName,
  fallbackPhone,
  fallbackEmail,
  fallbackCompany,
  contactEmail,
  phoneNumber,
}: TemplateVarsArgs) {
  return {
    customerName: lead?.name || fallbackName || "Valued Customer",
    companyName: lead?.company || fallbackCompany || "Unknown Company",
    phone: lead?.phone || phoneNumber || fallbackPhone || "N/A",
    email: lead?.email || contactEmail || fallbackEmail || "N/A",
    assignedAgent: lead?.assignedAgent || userName || "CRM Agent",
    notes: lead?.notes || "",
    formLink: `${window.location.origin}/customer-form?lead=${lead?.id || ''}`,
    lastContact: lead?.lastContact || "",
    status: lead?.status || "",
    priority: lead?.priority || "",
    source: lead?.source || "",
  };
}

/**
 * Find a lead from phone or id (normalize for dashes/spaces).
 */
export function findMatchedLead({
  leads,
  phoneNumber,
  leadId,
}: {
  leads: Lead[];
  phoneNumber?: string;
  leadId?: string | number;
}): Lead | undefined {
  let phoneLookup = phoneNumber ? phoneNumber.replace(/[\s\-]/g, '') : '';
  let lead = undefined;
  if (leadId) {
    lead = leads.find((l) => l.id === leadId?.toString());
  }
  if (!lead && phoneLookup) {
    lead = leads.find(
      (l) => (l.phone || '').replace(/[\s\-]/g, '') === phoneLookup
    );
  }
  return lead;
}
