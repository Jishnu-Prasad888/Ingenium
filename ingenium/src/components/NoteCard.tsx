import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { CircleChevronRight, X } from "lucide-react-native";
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

const facts = [
  "Octopuses have three hearts.",
  "Bananas are berries, but strawberries are not.",
  "Honey never spoils.",
  "A day on Venus is longer than a year on Venus.",
  "Wombat poop is cube-shaped.",
];

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  const { setCurrentNoteId, setCurrentScreen, deleteNote } = useApp();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteScale = useRef(new Animated.Value(1)).current;
  const deleteRotate = useRef(new Animated.Value(0)).current;

  const title = note?.title || "";
  const content = note?.content || "";
  const createdAt = note?.createdAt || Date.now();

  const isEmpty = !content.trim();
  const randomFact = facts[Math.floor(Math.random() * facts.length)];

  // 🔹 Animate height when empty/content changes
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

  const rotation = deleteRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-8deg", "8deg"],
  });

  return (
    <>
      <TouchableOpacity
        style={{
          backgroundColor: colors.backgroundCard,
          borderRadius: 14,
          padding: isEmpty ? 10 : 14,
          marginBottom: 12,
          opacity: isDeleting ? 0.6 : 1,
          position: "relative",
        }}
        onPress={handlePress}
        disabled={isDeleting}
        activeOpacity={0.9}
      >
        {/* Delete Button */}
        <Pressable
          onPress={() => setShowDeletePopup(true)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.backgroundAlt,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: deleteScale }, { rotate: rotation }],
            }}
          >
            <X size={14} color={colors.textSecondary} />
          </Animated.View>
        </Pressable>

        {/* Title */}
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

        {/* Date */}
        <Text
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            marginBottom: isEmpty ? 2 : 6,
          }}
        >
          {formatDate(createdAt)}
        </Text>

        {/* Content */}
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
            {randomFact}
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

        {/* Chevron */}
        <View style={{ alignItems: "flex-end", marginTop: isEmpty ? 4 : 8 }}>
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
