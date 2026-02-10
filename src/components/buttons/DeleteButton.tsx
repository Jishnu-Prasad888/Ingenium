// components/DeleteButton.tsx
import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Trash2 } from "lucide-react-native";
import { colors } from "../../theme/colors";
import DeleteConfirmationPopup from "../DeleteConfirmationPopup";

interface DeleteButtonProps {
  onDelete: () => Promise<boolean> | boolean;
  itemName?: string;
  title?: string;
  message?: string;
  size?: "small" | "medium" | "large";
  variant?: "icon" | "text" | "both";
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  itemName,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item?",
  size = "medium",
  variant = "icon",
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePress = () => {
    setShowPopup(true);
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await onDelete();
      if (result) {
        setShowPopup(false);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
  };

  const sizeStyles = {
    small: { width: 32, height: 32, iconSize: 16, fontSize: 14 },
    medium: { width: 40, height: 40, iconSize: 20, fontSize: 16 },
    large: { width: 48, height: 48, iconSize: 24, fontSize: 18 },
  };

  const currentSize = sizeStyles[size];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: currentSize.width,
            height: currentSize.height,
            backgroundColor: colors.error,
            opacity: isDeleting ? 0.6 : 1,
          },
          variant === "text" && styles.textButton,
          variant === "both" && styles.bothButton,
        ]}
        onPress={handlePress}
        disabled={isDeleting}
      >
        {variant !== "text" && (
          <Trash2 size={currentSize.iconSize} color={colors.white} />
        )}
        {variant !== "icon" && (
          <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>
            Delete
          </Text>
        )}
      </TouchableOpacity>

      <DeleteConfirmationPopup
        visible={showPopup}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={title}
        message={message}
        itemName={itemName}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textButton: {
    paddingHorizontal: 16,
    width: "auto",
  },
  bothButton: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    width: "auto",
  },
  text: {
    color: colors.white,
    fontWeight: "600",
  },
});

export default DeleteButton;
