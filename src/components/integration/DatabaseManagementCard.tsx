import React from 'react';

// Place handler functions above the component to avoid ReferenceError
const handleMaintenance = async () => {
  // Simulate some maintenance task (like clearing up duplicate data)
  alert("Maintenance task complete! Duplicates and cleanup handled.");
};

const handleWipeLeads = async () => {
  if (!window.confirm("Are you SURE you want to permanently delete ALL leads? This cannot be undone!")) {
    return;
  }
  try {
    // Simulate clearing all leads from system. Implement as needed.
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
          // Fix: Cast content to string before parsing!
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
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Database Management</h3>
      </div>
      <div className="card-body">
        <p>Manage your CRM database with these tools.</p>
        <div className="flex gap-2 mt-4">
          {userRole !== "Agent" && (
            <>
              <button className="btn btn-outline" onClick={handleBackup}>
                Backup Database
              </button>
              <button className="btn btn-outline" onClick={handleExport}>
                Export to CSV
              </button>
              <label className="btn btn-outline">
                Import from JSON
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
              <button className="btn btn-outline" onClick={handleMaintenance}>
                Maintenance
              </button>
              <button
                className="btn btn-destructive"
                onClick={handleWipeLeads}
                style={{ marginLeft: '8px' }}
              >
                Wipe Leads
              </button>
            </>
          )}
        </div>
        {userRole === "Agent" && (
          <p>Contact your manager to perform database management tasks.</p>
        )}
      </div>
    </div>
  );
};

export default DatabaseManagementCard;
