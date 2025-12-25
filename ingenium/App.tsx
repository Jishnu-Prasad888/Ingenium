// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { AppProvider } from "./src/context/AppContext";
import { colors } from "./src/theme/colors";
import StorageService from "./src/services/StorageService";
import { AppContent } from "./src/components/AppContent";

// Wrapper that lazy-loads AppContent
// Wrapper that lazy-loads AppContent
const AppWrapper: React.FC = () => {
  return <AppContent />;
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
        await StorageService.initialize();
        console.log("SQLite database initialized successfully");
        setDatabaseInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitializationError(
          "Failed to initialize database. Please restart the app."
        );
        // Allow app to continue even if DB fails
        setDatabaseInitialized(true);
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

  return (
    <AppProvider>
      <AppWrapper />
    </AppProvider>
  );
};

export default IngeniumApp;
