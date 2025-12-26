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
  TextStyle,
} from "react-native";
import { ChevronLeft, Share2, Save, Trash2 } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import DeleteConfirmationPopup from "../components/DeleteConfirmationPopup";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import Markdown from "react-native-markdown-display";

// Define props interface for MarkdownRenderer
interface MarkdownRendererProps {
  content: string;
  note: any;
  onContentChange: (content: string) => void;
}

// Custom Markdown Renderer with Checkbox Support
// Custom Markdown Renderer with Checkbox Support
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  note,
  onContentChange,
}) => {
  const { debouncedUpdateNote } = useApp();

  const handleCheckboxToggle = (lineIndex: number, lineText: string) => {
    const lines = content.split("\n");

    // Toggle the checkbox
    let newLineText = lineText;
    if (lineText.includes("[ ]")) {
      newLineText = lineText.replace("[ ]", "[x]");
    } else if (lineText.includes("[x]")) {
      newLineText = lineText.replace("[x]", "[ ]");
    }

    // Update the line in the array
    lines[lineIndex] = newLineText;
    const updatedContent = lines.join("\n");

    // Update parent and save
    onContentChange(updatedContent);
    debouncedUpdateNote(note.id, { content: updatedContent });
  };

  const renderContent = () => {
    const lines = content.split("\n"); // Use the prop content, not local state
    let inCodeBlock = false;
    let codeBlockContent = "";
    const renderedElements: React.ReactNode[] = [];
    let lineIndex = 0;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex];

      // Handle code blocks
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          // Start of code block
          inCodeBlock = true;
          codeBlockContent = "";
        } else {
          // End of code block
          inCodeBlock = false;
          renderedElements.push(
            <View
              key={`code-${lineIndex}`}
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
        }
        lineIndex++;
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + "\n";
        lineIndex++;
        continue;
      }

      // Check for checkbox lines (must start with - [ ] or - [x])
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("- [ ]") || trimmedLine.startsWith("- [x]")) {
        const isChecked = trimmedLine.includes("[x]");
        const taskText = trimmedLine.replace(/^-\s*\[[ x]\]\s*/, "");

        renderedElements.push(
          <TouchableOpacity
            key={`checkbox-${lineIndex}`}
            onPress={() => handleCheckboxToggle(lineIndex, line)}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginVertical: 4,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                marginRight: 12,
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
              {taskText}
            </Text>
          </TouchableOpacity>
        );
        lineIndex++;
        continue;
      }

      // For regular content, collect consecutive lines for better Markdown parsing
      let markdownContent = "";
      while (lineIndex < lines.length) {
        const currentLine = lines[lineIndex];

        // Stop collecting if we hit a checkbox or code block
        if (
          currentLine.trim().startsWith("```") ||
          currentLine.trim().startsWith("- [ ]") ||
          currentLine.trim().startsWith("- [x]")
        ) {
          break;
        }

        markdownContent += currentLine + "\n";
        lineIndex++;
      }

      if (markdownContent.trim()) {
        renderedElements.push(
          <Markdown
            key={`md-${lineIndex}`}
            style={{
              body: {
                color: colors.text,
                fontSize: 16,
                lineHeight: 24,
              },
              heading1: {
                fontSize: 28,
                color: colors.primary,
                fontWeight: "800" as const,
                marginTop: renderedElements.length === 0 ? 0 : 24,
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
              paragraph: {
                marginVertical: 8,
                lineHeight: 24,
              },
              strong: { fontWeight: "700" as const },
              em: { fontStyle: "italic" as const },
              bullet_list: {
                marginVertical: 8,
                marginLeft: 20,
              },
              ordered_list: {
                marginVertical: 8,
                marginLeft: 20,
              },
              list_item: {
                marginVertical: 4,
              },
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

  const FormatButton = ({
    label,
    onPress,
  }: {
    label: string;
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
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontWeight: "600",
          lineHeight: 16,
        }}
      >
        {label}
      </Text>
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

      {/* KeyboardAvoidingView wraps the main content area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0} // header height
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

            {/* Editor container */}
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: 8,
                  marginBottom: 12, // space for toolbar
                }}
              >
                {isPreview ? (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                      padding: 16,
                      paddingBottom: 120,
                    }}
                  >
                    {note && (
                      <MarkdownRenderer
                        content={content}
                        note={note}
                        onContentChange={(newContent) => {
                          setContent(newContent);
                          setHasUnsavedChanges(true);
                        }}
                      />
                    )}
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
                paddingVertical: 6,
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
                  paddingHorizontal: 12,
                }}
              >
                <FormatButton
                  label={isPreview ? "Edit" : "Preview"}
                  onPress={() => setIsPreview((p) => !p)}
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
          paddingBottom: Platform.OS === "ios" ? 90 : 90,
          paddingTop: 12,
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
