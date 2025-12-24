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

const facts = [
  "Octopuses have three hearts.",
  "Bananas are berries, but strawberries are not.",
  "Honey never spoils.",
  "A day on Venus is longer than a year on Venus.",
  "Wombat poop is cube-shaped.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Sharks existed before trees.",
  "The human brain uses about 20% of the body’s energy.",
  "Butterflies remember being caterpillars.",
  "The Eiffel Tower grows taller in summer.",
];
function getRandomFact() {
  const index = Math.floor(Math.random() * facts.length);
  return facts[index];
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const { setCurrentNoteId, setCurrentScreen } = useApp();

  const title = typeof note?.title === "string" ? note.title : "";
  const content =
    note?.content && typeof note.content === "string" ? note.content : "";
  const createdAt = note?.createdAt ? note.createdAt : Date.now();
  const isEmpty = !content?.trim();
  const randomFact = facts[Math.floor(Math.random() * facts.length)];

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
          alignItems: "center",
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
          {isEmpty ? (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontStyle: "italic",
                  fontFamily: "serif",
                  opacity: 0.5,
                }}
                numberOfLines={2}
              >
                Did You Know ! {randomFact}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontStyle: "italic",
                  fontFamily: "serif",
                  opacity: 0.5,
                  paddingTop: 1,
                }}
              >
                waiting to hear form you now :)
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 12,
                color: colors.text,
                fontFamily: "serif",
              }}
            >
              {content}
            </Text>
          )}

          {/* <Text
            style={{
              fontSize: 14,
              color: colors.text,
              fontStyle: isEmpty ? "italic" : "normal",
            }}
            numberOfLines={2}
          >
            {isEmpty ? randomFact : content}
          </Text> */}
        </View>
        <View style={{ alignItems: "center" }}>
          <CircleChevronRight size={24} color={colors.text} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NoteCard;
