import React from "react";
import { View, ScrollView, TouchableOpacity, Text } from "react-native";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import SortControl from "../components/SortControl";
import NoteCard from "../components/NoteCard";
import FolderCard from "../components/FolderCard";
import Divider from "../components/Divider";
import { colors } from "../theme/colors";

const FolderExplorerScreen: React.FC = () => {
  const {
    notes,
    folders,
    currentFolderId,
    setCurrentFolderId,
    createFolder,
    createNote,
    getCurrentPath,
    getFilteredAndSortedItems,
  } = useApp();

  const currentFolderNotes = getFilteredAndSortedItems(
    notes.filter((n) => n.folderId === currentFolderId),
    "note"
  );

  const subfolders = getFilteredAndSortedItems(
    folders.filter((f) => f.parentId === currentFolderId),
    "folder"
  );

  const handleCreateFolder = () => {
    const name = `Folder ${folders.length + 1}`;
    createFolder(name, currentFolderId);
  };

  const handleCreateNote = () => {
    createNote(currentFolderId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <SearchBar />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 12,
        }}
      >
        {currentFolderId && (
          <TouchableOpacity
            style={{
              backgroundColor: colors.backgroundFolder,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 12,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
            onPress={() => {
              const parent = folders.find((f) => f.id === currentFolderId);
              setCurrentFolderId(parent?.parentId || null);
            }}
          >
            <ChevronLeft size={16} color={colors.text} />
            <Text style={{ marginLeft: 4, color: colors.text }}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <SortControl />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <Text
          style={{ fontSize: 18, color: colors.primary, fontFamily: "serif" }}
        >
          {getCurrentPath()}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {currentFolderNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}

        {currentFolderNotes.length > 0 && subfolders.length > 0 && (
          <View
            style={{
              height: 2,
              backgroundColor: colors.text,
              marginVertical: 16,
            }}
          />
        )}

        {subfolders.map((folder) => (
          <FolderCard key={folder.id} folder={folder} />
        ))}

        {currentFolderNotes.length === 0 && subfolders.length > 0 && (
          <Divider text="End of Folders" />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 16,
            marginRight: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={handleCreateFolder}
        >
          <Text style={{ fontSize: 16, color: colors.text, marginRight: 8 }}>
            Create a new folder
          </Text>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{ width: 2, backgroundColor: colors.text, opacity: 0.3 }}
        />

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 16,
            marginLeft: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={handleCreateNote}
        >
          <Text style={{ fontSize: 16, color: colors.text, marginRight: 8 }}>
            Create a new note
          </Text>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FolderExplorerScreen;
