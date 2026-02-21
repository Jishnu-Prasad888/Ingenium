// screens/NotesListScreen.tsx
import React, { useEffect, useRef, useState } from "react";
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
import ScrollToTopButton from "../components/buttons/ScrollToTopButton";
import { colors } from "../theme/colors";
import { EmptyNotesState } from "../components/EmptyNotesState";
import NotesListScreenAllButtons from "../components/buttons/NotesListScreenAllButtons";
import BurgerMenu from "../components/BurgeMenu";

const NotesListScreen: React.FC = () => {
  const {
    notes,
    createNote,
    createWhiteboard,
    getFilteredAndSortedItems,
    queryNotes,
  } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
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
        <NotesListScreenAllButtons
          createNote={createNote}
          queryNotes={queryNotes}
          createWhiteboard={createWhiteboard}
        />
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
      <BurgerMenu />
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
