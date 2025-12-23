import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from "react-native";
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <SearchBar />

      {/* Back button + SortControl row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12, // reduced gap to screen edge
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
            }}
            onPress={() => {
              const parent = folders.find((f) => f.id === currentFolderId);
              setCurrentFolderId(parent?.parentId ?? null);
            }}
          >
            <ChevronLeft size={16} color={colors.text} />
            <Text
              style={{
                marginLeft: 4,
                color: colors.text,
              }}
              numberOfLines={1}
            >
              Back
            </Text>
          </TouchableOpacity>
        )}

        <View
          style={{
            flex: 1,
            minWidth: 0,
            justifyContent: "center",
          }}
        >
          <SortControl />
        </View>
      </View>

      {/* Folder path */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <Text
          style={{ fontSize: 18, color: colors.primary, fontFamily: "serif" }}
        >
          Folder path : {getCurrentPath()}
        </Text>
      </View>

      {/* Notes and folders */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          flexDirection: "row",
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            height: 40,
            marginRight: 5,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
          onPress={() => createFolder(currentFolderId)}
        >
          <Text style={{ fontSize: 12, color: colors.text, marginRight: 2 }}>
            Create a new folder
          </Text>
          <Plus size={16} color={colors.text} />
        </TouchableOpacity>
        <View
          style={{
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 2,
              height: 35,
              backgroundColor: "brown",
              borderRadius: 1,
            }}
          />
        </View>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            height: 40,
            padding: 2,
            marginLeft: 4,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
          onPress={() => createNote(currentFolderId)}
        >
          <Text style={{ fontSize: 12, color: colors.text, marginRight: 2 }}>
            Create a new note
          </Text>
          <Plus size={16} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FolderExplorerScreen;
