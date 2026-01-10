// types/navigation.d.ts
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

export type RootStackParamList = {
  "notes-list": undefined;
  "folder-explorer": undefined;
  "note-editor": { noteId?: string };
  "query-notes": undefined;
  Whiteboard: undefined;
  Share: undefined;
};

export type NotesListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "notes-list"
>;

export type WhiteboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Whiteboard"
>;
