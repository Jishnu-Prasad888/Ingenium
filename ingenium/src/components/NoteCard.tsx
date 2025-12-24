// components/NoteCard.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
} from "react-native";
import { CircleChevronRight, X } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import { Note } from "../services/StorageService";
import DeleteConfirmationPopup from "./DeleteConfirmationPopup";

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
  "There are more stars in the universe than grains of sand on Earth.",
  "Sharks existed before trees.",
  "The human brain uses about 20% of the body's energy.",
  "Butterflies remember being caterpillars.",
  "The Eiffel Tower grows taller in summer.",
];

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  const { setCurrentNoteId, setCurrentScreen, deleteNote } = useApp();
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteScale = useRef(new Animated.Value(1)).current;
  const deleteRotate = useRef(new Animated.Value(0)).current;

  const title = typeof note?.title === "string" ? note.title : "";
  const content =
    note?.content && typeof note.content === "string" ? note.content : "";
  const createdAt = note?.createdAt ? note.createdAt : Date.now();
  const isEmpty = !content?.trim();
  const randomFact = facts[Math.floor(Math.random() * facts.length)];

  const handlePress = () => {
    if (note?.id) {
      setCurrentNoteId(note.id);
      setCurrentScreen("note-editor");
    }
  };

  const handleDeletePress = () => {
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteNote) return;

    setIsDeleting(true);
    try {
      const success = await deleteNote(note.id);
      if (success) {
        setShowDeletePopup(false);
        onDelete?.();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
  };

  const animateDeleteIn = () => {
    Animated.spring(deleteScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const animateDeleteOut = () => {
    Animated.spring(deleteScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const animateDeleteWiggle = () => {
    Animated.sequence([
      Animated.timing(deleteRotate, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(deleteRotate, {
        toValue: -1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(deleteRotate, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
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
          padding: 18,
          marginBottom: 14,
          opacity: isDeleting ? 0.6 : 1,
          position: "relative",
        }}
        onPress={handlePress}
        disabled={isDeleting}
        onLongPress={animateDeleteWiggle}
        delayLongPress={400}
        activeOpacity={0.9}
      >
        {/* Animated Delete Button */}
        <Pressable
          onPress={handleDeletePress}
          onPressIn={animateDeleteIn}
          onPressOut={animateDeleteOut}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 16,
            backgroundColor: colors.backgroundAlt,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 6,
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: deleteScale }, { rotate: rotation }],
            }}
          >
            <X size={16} color={colors.textSecondary} />
          </Animated.View>
        </Pressable>

        {/* Content */}
        <View style={{ marginBottom: 6 }}>
          <Text
            style={{
              fontSize: 24,
              fontFamily: "serif",
              color: colors.primary,
            }}
            numberOfLines={1}
          >
            {title.length > 0 ? title : "Untitled Note"}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 8,
          }}
        >
          {formatDate(createdAt)}
        </Text>

        {isEmpty ? (
          <View>
            <Text
              style={{
                fontSize: 12,
                color: colors.text,
                fontStyle: "italic",
                fontFamily: "serif",
                opacity: 0.5,
              }}
              numberOfLines={2}
            >
              Did You Know! {randomFact}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.text,
                fontStyle: "italic",
                fontFamily: "serif",
                opacity: 0.5,
                paddingTop: 1,
              }}
            >
              waiting to hear from you now :)
            </Text>
          </View>
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

        <View style={{ alignItems: "flex-end", marginTop: 10 }}>
          <CircleChevronRight size={22} color={colors.text} />
        </View>
      </TouchableOpacity>

      <DeleteConfirmationPopup
        visible={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        itemName={title.length > 0 ? title : "Untitled Note"}
      />
    </>
  );
};

export default NoteCard;
