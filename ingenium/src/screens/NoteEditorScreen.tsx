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

  const title = typeof note?.title === "string" ? note.title : "";

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

      <View style={{ flex: 1, paddingHorizontal: 20, marginBottom: 10 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 20,
          }}
        >
          {/* Title */}
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

          {/* Meta */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Folder: {folderPath}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Created On: {formatDate(createdAt)}
            </Text>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={{
                fontSize: 16,
                color: colors.text,
                textAlignVertical: "top",
                minHeight: 250,
                marginBottom: 120,
              }}
              value={content}
              onChangeText={(text) => updateNote(note.id, { content: text })}
              multiline
              placeholder="Start writing..."
              placeholderTextColor={colors.textSecondary}
            />
          </ScrollView>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 112,
          flexDirection: "row",
          alignItems: "center",
          alignContent: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 10,
            paddingRight: 20,
            marginRight: 10,
            height: 45,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => {
            setCurrentScreen("notes-list");
          }}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              paddingLeft: 10,
              textAlign: "center",
            }}
          >
            Back
          </Text>
        </TouchableOpacity>
        <View
          style={{
            width: 3,
            backgroundColor: colors.primary,
            opacity: 1,
            height: 34,
            borderRadius: 12,
          }}
        />

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingLeft: 10,
            paddingRight: 20,
            marginLeft: 10,
            height: 45,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
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
