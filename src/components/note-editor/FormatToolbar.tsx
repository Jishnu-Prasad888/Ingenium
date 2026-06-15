import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ExternalLink } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface FormatButtonProps {
  label: string | React.ReactNode;
  onPress: () => void;
}

const FormatButton: React.FC<FormatButtonProps> = ({ label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.backgroundCard,
      borderWidth: 1,
      borderColor: colors.textSecondary,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 30,
    }}
  >
    {typeof label === "string" ? (
      <Text style={{ color: colors.text, fontWeight: "600" }}>{label}</Text>
    ) : (
      label
    )}
  </TouchableOpacity>
);

interface FormatToolbarProps {
  isPreview: boolean;
  onTogglePreview: () => void;
  onInsertMarkdown: (prefix: string, suffix?: string) => void;
  onFullscreen: () => void;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

const FormatToolbar: React.FC<FormatToolbarProps> = ({
  isPreview,
  onTogglePreview,
  onInsertMarkdown,
  onFullscreen,
  keyboardShouldPersistTaps = "handled",
}) => {
  return (
    <View
      style={{
        backgroundColor: colors.backgroundCard,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: 8,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          alignItems: "center",
          gap: 8,
        }}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        <FormatButton
          label={isPreview ? "Edit" : "Preview"}
          onPress={onTogglePreview}
        />
        <FormatButton
          label={<ExternalLink size={16} color={colors.text} />}
          onPress={onFullscreen}
        />
        <FormatButton label="H1" onPress={() => onInsertMarkdown("# ")} />
        <FormatButton label="H2" onPress={() => onInsertMarkdown("## ")} />
        <FormatButton label="H3" onPress={() => onInsertMarkdown("### ")} />
        <FormatButton label="B" onPress={() => onInsertMarkdown("**", "**")} />
        <FormatButton label="I" onPress={() => onInsertMarkdown("*", "*")} />
        <FormatButton
          label="U"
          onPress={() => onInsertMarkdown("__", "__")}
        />
        <FormatButton
          label="☐"
          onPress={() => onInsertMarkdown("- [ ] ")}
        />
      </ScrollView>
    </View>
  );
};

export default FormatToolbar;
