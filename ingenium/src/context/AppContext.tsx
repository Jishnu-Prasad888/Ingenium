import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from "react";
import {
  AppState,
  AppStateStatus,
  Platform,
  BackHandler,
  Alert,
} from "react-native";
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
  ensureDataSaved: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
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

  const isSavingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const isExitingRef = useRef(false);

  useEffect(() => {
    loadData();
    performInitialSync();
    setupAppStateListeners();

    // Initialize storage service
    StorageService.initialize();

    return () => {
      cleanup();
    };
  }, []);

  const setupAppStateListeners = () => {
    // Listen for app state changes
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Handle hardware back button on Android
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress
      );
      return () => {
        subscription.remove();
        backHandler.remove();
      };
    }

    return () => subscription.remove();
  };

  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App coming to foreground
        console.log("App has come to the foreground");
        await loadData();
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background
        console.log("App is going to the background");
        await ensureAllDataSaved();
      }

      appStateRef.current = nextAppState;
    },
    []
  );

  const handleBackPress = useCallback(() => {
    if (
      currentScreen === "note-editor" ||
      currentScreen === "folder-explorer"
    ) {
      // Save data before navigating back
      ensureAllDataSaved().then(() => {
        // Navigate back based on current screen
        if (currentScreen === "note-editor") {
          setCurrentScreen("notes-list");
        } else if (currentScreen === "folder-explorer") {
          const parent = folders.find((f) => f.id === currentFolderId);
          setCurrentFolderId(parent?.parentId || null);
        }
      });
      return true; // Prevent default back behavior
    }
    return false;
  }, [currentScreen, currentFolderId, folders]);

  // Ensure all data is saved
  const ensureAllDataSaved = async (): Promise<void> => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      console.log("Ensuring all data is saved...");
      await StorageService.ensureDataSaved();
      console.log("All data saved successfully");
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      isSavingRef.current = false;
    }
  };

  // Handle app exit/cleanup
  const cleanup = async () => {
    if (isExitingRef.current) return;

    isExitingRef.current = true;
    console.log("Performing cleanup before exit...");

    try {
      await ensureAllDataSaved();
      // Optionally perform a final sync
      await SyncService.quickSync();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

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

  // Update createFolder to ensure immediate save
  const createFolder = async (name: string, parentId: string | null = null) => {
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

    // Ensure immediate persistence
    await ensureAllDataSaved();
  };

  // Update createNote to ensure immediate save
  const createNote = async (folderId: string | null = null) => {
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
    await ensureAllDataSaved();

    setCurrentNoteId(newNote.id);
    setCurrentScreen("note-editor");
  };

  // Update updateNote to ensure immediate save
  const updateNote = async (id: string, updates: Partial<Note>) => {
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
      await StorageService.saveNote(updated);
      await ensureAllDataSaved();
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
    ensureDataSaved: ensureAllDataSaved,
    exportData: StorageService.exportData,
    importData: StorageService.importData,
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
