import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Plus, Brain, NotebookPen } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface NotesListScreenAllButtonsProps {
  createNote: (folderId: string | null) => void;
  createWhiteboard: (folderId: string | null) => void;
  queryNotes: () => void;
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
}

export default function NotesListScreenAllButtons({
  createNote,
  createWhiteboard,
  queryNotes,
}: NotesListScreenAllButtonsProps) {
  return (
    <View style={styles.container}>
      <ActionButton
        label="Note"
        onPress={() => createNote(null)}
        icon={<Plus size={18} color={colors.primary} />}
      />

      <ActionButton
        label="Whiteboard"
        onPress={() => createWhiteboard(null)}
        icon={<NotebookPen size={18} color={colors.primary} />}
      />

      <ActionButton
        label="Aivya"
        onPress={queryNotes}
        icon={<Brain size={18} color={colors.primary} />}
      />
    </View>
  );
}

function ActionButton({ label, onPress, icon }: ActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.button}
    >
      {icon}

      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.text}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
    width: "100%", // ✅ fill screen
  },

  button: {
    flex: 1, // ✅ evenly share width
    minWidth: 0, // ✅ allow shrinking
    height: 44,

    backgroundColor: colors.backgroundCard,
    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,
    gap: 8,

    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },

  text: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,

    flexShrink: 1, // ✅ text truncates instead of disappearing
  },
});
