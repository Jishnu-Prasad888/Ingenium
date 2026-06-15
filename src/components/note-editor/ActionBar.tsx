import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft, Trash2, Save, Share2 } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface ActionBarProps {
  showButtonText: boolean;
  onBack: () => void;
  onDelete: () => void;
  onSave: () => void;
  onShare: () => void;
}

const Divider: React.FC = () => (
  <View
    style={{
      width: 3,
      backgroundColor: colors.primary,
      opacity: 1,
      height: 34,
      borderRadius: 12,
    }}
  />
);

const ActionBar: React.FC<ActionBarProps> = ({
  showButtonText,
  onBack,
  onDelete,
  onSave,
  onShare,
}) => {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 90,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        zIndex: 10,
      }}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          paddingLeft: 10,
          paddingRight: 20,
          height: 40,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={onBack}
      >
        <ChevronLeft size={20} color={colors.text} />
        {showButtonText && (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              fontSize: 16,
              color: colors.text,
              paddingLeft: 10,
              textAlign: "center",
            }}
          >
            Back
          </Text>
        )}
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        style={{
          width: 60,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          height: 40,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={onDelete}
      >
        <Trash2 size={20} color={colors.text} />
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          paddingLeft: 18,
          paddingRight: 20,
          height: 40,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={onSave}
      >
        <Save size={18} color={colors.text} />
        {showButtonText && (
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              color: colors.text,
            }}
          >
            Save
          </Text>
        )}
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.backgroundCard,
          borderRadius: 12,
          paddingLeft: 14,
          paddingRight: 20,
          height: 40,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={onShare}
      >
        <Share2 size={18} color={colors.text} />
        {showButtonText && (
          <Text style={{ marginLeft: 8, fontSize: 16, color: colors.text }}>
            Share
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ActionBar;
