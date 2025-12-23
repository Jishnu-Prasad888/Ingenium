import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors } from "../theme/colors";

interface InputModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  defaultValue: string;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

const InputModal: React.FC<InputModalProps> = ({
  visible,
  title,
  placeholder,
  defaultValue,
  onClose,
  onSubmit,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset input value when modal becomes visible
  useEffect(() => {
    if (visible) {
      console.log("InputModal: Setting defaultValue:", defaultValue);
      setInputValue(defaultValue);
      setIsSubmitting(false);
    } else {
      setInputValue("");
    }
  }, [visible, defaultValue]);

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const value = inputValue?.trim() || defaultValue?.trim();

    if (!value) {
      setIsSubmitting(false);
      return;
    }

    onSubmit(value);
    onClose();
  };

  const handleClose = () => {
    console.log("InputModal: User requested close");
    // Just close without submitting
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose} // This handles hardware back button
    >
      <TouchableOpacity
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        activeOpacity={1}
        onPress={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "80%" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()} // Prevent closing when tapping inside
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 16,
                padding: 24,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "serif",
                  color: colors.primary,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {title}
              </Text>

              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 20,
                  backgroundColor: colors.white,
                }}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus
              />

              <View
                style={{ flexDirection: "row", justifyContent: "flex-end" }}
              >
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    marginRight: 12,
                    borderRadius: 8,
                    backgroundColor: colors.backgroundAlt,
                  }}
                  onPress={handleClose}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={{ color: colors.white, fontSize: 16 }}>
                    {isSubmitting ? "Creating..." : "Create"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

export default InputModal;
