export type ScreenName =
  | "notes-list"
  | "folder-explorer"
  | "note-editor"
  | "query-notes"
  | "whiteboard"
  | "share";

export type SortOption =
  | "date-asc"
  | "date-desc"
  | "alpha-asc"
  | "alpha-desc";

export type NoteType = "text" | "whiteboard";

export type SyncStatus = "pending" | "synced";

export interface PendingUpdate {
  noteId: string;
  updates: Record<string, unknown>;
}

export type ToolType = "pen" | "pencil" | "eraser";

export interface Stroke {
  path: string;
  color: string;
  width: number;
  isEraser?: boolean;
  isPencil?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

export interface SelectedNote {
  id: string;
  title: string;
  content: string;
}
