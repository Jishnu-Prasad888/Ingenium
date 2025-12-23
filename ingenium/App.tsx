import React from "react";
import { View } from "react-native";
import { AppProvider } from "./src/context/AppContext";
import NotesListScreen from "./src/screens/NotesListScreen";
import FolderExplorerScreen from "./src/screens/FolderExplorerScreen";
import NoteEditorScreen from "./src/screens/NoteEditorScreen";
import BottomNavigationBar from "./src/components/BottomNavigationBar";
import SyncIndicator from "./src/components/SyncIndicator";
import { colors } from "./src/theme/colors";
import { useApp } from "./src/context/AppContext";

const AppContent: React.FC = () => {
  const { currentScreen } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {currentScreen === "notes-list" && <NotesListScreen />}
      {currentScreen === "folder-explorer" && <FolderExplorerScreen />}
      {currentScreen === "note-editor" && <NoteEditorScreen />}
      <BottomNavigationBar />
      <SyncIndicator />
    </View>
  );
};

const IngeniumApp: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default IngeniumApp;
