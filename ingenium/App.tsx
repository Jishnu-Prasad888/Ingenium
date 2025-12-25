// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert, Platform } from "react-native";
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
import ShareScreen from "./src/screens/ShareScreen";
import * as Linking from "expo-linking";

// Wrapper component that conditionally renders screens based on sharing state
const AppContent: React.FC = () => {
  const {
    currentScreen,
    isSharing,
    sharedContent,
    setIsSharing,
    setSharedContent,
    setCurrentScreen,
  } = useApp();
  const [fontsLoaded] = useFonts({
    logo: require("./assets/fonts/logo.ttf"),
  });

  const extractSharedText = (input: string): string | null => {
    if (!input) return null;

    const trimmed = input.trim();

    // Reject binary / unsupported schemes
    if (/^(file|content|intent|mailto):\/\//i.test(trimmed)) {
      return null;
    }

    // If it contains text or a URL anywhere, accept it
    return trimmed;
  };

  // Handle deep links when app is already open
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("Deep link received while app is open:", url);
      handleIncomingShare(url);
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleIncomingShare = (url: string) => {
    try {
      let sharedText: string | null = null;

      const parsed = Linking.parse(url);

      if (parsed?.queryParams?.text) {
        sharedText = String(parsed.queryParams.text);
      } else if (parsed?.queryParams?.url) {
        sharedText = String(parsed.queryParams.url);
      } else if (
        parsed?.scheme === "ingenium" &&
        parsed?.path?.startsWith("share")
      ) {
        sharedText = decodeURIComponent(parsed.path.replace(/^share\/?/, ""));
      } else {
        sharedText = extractSharedText(url);
      }

      if (!sharedText) return;

      setSharedContent(sharedText);
      setIsSharing(true);
      setCurrentScreen("folder-explorer");
    } catch (error) {
      console.error("Error processing share:", error);
    }
  };

  const handleContentSaved = () => {
    // Reset sharing state after content is saved
    setIsSharing(false);
    setSharedContent("");
    setCurrentScreen("notes-list");

    Alert.alert("Success", "Content saved successfully!", [{ text: "OK" }]);
  };

  const handleCancelShare = () => {
    setIsSharing(false);
    setSharedContent("");
    setCurrentScreen("notes-list");
  };

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

  // Show ShareScreen when isSharing is true
  if (isSharing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ShareScreen
          sharedContent={sharedContent}
          onContentSaved={handleContentSaved}
          onCancel={handleCancelShare}
        />
        {__DEV__ && <DebugDatabaseInfo />}
      </View>
    );
  }

  // Normal app flow
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

        // Still continue with app
        setDatabaseInitialized(true);
      }
    };

    initializeApp();

    // Handle app opening with deep link
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log("App opened with URL:", initialUrl);

          // Small delay to ensure context is initialized
          setTimeout(() => {
            // We'll process this in AppContent component
            console.log("Initial URL will be processed in AppContent");
          }, 1000);
        }
      } catch (error) {
        console.error("Error getting initial URL:", error);
      }
    };

    handleInitialURL();

    // Setup intent listener for Android
    if (Platform.OS === "android") {
      // Listen for incoming intents
      // Note: For full Android intent handling, you'd need a custom native module
      // This is a simplified version
      console.log("Android platform detected, setting up intent handling...");

      // You can add more Android-specific intent handling here
      // For now, we rely on deep linking
    }

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
