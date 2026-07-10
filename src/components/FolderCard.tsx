// components/FolderCard.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  StyleSheet,
} from "react-native";
import { Folder, ChevronRight, Trash2 } from "lucide-react-native";
import { colors } from "../theme/colors";
import { useApp } from "../context/AppContext";
import DeleteConfirmationPopup from "./DeleteConfirmationPopup";
import RenameFolderPopup from "./RenameFolderPopup";
import { Pencil } from "lucide-react-native";

interface FolderCardProps {
  folder: any;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  const { setCurrentFolderId, deleteFolder } = useApp();
  const { renameFolder } = useApp();
  const [showRenamePopup, setShowRenamePopup] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔑 Prevent navigation when delete is pressed
  const deletePressedRef = useRef(false);

  const deleteScale = useRef(new Animated.Value(1)).current;
  const deleteRotate = useRef(new Animated.Value(0)).current;

  const handleCardPress = () => {
    if (deletePressedRef.current) return;
    setCurrentFolderId(folder.id);
  };

  const handleDeletePress = () => {
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFolder) return;

    setIsDeleting(true);
    try {
      const success = await deleteFolder(folder.id);
      if (success) {
        setShowDeletePopup(false);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const animateDeleteIn = () => {
    deletePressedRef.current = true;
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
    }).start(() => {
      deletePressedRef.current = false;
    });
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

  const handleRenameConfirm = async (newName: string) => {
    await renameFolder(folder.id, newName);
    setShowRenamePopup(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, isDeleting && styles.cardDeleting]}
        activeOpacity={0.9}
        onPress={handleCardPress}
        onLongPress={animateDeleteWiggle}
        delayLongPress={400}
        disabled={isDeleting}
      >
        <View style={styles.iconWrap}>
          <Folder size={24} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {folder.name || "Unnamed Folder"}
          </Text>

          <Text style={styles.meta}>
            Created: {new Date(folder.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.rightColumn}>
          <Pressable
            onPress={() => setShowRenamePopup(true)}
            style={styles.actionButton}
          >
            <Pencil size={16} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={handleDeletePress}
            onPressIn={animateDeleteIn}
            onPressOut={animateDeleteOut}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Animated.View
              style={{ transform: [{ scale: deleteScale }, { rotate: rotation }] }}
            >
              <Trash2 size={16} color={colors.error} />
            </Animated.View>
          </Pressable>
          <View style={styles.chevronShell}>
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>

      <DeleteConfirmationPopup
        visible={showDeletePopup}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeletePopup(false)}
        title="Delete Folder"
        message="Are you sure you want to delete this folder and all its contents?"
        itemName={folder.name || "Unnamed Folder"}
      />

      <RenameFolderPopup
        visible={showRenamePopup}
        initialName={folder.name}
        onConfirm={handleRenameConfirm}
        onCancel={() => setShowRenamePopup(false)}
      />
    </>
  );
};

export default FolderCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    opacity: 1,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardDeleting: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontFamily: "SpaceGrotesk_700Bold",
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  rightColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: colors.warningLight,
    borderColor: "transparent",
  },
  chevronShell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
  },
});
