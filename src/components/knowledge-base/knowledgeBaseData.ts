
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
  version: "2.1.0",
  lastUpdated: "2024-06-14",
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
            "Regular lead follow-ups increase conversion rates by 35%"
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
      title: "Call Center",
      description: "Make calls, manage call history, and handle post-call actions",
      order: 2,
      sections: [
        {
          id: "calls-overview",
          title: "Call Center Overview",
          content: "The Call Center module provides comprehensive calling capabilities including direct dialing, call history tracking, and post-call actions.",
          tips: [
            "Always test your AMI connection before starting calls",
            "Use the extension selector to choose your calling device",
            "Post-call actions help maintain accurate lead records"
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
              description: "Choose your extension from the dropdown in the Call Center tab."
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
              description: "Access the call history section to see all past calls."
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
            }
          ]
        }
      ]
    },
    {
      id: "calendar",
      title: "Callback Calendar",
      description: "Schedule and manage callback appointments and follow-ups",
      order: 3,
      sections: [
        {
          id: "calendar-overview",
          title: "Callback Calendar Overview",
          content: "The Callback Calendar helps you schedule and manage follow-up calls with leads and customers, ensuring no opportunities are missed.",
          tips: [
            "Set callbacks immediately after calls for better organization",
            "Use different callback types to categorize your follow-ups",
            "Enable notifications to never miss a scheduled callback"
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
        }
      ]
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      description: "View performance metrics, call statistics, and business analytics",
      order: 4,
      requiresManagerAccess: true,
      sections: [
        {
          id: "reports-overview",
          title: "Reports Overview",
          content: "The Reports & Analytics module provides comprehensive insights into your team's performance, call statistics, and business metrics.",
          tips: [
            "Review reports weekly to identify trends",
            "Use date filters to compare different time periods",
            "Export reports for presentations and record keeping"
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
        }
      ]
    },
    {
      id: "integrations",
      title: "Integration Settings",
      description: "Configure AMI Bridge, database settings, and third-party integrations",
      order: 5,
      requiresManagerAccess: true,
      sections: [
        {
          id: "integrations-overview",
          title: "Integration Settings Overview",
          content: "The Integration Settings module allows you to configure connections to external systems including AMI Bridge, database settings, and third-party services.",
          tips: [
            "Always test connections after making changes",
            "Keep backup copies of working configurations",
            "Monitor connection status regularly"
          ]
        },
        {
          id: "integrations-ami",
          title: "AMI Bridge Configuration",
          content: "How to set up and maintain the AMI Bridge connection.",
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
        }
      ]
    },
    {
      id: "users",
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      order: 6,
      requiresManagerAccess: true,
      sections: [
        {
          id: "users-overview",
          title: "User Management Overview",
          content: "The User Management module allows administrators and managers to create, edit, and manage user accounts and permissions.",
          tips: [
            "Assign appropriate roles based on job responsibilities",
            "Regularly review user permissions for security",
            "Use strong passwords for all user accounts"
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
        }
      ]
    }
  ]
};
