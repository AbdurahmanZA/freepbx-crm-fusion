
export interface KnowledgeModule {
  id: string;
  title: string;
  description: string;
  sections: KnowledgeSection[];
  requiresManagerAccess?: boolean;
  order: number;
}

export interface KnowledgeSection {
  id: string;
  title: string;
  content: string;
  steps?: KnowledgeStep[];
  tips?: string[];
  troubleshooting?: TroubleshootingItem[];
}

export interface KnowledgeStep {
  step: number;
  title: string;
  description: string;
  screenshot?: string;
}

export interface TroubleshootingItem {
  issue: string;
  solution: string;
}

export interface KnowledgeBaseData {
  version: string;
  lastUpdated: string;
  modules: KnowledgeModule[];
}

export const knowledgeBaseData: KnowledgeBaseData = {
  version: "2.2.0",
  lastUpdated: "2025-06-15",
  modules: [
    {
      id: "leads",
      title: "Lead Management",
      description: "Manage leads, contacts, and customer information effectively",
      order: 1,
      sections: [
        {
          id: "leads-overview",
          title: "Overview",
          content: "The Lead Management module is your central hub for managing potential customers and existing contacts. Here you can add, edit, and track leads through your sales process.",
          tips: [
            "Always fill in the phone number for leads to enable calling features",
            "Use the notes section to track important conversation details",
            "Regular lead follow-ups increase conversion rates by 35%",
            "Use the unified dialer to call directly from lead records"
          ]
        },
        {
          id: "leads-adding",
          title: "Adding New Leads",
          content: "Learn how to add new leads to your CRM system.",
          steps: [
            {
              step: 1,
              title: "Click Add New Lead",
              description: "Navigate to the Lead Management tab and click the 'Add New Lead' button in the top right."
            },
            {
              step: 2,
              title: "Fill in Lead Information",
              description: "Enter the lead's name, phone number, email, and company information. Phone number is required for calling features."
            },
            {
              step: 3,
              title: "Set Lead Status",
              description: "Choose the appropriate status: New, Contacted, Qualified, or Converted."
            },
            {
              step: 4,
              title: "Add Notes",
              description: "Include any relevant information about the lead, their needs, or conversation history."
            },
            {
              step: 5,
              title: "Save Lead",
              description: "Click 'Add Lead' to save the information to your database."
            }
          ]
        },
        {
          id: "leads-management",
          title: "Managing Existing Leads",
          content: "How to edit, update, and manage your existing leads.",
          steps: [
            {
              step: 1,
              title: "Find Your Lead",
              description: "Use the search function or browse through the leads list to find the lead you want to manage."
            },
            {
              step: 2,
              title: "Edit Lead Information",
              description: "Click the edit button to modify lead details, status, or notes."
            },
            {
              step: 3,
              title: "Call Directly",
              description: "Use the phone icon to initiate calls directly from the lead record."
            },
            {
              step: 4,
              title: "Schedule Callbacks",
              description: "Set up follow-up calls by clicking the calendar icon and selecting a date and time."
            }
          ],
          troubleshooting: [
            {
              issue: "Cannot edit lead information",
              solution: "Check your user permissions. Sales Representatives can only edit leads they created."
            },
            {
              issue: "Phone number not calling",
              solution: "Ensure AMI Bridge is connected and the phone number format is correct."
            }
          ]
        }
      ]
    },
    {
      id: "calls",
      title: "Call Center & Unified Dialer",
      description: "Make calls, manage call history, handle post-call actions, and use the unified dialer interface",
      order: 2,
      sections: [
        {
          id: "calls-overview",
          title: "Call Center Overview",
          content: "The Call Center module provides comprehensive calling capabilities including direct dialing, call history tracking, post-call actions, and the advanced unified dialer interface.",
          tips: [
            "Always test your AMI connection before starting calls",
            "Use the extension selector to choose your calling device",
            "Post-call actions help maintain accurate lead records",
            "The unified dialer provides a modern interface for all calling activities"
          ]
        },
        {
          id: "unified-dialer",
          title: "Using the Unified Dialer",
          content: "The unified dialer is an advanced interface that combines calling, lead management, and email functionality in one streamlined panel.",
          steps: [
            {
              step: 1,
              title: "Access Unified Dialer",
              description: "The unified dialer appears as a collapsible panel at the bottom of your screen when available."
            },
            {
              step: 2,
              title: "Make Calls",
              description: "Enter a phone number in the dialer or select from recent contacts to initiate calls."
            },
            {
              step: 3,
              title: "Manage Active Calls",
              description: "During calls, use the active call display to see call duration, hold/unhold, and access call controls."
            },
            {
              step: 4,
              title: "Post-Call Actions",
              description: "After calls end, quickly update lead status, add notes, schedule callbacks, or send follow-up emails."
            }
          ]
        },
        {
          id: "calls-making",
          title: "Making Calls",
          content: "Step-by-step guide to making calls through the system.",
          steps: [
            {
              step: 1,
              title: "Select Your Extension",
              description: "Choose your extension from the dropdown in the Call Center tab or unified dialer."
            },
            {
              step: 2,
              title: "Enter Phone Number",
              description: "Type the phone number you want to call in the dialer interface."
            },
            {
              step: 3,
              title: "Initiate Call",
              description: "Click the call button to start the call. Your extension will ring first, then the destination number."
            },
            {
              step: 4,
              title: "Handle Call",
              description: "Answer your extension when it rings, then the system will connect you to the destination."
            }
          ]
        },
        {
          id: "calls-history",
          title: "Call History Management",
          content: "Track and manage your call history and records.",
          steps: [
            {
              step: 1,
              title: "View Call History",
              description: "Access the call history section to see all past calls with timestamps and duration."
            },
            {
              step: 2,
              title: "Filter Calls",
              description: "Use date filters and search to find specific call records."
            },
            {
              step: 3,
              title: "Add Call Notes",
              description: "Click on any call record to add or edit notes about the conversation."
            },
            {
              step: 4,
              title: "Quick Redial",
              description: "Use the redial button next to any call history entry to quickly call back."
            }
          ]
        }
      ]
    },
    {
      id: "email",
      title: "Email System",
      description: "Send emails to leads and customers using templates and SMTP configuration",
      order: 3,
      sections: [
        {
          id: "email-overview",
          title: "Email System Overview",
          content: "The Email System allows you to send professional emails to leads and customers using customizable templates and SMTP configuration. Emails are sent through your configured SMTP server and logged for tracking.",
          tips: [
            "Configure SMTP settings in Integration Settings before sending emails",
            "Use email templates for consistent professional communication",
            "All sent emails are logged and can be viewed in email history",
            "Test your SMTP connection before important email campaigns"
          ]
        },
        {
          id: "email-sending",
          title: "Sending Emails",
          content: "How to send emails to leads and customers using the email panel.",
          steps: [
            {
              step: 1,
              title: "Access Email Panel",
              description: "Click on the 'Send Email' section in the unified dialer or navigate to the Email Center."
            },
            {
              step: 2,
              title: "Enter Recipient",
              description: "Type the recipient's email address or select from lead information if available."
            },
            {
              step: 3,
              title: "Choose Template",
              description: "Select from available email templates or choose to write a custom email."
            },
            {
              step: 4,
              title: "Customize Content",
              description: "Edit the subject line and email body as needed. Templates can be customized before sending."
            },
            {
              step: 5,
              title: "Preview and Send",
              description: "Click 'Preview & Send' to review the email, then click 'Send Email' to deliver it."
            }
          ]
        },
        {
          id: "email-templates",
          title: "Managing Email Templates",
          content: "Create and manage email templates for consistent communication.",
          steps: [
            {
              step: 1,
              title: "Access Template Management",
              description: "Go to Integration Settings and find the Email Template Card section."
            },
            {
              step: 2,
              title: "Create New Template",
              description: "Click 'Add Template' to create a new email template with subject and body."
            },
            {
              step: 3,
              title: "Set Template Category",
              description: "Choose a category: Form Link, Quote Request, Follow-up, Service, Billing, or Custom."
            },
            {
              step: 4,
              title: "Save Template",
              description: "Save your template for use across all email sending interfaces."
            }
          ]
        },
        {
          id: "email-history",
          title: "Email History and Tracking",
          content: "View and manage your email sending history and logs.",
          steps: [
            {
              step: 1,
              title: "View Email Logs",
              description: "Email sending history is automatically logged and stored locally."
            },
            {
              step: 2,
              title: "Track Email Status",
              description: "See which emails were sent successfully and which failed with error details."
            },
            {
              step: 3,
              title: "Contact-Specific History",
              description: "View all emails sent to specific contacts and leads."
            }
          ]
        }
      ]
    },
    {
      id: "calendar",
      title: "Callback Calendar",
      description: "Schedule and manage callback appointments and follow-ups",
      order: 4,
      sections: [
        {
          id: "calendar-overview",
          title: "Callback Calendar Overview",
          content: "The Callback Calendar helps you schedule and manage follow-up calls with leads and customers, ensuring no opportunities are missed.",
          tips: [
            "Set callbacks immediately after calls for better organization",
            "Use different callback types to categorize your follow-ups",
            "Enable notifications to never miss a scheduled callback",
            "Google Calendar integration available for syncing callbacks"
          ]
        },
        {
          id: "calendar-scheduling",
          title: "Scheduling Callbacks",
          content: "How to schedule follow-up calls and appointments.",
          steps: [
            {
              step: 1,
              title: "Access Calendar",
              description: "Navigate to the Callback Calendar tab to view your calendar interface."
            },
            {
              step: 2,
              title: "Add New Callback",
              description: "Click 'Add Callback' or click on a date in the calendar view."
            },
            {
              step: 3,
              title: "Select Lead",
              description: "Choose the lead you want to schedule a callback for from the dropdown."
            },
            {
              step: 4,
              title: "Set Date and Time",
              description: "Select the desired date and time for the callback."
            },
            {
              step: 5,
              title: "Add Notes",
              description: "Include notes about what to discuss during the callback."
            }
          ]
        },
        {
          id: "calendar-integration",
          title: "Google Calendar Integration",
          content: "Sync your callbacks with Google Calendar for better organization.",
          steps: [
            {
              step: 1,
              title: "Configure Google Calendar",
              description: "Go to Integration Settings and enable Google Calendar integration."
            },
            {
              step: 2,
              title: "Enable Sync Options",
              description: "Choose to sync callbacks, meetings, or both to your Google Calendar."
            },
            {
              step: 3,
              title: "Set Default Calendar",
              description: "Select which Google Calendar to use for CRM events."
            }
          ]
        }
      ]
    },
    {
      id: "discord",
      title: "Discord Integration",
      description: "Connect with Discord for team notifications and lead updates",
      order: 5,
      sections: [
        {
          id: "discord-overview",
          title: "Discord Integration Overview",
          content: "The Discord integration allows you to send notifications about new leads, call activities, and other CRM events to your Discord server channels.",
          tips: [
            "Configure webhook URL in Integration Settings to enable Discord notifications",
            "Choose specific channels for different types of notifications",
            "Test webhook connection before enabling live notifications"
          ]
        },
        {
          id: "discord-setup",
          title: "Setting Up Discord Integration",
          content: "How to configure Discord webhooks for CRM notifications.",
          steps: [
            {
              step: 1,
              title: "Create Discord Webhook",
              description: "In your Discord server, go to channel settings and create a new webhook."
            },
            {
              step: 2,
              title: "Copy Webhook URL",
              description: "Copy the webhook URL from Discord for use in the CRM configuration."
            },
            {
              step: 3,
              title: "Configure in CRM",
              description: "Go to Integration Settings > Discord Webhook and paste the webhook URL."
            },
            {
              step: 4,
              title: "Set Channel Name",
              description: "Specify the channel name (e.g., #leads) where notifications will be sent."
            },
            {
              step: 5,
              title: "Enable Integration",
              description: "Toggle the integration on and save settings to start receiving notifications."
            }
          ]
        }
      ]
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      description: "View performance metrics, call statistics, and business analytics",
      order: 6,
      requiresManagerAccess: true,
      sections: [
        {
          id: "reports-overview",
          title: "Reports Overview",
          content: "The Reports & Analytics module provides comprehensive insights into your team's performance, call statistics, and business metrics.",
          tips: [
            "Review reports weekly to identify trends",
            "Use date filters to compare different time periods",
            "Export reports for presentations and record keeping",
            "Monitor call volume and conversion rates for performance optimization"
          ]
        },
        {
          id: "reports-viewing",
          title: "Viewing Reports",
          content: "How to access and interpret different types of reports.",
          steps: [
            {
              step: 1,
              title: "Navigate to Reports",
              description: "Go to the Reports & Analytics tab to access all reporting features."
            },
            {
              step: 2,
              title: "Select Date Range",
              description: "Use the date picker to select the time period for your report."
            },
            {
              step: 3,
              title: "Choose Report Type",
              description: "Select from call volume, conversion rates, team performance, or other available reports."
            },
            {
              step: 4,
              title: "Analyze Data",
              description: "Review charts, graphs, and key metrics displayed in the report."
            }
          ]
        },
        {
          id: "reports-types",
          title: "Available Report Types",
          content: "Overview of different report types available in the system.",
          steps: [
            {
              step: 1,
              title: "Call Volume Reports",
              description: "Track total calls, successful connections, and call duration statistics."
            },
            {
              step: 2,
              title: "Lead Conversion Reports",
              description: "Monitor lead status changes and conversion rates over time."
            },
            {
              step: 3,
              title: "Agent Performance Reports",
              description: "View individual agent statistics including calls made, emails sent, and conversion rates."
            },
            {
              step: 4,
              title: "Email Campaign Reports",
              description: "Track email sending statistics and template usage."
            }
          ]
        }
      ]
    },
    {
      id: "integrations",
      title: "Integration Settings",
      description: "Configure AMI Bridge, database settings, SMTP, and third-party integrations",
      order: 7,
      requiresManagerAccess: true,
      sections: [
        {
          id: "integrations-overview",
          title: "Integration Settings Overview",
          content: "The Integration Settings module allows you to configure connections to external systems including AMI Bridge, database settings, SMTP email, and third-party services like Discord and Google Calendar.",
          tips: [
            "Always test connections after making changes",
            "Keep backup copies of working configurations",
            "Monitor connection status regularly",
            "Use secure passwords and API keys for all integrations"
          ]
        },
        {
          id: "integrations-ami",
          title: "AMI Bridge Configuration",
          content: "How to set up and maintain the AMI Bridge connection for FreePBX integration.",
          steps: [
            {
              step: 1,
              title: "Access AMI Settings",
              description: "Navigate to Integration Settings and find the AMI Bridge configuration section."
            },
            {
              step: 2,
              title: "Enter Connection Details",
              description: "Input your FreePBX server IP, AMI port (usually 5038), username, and password."
            },
            {
              step: 3,
              title: "Test Connection",
              description: "Use the test connection button to verify your settings are correct."
            },
            {
              step: 4,
              title: "Connect to AMI",
              description: "Once tested successfully, click connect to establish the AMI Bridge connection."
            }
          ],
          troubleshooting: [
            {
              issue: "Connection timeout errors",
              solution: "Check firewall settings and ensure port 5038 is open on your FreePBX server."
            },
            {
              issue: "Authentication failed",
              solution: "Verify AMI username and password are correct in FreePBX Admin interface."
            }
          ]
        },
        {
          id: "integrations-smtp",
          title: "SMTP Email Configuration",
          content: "Configure SMTP settings for sending emails through the CRM system.",
          steps: [
            {
              step: 1,
              title: "Access SMTP Settings",
              description: "Go to Integration Settings and find the SMTP Configuration card."
            },
            {
              step: 2,
              title: "Enable SMTP",
              description: "Toggle the SMTP integration on to enable email functionality."
            },
            {
              step: 3,
              title: "Enter Server Details",
              description: "Input SMTP host, port (usually 587 for TLS), username, and password."
            },
            {
              step: 4,
              title: "Configure Encryption",
              description: "Select TLS or SSL encryption based on your email provider's requirements."
            },
            {
              step: 5,
              title: "Set From Information",
              description: "Enter the from email address and display name for outgoing emails."
            },
            {
              step: 6,
              title: "Test Connection",
              description: "Use the test button to verify SMTP settings work correctly."
            }
          ],
          troubleshooting: [
            {
              issue: "Authentication failed",
              solution: "Check username/password and ensure app passwords are used for Gmail/Outlook."
            },
            {
              issue: "Connection refused",
              solution: "Verify SMTP server address and port. Check if firewall allows outbound SMTP traffic."
            },
            {
              issue: "TLS/SSL errors",
              solution: "Try different encryption settings or check if your provider requires specific TLS versions."
            }
          ]
        },
        {
          id: "integrations-database",
          title: "Database Configuration",
          content: "Configure database connections for storing CRM data.",
          steps: [
            {
              step: 1,
              title: "Access Database Settings",
              description: "Navigate to the Database Configuration card in Integration Settings."
            },
            {
              step: 2,
              title: "Enter Connection Details",
              description: "Input database host, port, database name, username, and password."
            },
            {
              step: 3,
              title: "Test Connection",
              description: "Use the test connection button to verify database connectivity."
            },
            {
              step: 4,
              title: "Save Configuration",
              description: "Save the working database configuration for persistent use."
            }
          ]
        },
        {
          id: "integrations-supabase",
          title: "Supabase Configuration",
          content: "Configure Supabase for cloud database and authentication services.",
          steps: [
            {
              step: 1,
              title: "Enable Supabase",
              description: "Toggle Supabase integration on in the Integration Settings."
            },
            {
              step: 2,
              title: "Enter Project Details",
              description: "Input your Supabase project URL and anonymous key."
            },
            {
              step: 3,
              title: "Configure Authentication",
              description: "Enable Google authentication if needed for calendar integration."
            },
            {
              step: 4,
              title: "Test Connection",
              description: "Verify the Supabase connection is working properly."
            }
          ]
        }
      ]
    },
    {
      id: "users",
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      order: 8,
      requiresManagerAccess: true,
      sections: [
        {
          id: "users-overview",
          title: "User Management Overview",
          content: "The User Management module allows administrators and managers to create, edit, and manage user accounts and permissions.",
          tips: [
            "Assign appropriate roles based on job responsibilities",
            "Regularly review user permissions for security",
            "Use strong passwords for all user accounts",
            "Monitor user activity through the system logs"
          ]
        },
        {
          id: "users-adding",
          title: "Adding New Users",
          content: "How to create new user accounts in the system.",
          steps: [
            {
              step: 1,
              title: "Access User Management",
              description: "Navigate to the User Management tab (available to Managers and Administrators only)."
            },
            {
              step: 2,
              title: "Click Add User",
              description: "Use the 'Add New User' button to open the user creation form."
            },
            {
              step: 3,
              title: "Enter User Details",
              description: "Fill in name, email, username, and initial password."
            },
            {
              step: 4,
              title: "Assign Role",
              description: "Select the appropriate role: Sales Representative, Manager, or Administrator."
            },
            {
              step: 5,
              title: "Save User",
              description: "Click 'Add User' to create the account and notify the user."
            }
          ]
        },
        {
          id: "users-roles",
          title: "User Roles and Permissions",
          content: "Understanding different user roles and their capabilities.",
          steps: [
            {
              step: 1,
              title: "Sales Representative",
              description: "Can manage their own leads, make calls, send emails, and view their own reports."
            },
            {
              step: 2,
              title: "Manager",
              description: "Can do everything Sales Reps can do, plus view team reports, manage users, and access integration settings."
            },
            {
              step: 3,
              title: "Administrator",
              description: "Full system access including all management features, system configuration, and user administration."
            }
          ]
        }
      ]
    },
    {
      id: "knowledge-base",
      title: "Knowledge Base",
      description: "Access documentation, guides, and help resources",
      order: 9,
      sections: [
        {
          id: "kb-overview",
          title: "Knowledge Base Overview",
          content: "The Knowledge Base provides comprehensive documentation and guides for using all CRM features effectively.",
          tips: [
            "Use the search function to quickly find specific information",
            "Download PDF guides for offline reference",
            "Check for updates regularly as new features are added"
          ]
        },
        {
          id: "kb-navigation",
          title: "Navigating the Knowledge Base",
          content: "How to effectively use the Knowledge Base for learning and reference.",
          steps: [
            {
              step: 1,
              title: "Browse by Module",
              description: "Use the tabs to browse documentation for specific CRM modules."
            },
            {
              step: 2,
              title: "Search Content",
              description: "Use the search box to find specific topics or features."
            },
            {
              step: 3,
              title: "Download Guides",
              description: "Export documentation as PDF for offline access and sharing."
            }
          ]
        }
      ]
    }
  ]
};
