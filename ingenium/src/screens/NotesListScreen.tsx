import React, { useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { Plus, NotebookPen } from "lucide-react-native";
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
  const { notes, createNote, getFilteredAndSortedItems } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const allNotes = getFilteredAndSortedItems(notes, "note");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <SearchBar />
      <SortControl />

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => createNote(null)}
        >
          <Text style={{ fontSize: 18, color: colors.text, marginRight: 8 }}>
            Create a new note
          </Text>
          <Plus size={20} color={colors.text} />
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
