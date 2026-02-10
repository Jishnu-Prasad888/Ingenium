// services/StorageService.ts
import DatabaseService from './DatabaseService';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  syncStatus: string;
}

export interface Note {
  id: string;
  folderId: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: string;
}

class StorageService {
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Initialize database connection with error handling
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        console.log('Initializing StorageService...');
        await DatabaseService.init();
        this.initialized = true;
        console.log('StorageService initialized successfully');
      } catch (error) {
        console.error('StorageService initialization failed:', error);
        this.initialized = false;
        this.initializationPromise = null;
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  // Ensure all data is saved before exit
  async ensureDataSaved(): Promise<void> {
    try {
      await DatabaseService.flush();
    } catch (error) {
      console.error('Error ensuring data is saved:', error);
    }
  }

  async getFolders(): Promise<Folder[]> {
    try {
      await this.initialize();
      return await DatabaseService.getFolders();
    } catch (error) {
      console.error('Error getting folders:', error);
      return [];
    }
  }

  async getNotes(): Promise<Note[]> {
    try {
      await this.initialize();
      return await DatabaseService.getNotes();
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  async saveFolder(folder: Folder): Promise<void> {
    try {
      await this.initialize();
      await DatabaseService.saveFolder(folder);
    } catch (error) {
      console.error('Error saving folder:', error);
      throw error;
    }
  }

  async saveNote(note: Note): Promise<void> {
    try {
      await this.initialize();
      await DatabaseService.saveNote(note);
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  async deleteFolder(id: string): Promise<void> {
    try {
      await this.initialize();
      await DatabaseService.deleteFolder(id);
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await this.initialize();
      await DatabaseService.deleteNote(id);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    try {
      await this.initialize();
      return await DatabaseService.getNoteById(id);
    } catch (error) {
      console.error('Error getting note by ID:', error);
      return null;
    }
  }

  // Get notes by folder ID
  async getNotesByFolderId(folderId: string | null): Promise<Note[]> {
    try {
      await this.initialize();
      const notes = await DatabaseService.getNotes();
      return notes.filter(note => note.folderId === folderId);
    } catch (error) {
      console.error('Error getting notes by folder ID:', error);
      return [];
    }
  }

  // Get subfolders by parent ID
  async getSubfolders(parentId: string | null): Promise<Folder[]> {
    try {
      await this.initialize();
      const folders = await DatabaseService.getFolders();
      return folders.filter(folder => folder.parentId === parentId);
    } catch (error) {
      console.error('Error getting subfolders:', error);
      return [];
    }
  }

  // Get folder by ID
  async getFolderById(id: string): Promise<Folder | null> {
    try {
      await this.initialize();
      const folders = await DatabaseService.getFolders();
      return folders.find(folder => folder.id === id) || null;
    } catch (error) {
      console.error('Error getting folder by ID:', error);
      return null;
    }
  }

  // Update folder
  async updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
    try {
      await this.initialize();
      const folders = await DatabaseService.getFolders();
      const folder = folders.find(f => f.id === id);
      
      if (!folder) {
        throw new Error(`Folder with id ${id} not found`);
      }
      
      const updatedFolder: Folder = {
        ...folder,
        ...updates,
        updatedAt: Date.now(),
        syncStatus: updates.syncStatus || 'pending',
      };
      
      await DatabaseService.saveFolder(updatedFolder);
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  }

  // Update note
  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    try {
      await this.initialize();
      const notes = await DatabaseService.getNotes();
      const note = notes.find(n => n.id === id);
      
      if (!note) {
        throw new Error(`Note with id ${id} not found`);
      }
      
      const updatedNote: Note = {
        ...note,
        ...updates,
        updatedAt: Date.now(),
        syncStatus: updates.syncStatus || 'pending',
      };
      
      await DatabaseService.saveNote(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

    async getDatabaseInfo(): Promise<{
    size?: number;
    rowCounts: {
      folders: number;
      notes: number;
      pendingSync: number;
    };
    status: 'initialized' | 'not-initialized' | 'error';
    lastBackup?: number;
  }> {
    try {
      if (!this.initialized) {
        return {
          rowCounts: { folders: 0, notes: 0, pendingSync: 0 },
          status: 'not-initialized',
        };
      }

      // Get counts from database
      const folders = await this.getFolders();
      const notes = await this.getNotes();
      const pendingItems = await this.getPendingSyncItems();

      return {
        rowCounts: {
          folders: folders.length,
          notes: notes.length,
          pendingSync: pendingItems.length,
        },
        status: 'initialized',
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return {
        rowCounts: { folders: 0, notes: 0, pendingSync: 0 },
        status: 'error',
      };
    }
  }

  // Backup and restore methods
  async exportData(): Promise<string> {
    try {
      await this.initialize();
      return await DatabaseService.exportDatabase();
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      await this.initialize();
      await DatabaseService.importDatabase(jsonData);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Get pending sync items
  async getPendingSyncItems(): Promise<any[]> {
    try {
      await this.initialize();
      return await DatabaseService.getPendingSyncItems();
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      return [];
    }
  }

  // Clear pending sync item
  async clearPendingSyncItem(id: string): Promise<void> {
    try {
      await this.initialize();
      await DatabaseService.clearPendingSyncItem(id);
    } catch (error) {
      console.error('Error clearing pending sync item:', error);
    }
  }

  // Clear all pending sync items
  async clearAllPendingSyncItems(): Promise<void> {
    try {
      await this.initialize();
      const items = await DatabaseService.getPendingSyncItems();
      for (const item of items) {
        await DatabaseService.clearPendingSyncItem(item.id);
      }
    } catch (error) {
      console.error('Error clearing all pending sync items:', error);
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    totalNotes: number;
    totalFolders: number;
    pendingSyncItems: number;
    lastUpdated: number | null;
  }> {
    try {
      await this.initialize();
      const notes = await this.getNotes();
      const folders = await this.getFolders();
      const pendingItems = await this.getPendingSyncItems();
      
      // Find most recent update
      const allItems = [...notes, ...folders];
      const lastUpdated = allItems.length > 0 
        ? Math.max(...allItems.map(item => item.updatedAt))
        : null;

      return {
        totalNotes: notes.length,
        totalFolders: folders.length,
        pendingSyncItems: pendingItems.length,
        lastUpdated,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        totalNotes: 0,
        totalFolders: 0,
        pendingSyncItems: 0,
        lastUpdated: null,
      };
    }
  }

  // Search notes and folders
  async search(query: string): Promise<{
    notes: Note[];
    folders: Folder[];
  }> {
    try {
      await this.initialize();
      const notes = await this.getNotes();
      const folders = await this.getFolders();
      
      const searchLower = query.toLowerCase().trim();
      
      const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
      
      const filteredFolders = folders.filter(folder =>
        folder.name.toLowerCase().includes(searchLower)
      );
      
      return {
        notes: filteredNotes,
        folders: filteredFolders,
      };
    } catch (error) {
      console.error('Error searching:', error);
      return { notes: [], folders: [] };
    }
  }

  // Check if storage is ready
  isInitialized(): boolean {
    return this.initialized;
  }

  // Reset storage (for testing/debugging)
  async reset(): Promise<void> {
    try {
      // Note: This doesn't delete the database file, just clears data
      // For Expo, we would need a different approach to delete the file
      console.warn('Reset method not fully implemented for Expo SQLite');
      
      // Clear all data from tables
      await this.initialize();
      
      // This is a workaround - in production you might want to handle this differently
      const notes = await this.getNotes();
      const folders = await this.getFolders();
      
      // Delete all notes
      for (const note of notes) {
        await this.deleteNote(note.id);
      }
      
      // Delete all folders
      for (const folder of folders) {
        await this.deleteFolder(folder.id);
      }
      
      // Clear pending sync
      await this.clearAllPendingSyncItems();
      
    } catch (error) {
      console.error('Error resetting storage:', error);
    }
  }

  // Close database connection (for cleanup)
  async close(): Promise<void> {
    try {
      await DatabaseService.close();
      this.initialized = false;
      this.initializationPromise = null;
    } catch (error) {
      console.error('Error closing storage:', error);
    }
  }
}

export default new StorageService();