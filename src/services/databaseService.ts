
import { format } from "date-fns";

interface DatabaseExport {
  version: string;
  timestamp: string;
  data: {
    users: any[];
    leads: any[];
    callRecords: any[];
    callbacks: any[];
    settings: any;
  };
}

interface BackupMetadata {
  id: string;
  name: string;
  timestamp: Date;
  size: string;
  description: string;
  version: string;
}

class DatabaseService {
  private version = "1.0.0";

  // Export all CRM data
  exportDatabase(): string {
    try {
      const exportData: DatabaseExport = {
        version: this.version,
        timestamp: new Date().toISOString(),
        data: {
          users: this.getStoredData('crm_users'),
          leads: this.getStoredData('crm_leads'),
          callRecords: this.getStoredData('call_records'),
          callbacks: this.getStoredData('crm_callbacks'),
          settings: {
            amiConfig: this.getStoredData('ami_config'),
            discordConfig: this.getStoredData('discord_config'),
            integrationSettings: this.getStoredData('integration_settings')
          }
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Failed to export database');
    }
  }

  // Import CRM data
  importDatabase(jsonData: string, options: { 
    overwrite?: boolean; 
    merge?: boolean; 
    backupBeforeImport?: boolean 
  } = {}): void {
    try {
      const importData: DatabaseExport = JSON.parse(jsonData);
      
      // Validate import data
      if (!importData.version || !importData.data) {
        throw new Error('Invalid import file format');
      }

      // Create backup before import if requested
      if (options.backupBeforeImport) {
        this.createBackup(`Pre-import backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);
      }

      // Import data based on options
      if (options.overwrite) {
        // Clear existing data and import
        this.clearAllData();
        this.importAllData(importData.data);
      } else if (options.merge) {
        // Merge with existing data
        this.mergeData(importData.data);
      } else {
        // Default: replace all data
        this.importAllData(importData.data);
      }

    } catch (error) {
      console.error('Import error:', error);
      throw new Error('Failed to import database: ' + (error as Error).message);
    }
  }

  // Create a backup
  createBackup(description?: string): BackupMetadata {
    try {
      const timestamp = new Date();
      const backupId = `backup_${timestamp.getTime()}`;
      const backupName = `CRM_Backup_${format(timestamp, 'yyyy-MM-dd_HH-mm-ss')}`;
      
      const exportData = this.exportDatabase();
      
      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        timestamp,
        size: this.formatBytes(new Blob([exportData]).size),
        description: description || `Automatic backup created on ${format(timestamp, 'PPpp')}`,
        version: this.version
      };

      // Store backup data
      localStorage.setItem(`backup_${backupId}`, exportData);
      
      // Store backup metadata
      const backups = this.getBackupList();
      backups.push(metadata);
      localStorage.setItem('crm_backups', JSON.stringify(backups));

      return metadata;
    } catch (error) {
      console.error('Backup error:', error);
      throw new Error('Failed to create backup');
    }
  }

  // Get list of backups
  getBackupList(): BackupMetadata[] {
    try {
      const stored = localStorage.getItem('crm_backups');
      if (!stored) return [];
      
      return JSON.parse(stored).map((backup: any) => ({
        ...backup,
        timestamp: new Date(backup.timestamp)
      }));
    } catch (error) {
      console.error('Error loading backup list:', error);
      return [];
    }
  }

  // Restore from backup
  restoreBackup(backupId: string): void {
    try {
      const backupData = localStorage.getItem(`backup_${backupId}`);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      // Create a backup before restoring
      this.createBackup(`Pre-restore backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`);

      // Import the backup data
      this.importDatabase(backupData, { overwrite: true });
    } catch (error) {
      console.error('Restore error:', error);
      throw new Error('Failed to restore backup: ' + (error as Error).message);
    }
  }

  // Delete backup
  deleteBackup(backupId: string): void {
    try {
      localStorage.removeItem(`backup_${backupId}`);
      
      const backups = this.getBackupList();
      const filtered = backups.filter(b => b.id !== backupId);
      localStorage.setItem('crm_backups', JSON.stringify(filtered));
    } catch (error) {
      console.error('Delete backup error:', error);
      throw new Error('Failed to delete backup');
    }
  }

  // Helper methods
  private getStoredData(key: string): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  private clearAllData(): void {
    const keys = ['crm_users', 'crm_leads', 'call_records', 'crm_callbacks'];
    keys.forEach(key => localStorage.removeItem(key));
  }

  private importAllData(data: DatabaseExport['data']): void {
    if (data.users) localStorage.setItem('crm_users', JSON.stringify(data.users));
    if (data.leads) localStorage.setItem('crm_leads', JSON.stringify(data.leads));
    if (data.callRecords) localStorage.setItem('call_records', JSON.stringify(data.callRecords));
    if (data.callbacks) localStorage.setItem('crm_callbacks', JSON.stringify(data.callbacks));
    
    if (data.settings) {
      if (data.settings.amiConfig) localStorage.setItem('ami_config', JSON.stringify(data.settings.amiConfig));
      if (data.settings.discordConfig) localStorage.setItem('discord_config', JSON.stringify(data.settings.discordConfig));
      if (data.settings.integrationSettings) localStorage.setItem('integration_settings', JSON.stringify(data.settings.integrationSettings));
    }
  }

  private mergeData(data: DatabaseExport['data']): void {
    // For simplicity, merge means adding new items without duplicating by ID
    Object.entries(data).forEach(([key, items]) => {
      if (key === 'settings') return; // Handle settings separately
      
      const existing = this.getStoredData(`crm_${key}`);
      const existingIds = new Set(existing.map((item: any) => item.id));
      const newItems = (items as any[]).filter(item => !existingIds.has(item.id));
      
      localStorage.setItem(`crm_${key}`, JSON.stringify([...existing, ...newItems]));
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const databaseService = new DatabaseService();
export type { DatabaseExport, BackupMetadata };
