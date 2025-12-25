import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { AppProvider, useApp } from "./src/context/AppContext";
import { colors } from "./src/theme/colors";
import StorageService from "./src/services/StorageService";
import { AppContent } from "./src/components/AppContent";
import { useShareIntent } from "expo-share-intent";
import * as Linking from "expo-linking";

const AppWrapper: React.FC = () => <AppContent />;

const IncomingContentHandler: React.FC = () => {
  const { processIncomingShare } = useApp();
  const { hasShareIntent, shareIntent } = useShareIntent({
    resetOnBackground: true,
  });

  // Handle share intents from other apps
  useEffect(() => {
    if (hasShareIntent && shareIntent?.text) {
      const text = Array.isArray(shareIntent.text)
        ? shareIntent.text[0]
        : shareIntent.text;
      processIncomingShare(text);
    }
  }, [hasShareIntent, shareIntent]);

  // Handle deep links (ingenium:// or https://)
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;

      try {
        const parsed = Linking.parse(url);
        if (parsed.hostname === "share") {
          const textParam = parsed.queryParams?.text;
          if (textParam) {
            const content = Array.isArray(textParam) ? textParam[0] : textParam;
            processIncomingShare(content);
          }
        }
      } catch (e) {
        console.error("Error processing deep link:", e);
      }
    };

    // Handle initial URL
    Linking.getInitialURL().then(handleUrl);

    // Listen for incoming URLs while app is running
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
};
const IngeniumApp: React.FC = () => {
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await StorageService.initialize();
        setDatabaseInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitializationError(
          "Failed to initialize database. Please restart the app."
        );
        setDatabaseInitialized(true);
      }
    };
    initializeApp();
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
      <IncomingContentHandler />
      <AppWrapper />
    </AppProvider>
  );
};

export default IngeniumApp;
