import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  Download, 
  Upload, 
  Save, 
  RotateCcw,
  Trash2,
  FileText,
  Calendar,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { databaseService, BackupMetadata } from "@/services/databaseService";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DatabaseManagementCard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [showWipeLeadsDialog, setShowWipeLeadsDialog] = useState(false);

  // Load backups on component mount
  useState(() => {
    loadBackups();
  });

  const loadBackups = () => {
    try {
      const backupList = databaseService.getBackupList();
      setBackups(backupList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load backup list",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    try {
      setLoading(true);
      const exportData = databaseService.exportDatabase();
      
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CRM_Export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "CRM database exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        databaseService.importDatabase(jsonData, { 
          overwrite: true, 
          backupBeforeImport: true 
        });
        
        loadBackups(); // Refresh backup list
        
        toast({
          title: "Import Successful",
          description: "Database imported successfully. A backup was created before import.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: (error as Error).message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleCreateBackup = () => {
    try {
      setLoading(true);
      const backup = databaseService.createBackup(backupDescription || undefined);
      setBackups(prev => [backup, ...prev]);
      setBackupDescription('');
      
      toast({
        title: "Backup Created",
        description: `Backup "${backup.name}" created successfully`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    try {
      setLoading(true);
      databaseService.restoreBackup(backupId);
      loadBackups(); // Refresh backup list
      
      toast({
        title: "Restore Successful",
        description: "Database restored from backup successfully",
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    try {
      databaseService.deleteBackup(backupId);
      setBackups(prev => prev.filter(b => b.id !== backupId));
      
      toast({
        title: "Backup Deleted",
        description: "Backup deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete backup",
        variant: "destructive"
      });
    }
  };

  // Simple flag for Agent 
  const isAgent = user?.role.toLowerCase() === "agent";

  // "Maintenance": Remove duplicate users/call records for demo maintenance
  const handleMaintenance = () => {
    try {
      setLoading(true);

      // Remove duplicate users
      const users = JSON.parse(localStorage.getItem('crm_users') || '[]');
      const uniqueUsers = Array.isArray(users)
        ? Object.values(users.reduce((acc, cur) => {
            acc[cur.id] = cur;
            return acc;
          }, {} as Record<string, any>))
        : [];
      localStorage.setItem('crm_users', JSON.stringify(uniqueUsers));

      // Remove duplicate call records
      const callRecords = JSON.parse(localStorage.getItem('call_records') || '[]');
      const uniqueCallRecords = Array.isArray(callRecords)
        ? Object.values(callRecords.reduce((acc, cur) => {
            acc[cur.id] = cur;
            return acc;
          }, {} as Record<string, any>))
        : [];
      localStorage.setItem('call_records', JSON.stringify(uniqueCallRecords));

      // You can add more cleanup logic here!
      toast({
        title: "Maintenance Complete",
        description: "Duplicates have been cleaned. Check system health for more details.",
      });
    } catch (error) {
      toast({
        title: "Maintenance Error",
        description: "Failed to complete maintenance.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Wipe Leads logic
  const handleWipeLeads = () => {
    try {
      setLoading(true);
      localStorage.removeItem("crm_leads");
      toast({
        title: "Leads Wiped",
        description: "All leads have been deleted from the system.",
      });
      setShowWipeLeadsDialog(false);
    } catch (error) {
      toast({
        title: "Wipe Failed",
        description: "Could not wipe leads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Added info box for cloud/advanced backup features */}
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          For automated scheduled backups and secure cloud storage, connect your CRM to Supabase.<br/>
          <a 
            href="https://docs.lovable.dev/integrations/supabase/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline text-blue-700"
          >
            Learn more about cloud backup &rarr;
          </a>
        </div>
        {/* Export/Import Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Import & Export</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleExport}
              disabled={loading || isAgent}
              className="flex items-center gap-2"
              title={isAgent ? "Agents cannot export the database" : undefined}
              style={isAgent ? { opacity: 0.5, pointerEvents: 'none' } : {}}
            >
              <Download className="h-4 w-4" />
              Export Database
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={loading || isAgent}
                className="hidden"
                id="import-file"
              />
              <Label 
                htmlFor="import-file" 
                className={`flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isAgent ? "opacity-50 pointer-events-none" : ""}`}
                title={isAgent ? "Agents cannot import the database" : undefined}
              >
                <Upload className="h-4 w-4" />
                Import Database
              </Label>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Export:</strong> Downloads all CRM data as a JSON file</p>
            <p><strong>Import:</strong> Replaces all current data with imported data (creates backup first)</p>
          </div>
        </div>

        {/* Backup Section */}
        {!isAgent && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Backup & Restore
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleMaintenance}
                disabled={loading}
                className="flex items-center gap-1"
                title="Perform maintenance (cleanup duplicates)"
              >
                <span>Maintenance</span>
                <HardDrive className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowWipeLeadsDialog(true)}
                disabled={loading}
                className="flex items-center gap-1"
                title="Delete all leads from system"
              >
                <span>Wipe Leads</span>
                <Trash2 className="h-4 w-4" />
              </Button>
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="backup-description">Backup Description (Optional)</Label>
              <Textarea
                id="backup-description"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Enter a description for this backup..."
                rows={2}
              />
            </div>
            
            <Button 
              onClick={handleCreateBackup}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Create Backup
            </Button>
          </div>
        )}

        {/* Backup List */}
        {!isAgent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Backups</h3>
              <Badge variant="outline">{backups.length} backups</Badge>
            </div>
            
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No backups available</p>
                <p className="text-sm">Create your first backup above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <Card key={backup.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{backup.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {backup.size}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(backup.timestamp, 'PPpp')}
                            </div>
                            <span>v{backup.version}</span>
                          </div>
                          {backup.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {backup.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={loading}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={loading}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wipe Leads Confirmation Dialog */}
        <Dialog open={showWipeLeadsDialog} onOpenChange={setShowWipeLeadsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete All Leads</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              Are you sure you want to <span className="font-semibold text-destructive">permanently delete all leads</span> from the system? This cannot be undone.
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowWipeLeadsDialog(false)}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWipeLeads}
                variant="destructive"
                disabled={loading}
              >
                Wipe Leads
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
};

export default DatabaseManagementCard;
