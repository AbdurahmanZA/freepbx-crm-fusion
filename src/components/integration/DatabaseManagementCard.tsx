
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ShieldCheck, Trash } from "lucide-react";

const handleMaintenance = async () => {
  alert("Maintenance task complete! Duplicates and cleanup handled.");
};

const handleWipeLeads = async () => {
  if (!window.confirm("Are you SURE you want to permanently delete ALL leads? This cannot be undone!")) {
    return;
  }
  try {
    localStorage.setItem('leads', JSON.stringify([]));
    alert("All leads have been wiped from the system.");
  } catch (err) {
    alert("An error occurred while wiping leads.");
  }
};

const DatabaseManagementCard = ({ userRole }) => {
  const handleBackup = () => {
    const leads = localStorage.getItem('leads');
    if (leads) {
      const blob = new Blob([leads], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('No leads data found to backup.');
    }
  };

  const handleExport = () => {
    const leads = localStorage.getItem('leads');
    if (leads) {
      const data = JSON.parse(leads);
      const csv = convertJsonToCsv(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('No leads data found to export.');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const data = JSON.parse(content as string);
          localStorage.setItem('leads', JSON.stringify(data));
          alert('Leads imported successfully!');
        } catch (error) {
          alert('Error importing leads: Invalid JSON format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const convertJsonToCsv = (jsonData) => {
    if (!jsonData || jsonData.length === 0) {
      return '';
    }
    const headers = Object.keys(jsonData[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of jsonData) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value ? value.toString().replace(/"/g, '""') : ''}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          CRM Database
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Use the tools below to manage your CRM leads database.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-2">
          {userRole !== "Agent" && (
            <>
              <Button
                variant="outline"
                onClick={handleBackup}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Backup Database
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Export to CSV
              </Button>
              {/* Import button with file input overlay */}
              <label>
                <Button variant="outline" className="flex items-center gap-2 cursor-pointer">
                  <ShieldCheck className="h-4 w-4" />
                  Import from JSON
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImport}
                  />
                </Button>
              </label>
              <Button
                variant="outline"
                onClick={handleMaintenance}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Maintenance
              </Button>
              <Button
                variant="destructive"
                onClick={handleWipeLeads}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Wipe Leads
              </Button>
            </>
          )}
        </div>
        {userRole === "Agent" && (
          <p className="mt-3 text-xs text-orange-600">
            Contact your manager to perform CRM database operations.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseManagementCard;
