// services/DatabaseService.ts
import * as SQLite from 'expo-sqlite';
import { Folder, Note } from './StorageService';

interface SQLResult {
  insertId?: number;
  rowsAffected: number;
  rows: {
    _array: any[];
    length: number;
    item: (index: number) => any;
  };
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'notes_app.db';

  // Initialize database
  async init(): Promise<void> {
    try {
      // Open or create database
      this.db = SQLite.openDatabaseSync(this.dbName);
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Create tables if they don't exist
  private async createTables(): Promise<void> {
    if (!this.db) return;

    try {
      // Use runAsync for each SQL statement
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          parentId TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          syncStatus TEXT DEFAULT 'synced'
        )
      `);

      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          folderId TEXT,
          title TEXT NOT NULL,
          content TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          syncStatus TEXT DEFAULT 'synced'
        )
      `);

      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS pending_sync (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          data TEXT,
          createdAt INTEGER NOT NULL
        )
      `);

      await this.db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_notes_folder 
        ON notes(folderId)
      `);

      await this.db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_folders_parent 
        ON folders(parentId)
      `);

    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Folder operations
  async saveFolder(folder: Folder): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO folders (id, name, parentId, createdAt, updatedAt, syncStatus) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [folder.id, folder.name, folder.parentId, folder.createdAt, folder.updatedAt, folder.syncStatus]
      );
      
      // Add to pending sync if not synced
      if (folder.syncStatus !== 'synced') {
        await this.addToPendingSync('folders', folder.id, 'INSERT', folder);
      }
    } catch (error) {
      console.error('Error saving folder to database:', error);
      throw error;
    }
  }

  async getFolders(): Promise<Folder[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync<Folder>(
        'SELECT * FROM folders ORDER BY createdAt DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting folders from database:', error);
      return [];
    }
  }

  async deleteFolder(id: string): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.runAsync('DELETE FROM folders WHERE id = ?', [id]);
      
      // Add to pending sync
      await this.addToPendingSync('folders', id, 'DELETE', null);
      
      // Also delete notes in this folder
      await this.db.runAsync('DELETE FROM notes WHERE folderId = ?', [id]);
    } catch (error) {
      console.error('Error deleting folder from database:', error);
      throw error;
    }
  }

  // Note operations
  async saveNote(note: Note): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO notes (id, folderId, title, content, createdAt, updatedAt, syncStatus) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [note.id, note.folderId, note.title, note.content, note.createdAt, note.updatedAt, note.syncStatus]
      );
      
      // Add to pending sync if not synced
      if (note.syncStatus !== 'synced') {
        await this.addToPendingSync('notes', note.id, 'INSERT', note);
      }
    } catch (error) {
      console.error('Error saving note to database:', error);
      throw error;
    }
  }

  async getNotes(): Promise<Note[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync<Note>(
        'SELECT * FROM notes ORDER BY updatedAt DESC'
      );
      return result;
    } catch (error) {
      console.error('Error getting notes from database:', error);
      return [];
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    if (!this.db) return null;

    try {
      const result = await this.db.getFirstAsync<Note>(
        'SELECT * FROM notes WHERE id = ?',
        [id]
      );
      
      return result || null;
    } catch (error) {
      console.error('Error getting note by ID:', error);
      return null;
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
      
      // Add to pending sync
      await this.addToPendingSync('notes', id, 'DELETE', null);
    } catch (error) {
      console.error('Error deleting note from database:', error);
      throw error;
    }
  }

  // Pending sync operations
  private async addToPendingSync(
    tableName: string, 
    recordId: string, 
    operation: string, 
    data: any
  ): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO pending_sync (id, table_name, record_id, operation, data, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`${tableName}_${recordId}_${Date.now()}`, tableName, recordId, operation, 
         data ? JSON.stringify(data) : null, Date.now()]
      );
    } catch (error) {
      console.error('Error adding to pending sync:', error);
    }
  }

  async getPendingSyncItems(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync<any>(
        'SELECT * FROM pending_sync ORDER BY createdAt ASC'
      );
      
      // Parse JSON data
      return result.map(item => ({
        ...item,
        data: item.data ? JSON.parse(item.data) : null
      }));
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      return [];
    }
  }

  async clearPendingSyncItem(id: string): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.runAsync('DELETE FROM pending_sync WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error clearing pending sync item:', error);
    }
  }

  // Backup and restore
  async exportDatabase(): Promise<string> {
    if (!this.db) return '';

    try {
      const folders = await this.getFolders();
      const notes = await this.getNotes();
      
      const backup = {
        folders,
        notes,
        timestamp: Date.now(),
        version: '1.0',
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Error exporting database:', error);
      return '';
    }
  }

  async importDatabase(jsonData: string): Promise<void> {
    if (!this.db) return;

    try {
      const data = JSON.parse(jsonData);
      
      // Start transaction
      await this.db.execAsync('BEGIN TRANSACTION');
      
      try {
        // Clear existing data
        await this.db.execAsync('DELETE FROM folders');
        await this.db.execAsync('DELETE FROM notes');
        await this.db.execAsync('DELETE FROM pending_sync');
        
        // Import folders
        for (const folder of data.folders) {
          await this.saveFolder(folder);
        }
        
        // Import notes
        for (const note of data.notes) {
          await this.saveNote(note);
        }
        
        // Commit transaction
        await this.db.execAsync('COMMIT');
      } catch (error) {
        // Rollback on error
        await this.db.execAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error importing database:', error);
      throw error;
    }
  }

  // Ensure all data is saved
  async flush(): Promise<void> {
    // In Expo SQLite, writes are immediate, so this is mostly for API compatibility
    if (!this.db) return;
    
    try {
      await this.db.execAsync('COMMIT');
    } catch (error) {
      // Ignore errors - COMMIT might fail if no transaction is active
    }
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      await this.flush();
      // Expo SQLite doesn't have a close method
      this.db = null;
    }
  }

  // Get database file size (for info/debugging)
  async getDatabaseInfo(): Promise<{ size: number; rowCounts: any }> {
    if (!this.db) return { size: 0, rowCounts: {} };

    try {
      const foldersCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM folders'
      );
      
      const notesCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM notes'
      );
      
      const pendingCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM pending_sync'
      );

      return {
        size: 0, // Expo doesn't provide file size directly
        rowCounts: {
          folders: foldersCount?.count || 0,
          notes: notesCount?.count || 0,
          pendingSync: pendingCount?.count || 0,
        }
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return { size: 0, rowCounts: {} };
    }
  }
}

export default new DatabaseService();