// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { AppProvider, useApp } from "./src/context/AppContext";
import { colors } from "./src/theme/colors";
import StorageService from "./src/services/StorageService";
import { AppContent } from "./src/components/AppContent";
import { useShareIntent } from "expo-share-intent";

// Simple wrapper, just renders AppContent
const AppWrapper: React.FC = () => <AppContent />;

const IngeniumApp: React.FC = () => {
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Initialize SQLite database
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Initializing SQLite database...");
        await StorageService.initialize();
        console.log("SQLite database initialized successfully");
        setDatabaseInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitializationError(
          "Failed to initialize database. Please restart the app."
        );
        setDatabaseInitialized(true); // allow app to continue
      }
    };

    initializeApp();

    return () => {
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

  // Listener for shared content from other apps
  const ShareIntentListener: React.FC = () => {
    const { processIncomingShare } = useApp();
    const { hasShareIntent, shareIntent } = useShareIntent({
      resetOnBackground: true,
    });

    useEffect(() => {
      if (hasShareIntent && shareIntent?.text) {
        processIncomingShare(shareIntent.text);
      }
    }, [hasShareIntent, shareIntent]);

    return null;
  };

  return (
    <AppProvider>
      <ShareIntentListener />
      <AppWrapper />
    </AppProvider>
  );
};

export default IngeniumApp;
