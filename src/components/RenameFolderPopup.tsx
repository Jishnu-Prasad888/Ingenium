import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";

interface Props {
  visible: boolean;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const RenameFolderPopup: React.FC<Props> = ({
  visible,
  initialName,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "85%",
          backgroundColor: colors.backgroundCard,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
          Rename Folder
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 10,
            marginBottom: 16,
            color: colors.text,
          }}
        />

        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <TouchableOpacity onPress={onCancel} style={{ marginRight: 16 }}>
            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => name.trim() && onConfirm(name.trim())}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RenameFolderPopup;
