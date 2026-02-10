// components/FolderCard.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
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
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.backgroundCard,
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
          opacity: isDeleting ? 0.6 : 1,
          position: "relative",
        }}
        activeOpacity={0.9}
        onPress={handleCardPress}
        onLongPress={animateDeleteWiggle}
        delayLongPress={400}
        disabled={isDeleting}
      >
        {/* Folder Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 2,
          }}
        >
          <Folder size={24} color={colors.primary} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {folder.name || "Unnamed Folder"}
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            Created: {new Date(folder.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Chevron */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 2,
            paddingTop: 16,
            marginTop: 20,
            paddingRight: 4,
          }}
        >
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>

        {/* Delete Button */}
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
          }}
        >
          <Animated.View
            style={{
              transform: [{ scale: deleteScale }, { rotate: rotation }],
            }}
          >
            <Trash2 size={16} color={colors.textSecondary} />
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={() => setShowRenamePopup(true)}
          style={{
            position: "absolute",
            top: 12,
            right: 48,
            width: 28,
            height: 28,
            borderRadius: 16,
            backgroundColor: colors.backgroundAlt,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pencil size={14} color={colors.textSecondary} />
        </Pressable>
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
