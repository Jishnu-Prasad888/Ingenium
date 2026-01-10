// screens/NotesListScreen.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { Plus, NotebookPen, Brain } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import SortControl from "../components/SortControl";
import NoteCard from "../components/NoteCard";
import Divider from "../components/Divider";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { colors } from "../theme/colors";
import { EmptyNotesState } from "../components/EmptyNotesState";

const NotesListScreen: React.FC = () => {
  const { notes, createNote, getFilteredAndSortedItems, queryNotes } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const allNotes = getFilteredAndSortedItems(notes, "note");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <SearchBar />

      <SortControl />

      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 12,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => createNote(null)}
          activeOpacity={0.8}
          style={{
            flex: 1,
            height: 44,
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            paddingHorizontal: 14,

            // Subtle depth
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: colors.text,
              marginRight: 7,
            }}
          >
            Create a new note
          </Text>

          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={queryNotes}
          activeOpacity={0.8}
        >
          <Brain size={20} color={colors.primary} />
          <Text style={styles.text}>Aivya</Text>
        </TouchableOpacity>
      </View>

      <Divider text="Your notes here" />

      {allNotes.length > 0 ? (
        <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 20 }}>
          {allNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <EmptyNotesState />
      )}

      <ScrollToTopButton scrollRef={scrollRef} />
    </View>
  );
};

export default NotesListScreen;

const styles = {
  button: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
};
