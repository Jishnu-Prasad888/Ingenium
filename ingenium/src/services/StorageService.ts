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
    private data = {
        folders: [] as Folder[],
        notes: [] as Note[],
        lastSync: null as number | null
    };

    async getFolders(): Promise<Folder[]> {
        return this.data.folders;
    }

    async getNotes(): Promise<Note[]> {
        return this.data.notes;
    }

    async saveFolder(folder: Folder): Promise<void> {
        const existing = this.data.folders.findIndex(f => f.id === folder.id);
        if (existing >= 0) {
            this.data.folders[existing] = folder;
        } else {
            this.data.folders.push(folder);
        }
    }

    async saveNote(note: Note): Promise<void> {
        const existing = this.data.notes.findIndex(n => n.id === note.id);
        if (existing >= 0) {
            this.data.notes[existing] = note;
        } else {
            this.data.notes.push(note);
        }
    }

    async deleteFolder(id: string): Promise<void> {
        this.data.folders = this.data.folders.filter(f => f.id !== id);
    }

    async deleteNote(id: string): Promise<void> {
        this.data.notes = this.data.notes.filter(n => n.id !== id);
    }
}

export default new StorageService();