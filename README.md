# Project Ingenium

**Harmonising Imagination and Structure**

Project Ingenium is a structured yet flexible note-taking application designed to help users organise ideas through notes, folders, and subfolders while maintaining a smooth and intuitive navigation experience. Notes are stored remotely using Appwrite, ensuring persistence and scalability.

---

## Core Features

### Notes & Storage

- Create notes and store them remotely in an Appwrite database.
- Each note records its creation date automatically.
- By default, every new note is assigned a randomly generated unique ID as its title.
- Notes can be shared via system share sheets (WhatsApp, Instagram chats, etc.).

### Folder System

- Create folders and nested subfolders.
- Move notes freely between folders and subfolders.
- Navigate back one level up in the folder hierarchy using a back button.
- Notes created:

  - From the main notes list are created in the root (`/`) directory.
  - From within a folder or subfolder are created inside that directory.

### Navigation & UI Behavior

- “Always stay on top” button:

  - Available in the notes list and inside folders.
  - Instantly scrolls the user back to the top of the screen.

- The app title **Ingenium** and the bottom snack bar always remain visible.
- Bottom snack bar behavior:

  - **List icon**: Displays all notes only (no folders).
  - **File icon**:

    - Opens the note editor.
    - If opened directly, shows the most recently created note.
    - If no notes exist, displays a “Create your first note” message.

  - **Folder icon**:

    - Opens the folder explorer.
    - Defaults to the root (`/`) directory.
    - Displays all folders, subfolders, and notes in that directory.

### Folder & Notes View Layout

- Folder explorer screen layout:

  - Folders and subfolders are displayed in one scrollable view.
  - Notes are displayed in a separate scrollable view.
  - Both views are contained within a parent view that allows scrolling between them.

### Search & Sorting

- Search functionality for both notes and folders.
- Sorting options for notes and folders:

  - By creation date (ascending and descending).
  - Alphabetical order (A–Z and Z–A).

---

## Icons Used

Icons are provided by **lucide-react** and lucide.dev.

- Search
  [https://lucide.dev/icons/search](https://lucide.dev/icons/search)
- Chevron Down
  [https://lucide.dev/icons/chevron-down](https://lucide.dev/icons/chevron-down)
- Arrow Down
  [https://lucide.dev/icons/arrow-down?search=drop](https://lucide.dev/icons/arrow-down?search=drop)
- Plus
  [https://lucide.dev/icons/plus](https://lucide.dev/icons/plus)
- Circle Chevron Right
  [https://lucide.dev/icons/circle-chevron-right](https://lucide.dev/icons/circle-chevron-right)
- File Plus
  [https://lucide.dev/icons/file-plus](https://lucide.dev/icons/file-plus)
- List
  [https://lucide.dev/icons/list](https://lucide.dev/icons/list)
- Share
  [https://lucide.dev/icons/share-2](https://lucide.dev/icons/share-2)

---

## Dependencies

Key dependencies used in Project Ingenium:

```json
{
  "nativewind": "^4.2.1",
  "react-native-appwrite": "^0.19.0",
  "react-native-safe-area-context": "~5.6.0",
  "tailwindcss": "^3.3.2"
}
```

Additional libraries:

- lucide-react
- Other supporting React Native dependencies

---

## Vision

Project Ingenium focuses on blending creativity with structure—allowing users to capture ideas instantly while maintaining a clean, navigable, and scalable organisation system.
