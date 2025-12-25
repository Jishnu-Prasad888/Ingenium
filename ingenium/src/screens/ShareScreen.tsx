import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Share,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  SendHorizontal,
  X,
  Search,
  FolderPlus,
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

  // Modal states
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [newNoteName, setNewNoteName] = useState("Shared Content");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderForNewNote, setSelectedFolderForNewNote] = useState<
    string | null
  >(currentFolderId);

  // Filter notes and folders for current folder
  const currentFolderNotes = getFilteredAndSortedItems(
    notes.filter((n) => n.folderId === currentFolderId),
    "note"
  );

  const subfolders = getFilteredAndSortedItems(
    folders.filter((f) => f.parentId === currentFolderId),
    "folder"
  );

  // Get all notes for modal (filtered by search)
  const allNotes = React.useMemo(() => {
    let filtered = notes;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected folder if in modal
    if (selectedFolderForNewNote) {
      filtered = filtered.filter(
        (note) => note.folderId === selectedFolderForNewNote
      );
    }

    return filtered;
  }, [notes, searchQuery, selectedFolderForNewNote]);

  // Open save modal
  const openSaveModal = () => {
    setNewNoteName("Shared Content");
    setSearchQuery("");
    setSelectedFolderForNewNote(currentFolderId);
    setShowNewNoteInput(false);
    setShowNewFolderInput(false);
    setSaveModalVisible(true);
  };

  // Handle saving to existing note
  const handleSaveToExistingNote = async (noteId: string) => {
    if (!sharedContent.trim()) {
      Alert.alert("Error", "No content to save");
      return;
    }

    setIsSaving(true);
    try {
      const note = notes.find((n) => n.id === noteId);
      if (!note) {
        throw new Error("Note not found");
      }

      // Append shared content to existing note
      const separator = note.content ? "\n\n---\n" : "";
      const newContent = note.content + separator + sharedContent;

      await updateNote(noteId, {
        content: newContent,
        updatedAt: Date.now(),
      });

      setSaveModalVisible(false);
      Alert.alert("Success", `Content added to "${note.title}" successfully!`);
      if (onContentSaved) {
        onContentSaved();
      }
    } catch (error) {
      console.error("Error saving to note:", error);
      Alert.alert("Error", "Failed to save content. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle creating new note
  const handleCreateNewNote = async () => {
    if (!sharedContent.trim()) {
      Alert.alert("Error", "No content to save");
      return;
    }

    if (!newNoteName.trim()) {
      Alert.alert("Error", "Please enter a note name");
      return;
    }

    setIsSaving(true);
    try {
      // Create a new note
      await createNote(selectedFolderForNewNote || currentFolderId);

      // Find the newly created note (usually the last one)
      const newNote = notes[notes.length - 1];
      if (newNote) {
        // Update it with shared content and custom name
        await updateNote(newNote.id, {
          title: newNoteName,
          content: sharedContent,
          updatedAt: Date.now(),
        });
      }

      setSaveModalVisible(false);
      Alert.alert("Success", `Created and saved to "${newNoteName}"!`);
      if (onContentSaved) {
        onContentSaved();
      }
    } catch (error) {
      console.error("Error creating note:", error);
      Alert.alert("Error", "Failed to create note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle creating new folder
  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert("Error", "Please enter a folder name");
      return;
    }

    try {
      await createFolder(
        newFolderName,
        selectedFolderForNewNote || currentFolderId
      );
      setNewFolderName("");
      setShowNewFolderInput(false);
      Alert.alert("Success", `Folder "${newFolderName}" created!`);
    } catch (error) {
      console.error("Error creating folder:", error);
      Alert.alert("Error", "Failed to create folder. Please try again.");
    }
  };

  // Get folder name by ID
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "Root";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "Unknown Folder";
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
          onPress={handleCreateNewFolder}
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
          onPress={() => {
            setNewNoteName("Shared Content");
            createNote(currentFolderId);
          }}
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
          onPress={openSaveModal}
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
            Save Content
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save Modal */}
      <Modal
        visible={saveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.text,
                }}
              >
                Save Content
              </Text>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.backgroundCard,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 16,
              }}
            >
              <Search size={20} color={colors.text} style={{ opacity: 0.5 }} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 16,
                  color: colors.text,
                }}
                placeholder="Search notes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.text + "80"}
              />
            </View>

            {/* Folder Selection */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Save in folder:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor:
                      selectedFolderForNewNote === null
                        ? colors.primary
                        : colors.backgroundCard,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                  onPress={() => setSelectedFolderForNewNote(null)}
                >
                  <Text
                    style={{
                      color:
                        selectedFolderForNewNote === null
                          ? colors.white
                          : colors.text,
                    }}
                  >
                    Root
                  </Text>
                </TouchableOpacity>
                {folders.map((folder) => (
                  <TouchableOpacity
                    key={folder.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor:
                        selectedFolderForNewNote === folder.id
                          ? colors.primary
                          : colors.backgroundCard,
                      borderRadius: 20,
                      marginRight: 8,
                    }}
                    onPress={() => setSelectedFolderForNewNote(folder.id)}
                  >
                    <Text
                      style={{
                        color:
                          selectedFolderForNewNote === folder.id
                            ? colors.white
                            : colors.text,
                      }}
                    >
                      {folder.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 20,
                    marginRight: 8,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => setShowNewFolderInput(true)}
                >
                  <FolderPlus size={16} color={colors.text} />
                  <Text style={{ marginLeft: 4, color: colors.text }}>New</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* New Folder Input */}
            {showNewFolderInput && (
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 16,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                  placeholder="New folder name"
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholderTextColor={colors.text + "80"}
                  autoFocus
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: colors.backgroundCard,
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                  >
                    <Text style={{ color: colors.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                    }}
                    onPress={handleCreateNewFolder}
                  >
                    <Text style={{ color: colors.white }}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Existing Notes List */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Select existing note:
            </Text>
            <FlatList
              data={allNotes}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                  }}
                  onPress={() => handleSaveToExistingNote(item.id)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      fontWeight: "500",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.text + "80",
                    }}
                  >
                    {getFolderName(item.folderId)} •{" "}
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={{
                    textAlign: "center",
                    color: colors.text + "80",
                    padding: 20,
                  }}
                >
                  {searchQuery ? "No matching notes found" : "No notes yet"}
                </Text>
              }
            />

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: 16,
              }}
            />

            {/* Create New Note */}
            {!showNewNoteInput ? (
              <TouchableOpacity
                style={{
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  marginBottom: 16,
                }}
                onPress={() => setShowNewNoteInput(true)}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  + Create New Note
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  style={{
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 16,
                    color: colors.text,
                    marginBottom: 8,
                  }}
                  placeholder="Note name"
                  value={newNoteName}
                  onChangeText={setNewNoteName}
                  placeholderTextColor={colors.text + "80"}
                  autoFocus
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: colors.backgroundCard,
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setShowNewNoteInput(false);
                      setNewNoteName("Shared Content");
                    }}
                  >
                    <Text style={{ color: colors.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                    }}
                    onPress={handleCreateNewNote}
                    disabled={!newNoteName.trim()}
                  >
                    <Text style={{ color: colors.white }}>Create & Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={{
                padding: 16,
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: colors.border,
                marginTop: 10,
              }}
              onPress={() => setSaveModalVisible(false)}
            >
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ShareScreen;
