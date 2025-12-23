import React from "react";
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Share,
} from "react-native";
import { ChevronLeft, Share2 } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import { colors } from "../theme/colors";
import { formatDate } from "../utils/helpers";

const NoteEditorScreen: React.FC = () => {
  const {
    notes,
    folders,
    currentNoteId,
    setCurrentScreen,
    updateNote,
    getCurrentPath,
  } = useApp();

  const note = notes.find((n) => n.id === currentNoteId);

  // Handle case where note might not be found
  if (!note) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, color: colors.text }}>Note not found</Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => setCurrentScreen("notes-list")}
        >
          <Text style={{ color: colors.white }}>Back to Notes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const folder = folders.find((f) => f.id === note.folderId);
  const folderPath = folder ? getCurrentPath() : "/";

  // Safely handle note data
  const title = note?.title && typeof note.title === "string" ? note.title : "";
  const content =
    note?.content && typeof note.content === "string" ? note.content : "";
  const createdAt = note?.createdAt ? note.createdAt : Date.now();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\n${content}`,
        title: title || "Note",
      });
    } catch (error) {
      console.error("Error sharing note:", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        <View
          style={{
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <TextInput
            style={{
              fontSize: 32,
              fontFamily: "serif",
              color: colors.primary,
              marginBottom: 8,
              borderBottomWidth: 2,
              borderBottomColor: colors.text,
              paddingBottom: 8,
            }}
            value={title}
            onChangeText={(text) => updateNote(note.id, { title: text })}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Folder: {folderPath}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Created On: {formatDate(createdAt)}
            </Text>
          </View>

          <TextInput
            style={{
              fontSize: 16,
              color: colors.text,
              minHeight: 300,
              textAlignVertical: "top",
            }}
            value={content}
            onChangeText={(text) => updateNote(note.id, { content: text })}
            multiline
            placeholder="Start writing..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundFolder,
            borderRadius: 12,
            padding: 16,
            marginRight: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
          onPress={() => {
            setCurrentScreen("notes-list");
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={{ marginLeft: 8, fontSize: 16, color: colors.text }}>
            Back
          </Text>
        </TouchableOpacity>
        <View style={{ width: 2, backgroundColor: colors.text }} />
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundFolder,
            borderRadius: 12,
            padding: 16,
            marginLeft: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
          onPress={handleShare}
        >
          <Share2 size={20} color={colors.text} />
          <Text style={{ marginLeft: 8, fontSize: 16, color: colors.text }}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NoteEditorScreen;
