import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { Folder } from "../services/StorageService";

interface FolderCardProps {
  folder: Folder;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  const { setCurrentFolderId } = useApp();

  // Safely handle folder data
  const name =
    folder?.name && typeof folder.name === "string"
      ? folder.name
      : "Untitled Folder";

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.backgroundFolder,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
      onPress={() => {
        if (folder?.id) {
          setCurrentFolderId(folder.id);
        }
      }}
    >
      <Text
        style={{ fontSize: 18, color: colors.primary, fontFamily: "serif" }}
      >
        /{name}
      </Text>
    </TouchableOpacity>
  );
};

export default FolderCard;
