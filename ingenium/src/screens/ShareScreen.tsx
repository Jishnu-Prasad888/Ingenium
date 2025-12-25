import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Share,
} from "react-native";
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  SendHorizontal,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import SortControl from "../components/SortControl";
import NoteCard from "../components/NoteCard";
import FolderCard from "../components/FolderCard";
import Divider from "../components/Divider";
import { colors } from "../theme/colors";

interface ShareScreenProps {
  sharedContent?: string;
  onContentSaved?: () => void;
  onCancel?: () => void;
}

const ShareScreen: React.FC<ShareScreenProps> = ({
  sharedContent = "",
  onContentSaved,
}) => {
  const {
    notes,
    folders,
    currentFolderId,
    setCurrentFolderId,
    createFolder,
    createNote,
    updateNote,
    getCurrentPath,
    getFilteredAndSortedItems,
    setCurrentScreen,
  } = useApp();

  const [showNotes, setShowNotes] = useState(true);
  const [showFolders, setShowFolders] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter notes and folders for current folder
  const currentFolderNotes = getFilteredAndSortedItems(
    notes.filter((n) => n.folderId === currentFolderId),
    "note"
  );

  const subfolders = getFilteredAndSortedItems(
    folders.filter((f) => f.parentId === currentFolderId),
    "folder"
  );

  // Handle creating a new note with shared content
  const handleCreateNoteWithSharedContent = async () => {
    if (!sharedContent.trim()) return;

    setIsSaving(true);
    try {
      // Create a new note with shared content
      const newNote = {
        id: Date.now().toString(),
        folderId: currentFolderId,
        title: "Shared Content",
        content: sharedContent,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: "pending",
      };

      // Save the note
      await createNote(currentFolderId);

      // Find the newly created note and update it with shared content
      const latestNote = notes[notes.length - 1];
      if (latestNote) {
        await updateNote(latestNote.id, {
          title: "Shared Content",
          content: sharedContent,
        });
      }

      Alert.alert("Success", "Content saved successfully!");
      if (onContentSaved) {
        onContentSaved();
      }
    } catch (error) {
      console.error("Error saving shared content:", error);
      Alert.alert("Error", "Failed to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding to existing note
  const handleAddToExistingNote = async () => {
    if (!selectedNoteId || !sharedContent.trim()) return;

    setIsSaving(true);
    try {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (!note) {
        throw new Error("Note not found");
      }

      // Append shared content to existing note
      const newContent = note.content
        ? `${note.content}\n\n---\n${sharedContent}`
        : sharedContent;

      await updateNote(selectedNoteId, {
        content: newContent,
      });

      Alert.alert("Success", "Content added to note successfully!");
      if (onContentSaved) {
        onContentSaved();
      }
    } catch (error) {
      console.error("Error adding to note:", error);
      Alert.alert("Error", "Failed to add content to note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
      <Text
        style={{
          fontSize: 15,
          color: colors.text,
          fontWeight: "600",
        }}
      >
        {title} ({count})
      </Text>
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

      {/* Shared Content Preview */}
      <View
        style={{
          backgroundColor: colors.backgroundAlt,
          padding: 16,
          marginHorizontal: 20,
          marginTop: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.primary,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: colors.primary,
            marginBottom: 8,
          }}
        >
          Shared Content:
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
          }}
          numberOfLines={3}
        >
          {sharedContent || "No content received"}
        </Text>
      </View>

      <SearchBar />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          marginBottom: 12,
          marginTop: 8,
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
          style={{ fontSize: 16, color: colors.primary, fontFamily: "serif" }}
        >
          Save to: {getCurrentPath()}
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
        {/* Notes Section */}
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
                <TouchableOpacity
                  key={note.id}
                  onPress={() => setSelectedNoteId(note.id)}
                  style={{
                    backgroundColor:
                      selectedNoteId === note.id
                        ? colors.primary + "20"
                        : colors.backgroundCard,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: selectedNoteId === note.id ? 2 : 0,
                    borderColor: colors.primary,
                  }}
                >
                  <NoteCard note={note} />
                </TouchableOpacity>
              ))}
          </>
        )}

        {/* Divider */}
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

        {/* Folders Section */}
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 16,
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
          disabled={isSaving}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.text,
              textAlign: "center",
              marginRight: 8,
            }}
          >
            New Folder
          </Text>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 16,
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
          disabled={isSaving}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.text,
              textAlign: "center",
              marginRight: 8,
            }}
          >
            New Note
          </Text>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 2,
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            opacity: isSaving ? 0.7 : 1,
          }}
          onPress={
            selectedNoteId
              ? handleAddToExistingNote
              : handleCreateNoteWithSharedContent
          }
          disabled={isSaving || !sharedContent.trim()}
        >
          <SendHorizontal size={20} color={colors.white} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: colors.white,
              marginLeft: 10,
            }}
          >
            {selectedNoteId ? "Add to Note" : "Save Here"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShareScreen;
