import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import StorageService, { Folder, Note } from "../services/StorageService";
import SyncService from "../services/SyncService";
import { generateSyncId } from "../utils/helpers";

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
  createFolder: (name: string, parentId?: string | null) => void;
  createNote: (folderId?: string | null) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  getCurrentPath: () => string;
  getFilteredAndSortedItems: (items: any[], type: "note" | "folder") => any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentScreen, setCurrentScreen] = useState("notes-list");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
    performInitialSync();
  }, []);

  const loadData = async () => {
    const loadedFolders = await StorageService.getFolders();
    const loadedNotes = await StorageService.getNotes();
    setFolders(loadedFolders);
    setNotes((prev) => {
      const map = new Map<string, Note>();

      // existing notes
      prev.forEach((n) => map.set(n.id, n));

      // loaded notes
      loadedNotes.forEach((n) => map.set(n.id, n));

      return Array.from(map.values());
    });
  };

  const performInitialSync = async () => {
    setIsSyncing(true);
    await SyncService.fullSync();
    await loadData();
    setIsSyncing(false);
  };

  const createFolder = (name: string, parentId: string | null = null) => {
    if (!name || !name.trim()) return;

    const newFolder: Folder = {
      id: generateSyncId(),
      name: name.trim(),
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: "pending",
    };

    // 1️⃣ Update state first
    setFolders((prev) => {
      if (prev.some((f) => f.id === newFolder.id)) return prev;
      return [...prev, newFolder];
    });

    // 2️⃣ Save folder separately, outside the functional updater
    StorageService.saveFolder(newFolder);
  };

  const createNote = (folderId: string | null = null) => {
    const newNote: Note = {
      id: generateSyncId(),
      folderId: folderId || currentFolderId,
      title: "Untitled Note",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncStatus: "pending",
    };

    setNotes((prev) => {
      if (prev.some((n) => n.id === newNote.id)) {
        return prev;
      }
      return [...prev, newNote];
    });

    StorageService.saveNote(newNote);
    setCurrentNoteId(newNote.id);
    setCurrentScreen("note-editor");
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map((note) =>
      note.id === id
        ? {
            ...note,
            ...updates,
            updatedAt: Date.now(),
            syncStatus: "pending",
            title:
              typeof updates.title === "string"
                ? updates.title.trim()
                : note.title,
          }
        : note
    );
    setNotes(updatedNotes);
    const updated = updatedNotes.find((n) => n.id === id);
    if (updated) {
      StorageService.saveNote(updated);
    }
  };

  const getCurrentPath = () => {
    if (!currentFolderId) return "/";

    const path: string[] = [];
    let currentId: string | null = currentFolderId;

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (!folder) break;

      path.unshift(folder.name);
      currentId = folder.parentId;
    }

    return "/" + path.join("/");
  };

  const getFilteredAndSortedItems = (items: any[], type: "note" | "folder") => {
    let filtered = items;

    if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = items.filter((item) => {
        if (type === "note") {
          const title =
            item.title && typeof item.title === "string"
              ? item.title.toLowerCase()
              : "";
          const content =
            item.content && typeof item.content === "string"
              ? item.content.toLowerCase()
              : "";
          return title.includes(searchLower) || content.includes(searchLower);
        } else {
          const name =
            item.name && typeof item.name === "string"
              ? item.name.toLowerCase()
              : "";
          return name.includes(searchLower);
        }
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (a.createdAt || 0) - (b.createdAt || 0);
        case "date-desc":
          return (b.createdAt || 0) - (a.createdAt || 0);
        case "alpha-asc":
          const nameA =
            type === "note"
              ? a.title && typeof a.title === "string"
                ? a.title
                : ""
              : a.name && typeof a.name === "string"
              ? a.name
              : "";
          const nameB =
            type === "note"
              ? b.title && typeof b.title === "string"
                ? b.title
                : ""
              : b.name && typeof b.name === "string"
              ? b.name
              : "";
          return nameA.localeCompare(nameB);
        case "alpha-desc":
          const nameA2 =
            type === "note"
              ? a.title && typeof a.title === "string"
                ? a.title
                : ""
              : a.name && typeof a.name === "string"
              ? a.name
              : "";
          const nameB2 =
            type === "note"
              ? b.title && typeof b.title === "string"
                ? b.title
                : ""
              : b.name && typeof b.name === "string"
              ? b.name
              : "";
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
    getFilteredAndSortedItems,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
