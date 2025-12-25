// src/components/AppContent.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useFonts } from "expo-font";
import NotesListScreen from "../screens/NotesListScreen";
import FolderExplorerScreen from "../screens/FolderExplorerScreen";
import NoteEditorScreen from "../screens/NoteEditorScreen";
import BottomNavigationBar from "./BottomNavigationBar";
import SyncIndicator from "./SyncIndicator";
import { colors } from "../theme/colors";
import DebugDatabaseInfo from "./DebugDatabaseInfo";
import ShareScreen from "../screens/ShareScreen";
import * as Linking from "expo-linking";
import { useApp } from "../context/AppContext";

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
    logo: require("../../assets/fonts/logo.ttf"),
  });

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

  // Handle initial URL when app opens
  useEffect(() => {
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log("App opened with URL:", initialUrl);
          // Delay slightly to ensure context is ready
          setTimeout(() => {
            handleIncomingShare(initialUrl);
          }, 500);
        }
      } catch (error) {
        console.error("Error getting initial URL:", error);
      }
    };

    handleInitialURL();
  }, []);

  const handleIncomingShare = (url: string) => {
    try {
      console.log("Processing share URL:", url);

      let sharedText = "";

      // Parse the URL to extract just the content
      if (url.startsWith("ingenium://share/")) {
        // Extract content after 'ingenium://share/'
        const contentPart = url.replace("ingenium://share/", "");
        sharedText = decodeURIComponent(contentPart);
      } else if (url.startsWith("ingenium://")) {
        // For other ingenium URLs, extract path
        const parsed = Linking.parse(url);
        if (parsed.path) {
          sharedText = decodeURIComponent(parsed.path.replace(/^\//, ""));
        }
      } else if (url.includes("text=")) {
        // Handle text= parameter
        const urlObj = new URL(url);
        sharedText = urlObj.searchParams.get("text") || "";
      } else if (url.startsWith("text://")) {
        // Direct text scheme
        sharedText = url.replace("text://", "");
      } else if (url.startsWith("http://") || url.startsWith("https://")) {
        // Direct URL
        sharedText = url;
      } else {
        // Try to extract text from query parameters
        try {
          const parsed = Linking.parse(url);
          if (parsed.queryParams?.text) {
            sharedText = parsed.queryParams.text as string;
          } else if (parsed.queryParams?.url) {
            sharedText = parsed.queryParams.url as string;
          } else {
            // Use the whole URL as a fallback
            sharedText = url;
          }
        } catch (e) {
          // If all else fails, use the URL
          sharedText = url;
        }
      }

      if (sharedText && sharedText.trim()) {
        console.log(
          "Extracted shared content:",
          sharedText.substring(0, 100) + "..."
        );
        setSharedContent(sharedText);
        setIsSharing(true);
        setCurrentScreen("folder-explorer");
      }
    } catch (error) {
      console.error("Error processing share:", error);
      Alert.alert("Error", "Could not process shared content.");
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

export default AppContent;
