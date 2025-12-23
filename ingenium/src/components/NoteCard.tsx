import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CircleChevronRight } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";
import { Note } from "../services/StorageService";

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const { setCurrentNoteId, setCurrentScreen } = useApp();

  const title = typeof note?.title === "string" ? note.title : "";
  const content =
    note?.content && typeof note.content === "string" ? note.content : "";
  const createdAt = note?.createdAt ? note.createdAt : Date.now();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: colors.backgroundCard,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
      onPress={() => {
        if (note?.id) {
          setCurrentNoteId(note.id);
          setCurrentScreen("note-editor");
        }
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 24,
              fontFamily: "serif",
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            <Text>{title.length > 0 ? title : "Untitled Note"}</Text>
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 8,
            }}
          >
            {formatDate(createdAt)}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text }} numberOfLines={2}>
            {content || "No content"}
          </Text>
        </View>
        <CircleChevronRight size={24} color={colors.text} />
      </View>
    </TouchableOpacity>
  );
};

export default NoteCard;
