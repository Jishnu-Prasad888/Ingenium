import React from "react";
import { View, TouchableOpacity } from "react-native";
import { List, FilePlus, Folder, Pencil } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BottomNavigationBar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    setCurrentFolderId,
    notes,
    setCurrentNoteId,
    createNote,
  } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingBottom: Math.max(insets.bottom, 12) + 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.backgroundCard,
          borderRadius: 20,
          padding: 6,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.14,
          shadowRadius: 10,
          elevation: 6,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor:
              currentScreen === "notes-list"
                ? colors.primaryLight
                : "transparent",
            borderRadius: 14,
            padding: 12,
            alignItems: "center",
          }}
          onPress={() => {
            setCurrentFolderId(null);
            setCurrentScreen("notes-list");
          }}
        >
          <List
            size={22}
            color={
              currentScreen === "notes-list" ? colors.primary : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor:
              currentScreen === "note-editor"
                ? colors.primaryLight
                : "transparent",
            borderRadius: 14,
            padding: 12,
            alignItems: "center",
          }}
          onPress={() => {
            if (notes.length > 0) {
              const mostRecent = notes.reduce((latest, note) =>
                note.createdAt > latest.createdAt ? note : latest,
              );
              setCurrentNoteId(mostRecent.id);
              setCurrentScreen("note-editor");
            } else {
              createNote(null);
            }
          }}
        >
          <FilePlus
            size={22}
            color={
              currentScreen === "note-editor" ? colors.primary : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor:
              currentScreen === "folder-explorer"
                ? colors.primaryLight
                : "transparent",
            borderRadius: 14,
            padding: 12,
            alignItems: "center",
          }}
          onPress={() => {
            setCurrentFolderId(null);
            setCurrentScreen("folder-explorer");
          }}
        >
          <Folder
            size={22}
            color={
              currentScreen === "folder-explorer"
                ? colors.primary
                : colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor:
              currentScreen === "whiteboard"
                ? colors.primaryLight
                : "transparent",
            borderRadius: 14,
            padding: 12,
            alignItems: "center",
          }}
          onPress={() => {
            setCurrentFolderId(null);
            setCurrentScreen("whiteboard");
          }}
        >
          <Pencil
            size={22}
            color={
              currentScreen === "whiteboard" ? colors.primary : colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BottomNavigationBar;
