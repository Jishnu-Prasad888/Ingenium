// components/MoveNoteModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { X, Folder as FolderIcon } from "lucide-react-native";
import { colors } from "../theme/colors";
import { useApp } from "../context/AppContext";

interface MoveNoteModalProps {
  visible: boolean;
  onClose: () => void;
  noteId: string;
  currentFolderId: string | null;
  noteTitle: string;
}

const MoveNoteModal: React.FC<MoveNoteModalProps> = ({
  visible,
  onClose,
  noteId,
  currentFolderId,
  noteTitle,
}) => {
  const { folders, moveNote } = useApp();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Get all folders except the current one
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);
  // Helper function to get folder path
  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return "/";

    const path: string[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (!folder) break;

      path.unshift(folder.name);
      currentId = folder.parentId;
    }

    return "/" + path.join("/");
  };

  const handleMove = async () => {
    const success = await moveNote(noteId, selectedFolderId);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Move Note</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Note info */}
          <View style={styles.noteInfo}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              "{noteTitle}"
            </Text>
            <Text style={styles.noteSubtitle}>
              From : {getFolderPath(currentFolderId)}
            </Text>
            <Text style={styles.noteSubtitle}>Select destination folder:</Text>
          </View>

          {/* Folders list */}
          <ScrollView style={styles.foldersList}>
            {/* Root folder option */}
            <TouchableOpacity
              style={[
                styles.folderItem,
                selectedFolderId === null && styles.selectedFolderItem,
              ]}
              onPress={() => setSelectedFolderId(null)}
            >
              <FolderIcon
                size={20}
                color={selectedFolderId === null ? colors.primary : colors.text}
                style={styles.folderIcon}
              />
              <View style={styles.folderInfo}>
                <Text
                  style={[
                    styles.folderName,
                    selectedFolderId === null && styles.selectedFolderName,
                  ]}
                >
                  Root Folder
                </Text>
                <Text style={styles.folderPath}>/</Text>
              </View>
            </TouchableOpacity>

            {/* Available folders */}
            {availableFolders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[
                  styles.folderItem,
                  selectedFolderId === folder.id && styles.selectedFolderItem,
                ]}
                onPress={() => setSelectedFolderId(folder.id)}
              >
                <FolderIcon
                  size={20}
                  color={
                    selectedFolderId === folder.id
                      ? colors.primary
                      : colors.text
                  }
                  style={styles.folderIcon}
                />
                <View style={styles.folderInfo}>
                  <Text
                    style={[
                      styles.folderName,
                      selectedFolderId === folder.id &&
                        styles.selectedFolderName,
                    ]}
                  >
                    {folder.name}
                  </Text>
                  <Text style={styles.folderPath}>
                    {getFolderPath(folder.id)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {availableFolders.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No other folders available</Text>
              </View>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.moveButton,
                !selectedFolderId && styles.disabledButton,
              ]}
              onPress={handleMove}
              disabled={!selectedFolderId}
            >
              <Text style={styles.moveButtonText}>Move Here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  noteInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  noteSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  foldersList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectedFolderItem: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  folderIcon: {
    marginRight: 12,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  selectedFolderName: {
    color: colors.primary,
    fontWeight: "600",
  },
  folderPath: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moveButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  moveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MoveNoteModal;
