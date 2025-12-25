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
import { CircleChevronRight } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import { Note } from "../services/StorageService";
import DeleteConfirmationPopup from "./DeleteConfirmationPopup";

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
    </>
  );
};

export default NoteCard;
