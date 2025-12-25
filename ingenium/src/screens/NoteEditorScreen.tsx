// screens/NoteEditorScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Share,
  useWindowDimensions,
} from "react-native";
import { ChevronLeft, Share2, Save, Trash2 } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import DeleteConfirmationPopup from "../components/DeleteConfirmationPopup";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";

const NoteEditorScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const showButtonText = width >= 420;
  const {
    notes,
    folders,
    currentNoteId,
    setCurrentScreen,
    debouncedUpdateNote,
    flushPendingSaves,
    deleteNote,
  } = useApp();

  const note = notes.find((n) => n.id === currentNoteId);

  // Local state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const lastSavedRef = useRef<number>(Date.now());

  // Initialize local state when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setHasUnsavedChanges(false);
      lastSavedRef.current = Date.now();
    }
  }, [note?.id]);

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!note) return;

    // Save any pending changes first
    await flushPendingSaves();

    // Delete the note
    const success = await deleteNote(note.id);

    if (success) {
      // Note is deleted, popup will close automatically
      // Navigation is handled in deleteNote function
    }

    setShowDeletePopup(false);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
  };

  // Handle delete button press
  const handleDeletePress = () => {
    if (hasUnsavedChanges) {
      // Save changes before showing delete confirmation
      flushPendingSaves().then(() => {
        setShowDeletePopup(true);
      });
    } else {
      setShowDeletePopup(true);
    }
  };

  // Handle case where note might not be found
  if (!note) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, color: colors.text }}>Note not found</Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => setCurrentScreen("notes-list")}
        >
          <Text style={{ color: colors.white }}>Back to Notes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const folder = folders.find((f) => f.id === note.folderId);
  const folderPath = folder ? `/.../${folder.name}` : "/";

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasUnsavedChanges(true);
    debouncedUpdateNote(note.id, { title: text });
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    setHasUnsavedChanges(true);
    debouncedUpdateNote(note.id, { content: text });
  };

  const handleSaveNow = async () => {
    await flushPendingSaves();
    setHasUnsavedChanges(false);
    lastSavedRef.current = Date.now();
  };

  const handleBack = async () => {
    // Save any pending changes before navigating away
    await flushPendingSaves();
    setCurrentScreen("notes-list");
  };

  const handleShare = async () => {
    // Ensure all changes are saved before sharing
    await flushPendingSaves();

    try {
      await Share.share({
        message: `${title}\n\n${content}`,
        title: title || "Note",
      });
    } catch (error) {
      console.error("Error sharing note:", error);
    }
  };

  // Calculate time since last save
  const getLastSaveText = () => {
    const secondsAgo = Math.floor((Date.now() - lastSavedRef.current) / 1000);

    if (secondsAgo < 5) {
      return "Just now";
    } else if (secondsAgo < 60) {
      return `${secondsAgo}s ago`;
    } else {
      const minutesAgo = Math.floor(secondsAgo / 60);
      return `${minutesAgo}m ago`;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />

      {/* Delete Confirmation Popup */}
      <DeleteConfirmationPopup
        visible={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        itemName={title || "Untitled Note"}
      />

      {/* Save indicator */}
      {hasUnsavedChanges && (
        <View
          style={{
            backgroundColor: colors.warning,
            paddingHorizontal: 20,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: colors.white, fontSize: 12 }}>
            Unsaved changes
          </Text>
          <TouchableOpacity onPress={handleSaveNow}>
            <Text
              style={{ color: colors.white, fontSize: 12, fontWeight: "bold" }}
            >
              SAVE NOW
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flex: 1, paddingHorizontal: 20, marginBottom: 10 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 20,
          }}
        >
          {/* Title */}
          <TextInput
            style={{
              fontSize: 32,
              fontFamily: "serif",
              color: colors.primary,
              marginBottom: 8,
              borderBottomWidth: 2,
              borderBottomColor: colors.text,
              paddingBottom: 8,
            }}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Meta info */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Folder: {folderPath}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                Created: {formatDate(note.createdAt)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                Last save: {getLastSaveText()}
              </Text>
              {hasUnsavedChanges && (
                <Text style={{ fontSize: 10, color: colors.warning }}>
                  • Unsaved
                </Text>
              )}
            </View>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={{
                fontSize: 16,
                color: colors.text,
                textAlignVertical: "top",
                minHeight: 250,
                marginBottom: 120,
              }}
              value={content}
              onChangeText={handleContentChange}
              multiline
              placeholder="Start writing..."
              placeholderTextColor={colors.textSecondary}
            />
          </ScrollView>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 112,
          flexDirection: "row",
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 10,
            paddingRight: 20,
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
          onPress={handleBack}
        >
          <ChevronLeft size={20} color={colors.text} />
          {showButtonText && (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 16,
                color: colors.text,
                paddingLeft: 10,
                textAlign: "center",
              }}
            >
              Back
            </Text>
          )}
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

        {/* Delete Button */}
        <TouchableOpacity
          style={{
            width: 60,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
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
          onPress={handleDeletePress}
        >
          <Trash2 size={20} color={colors.text} />
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

        {/* Save Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 14,
            paddingRight: 20,
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
          onPress={handleSaveNow}
        >
          <Save size={18} color={colors.text} />
          {showButtonText && (
            <Text
              style={{
                marginLeft: 8,
                fontSize: 16,
                color: colors.text,
              }}
            >
              Save
            </Text>
          )}
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

        {/* Share Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 10,
            paddingRight: 20,
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
          onPress={handleShare}
        >
          <Share2 size={18} color={colors.text} />
          {showButtonText && (
            <Text style={{ marginLeft: 8, fontSize: 16, color: colors.text }}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NoteEditorScreen;
