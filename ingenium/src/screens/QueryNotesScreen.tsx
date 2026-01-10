// screens/QueryNotesScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  X,
  Copy,
  Check,
  MessageSquare,
  Key,
  AlertTriangle,
  Send,
  CheckCircle,
  Settings,
  RefreshCw,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import GeminiService from "../services/GeminiService";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
}

interface SelectedNote {
  id: string;
  title: string;
  content: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const QueryNotesScreen: React.FC = () => {
  const { notes, setCurrentScreen, getFilteredAndSortedItems } = useApp();

  const [selectedNotes, setSelectedNotes] = useState<SelectedNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Multi-selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [tempSelectedNotes, setTempSelectedNotes] = useState<SelectedNote[]>(
    []
  );

  // API Key states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Check if API key exists on mount
  useEffect(() => {
    const checkApiKey = async () => {
      const hasKey = await GeminiService.hasApiKey();
      setHasValidApiKey(hasKey);
      if (!hasKey) {
        setShowApiKeyModal(true);
      } else {
        setShowPrivacyWarning(true);
      }
    };
    checkApiKey();
  }, []);

  // Load existing API key when modal opens for change
  useEffect(() => {
    const loadApiKey = async () => {
      if (showApiKeyModal && !isChangingApiKey) {
        const existingKey = await GeminiService.getApiKey();
        if (existingKey) {
          setApiKey("••••••••••••••••"); // Mask existing key
        }
      }
    };
    loadApiKey();
  }, [showApiKeyModal, isChangingApiKey]);

  const filteredNotes = getFilteredAndSortedItems(
    notes.filter(
      (note: any) => !selectedNotes.some((selected) => selected.id === note.id)
    ),
    "note"
  );

  // Enter multi-selection mode on long press
  const handleLongPressNote = useCallback((note: any) => {
    setSelectionMode(true);
    // Initialize temp selection with this note
    const newNote: SelectedNote = {
      id: note.id,
      title: note.title,
      content: note.content,
    };
    setTempSelectedNotes([newNote]);
  }, []);

  // Handle note press - different behavior based on mode
  const handleNotePress = useCallback(
    (note: any) => {
      if (selectionMode) {
        // In selection mode: toggle note selection
        const noteToAdd: SelectedNote = {
          id: note.id,
          title: note.title,
          content: note.content,
        };

        const isAlreadySelected = tempSelectedNotes.some(
          (selected) => selected.id === note.id
        );

        if (isAlreadySelected) {
          // Remove from selection
          setTempSelectedNotes(
            tempSelectedNotes.filter((selected) => selected.id !== note.id)
          );
        } else {
          // Add to selection if under limit
          if (tempSelectedNotes.length < 10) {
            setTempSelectedNotes([...tempSelectedNotes, noteToAdd]);
          } else {
            Alert.alert(
              "Limit Reached",
              "You can only select up to 10 notes at a time."
            );
          }
        }
      } else {
        // Normal mode: single note selection
        if (selectedNotes.length >= 10) {
          Alert.alert(
            "Limit Reached",
            "You can only select up to 10 notes at a time."
          );
          return;
        }

        const newNote: SelectedNote = {
          id: note.id,
          title: note.title,
          content: note.content,
        };

        // Check if already selected in main list
        const isAlreadySelected = selectedNotes.some(
          (selected) => selected.id === note.id
        );

        if (!isAlreadySelected) {
          setSelectedNotes([...selectedNotes, newNote]);
        }
      }
    },
    [selectionMode, tempSelectedNotes, selectedNotes]
  );

  // Confirm selections and exit selection mode
  const handleConfirmSelections = useCallback(() => {
    if (tempSelectedNotes.length === 0) {
      Alert.alert("No Selection", "Please select at least one note.");
      return;
    }

    // Add temp selections to main selected notes
    const newSelections = [...selectedNotes];

    // Only add notes that aren't already selected
    tempSelectedNotes.forEach((tempNote) => {
      if (!newSelections.some((selected) => selected.id === tempNote.id)) {
        if (newSelections.length < 10) {
          newSelections.push(tempNote);
        }
      }
    });

    setSelectedNotes(newSelections);
    setSelectionMode(false);
    setTempSelectedNotes([]);
  }, [tempSelectedNotes, selectedNotes]);

  // Cancel selection mode
  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setTempSelectedNotes([]);
  }, []);

  const handleRemoveNote = (noteId: string) => {
    setSelectedNotes(selectedNotes.filter((note) => note.id !== noteId));
  };

  // Clear all selected notes
  const handleClearAllSelections = useCallback(() => {
    Alert.alert(
      "Clear All Selections",
      "Are you sure you want to remove all selected notes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setSelectedNotes([]);
            if (selectionMode) {
              setSelectionMode(false);
              setTempSelectedNotes([]);
            }
          },
        },
      ]
    );
  }, [selectionMode]);

  // Handle changing API key
  const handleChangeApiKey = () => {
    setIsChangingApiKey(true);
    setApiKey(""); // Clear the masked key
    setApiKeyError("");
    setShowApiKeyModal(true);
  };

  // Handle remove API key
  const handleRemoveApiKey = async () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove your API key? You'll need to enter it again to use AI features.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await GeminiService.removeApiKey();
            setHasValidApiKey(false);
            setShowApiKeyModal(true);
            setChatMessages([]);
            setSelectedNotes([]);
            setIsChangingApiKey(true);
          },
        },
      ]
    );
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setApiKeyError("Please enter your API key");
      return;
    }

    setIsTestingApiKey(true);
    setApiKeyError("");

    try {
      const result = await GeminiService.testApiKey(apiKey);

      if (result.success) {
        await GeminiService.saveApiKey(apiKey);
        setHasValidApiKey(true);
        setShowApiKeyModal(false);
        setIsChangingApiKey(false);
        Alert.alert("Success", "API key saved successfully!");
        setShowPrivacyWarning(true);
      } else {
        setApiKeyError(result.message || "Invalid API key");
      }
    } catch (error: any) {
      setApiKeyError(error.message || "Failed to test API key");
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleSendQuestion = async () => {
    if (!question.trim()) {
      Alert.alert("Error", "Please enter a question");
      return;
    }

    if (selectedNotes.length === 0) {
      Alert.alert("Error", "Please select at least one note");
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: question,
      isUser: true,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    const currentQuestion = question;
    setQuestion("");
    setIsLoading(true);

    try {
      // Ensure we're passing the correct context (max 10 notes)
      const notesToSend = selectedNotes.slice(0, 10);

      const result = await GeminiService.queryWithNotes(
        currentQuestion,
        notesToSend
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: result.success ? result.response! : `Error: ${result.error}`,
        isUser: false,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error.message || "Failed to get response"}`,
        isUser: false,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async (content: string, messageId: string) => {
    await Clipboard.setStringAsync(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearChat = () => {
    Alert.alert("Clear Chat", "Are you sure you want to clear all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => setChatMessages([]),
      },
    ]);
  };

  // Check if a note is selected (either in selection mode or normal mode)
  const isNoteSelected = useCallback(
    (noteId: string) => {
      if (selectionMode) {
        return tempSelectedNotes.some((note) => note.id === noteId);
      } else {
        return selectedNotes.some((note) => note.id === noteId);
      }
    },
    [selectionMode, tempSelectedNotes, selectedNotes]
  );

  if (!hasValidApiKey && !showApiKeyModal) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.backgroundCard,
            padding: 32,
            borderRadius: 16,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Key size={64} color={colors.primary} />
          <Text
            style={{
              fontSize: 24,
              color: colors.text,
              marginTop: 20,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            API Key Required
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 12,
              lineHeight: 20,
            }}
          >
            You need to set up your Gemini API key to use this feature and query
            your notes with AI
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 10,
              width: "100%",
              alignItems: "center",
            }}
            onPress={() => setShowApiKeyModal(true)}
          >
            <Text
              style={{ color: colors.white, fontSize: 16, fontWeight: "600" }}
            >
              Set Up API Key
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background, paddingBottom: 90 }}
      edges={["top"]}
    >
      {/* Privacy Warning Modal */}
      <Modal
        visible={showPrivacyWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacyWarning(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 20,
              padding: 28,
              width: "100%",
              maxWidth: 420,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: colors.warningLight || "#FFF3CD",
                  borderRadius: 50,
                  padding: 16,
                }}
              >
                <AlertTriangle size={48} color={colors.warning} />
              </View>
            </View>
            <Text
              style={{
                fontSize: 22,
                color: colors.text,
                fontWeight: "700",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Privacy Notice
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                lineHeight: 22,
                marginBottom: 28,
                textAlign: "center",
              }}
            >
              When using this feature, your notes will be sent to Google's
              servers to generate responses. Please ensure you trust Google's
              privacy policy and data handling practices.
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.backgroundCard,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => {
                  setShowPrivacyWarning(false);
                  setCurrentScreen("notes-list");
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={() => setShowPrivacyWarning(false)}
              >
                <Text style={{ color: colors.white, fontWeight: "600" }}>
                  I Understand
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* API Key Setup Modal */}
      <Modal
        visible={showApiKeyModal}
        animationType="slide"
        onRequestClose={() => {
          if (hasValidApiKey) {
            setShowApiKeyModal(false);
            setIsChangingApiKey(false);
          }
        }}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
          edges={["top", "bottom"]}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={{ marginTop: 12, marginBottom: 24 }}
              onPress={() => {
                if (hasValidApiKey) {
                  setShowApiKeyModal(false);
                  setIsChangingApiKey(false);
                } else {
                  setCurrentScreen("notes-list");
                }
              }}
            >
              <ChevronLeft size={28} color={colors.text} />
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <View
                style={{
                  backgroundColor: colors.primaryLight || colors.backgroundCard,
                  borderRadius: 60,
                  padding: 20,
                  marginBottom: 20,
                }}
              >
                <Key size={64} color={colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: 30,
                  color: colors.text,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                {isChangingApiKey ? "Change API Key" : "Gemini API Key"}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 22,
                  paddingHorizontal: 20,
                }}
              >
                {isChangingApiKey
                  ? "Enter a new Gemini API key"
                  : "Enter your Google Gemini API key to enable AI-powered note queries"}
              </Text>
            </View>

            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 10,
                  fontWeight: "600",
                }}
              >
                API Key
              </Text>
              <TextInput
                value={apiKey}
                onChangeText={(text) => {
                  setApiKey(text);
                  setApiKeyError("");
                }}
                placeholder="Enter your Gemini API key"
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 16,
                  color: colors.text,
                  borderWidth: 2,
                  borderColor: apiKeyError ? colors.error : colors.border,
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {apiKeyError ? (
                <Text
                  style={{ fontSize: 14, color: colors.error, marginTop: 8 }}
                >
                  {apiKeyError}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 8,
                  }}
                >
                  Get your API key from Google AI Studio
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                padding: 18,
                alignItems: "center",
                opacity: isTestingApiKey ? 0.7 : 1,
              }}
              onPress={handleTestApiKey}
              disabled={isTestingApiKey}
            >
              {isTestingApiKey ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.white,
                    fontWeight: "700",
                  }}
                >
                  {isChangingApiKey ? "Update API Key" : "Test & Save API Key"}
                </Text>
              )}
            </TouchableOpacity>

            {hasValidApiKey && !isChangingApiKey && (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 10,
                  padding: 18,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={handleChangeApiKey}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.text,
                    fontWeight: "600",
                  }}
                >
                  Change API Key
                </Text>
              </TouchableOpacity>
            )}

            {hasValidApiKey && (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 10,
                  padding: 18,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.error,
                }}
                onPress={handleRemoveApiKey}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.error,
                    fontWeight: "600",
                  }}
                >
                  Remove API Key
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: "center", padding: 12 }}
              onPress={() => {
                if (hasValidApiKey) {
                  setShowApiKeyModal(false);
                  setIsChangingApiKey(false);
                } else {
                  setCurrentScreen("notes-list");
                }
              }}
            >
              <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Main Layout with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => setCurrentScreen("notes-list")}
            style={{ padding: 4 }}
          >
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 24,
                color: colors.text,
                fontWeight: "500",
                lineHeight: 28,
              }}
            >
              Aivya
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 2,
                fontWeight: "500",
              }}
            >
              Thinking made interactive
            </Text>
          </View>

          {/* API Key Settings Button */}
          {hasValidApiKey && !selectionMode && (
            <TouchableOpacity
              onPress={handleChangeApiKey}
              style={{ padding: 8, marginRight: 8 }}
            >
              <Settings size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Selection mode controls */}
          {selectionMode ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <TouchableOpacity
                onPress={handleCancelSelection}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmSelections}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Done ({tempSelectedNotes.length}/10)
                </Text>
              </TouchableOpacity>
            </View>
          ) : selectedNotes.length > 0 ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              {chatMessages.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearChat}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    Clear Chat
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

        {/* API Key Status Indicator */}
        {hasValidApiKey && !selectionMode && selectedNotes.length === 0 && (
          <View
            style={{
              backgroundColor: colors.success + "10",
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <CheckCircle
                size={16}
                color={colors.success}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: colors.success,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                API Key Configured
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleChangeApiKey}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "600",
                  marginRight: 4,
                }}
              >
                Change
              </Text>
              <RefreshCw size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Selection mode indicator */}
        {selectionMode && (
          <View
            style={{
              backgroundColor: colors.primary + "10",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 14,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Selection Mode - Tap notes to select
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                textAlign: "center",
                marginTop: 2,
              }}
            >
              {tempSelectedNotes.length} note
              {tempSelectedNotes.length !== 1 ? "s" : ""} selected • Max 10
              notes
            </Text>
          </View>
        )}

        {/* Selected Notes Pills */}
        {selectedNotes.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 10,
                fontWeight: "600",
              }}
            >
              Selected Notes ({selectedNotes.length}/10)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row" }}>
                {selectedNotes.map((note) => (
                  <View
                    key={note.id}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.white,
                        marginRight: 8,
                        maxWidth: 140,
                        fontWeight: "500",
                      }}
                      numberOfLines={1}
                    >
                      {note.title}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveNote(note.id)}>
                      <X size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          {selectedNotes.length === 0 ? (
            // Notes Selection Area
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
              <View style={{ marginBottom: 16, marginTop: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.backgroundCard,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Search size={20} color={colors.textSecondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search notes to add..."
                    placeholderTextColor={colors.textSecondary}
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      fontSize: 16,
                      color: colors.text,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <X size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  {selectionMode
                    ? "Tap notes to select • Done when finished"
                    : "Tap to select one note • Long press for multiple selection"}
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
              >
                {filteredNotes
                  .filter(
                    (note: any) =>
                      note.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      note.content
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((note: any) => {
                    const selected = isNoteSelected(note.id);

                    return (
                      <TouchableOpacity
                        key={note.id}
                        style={{
                          backgroundColor: colors.backgroundCard,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: selected ? 2 : 1,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          position: "relative",
                        }}
                        onPress={() => handleNotePress(note)}
                        onLongPress={() => handleLongPressNote(note)}
                        activeOpacity={0.7}
                        delayLongPress={500}
                      >
                        {selected && (
                          <View
                            style={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              backgroundColor: colors.primary,
                              borderRadius: 12,
                              width: 24,
                              height: 24,
                              justifyContent: "center",
                              alignItems: "center",
                              zIndex: 1,
                            }}
                          >
                            <CheckCircle size={16} color={colors.white} />
                          </View>
                        )}
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: colors.text,
                                fontWeight: "600",
                                marginBottom: 6,
                              }}
                            >
                              {note.title}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: colors.textSecondary,
                                lineHeight: 20,
                              }}
                              numberOfLines={2}
                            >
                              {note.content.substring(0, 120)}
                              {note.content.length > 120 ? "..." : ""}
                            </Text>
                          </View>
                          <MessageSquare size={22} color={colors.primary} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          ) : (
            // Chat Area
            <View
              style={{
                flex: 1,
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 4,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 0,
                }}
              >
                {chatMessages.length === 0 ? (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 20,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: colors.backgroundAlt,
                        borderRadius: 50,
                        padding: 20,
                        marginBottom: 16,
                      }}
                    >
                      <MessageSquare size={48} color={colors.textSecondary} />
                    </View>
                    <Text
                      style={{
                        fontSize: 18,
                        color: colors.text,
                        marginBottom: 8,
                        fontWeight: "600",
                      }}
                    >
                      Start a Conversation
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary,
                        textAlign: "center",
                        lineHeight: 20,
                      }}
                    >
                      Ask a question about your {selectedNotes.length} selected
                      note{selectedNotes.length !== 1 ? "s" : ""} to get
                      AI-powered insights
                    </Text>
                    <TouchableOpacity
                      style={{
                        marginTop: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: colors.backgroundAlt,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                      onPress={() => setSelectionMode(true)}
                    >
                      <MessageSquare
                        size={16}
                        color={colors.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 14,
                          fontWeight: "500",
                        }}
                      >
                        Select More Notes
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                    keyboardShouldPersistTaps="handled"
                    style={{ flex: 1 }}
                  >
                    {chatMessages.map((message) => (
                      <View
                        key={message.id}
                        style={{
                          marginBottom: 16,
                          alignItems: message.isUser
                            ? "flex-end"
                            : "flex-start",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: message.isUser
                              ? colors.primary
                              : colors.backgroundAlt,
                            borderRadius: 16,
                            padding: 14,
                            maxWidth: "85%",
                            position: "relative",
                          }}
                        >
                          {!message.isUser && (
                            <TouchableOpacity
                              style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                padding: 4,
                                backgroundColor: colors.background,
                                borderRadius: 6,
                              }}
                              onPress={() =>
                                handleCopyToClipboard(
                                  message.content,
                                  message.id
                                )
                              }
                            >
                              {copiedMessageId === message.id ? (
                                <Check size={14} color={colors.success} />
                              ) : (
                                <Copy size={14} color={colors.textSecondary} />
                              )}
                            </TouchableOpacity>
                          )}
                          {message.isUser ? (
                            <Text
                              style={{
                                fontSize: 15,
                                color: colors.white,
                                lineHeight: 22,
                              }}
                            >
                              {message.content}
                            </Text>
                          ) : (
                            <Markdown
                              style={{
                                body: {
                                  color: colors.text,
                                  fontSize: 15,
                                  lineHeight: 22,
                                },
                                code_inline: {
                                  backgroundColor: colors.background,
                                  paddingHorizontal: 6,
                                  paddingVertical: 3,
                                  borderRadius: 4,
                                  fontSize: 14,
                                },
                                code_block: {
                                  backgroundColor: colors.background,
                                  padding: 12,
                                  borderRadius: 8,
                                  fontSize: 14,
                                },
                                blockquote: {
                                  backgroundColor: colors.background,
                                  borderLeftWidth: 4,
                                  borderLeftColor: colors.primary,
                                  paddingLeft: 12,
                                  paddingVertical: 8,
                                  marginVertical: 8,
                                },
                              }}
                            >
                              {message.content}
                            </Markdown>
                          )}
                        </View>
                      </View>
                    ))}
                    {isLoading && (
                      <View style={{ alignItems: "flex-start" }}>
                        <View
                          style={{
                            backgroundColor: colors.backgroundAlt,
                            borderRadius: 16,
                            padding: 16,
                          }}
                        >
                          <ActivityIndicator color={colors.primary} />
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Question Input - Only show when notes are selected and not in selection mode */}
        {selectedNotes.length > 0 && !selectionMode && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 6,
              paddingBottom: 2,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row" as const,
                alignItems: "center" as const,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 50,
                  backgroundColor: colors.backgroundCard,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  marginRight: 10,
                  justifyContent: "center" as const,
                }}
              >
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Ask a question..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={500}
                  style={{
                    fontSize: 16,
                    color: colors.text,
                    paddingVertical: 0,
                    maxHeight: 90,
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSendQuestion}
                disabled={!question.trim() || isLoading}
                activeOpacity={0.75}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  justifyContent: "center" as const,
                  alignItems: "center" as const,
                  backgroundColor:
                    !question.trim() || isLoading
                      ? colors.backgroundAlt
                      : colors.primary,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Send
                    size={22}
                    color={
                      !question.trim() ? colors.textSecondary : colors.white
                    }
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Using {selectedNotes.length} note
              {selectedNotes.length !== 1 ? "s" : ""} as context
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default QueryNotesScreen;
