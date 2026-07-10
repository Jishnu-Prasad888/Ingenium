import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from "react-native";
import { CircleChevronRight, FolderInput } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import { Note } from "../services/StorageService";
import DeleteConfirmationPopup from "./DeleteConfirmationPopup";
import MoveNoteModal from "./MoveNoteModal";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NoteCardProps {
  note: Note;
  onDelete?: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  const { setCurrentNoteId, setCurrentScreen, deleteNote } = useApp();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const title = note?.title || "";
  const content = note?.content || "";
  const createdAt = note?.createdAt || Date.now();
  const isEmpty = !content.trim();

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isEmpty]);

  const handlePress = () => {
    setCurrentNoteId(note.id);
    setCurrentScreen("note-editor");
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteNote(note.id);
      if (success) {
        setShowDeletePopup(false);
        onDelete?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = () => {
    setShowMoveModal(true);
    setShowMenu(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          isEmpty && styles.emptyCard,
          isDeleting && styles.cardDeleting,
        ]}
        onPress={handlePress}
        disabled={isDeleting}
        activeOpacity={0.9}
        onLongPress={handleMove}
      >
        <View style={styles.accent} />

        <View style={{ flex: 1, paddingRight: 12 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={1}>
              {title || "Untitled Note"}
            </Text>
            <Text style={styles.date}>{formatDate(createdAt)}</Text>
          </View>

          {isEmpty ? (
            <Text style={styles.emptyText} numberOfLines={1}>
              No content yet
            </Text>
          ) : (
            <Text style={styles.preview} numberOfLines={3}>
              {content}
            </Text>
          )}
        </View>

        <View style={styles.chevronShell}>
          <CircleChevronRight size={20} color={colors.text} />
        </View>
      </TouchableOpacity>

      <DeleteConfirmationPopup
        visible={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeletePopup(false)}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        itemName={title || "Untitled Note"}
      />

      <MoveNoteModal
        visible={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        noteId={note.id}
        currentFolderId={note.folderId}
        noteTitle={note.title}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    opacity: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCard: {
    paddingVertical: 12,
  },
  cardDeleting: {
    opacity: 0.6,
  },
  accent: {
    width: 4,
    height: "90%",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  preview: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: "SpaceGrotesk_400Regular",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "SpaceGrotesk_500Medium",
    fontStyle: "italic",
  },
  chevronShell: {
    justifyContent: "center",
    alignItems: "center",
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
  },
});

export default NoteCard;
