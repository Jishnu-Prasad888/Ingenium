import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageService, { Folder, Note } from '../services/StorageService';
import SyncService from '../services/SyncService';
import { generateId } from '../utils/helpers';

interface AppContextType {
    folders: Folder[];
    notes: Note[];
    currentScreen: string;
    setCurrentScreen: (screen: string) => void;
    currentFolderId: string | null;
    setCurrentFolderId: (id: string | null) => void;
    currentNoteId: string | null;
    setCurrentNoteId: (id: string | null) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    isSyncing: boolean;
    createFolder: (parentId?: string | null) => void;
    createNote: (folderId?: string | null) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    getCurrentPath: () => string;
    getFilteredAndSortedItems: (items: any[], type: 'note' | 'folder') => any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentScreen, setCurrentScreen] = useState('notes-list');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        loadData();
        performInitialSync();
    }, []);

    const loadData = async () => {
        const loadedFolders = await StorageService.getFolders();
        const loadedNotes = await StorageService.getNotes();
        setFolders(loadedFolders);
        setNotes(loadedNotes);
    };

    const performInitialSync = async () => {
        setIsSyncing(true);
        await SyncService.fullSync();
        await loadData();
        setIsSyncing(false);
    };

    const createFolder = (parentId: string | null = null) => {
        const newFolder: Folder = {
            id: generateId(),
            name: `Folder ${folders.length + 1}`,
            parentId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'pending'
        };
        StorageService.saveFolder(newFolder);
        setFolders([...folders, newFolder]);
    };

    const createNote = (folderId: string | null = null) => {
        const newNote: Note = {
            id: generateId(),
            folderId: folderId || currentFolderId,
            title: generateId(),
            content: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'pending'
        };
        StorageService.saveNote(newNote);
        setNotes([...notes, newNote]);
        setCurrentNoteId(newNote.id);
        setCurrentScreen('note-editor');
    };

    const updateNote = (id: string, updates: Partial<Note>) => {
        const updatedNotes = notes.map(note =>
            note.id === id
                ? { ...note, ...updates, updatedAt: Date.now(), syncStatus: 'pending' }
                : note
        );
        setNotes(updatedNotes);
        const updated = updatedNotes.find(n => n.id === id);
        if (updated) {
            StorageService.saveNote(updated);
        }
    };

    const getCurrentPath = () => {
        if (!currentFolderId) return '/';

        const path: string[] = [];
        let currentId: string | null = currentFolderId;

        while (currentId) {
            const folder = folders.find(f => f.id === currentId);
            if (!folder) break;

            path.unshift(folder.name);
            currentId = folder.parentId;
        }

        return '/' + path.join('/');
    };



    const getFilteredAndSortedItems = (items: any[], type: 'note' | 'folder') => {
        let filtered = items;

        if (searchQuery) {
            filtered = items.filter(item => {
                const searchLower = searchQuery.toLowerCase();
                if (type === 'note') {
                    return item.title.toLowerCase().includes(searchLower) ||
                        item.content.toLowerCase().includes(searchLower);
                } else {
                    return item.name.toLowerCase().includes(searchLower);
                }
            });
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return a.createdAt - b.createdAt;
                case 'date-desc':
                    return b.createdAt - a.createdAt;
                case 'alpha-asc':
                    const nameA = type === 'note' ? a.title : a.name;
                    const nameB = type === 'note' ? b.title : b.name;
                    return nameA.localeCompare(nameB);
                case 'alpha-desc':
                    const nameA2 = type === 'note' ? a.title : a.name;
                    const nameB2 = type === 'note' ? b.title : b.name;
                    return nameB2.localeCompare(nameA2);
                default:
                    return 0;
            }
        });
    };

    const value: AppContextType = {
        folders,
        notes,
        currentScreen,
        setCurrentScreen,
        currentFolderId,
        setCurrentFolderId,
        currentNoteId,
        setCurrentNoteId,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        isSyncing,
        createFolder,
        createNote,
        updateNote,
        getCurrentPath,
        getFilteredAndSortedItems
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};