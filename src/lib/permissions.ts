
export interface PermissionOption {
  id: string;
  label: string;
  description?: string;
}

export const PERMISSION_OPTIONS: PermissionOption[] = [
  { id: "view_leads", label: "View Leads" },
  { id: "edit_leads", label: "Edit Leads" },
  { id: "delete_leads", label: "Delete Leads" },
  { id: "make_calls", label: "Make Calls" },
  { id: "view_reports", label: "View Reports" },
  { id: "manage_users", label: "Manage Users" },
  { id: "system_admin", label: "System Admin" },
  { id: "export_data", label: "Export Data" },
];

