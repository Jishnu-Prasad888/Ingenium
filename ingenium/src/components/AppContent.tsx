// src/components/AppContent.tsx
import React from "react";
import { View } from "react-native";
import { useApp } from "../context/AppContext";
import NotesListScreen from "../screens/NotesListScreen";
import FolderExplorerScreen from "../screens/FolderExplorerScreen";
import NoteEditorScreen from "../screens/NoteEditorScreen";
import ShareScreen from "../screens/ShareScreen";
import BottomNavigationBar from "./BottomNavigationBar";
import SyncIndicator from "./SyncIndicator";
import DebugDatabaseInfo from "./DebugDatabaseInfo";
import { colors } from "../theme/colors";
import DeepLinkHandler from "./DeepLinkHandler";
import QueryNotesScreen from "../screens/QueryNotesScreen";
import WhiteboardScreen from "../screens/WhiteboardScreen";

export const AppContent: React.FC = () => {
  const { currentScreen, isSharing, sharedContent, clearSharedContent } =
    useApp();

  return (
    <View style={{ flex: 1 }}>
      <DeepLinkHandler />

      {isSharing ? (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ShareScreen
            sharedContent={sharedContent}
            onContentSaved={clearSharedContent}
          />
        </View>
      ) : (
        <>
          {currentScreen === "notes-list" && <NotesListScreen />}
          {currentScreen === "folder-explorer" && <FolderExplorerScreen />}
          {currentScreen === "note-editor" && <NoteEditorScreen />}
          {currentScreen === "query-notes" && <QueryNotesScreen />}
          {currentScreen === "WhiteboardScreen" && <WhiteboardScreen />}

          <BottomNavigationBar />
          <SyncIndicator />
        </>
      )}
    </View>
  );
};
