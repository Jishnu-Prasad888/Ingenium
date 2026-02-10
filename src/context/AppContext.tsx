// context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import StorageService, { Folder, Note } from "../services/StorageService";
import SyncService from "../services/SyncService";
import { generateSyncId } from "../utils/helpers";
import * as Linking from "expo-linking";
import { Alert } from "react-native";
import GeminiService from "../services/GeminiService";

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
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  createNote: (folderId?: string | null) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => void;
  updateNoteImmediate: (id: string, updates: Partial<Note>) => Promise<void>;
  getCurrentPath: () => string;
  getFilteredAndSortedItems: (items: any[], type: "note" | "folder") => any[];
  debouncedUpdateNote: (id: string, updates: Partial<Note>) => void;
  flushPendingSaves: () => Promise<void>;
  loadData: () => Promise<void>;
  performInitialSync: () => Promise<void>;
  deleteNote: (id: string) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  sharedContent: string;
  setSharedContent: (content: string) => void;
  isSharing: boolean;
  setIsSharing: (sharing: boolean) => void;
  processIncomingShare: (content: string) => Promise<void>;
  clearSharedContent: () => void;
  renameFolder: (folderId: string, newName: string) => Promise<boolean>;
  moveNote: (noteId: string, targetFolderId: string | null) => Promise<boolean>;
  queryNotes: () => Promise<void>;
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

  const [sharedContent, setSharedContent] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, Partial<Note>>>(new Map());
  const isSavingRef = useRef(false);

  // Load data function
  const loadData = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  // Add to AppProvider component
  const queryNotes = useCallback(async () => {
    const hasKey = await GeminiService.hasApiKey();
    if (!hasKey) {
      Alert.alert(
        "API Key Required",
        "You need to set up your Gemini API key first. Would you like to do that now?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Set Up",
            onPress: () => {
              setCurrentScreen("query-notes");
            },
          },
        ]
      );
      return;
    }

    // Navigate to query notes screen
    setCurrentScreen("query-notes");
    setCurrentFolderId(null);
    setCurrentNoteId(null);
  }, [setCurrentScreen]);

  const renameFolder = async (folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
    return true;
  };

  // Initial sync function
  const performInitialSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await SyncService.fullSync();
      await loadData();
    } catch (error) {
      console.error("Error during initial sync:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
    performInitialSync();

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending updates before unmounting
      flushPendingSaves();
    };
  }, []);

  const processIncomingShare = useCallback(async (content: string) => {
    try {
      if (!content.trim()) return;

      setSharedContent(content);
      setIsSharing(true);

      // Navigate to share screen
      setCurrentScreen("share");
    } catch (error) {
      console.error("Error processing share:", error);
      Alert.alert("Error", "Failed to process shared content");
    }
  }, []);

  const clearSharedContent = useCallback(() => {
    setSharedContent("");
    setIsSharing(false);
    setCurrentScreen("notes-list");
  }, []);

  // Function to flush all pending saves
  const flushPendingSaves = useCallback(async (): Promise<void> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (pendingUpdatesRef.current.size === 0 || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      console.log(
        `Flushing ${pendingUpdatesRef.current.size} pending updates...`
      );

      // Process all pending updates
      const updates = Array.from(pendingUpdatesRef.current.entries());
      pendingUpdatesRef.current.clear();

      for (const [noteId, updateData] of updates) {
        const note = notes.find((n) => n.id === noteId);
        if (note) {
          const updatedNote: Note = {
            ...note,
            ...updateData,
            updatedAt: Date.now(),
            syncStatus: "pending",
            title:
              typeof updateData.title === "string"
                ? updateData.title.trim()
                : note.title,
          };

          // Update local state
          setNotes((prev) =>
            prev.map((n) => (n.id === noteId ? updatedNote : n))
          );

          // Save to database
          await StorageService.saveNote(updatedNote);
        }
      }

      console.log("All pending updates saved");
    } catch (error) {
      console.error("Error flushing pending saves:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [notes]);

  // Debounced updateNote function
  const debouncedUpdateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      // Update local state immediately for responsive UI
      setNotes((prev) =>
        prev.map((note) =>
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
        )
      );

      // Store the update for later saving
      if (pendingUpdatesRef.current.has(id)) {
        const existing = pendingUpdatesRef.current.get(id)!;
        pendingUpdatesRef.current.set(id, { ...existing, ...updates });
      } else {
        pendingUpdatesRef.current.set(id, updates);
      }

      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for 500ms
      saveTimeoutRef.current = setTimeout(async () => {
        await flushPendingSaves();
      }, 500);
    },
    [flushPendingSaves]
  );

  const moveNote = useCallback(
    async (noteId: string, targetFolderId: string | null): Promise<boolean> => {
      try {
        // Find the note
        const note = notes.find((n) => n.id === noteId);
        if (!note) {
          console.error("Note not found:", noteId);
          return false;
        }

        // If already in the target folder, no need to move
        if (note.folderId === targetFolderId) {
          return true;
        }

        // Update local state
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  folderId: targetFolderId,
                  updatedAt: Date.now(),
                  syncStatus: "pending",
                }
              : n
          )
        );

        // Save to database
        const updatedNote = {
          ...note,
          folderId: targetFolderId,
          updatedAt: Date.now(),
          syncStatus: "pending",
        };
        await StorageService.saveNote(updatedNote);

        console.log(
          `Moved note "${note.title}" to folder ${targetFolderId || "root"}`
        );
        return true;
      } catch (error) {
        console.error("Error moving note:", error);
        return false;
      }
    },
    [notes]
  );

  // Immediate update (for when user navigates away or explicitly saves)
  const updateNoteImmediate = useCallback(
    async (id: string, updates: Partial<Note>) => {
      // Cancel any pending debounced save for this note
      if (pendingUpdatesRef.current.has(id)) {
        pendingUpdatesRef.current.delete(id);
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Update state immediately
      setNotes((prev) =>
        prev.map((note) =>
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
        )
      );

      // Save immediately
      const updated = notes.find((n) => n.id === id);
      if (updated) {
        const finalNote = {
          ...updated,
          ...updates,
          updatedAt: Date.now(),
          syncStatus: "pending",
          title:
            typeof updates.title === "string"
              ? updates.title.trim()
              : updated.title,
        };
        await StorageService.saveNote(finalNote);
      }
    },
    [notes]
  );

  // Keep the original updateNote for backward compatibility (immediate save)
  const updateNote = useCallback(
    (id: string, updates: Partial<Note>) => {
      // Default to immediate save for non-typing updates
      updateNoteImmediate(id, updates);
    },
    [updateNoteImmediate]
  );

  // Create folder function
  const createFolder = useCallback(
    async (name: string, parentId: string | null = null) => {
      if (!name || !name.trim()) return;

      const newFolder: Folder = {
        id: generateSyncId(),
        name: name.trim(),
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: "pending",
      };

      // Update state first
      setFolders((prev) => {
        if (prev.some((f) => f.id === newFolder.id)) return prev;
        return [...prev, newFolder];
      });

      // Save to database
      await StorageService.saveFolder(newFolder);
    },
    []
  );

  // Create note function
  const createNote = useCallback(
    async (folderId: string | null = null) => {
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

      await StorageService.saveNote(newNote);
      setCurrentNoteId(newNote.id);
      setCurrentScreen("note-editor");
    },
    [currentFolderId]
  );

  // Delete note function
  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // Remove from local state
        setNotes((prev) => prev.filter((note) => note.id !== id));

        // Delete from database
        await StorageService.deleteNote(id);

        // If this was the current note, navigate away
        if (currentNoteId === id) {
          setCurrentNoteId(null);
          setCurrentScreen("notes-list");
        }

        return true;
      } catch (error) {
        console.error("Error deleting note:", error);
        return false;
      }
    },
    [currentNoteId]
  );

  // Delete folder function
  const deleteFolder = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        // Remove folder from local state
        setFolders((prev) => prev.filter((folder) => folder.id !== id));

        // Delete folder from database
        await StorageService.deleteFolder(id);

        // Delete all notes in this folder
        const notesInFolder = notes.filter((note) => note.folderId === id);

        // Remove notes from local state
        setNotes((prev) => prev.filter((note) => note.folderId !== id));

        // Delete notes from database
        for (const note of notesInFolder) {
          await StorageService.deleteNote(note.id);
        }

        // If we're in this folder, navigate to parent
        if (currentFolderId === id) {
          const folder = folders.find((f) => f.id === id);
          setCurrentFolderId(folder?.parentId || null);
        }

        return true;
      } catch (error) {
        console.error("Error deleting folder:", error);
        return false;
      }
    },
    [currentFolderId, folders, notes]
  );

  // Get current path function
  const getCurrentPath = useCallback(() => {
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
  }, [currentFolderId, folders]);

  // Get filtered and sorted items function
  const getFilteredAndSortedItems = useCallback(
    (items: any[], type: "note" | "folder") => {
      let filtered = items;

      if (
        searchQuery &&
        typeof searchQuery === "string" &&
        searchQuery.trim()
      ) {
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
    },
    [searchQuery, sortBy]
  );

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
    updateNoteImmediate,
    getCurrentPath,
    getFilteredAndSortedItems,
    debouncedUpdateNote,
    flushPendingSaves,
    loadData,
    performInitialSync,
    deleteNote,
    deleteFolder,
    sharedContent,
    setSharedContent,
    isSharing,
    setIsSharing,
    processIncomingShare,
    clearSharedContent,
    renameFolder,
    moveNote,
    queryNotes,
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
