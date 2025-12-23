import React from "react";
import { View, ActivityIndicator } from "react-native";
import { AppProvider } from "./src/context/AppContext";
import { useFonts } from "expo-font";
import NotesListScreen from "./src/screens/NotesListScreen";
import FolderExplorerScreen from "./src/screens/FolderExplorerScreen";
import NoteEditorScreen from "./src/screens/NoteEditorScreen";
import BottomNavigationBar from "./src/components/BottomNavigationBar";
import SyncIndicator from "./src/components/SyncIndicator";
import { colors } from "./src/theme/colors";
import { useApp } from "./src/context/AppContext";

const AppContent: React.FC = () => {
  const { currentScreen } = useApp();
  const [fontsLoaded] = useFonts({
    logo: require("./assets/fonts/logo.ttf"),
  });
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
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
