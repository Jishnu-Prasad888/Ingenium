import React, { useState } from "react";
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
} from "lucide-react-native";

import { View, ScrollView, TouchableOpacity, Text } from "react-native";
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
    const existingNumbers = folders
      .map((f) => {
        const match = f.name.match(/^Folder (\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const name = `Folder ${nextNumber}`;

    createFolder(name, currentFolderId);
  };

  const handleCreateNote = () => {
    createNote(currentFolderId);
  };

  const [showNotes, setShowNotes] = useState(true);
  const [showFolders, setShowFolders] = useState(true);

  const SectionHeader = ({
    title,
    count,
    expanded,
    onPress,
  }: {
    title: string;
    count: number;
    expanded: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
      }}
    >
      {/* Left side: text */}
      <Text
        style={{
          fontSize: 15,
          color: colors.text,
          fontWeight: "600",
        }}
      >
        {title} ({count})
      </Text>

      {/* Right side: icon only */}
      {expanded ? (
        <ChevronDown size={20} color={colors.text} />
      ) : (
        <ChevronRight size={20} color={colors.text} />
      )}
    </TouchableOpacity>
  );

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
              marginTop: -11,
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

      <View style={{ paddingHorizontal: 20, marginBottom: 12, marginTop: -10 }}>
        <Text
          style={{ fontSize: 16, color: colors.primary, fontFamily: "serif" }}
        >
          Folder : {getCurrentPath()}
        </Text>
      </View>

      <ScrollView
        style={{
          flex: 1,
          paddingHorizontal: 20,
          marginBottom: 2,
          borderRadius: 10,
        }}
      >
        {/* Notes Section (only if notes exist) */}
        {currentFolderNotes.length > 0 && (
          <>
            <SectionHeader
              title="Notes"
              count={currentFolderNotes.length}
              expanded={showNotes}
              onPress={() => setShowNotes((prev) => !prev)}
            />

            {showNotes &&
              currentFolderNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
          </>
        )}

        {/* Divider only if both sections exist */}
        {currentFolderNotes.length > 0 && subfolders.length > 0 && (
          <View
            style={{
              height: 1,
              backgroundColor: colors.text,
              marginVertical: 16,
              opacity: 0.3,
            }}
          />
        )}

        {/* Folders Section (only if folders exist) */}
        {subfolders.length > 0 && (
          <>
            <SectionHeader
              title="Folders"
              count={subfolders.length}
              expanded={showFolders}
              onPress={() => setShowFolders((prev) => !prev)}
            />

            {showFolders &&
              subfolders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 112,
          flexDirection: "row",
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 10,
            paddingRight: 20,
            marginRight: 10,
            height: 45,
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
          <Text
            style={{
              fontSize: 14,
              color: colors.text,
              paddingLeft: 10,
              textAlign: "center",
            }}
          >
            Create a new folder
          </Text>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{
            width: 3,
            backgroundColor: colors.primary,
            opacity: 1,
            height: 34,
            borderRadius: 12,
          }}
        />

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 10,
            paddingRight: 20,
            marginLeft: 10,
            height: 45,
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
          <Text
            style={{
              fontSize: 14,
              color: colors.text,
              paddingLeft: 10,
              textAlign: "center",
            }}
          >
            Create a new note
          </Text>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FolderExplorerScreen;
