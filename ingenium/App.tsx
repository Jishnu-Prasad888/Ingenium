// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { AppProvider } from "./src/context/AppContext";
import { useFonts } from "expo-font";
import NotesListScreen from "./src/screens/NotesListScreen";
import FolderExplorerScreen from "./src/screens/FolderExplorerScreen";
import NoteEditorScreen from "./src/screens/NoteEditorScreen";
import BottomNavigationBar from "./src/components/BottomNavigationBar";
import SyncIndicator from "./src/components/SyncIndicator";
import { colors } from "./src/theme/colors";
import { useApp } from "./src/context/AppContext";
import StorageService from "./src/services/StorageService";
import DebugDatabaseInfo from "./src/components/DebugDatabaseInfo";
// Separate component that uses the AppContext
const AppContent: React.FC = () => {
  const { currentScreen } = useApp();
  const [fontsLoaded] = useFonts({
    logo: require("./assets/fonts/logo.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
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
      {__DEV__ && <DebugDatabaseInfo />}
    </View>
  );
};

// Main App component
const IngeniumApp: React.FC = () => {
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Initializing SQLite database...");

        // Initialize the database
        await StorageService.initialize();

        console.log("SQLite database initialized successfully");
        setDatabaseInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitializationError(
          "Failed to initialize database. Please restart the app."
        );
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      // Ensure data is saved before component unmounts
      const cleanup = async () => {
        try {
          await StorageService.ensureDataSaved();
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      };

      cleanup();
    };
  }, []);

  // Show loading screen while database initializes
  if (!databaseInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 20, color: colors.text, fontSize: 16 }}>
          Initializing database...
        </Text>
        {initializationError && (
          <Text
            style={{
              marginTop: 10,
              color: colors.error,
              fontSize: 14,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {initializationError}
          </Text>
        )}
      </View>
    );
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default IngeniumApp;
