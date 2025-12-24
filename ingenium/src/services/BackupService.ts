// services/BackupService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from './StorageService';

const BACKUP_KEY = 'app_backup';
const MAX_BACKUPS = 5;

class BackupService {
  // Create automatic backup
  async createBackup(): Promise<void> {
    try {
      const data = await StorageService.exportData();
      if (!data) return;

      const backup = {
        data,
        timestamp: Date.now(),
        version: '1.0',
      };

      // Get existing backups
      const existingBackups = await this.getBackups();
      
      // Add new backup
      existingBackups.unshift(backup);
      
      // Keep only latest backups
      const trimmedBackups = existingBackups.slice(0, MAX_BACKUPS);
      
      // Save backups
      await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(trimmedBackups));
      
      console.log('Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  // Get all backups
  async getBackups(): Promise<any[]> {
    try {
      const backupsJson = await AsyncStorage.getItem(BACKUP_KEY);
      return backupsJson ? JSON.parse(backupsJson) : [];
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  // Restore from backup
  async restoreBackup(backupIndex: number): Promise<boolean> {
    try {
      const backups = await this.getBackups();
      if (backupIndex < 0 || backupIndex >= backups.length) {
        throw new Error('Invalid backup index');
      }

      const backup = backups[backupIndex];
      await StorageService.importData(backup.data);
      
      console.log('Backup restored successfully');
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return false;
    }
  }

  // Clear all backups
  async clearBackups(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BACKUP_KEY);
    } catch (error) {
      console.error('Error clearing backups:', error);
    }
  }
}

export default new BackupService();