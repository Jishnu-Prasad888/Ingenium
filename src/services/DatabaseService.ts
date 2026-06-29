// services/DatabaseService.ts
import * as SQLite from 'expo-sqlite';
import { Folder, Note, Routine, RoutineStep } from './StorageService';

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
        CREATE TABLE IF NOT EXISTS routines (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          syncStatus TEXT DEFAULT 'synced'
        )
      `);

      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS routine_steps (
          id TEXT PRIMARY KEY,
          routineId TEXT NOT NULL,
          name TEXT NOT NULL,
          seconds INTEGER NOT NULL,
          sortOrder INTEGER NOT NULL,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          syncStatus TEXT DEFAULT 'synced'
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

      await this.db.runAsync(`
        CREATE INDEX IF NOT EXISTS idx_routine_steps_routine 
        ON routine_steps(routineId)
      `);

    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  private async ensureRoutineTables(): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        syncStatus TEXT DEFAULT 'synced'
      )
    `);

    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS routine_steps (
        id TEXT PRIMARY KEY,
        routineId TEXT NOT NULL,
        name TEXT NOT NULL,
        seconds INTEGER NOT NULL,
        sortOrder INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        syncStatus TEXT DEFAULT 'synced'
      )
    `);

    const columns = await this.db.getAllAsync<{ name: string }>(
      'PRAGMA table_info(routine_steps)',
    );
    const hasSortOrder = columns.some((column) => column.name === 'sortOrder');
    const hasPosition = columns.some((column) => column.name === 'position');

    if (!hasSortOrder) {
      await this.db.runAsync(
        'ALTER TABLE routine_steps ADD COLUMN sortOrder INTEGER DEFAULT 0',
      );
    }

    if (!hasPosition) {
      await this.db.runAsync(
        'ALTER TABLE routine_steps ADD COLUMN position INTEGER DEFAULT 0',
      );
    }

    await this.db.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_routine_steps_routine 
      ON routine_steps(routineId)
    `);
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

  async saveRoutine(routine: Routine): Promise<void> {
    if (!this.db) return;

    try {
      await this.ensureRoutineTables();

      await this.db.runAsync(
        `INSERT OR REPLACE INTO routines (id, name, color, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(routine.id),
          String(routine.name || 'Untitled Routine'),
          String(routine.color),
          Number(routine.createdAt || Date.now()),
          Number(routine.updatedAt || Date.now()),
          routine.syncStatus || 'pending',
        ],
      );

      await this.db.runAsync('DELETE FROM routine_steps WHERE routineId = ?', [
        String(routine.id),
      ]);

      for (const step of routine.steps) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO routine_steps
           (id, routineId, name, seconds, position, sortOrder, createdAt, updatedAt, syncStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            String(step.id),
            String(step.routineId || routine.id),
            String(step.name || 'Timer'),
            Number(step.seconds || 60),
            Number(step.position || 0),
            Number(step.position || 0),
            Number(step.createdAt || Date.now()),
            Number(step.updatedAt || Date.now()),
            step.syncStatus || routine.syncStatus || 'pending',
          ],
        );
      }

      if (routine.syncStatus !== 'synced') {
        await this.addToPendingSync('routines', routine.id, 'INSERT', routine);
      }
    } catch (error) {
      console.error('Error saving routine to database:', error);
      throw error;
    }
  }

  async getRoutines(): Promise<Routine[]> {
    if (!this.db) return [];

    try {
      await this.ensureRoutineTables();

      const routines = await this.db.getAllAsync<Omit<Routine, 'steps'>>(
        'SELECT * FROM routines ORDER BY updatedAt DESC',
      );
      const steps = await this.db.getAllAsync<RoutineStep>(
        `SELECT
          id,
          routineId,
          name,
          seconds,
          sortOrder AS position,
          createdAt,
          updatedAt,
          syncStatus
        FROM routine_steps
        ORDER BY sortOrder ASC`,
      );
      const stepsByRoutine = new Map<string, RoutineStep[]>();

      steps.forEach((step) => {
        const existing = stepsByRoutine.get(step.routineId) ?? [];
        existing.push(step);
        stepsByRoutine.set(step.routineId, existing);
      });

      return routines.map((routine) => ({
        ...routine,
        steps: stepsByRoutine.get(routine.id) ?? [],
      }));
    } catch (error) {
      console.error('Error getting routines from database:', error);
      return [];
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    if (!this.db) return;

    try {
      await this.ensureRoutineTables();

      await this.db.runAsync('DELETE FROM routine_steps WHERE routineId = ?', [
        String(id),
      ]);
      await this.db.runAsync('DELETE FROM routines WHERE id = ?', [String(id)]);

      await this.addToPendingSync('routines', id, 'DELETE', null);
    } catch (error) {
      console.error('Error deleting routine from database:', error);
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
      const routines = await this.getRoutines();
      
      const backup = {
        folders,
        notes,
        routines,
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
        await this.db.execAsync('DELETE FROM routine_steps');
        await this.db.execAsync('DELETE FROM routines');
        await this.db.execAsync('DELETE FROM pending_sync');
        
        // Import folders
        for (const folder of data.folders) {
          await this.saveFolder(folder);
        }
        
        // Import notes
        for (const note of data.notes) {
          await this.saveNote(note);
        }

        if (Array.isArray(data.routines)) {
          for (const routine of data.routines) {
            await this.saveRoutine(routine);
          }
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
