// screens/NotesListScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
} from "react-native";
import { Clock3, X } from "lucide-react-native";
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerProgress = useRef(new Animated.Value(0)).current;
  const allNotes = getFilteredAndSortedItems(notes, "note");
  const drawerWidth = Math.max(260, Dimensions.get("window").width * 0.72);
  const drawerTranslateX = drawerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth, 0],
  });

  const openDrawer = () => {
    drawerProgress.stopAnimation();
    drawerProgress.setValue(0);
    setDrawerVisible(true);

    requestAnimationFrame(() => {
      Animated.timing(drawerProgress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDrawer = (onClosed?: () => void) => {
    drawerProgress.stopAnimation();
    Animated.timing(drawerProgress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDrawerVisible(false);
        onClosed?.();
      }
    });
  };

  const openTimerScreen = () => {
    closeDrawer(() => {
      setCurrentFolderId(null);
      setCurrentNoteId(null);
      setCurrentScreen("timer-routine");
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backdrop} pointerEvents="none">
        <View
          style={[styles.blob, { top: -70, right: -60, backgroundColor: colors.secondary }]}
        />
        <View
          style={[styles.blob, { top: 160, left: -50, backgroundColor: colors.primary }]}
        />
      </View>

      <Header onMenuPress={openDrawer} />

      <SearchBar />
      <SortControl />

      <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
        <NotesListScreenAllButtons
          createNote={createNote}
          queryNotes={queryNotes}
          createWhiteboard={createWhiteboard}
        />
      </View>

      <Divider text="Your notes" />

      {allNotes.length > 0 ? (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {allNotes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </ScrollView>
      ) : (
        <EmptyNotesState />
      )}

      <ScrollToTopButton scrollRef={scrollRef} />

      {drawerVisible && (
        <View style={[StyleSheet.absoluteFill, styles.drawerLayer]}>
          <Animated.View
            style={[
              styles.drawerScrim,
              { left: drawerWidth, opacity: drawerProgress },
            ]}
          >
            <Pressable
              accessibilityLabel="Close menu"
              onPress={() => closeDrawer()}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}
          >
            <View style={styles.drawerAccent} />
            <TouchableOpacity
              accessibilityLabel="Close menu"
              onPress={() => closeDrawer()}
              style={styles.drawerCloseButton}
            >
              <X size={21} color={colors.text} strokeWidth={2.6} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openTimerScreen}
              style={styles.drawerItem}
            >
              <View style={styles.drawerIconShell}>
                <Clock3 size={19} color={colors.primary} />
              </View>
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
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  blob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 120,
    opacity: 0.14,
    transform: [{ rotate: "15deg" }],
  },
  listContent: {
    paddingBottom: 170,
  },
  drawerScrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.2)",
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
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: colors.backgroundCard,
    paddingTop: 54,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 101,
    elevation: 101,
  },
  drawerCloseButton: {
    alignSelf: "flex-end",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  drawerAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: colors.secondary,
    borderTopRightRadius: 24,
  },
  drawerItem: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5,
  },
  drawerIconShell: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  drawerItemText: {
    color: colors.text,
    fontSize: 17,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
