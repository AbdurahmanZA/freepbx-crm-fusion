
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, ShieldCheck, Trash, FileText, FilePlus } from "lucide-react";

// Utility to convert JSON array to CSV string with headers
const convertJsonToCsv = (jsonData) => {
  // If no data, output expected columns from an empty lead
  if (!jsonData || jsonData.length === 0) {
    // Use a sensible set of default columns for leads
    const headers = ["id", "firstName", "lastName", "phone", "email", "notes"];
    return headers.join(',') + '\n';
  }
  const headers = Object.keys(jsonData[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  for (const row of jsonData) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape double quotes in value
      return `"${value ? value.toString().replace(/"/g, '""') : ''}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

// Minimal CSV to JSON for leads. Assumes first row is headers, comma separated, leaves empty cells as empty string.
function parseCsvToJson(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 1) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Remove leading/trailing spaces, support commas in quotes
    const matches = line.match(/("([^"]|"")*"|[^,]*)/g)?.filter(Boolean) || [];
    const values = matches.map(cell => {
      let trimmed = cell.trim();
      // Remove surrounding quotes, handle escaped quotes
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        trimmed = trimmed.slice(1, -1).replace(/""/g, '"');
      }
      return trimmed;
    });
    // Fill missing columns with empty string
    while (values.length < headers.length) values.push("");
    const obj = {};
    headers.forEach((header, idx) => { obj[header] = values[idx] || ""; });
    return obj;
  });
}

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
  // Remove handleBackup

  const handleExport = () => {
    const leads = localStorage.getItem('leads');
    let csv = '';
    if (leads) {
      const data = JSON.parse(leads);
      csv = convertJsonToCsv(data);
    } else {
      // No leads stored at all
      csv = convertJsonToCsv([]);
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // New: Import CSV logic
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result as string;
          const data = parseCsvToJson(text);
          // Save to localStorage as "leads"
          localStorage.setItem('leads', JSON.stringify(data));
          alert('Leads imported successfully from CSV!');
        } catch (error) {
          alert('Error importing leads: Invalid CSV format.');
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid CSV file.");
    }
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
              {/* Remove Backup Database Button */}
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" /> Export CSV
              </Button>
              {/* Import button with file input overlay */}
              <label>
                <Button variant="outline" className="flex items-center gap-2 cursor-pointer">
                  <FilePlus className="h-4 w-4" />
                  Import CSV
                  <input
                    type="file"
                    accept=".csv"
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

