// screens/NotesListScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
} from "react-native";
import { Clock3, Menu, X } from "lucide-react-native";
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

const NotesListScreen: React.FC = () => {
  const {
    notes,
    createNote,
    createWhiteboard,
    getFilteredAndSortedItems,
    queryNotes,
    setCurrentFolderId,
    setCurrentNoteId,
    setCurrentScreen,
  } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerProgress = useRef(new Animated.Value(0)).current;
  const allNotes = getFilteredAndSortedItems(notes, "note");
  const drawerWidth = Math.max(190, Dimensions.get("window").width * 0.5);
  const drawerTranslateX = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  useEffect(() => {
    Animated.timing(drawerProgress, {
      toValue: drawerOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, drawerProgress]);

  const openTimerScreen = () => {
    setDrawerOpen(false);
    setCurrentFolderId(null);
    setCurrentNoteId(null);
    setCurrentScreen("timer-routine");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <TouchableOpacity
        accessibilityLabel="Open menu"
        onPress={() => setDrawerOpen(true)}
        style={styles.menuButton}
      >
        <Menu size={34} color="#FF7A7D" strokeWidth={3} />
      </TouchableOpacity>
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

      {drawerOpen && (
        <View style={[StyleSheet.absoluteFill, styles.drawerLayer]}>
          <Pressable
            accessibilityLabel="Close menu"
            onPress={() => setDrawerOpen(false)}
            style={[styles.drawerScrim, { left: drawerWidth }]}
          />
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            <TouchableOpacity
              accessibilityLabel="Close menu"
              onPress={() => setDrawerOpen(false)}
              style={styles.drawerCloseButton}
            >
              <X size={34} color="#FF7A7D" strokeWidth={2.6} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openTimerScreen}
              style={styles.drawerItem}
            >
              <Clock3 size={24} color={colors.text} />
              <Text style={styles.drawerItemText}>Timer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
};

export default NotesListScreen;

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    top: 58,
    left: 14,
    zIndex: 10,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
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
  drawerScrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  drawerLayer: {
    zIndex: 100,
    elevation: 100,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderColor: colors.text,
    backgroundColor: colors.white,
    paddingTop: 54,
    paddingHorizontal: 14,
    zIndex: 101,
    elevation: 101,
  },
  drawerCloseButton: {
    alignSelf: "flex-end",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  drawerItem: {
    minHeight: 50,
    borderWidth: 2,
    borderColor: colors.text,
    borderRadius: 8,
    backgroundColor: "#FFD4D4",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  drawerItemText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
