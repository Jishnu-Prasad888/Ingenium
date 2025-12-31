import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
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
        style={{
          backgroundColor: colors.backgroundCard,
          borderRadius: 14,
          padding: isEmpty ? 10 : 14,
          marginBottom: 12,
          opacity: isDeleting ? 0.6 : 1,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={handlePress}
        disabled={isDeleting}
        activeOpacity={0.9}
        onLongPress={handleMove}
      >
        {/* LEFT: text content */}
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontSize: 20,
              fontFamily: "serif",
              color: colors.primary,
              marginBottom: isEmpty ? 2 : 4,
            }}
            numberOfLines={1}
          >
            {title || "Untitled Note"}
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: colors.textSecondary,
              marginBottom: isEmpty ? 2 : 6,
            }}
          >
            {formatDate(createdAt)}
          </Text>

          {isEmpty ? (
            <Text
              style={{
                fontSize: 11,
                fontStyle: "italic",
                fontFamily: "serif",
                color: colors.text,
                opacity: 0.5,
              }}
              numberOfLines={1}
            >
              No content
            </Text>
          ) : (
            <Text
              style={{
                fontSize: 12,
                color: colors.text,
                fontFamily: "serif",
              }}
              numberOfLines={2}
            >
              {content}
            </Text>
          )}
        </View>

        {/* RIGHT: chevron, vertically centered */}
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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

const styles = {
  // ... existing styles
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
  // ... rest of existing styles
};

export default NoteCard;
