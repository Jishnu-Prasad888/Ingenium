import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Share,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
} from "react-native";
import {
  ChevronLeft,
  Share2,
  Save,
  Trash2,
  ExternalLink,
  Maximize2,
  CircleX,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import DeleteConfirmationPopup from "../components/DeleteConfirmationPopup";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import { SafeAreaView } from "react-native-safe-area-context";
import MoveNoteModal from "../components/MoveNoteModal";
import MarkdownRenderer from "../components/note-editor/MarkdownRenderer";
import FormatToolbar from "../components/note-editor/FormatToolbar";
import ActionBar from "../components/note-editor/ActionBar";

const NoteEditorScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
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

  const [isPreview, setIsPreview] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const lastSavedRef = useRef<number>(Date.now());
  const contentInputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const insertMarkdown = (prefix: string, suffix = "") => {
    if (!note) return;

    const start = selection.start;
    const end = selection.end;

    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);

    const newText = before + prefix + selected + suffix + after;
    const cursorPosition = start + prefix.length + selected.length;

    setContent(newText);
    setHasUnsavedChanges(true);
    debouncedUpdateNote(note.id, { content: newText });

    requestAnimationFrame(() => {
      contentInputRef.current?.setSelection(cursorPosition, cursorPosition);
    });
  };

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setHasUnsavedChanges(false);
      lastSavedRef.current = Date.now();
    }
  }, [note?.id]);

  const handleDeleteConfirm = async () => {
    if (!note) return;

    await flushPendingSaves();
    const success = await deleteNote(note.id);

    if (success) {
    }

    setShowDeletePopup(false);
  };

  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
  };

  const handleDeletePress = () => {
    if (!note) return;

    if (hasUnsavedChanges) {
      flushPendingSaves().then(() => {
        setShowDeletePopup(true);
      });
    } else {
      setShowDeletePopup(true);
    }
  };

  const handleContentChange = (text: string) => {
    if (!note) return;

    setContent(text);
    setHasUnsavedChanges(true);
    debouncedUpdateNote(note.id, { content: text });
  };

  const handleTitleChange = (text: string) => {
    if (!note) return;

    setTitle(text);
    setHasUnsavedChanges(true);
    debouncedUpdateNote(note.id, { title: text });
  };

  const handleSaveNow = async () => {
    if (!note) return;

    await flushPendingSaves();
    setHasUnsavedChanges(false);
    lastSavedRef.current = Date.now();
  };

  const handleBack = async () => {
    await flushPendingSaves();
    setCurrentScreen("notes-list");
  };

  const handleShare = async () => {
    if (!note) return;

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

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 20,
      }}
    >
      <DeleteConfirmationPopup
        visible={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        itemName={title || "Untitled Note"}
      />

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 60}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, marginBottom: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.backgroundCard,
              borderRadius: 12,
              padding: 10,
            }}
          >
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

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View>
                <TouchableOpacity onPress={() => setShowMoveModal(true)}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    Folder: {folderPath}
                  </Text>
                </TouchableOpacity>
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

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: 12,
                  overflow: "hidden",
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                {isPreview ? (
                  <MarkdownRenderer
                    content={content}
                    onContentChange={handleContentChange}
                  />
                ) : (
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      padding: 16,
                      paddingBottom: 120,
                    }}
                  >
                    <TextInput
                      ref={contentInputRef}
                      value={content}
                      onChangeText={handleContentChange}
                      onSelectionChange={(e) =>
                        setSelection(e.nativeEvent.selection)
                      }
                      multiline
                      scrollEnabled={false}
                      caretColor={colors.text}
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        fontFamily:
                          Platform.OS === "ios" ? "Menlo" : "monospace",
                        lineHeight: 24,
                        includeFontPadding: false,
                        textAlignVertical: "top",
                        minHeight: 350,
                      }}
                    />
                  </ScrollView>
                )}
              </View>

              {!keyboardVisible && (
                <SafeAreaView>
                  <FormatToolbar
                    isPreview={isPreview}
                    onTogglePreview={() => setIsPreview((p) => !p)}
                    onInsertMarkdown={insertMarkdown}
                    onFullscreen={() => setIsFullscreen(true)}
                  />
                </SafeAreaView>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {keyboardVisible && (
        <SafeAreaView
          style={{
            marginHorizontal: 20,
            borderRadius: 20,
            marginTop: -6,
          }}
        >
          <View
            style={{
              backgroundColor: colors.backgroundCard,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingVertical: 4,
              borderRadius: 6,
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <FormatToolbar
              isPreview={isPreview}
              onTogglePreview={() => setIsPreview((p) => !p)}
              onInsertMarkdown={insertMarkdown}
              onFullscreen={() => setIsFullscreen(true)}
              keyboardShouldPersistTaps="always"
            />
          </View>
        </SafeAreaView>
      )}

      <ActionBar
        showButtonText={showButtonText}
        onBack={handleBack}
        onDelete={handleDeletePress}
        onSave={handleSaveNow}
        onShare={handleShare}
      />

      <Modal
        visible={isFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: colors.background,
            paddingTop: Platform.OS === "ios" ? 60 : 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Maximize2 size={18} color={colors.textSecondary} />

            <TouchableOpacity onPress={() => setIsFullscreen(false)}>
              <CircleX size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 40,
            }}
          >
            {isPreview ? (
              <MarkdownRenderer
                content={content}
                onContentChange={handleContentChange}
                scrollEnabled={false}
              />
            ) : (
              <Text
                selectable
                style={{
                  fontSize: 16,
                  lineHeight: 24,
                  color: colors.text,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                }}
              >
                {content}
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <MoveNoteModal
        visible={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        noteId={note.id}
        currentFolderId={note.folderId}
        noteTitle={note.title}
      />
    </SafeAreaView>
  );
};

export default NoteEditorScreen;
