import React, { useRef } from "react";
import { View, ScrollView, TouchableOpacity, Text, Image } from "react-native";
import { Plus } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import SortControl from "../components/SortControl";
import NoteCard from "../components/NoteCard";
import Divider from "../components/Divider";
import ScrollToTopButton from "../components/ScrollToTopButton";
import { colors } from "../theme/colors";
import Logo from "../../assets/images/logo.png";

const NotesListScreen: React.FC = () => {
  const { notes, createNote, getFilteredAndSortedItems } = useApp();

  const scrollRef = useRef<ScrollView | null>(null);
  const allNotes = getFilteredAndSortedItems(notes, "note");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <SearchBar />

      {/* Sort control aligned closer to edge */}
      <View style={{ paddingRight: 14 }}>
        <SortControl />
      </View>

      {/* Create note button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => createNote(null)}
        >
          <Text style={{ fontSize: 18, color: colors.text, marginRight: 8 }}>
            Create a new note
          </Text>
          <Plus size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Notes list */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          flexGrow: 1,
        }}
      >
        {allNotes.length > 0 ? (
          <>
            {allNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
            <Divider text="End of Notes" />
            <View style={{ height: 100 }} />
          </>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 28,
              paddingBottom: 180,
            }}
          >
            <Image
              source={require("../../assets/images/logo.png")}
              style={{
                width: "100%",
                height: 100,
                resizeMode: "contain",
                marginBottom: 12,
              }}
            />

            {/* Empty State Message */}
            <Text
              style={{
                fontSize: 18,
                color: colors.text,
                textAlign: "center",
                fontFamily: "serif",
                lineHeight: 28,
                opacity: 0.85,
                maxWidth: 320,
              }}
            >
              Get started by clicking the{"\n"}
              <Text
                style={{
                  fontWeight: "600",
                  color: colors.primary,
                }}
              >
                Create a new note
              </Text>{" "}
              button
            </Text>
          </View>
        )}
      </ScrollView>

      <ScrollToTopButton scrollRef={scrollRef} />
    </View>
  );
};

export default NotesListScreen;
