import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { ChevronLeft, Plus, ChevronDown, ChevronRight } from "lucide-react-native";

import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import SortControl from "../components/SortControl";
import NoteCard from "../components/NoteCard";
import FolderCard from "../components/FolderCard";
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
    "note",
  );

  const subfolders = getFilteredAndSortedItems(
    folders.filter((f) => f.parentId === currentFolderId),
    "folder",
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
    <TouchableOpacity onPress={onPress} style={styles.sectionHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      </View>
      {expanded ? (
        <ChevronDown size={18} color={colors.text} />
      ) : (
        <ChevronRight size={18} color={colors.text} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <Header subtitle="Folders & hierarchy" />
      <SearchBar />

      <View style={styles.toolbar}>
        {currentFolderId && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              const parent = folders.find((f) => f.id === currentFolderId);
              setCurrentFolderId(parent?.parentId || null);
            }}
          >
            <ChevronLeft size={16} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }}>
          <SortControl />
        </View>
      </View>

      <View style={styles.pathPill}>
        <Text style={styles.pathText}>Path: {getCurrentPath()}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currentFolderNotes.length === 0 && subfolders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>This folder is empty</Text>
          </View>
        ) : (
          <>
            {currentFolderNotes.length > 0 && (
              <View style={{ gap: 10 }}>
                <SectionHeader
                  title="Notes"
                  count={currentFolderNotes.length}
                  expanded={showNotes}
                  onPress={() => setShowNotes((prev) => !prev)}
                />

                {showNotes &&
                  currentFolderNotes.map((note) => <NoteCard key={note.id} note={note} />)}
              </View>
            )}

            {currentFolderNotes.length > 0 && subfolders.length > 0 && (
              <View style={styles.divider} />
            )}

            {subfolders.length > 0 && (
              <View style={{ gap: 10 }}>
                <SectionHeader
                  title="Folders"
                  count={subfolders.length}
                  expanded={showFolders}
                  onPress={() => setShowFolders((prev) => !prev)}
                />

                {showFolders &&
                  subfolders.map((folder) => <FolderCard key={folder.id} folder={folder} />)}
              </View>
            )}
          </>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateFolder}>
            <Text style={styles.actionText}>New Folder</Text>
            <Plus size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCreateNote}>
            <Text style={styles.actionText}>New Note</Text>
            <Plus size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default FolderExplorerScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  backText: {
    marginLeft: 4,
    color: colors.text,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  pathPill: {
    marginHorizontal: 20,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pathText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 160,
    gap: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  sectionCount: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  actionText: {
    fontSize: 15,
    color: colors.text,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
