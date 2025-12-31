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
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { ChevronLeft, Share2, Save, Trash2 } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import DeleteConfirmationPopup from "../components/DeleteConfirmationPopup";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import Markdown from "react-native-markdown-display";
import { Modal } from "react-native";
import { ExternalLink, Maximize2, CircleX } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MoveNoteModal from "../components/MoveNoteModal";

interface MarkdownRendererProps {
  content: string;
  onContentChange: (content: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onContentChange,
}) => {
  const handleCheckboxToggle = (lineIndex: number) => {
    const lines = content.split("\n");

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    if (!line) return;

    // Toggle checkbox state - match against the full line, not just trimmed
    if (/^[\s]*-\s*\[ \]/.test(line)) {
      // Change from [ ] to [x]
      lines[lineIndex] = line.replace(/(^[\s]*-\s*)\[ \]/, "$1[x]");
    } else if (/^[\s]*-\s*\[[xX]\]/.test(line)) {
      // Change from [x] to [ ]
      lines[lineIndex] = line.replace(/(^[\s]*-\s*)\[[xX]\]/, "$1[ ]");
    } else {
      // Not a checkbox line, do nothing
      return;
    }

    // Join back and update content
    const newContent = lines.join("\n");
    onContentChange(newContent);
  };

  const renderContent = () => {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeBlockContent = "";
    const renderedElements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = "";
          continue;
        } else {
          inCodeBlock = false;
          renderedElements.push(
            <View
              key={`code-${i}`}
              style={{
                backgroundColor: colors.backgroundCard,
                padding: 12,
                borderRadius: 8,
                marginVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {codeBlockContent}
              </Text>
            </View>
          );
          continue;
        }
      }

      if (inCodeBlock) {
        codeBlockContent += line + "\n";
        continue;
      }

      // Handle checkboxes
      const trimmedLine = line.trim();
      const isCheckbox = /^-\s*\[[ xX]\]/.test(trimmedLine);

      if (isCheckbox) {
        const checkboxMatch = trimmedLine.match(/^-\s*\[([ xX])\]/);
        const isChecked = checkboxMatch
          ? checkboxMatch[1].toLowerCase() === "x"
          : false;
        const textAfterCheckbox = trimmedLine.replace(/^-\s*\[[ xX]\]\s*/, "");
        const currentLineIndex = i;

        renderedElements.push(
          <Pressable
            key={`checkbox-${i}-${isChecked}`}
            onPress={() => {
              console.log("Toggling checkbox at line:", currentLineIndex);
              handleCheckboxToggle(currentLineIndex);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "flex-start",
              marginVertical: 4,
              paddingVertical: 2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 18,
                marginRight: 12,
                marginTop: 2,
                color: isChecked ? colors.primary : colors.text,
              }}
            >
              {isChecked ? "☑" : "☐"}
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                flex: 1,
                color: isChecked ? colors.textSecondary : colors.text,
                textDecorationLine: isChecked ? "line-through" : "none",
              }}
            >
              {textAfterCheckbox}
            </Text>
          </Pressable>
        );
        continue;
      }

      // Handle normal markdown - collect consecutive non-checkbox, non-code lines
      let markdownContent = "";
      let startLine = i;
      while (
        i < lines.length &&
        !lines[i].trim().startsWith("```") &&
        !/^-\s*\[[ xX]\]/.test(lines[i].trim())
      ) {
        markdownContent += lines[i] + "\n";
        i++;
      }
      i--; // Step back one since the loop will increment

      if (markdownContent.trim()) {
        renderedElements.push(
          <Markdown
            key={`md-${startLine}`}
            style={{
              body: { color: colors.text, fontSize: 16, lineHeight: 24 },
              heading1: {
                fontSize: 28,
                color: colors.primary,
                fontWeight: "800" as const,
                marginTop: 24,
                marginBottom: 12,
              },
              heading2: {
                fontSize: 24,
                fontWeight: "700" as const,
                marginTop: 20,
                marginBottom: 10,
              },
              heading3: {
                fontSize: 20,
                fontWeight: "600" as const,
                marginTop: 16,
                marginBottom: 8,
              },
              bullet_list: { marginVertical: 8, marginLeft: 20 },
              ordered_list: { marginVertical: 8, marginLeft: 20 },
              list_item: { marginVertical: 4 },
              code_inline: {
                backgroundColor: colors.backgroundCard,
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              },
              blockquote: {
                backgroundColor: colors.backgroundCard,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
                paddingLeft: 12,
                paddingVertical: 8,
                marginVertical: 8,
              },
              hr: {
                backgroundColor: colors.border,
                height: 1,
                marginVertical: 16,
              },
            }}
          >
            {markdownContent}
          </Markdown>
        );
      }
    }

    return renderedElements;
  };

  return <View>{renderContent()}</View>;
};

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
  const [showMenu, setShowMenu] = useState(false);

  const handleMove = () => {
    setShowMoveModal(true);
    setShowMenu(false);
  };

  const FormatButton = ({
    label,
    onPress,
  }: {
    label: string | React.ReactNode;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.backgroundCard,
        borderWidth: 1,
        borderColor: colors.textSecondary,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 42,
      }}
    >
      {typeof label === "string" ? (
        <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
      ) : (
        label
      )}
    </TouchableOpacity>
  );

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
    if (!note) return;

    if (hasUnsavedChanges) {
      // Save changes before showing delete confirmation
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
    // Save any pending changes before navigating away
    await flushPendingSaves();
    setCurrentScreen("notes-list");
  };

  const handleShare = async () => {
    if (!note) return;

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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: 20 }}
    >
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

      {/* KeyboardAvoidingView wraps the main content area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
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
                marginBottom: 8,
              }}
            >
              <View>
                <TouchableOpacity onPress={handleMove}>
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

            {/* Editor container */}
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
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    contentContainerStyle={{
                      padding: 16,
                      paddingBottom: 120,
                    }}
                  >
                    <MarkdownRenderer
                      content={content}
                      onContentChange={handleContentChange}
                    />
                  </ScrollView>
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
            </View>

            {/* Keyboard-aware toolbar */}
            <View
              style={{
                backgroundColor: colors.backgroundAlt,
                borderTopWidth: 1,
                borderTopColor: colors.textSecondary,
                paddingVertical: 4,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 10,
                  borderRadius: 30,
                }}
              >
                <FormatButton
                  label={isPreview ? "Edit" : "Preview"}
                  onPress={() => setIsPreview((p) => !p)}
                />
                <FormatButton
                  label={<ExternalLink size={16} color={colors.text} />}
                  onPress={() => setIsFullscreen(true)}
                />
                <FormatButton label="H1" onPress={() => insertMarkdown("# ")} />
                <FormatButton
                  label="H2"
                  onPress={() => insertMarkdown("## ")}
                />
                <FormatButton
                  label="H3"
                  onPress={() => insertMarkdown("### ")}
                />
                <FormatButton
                  label="B"
                  onPress={() => insertMarkdown("**", "**")}
                />
                <FormatButton
                  label="I"
                  onPress={() => insertMarkdown("*", "*")}
                />
                <FormatButton
                  label="U"
                  onPress={() => insertMarkdown("__", "__")}
                />
                <FormatButton
                  label="☐"
                  onPress={() => insertMarkdown("- [ ] ")}
                />
              </ScrollView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom action buttons - outside KeyboardAvoidingView */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: Platform.OS === "ios" ? 50 : 50,
          paddingTop: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
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
            height: 40,
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
            height: 40,
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
            paddingLeft: 18,
            paddingRight: 20,
            height: 40,
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
            paddingLeft: 14,
            paddingRight: 20,
            height: 40,
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
          {/* Header */}
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

          {/* Content */}
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

const styles = {
  menu: {
    position: "absolute",
    top: "100%",
    right: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  deleteText: {
    color: colors.error,
  },
  menuButton: {
    padding: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
};
