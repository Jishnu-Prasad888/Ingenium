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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const QueryNotesScreen: React.FC = () => {
  const { notes, setCurrentScreen, getFilteredAndSortedItems } = useApp();

  const [selectedNotes, setSelectedNotes] = useState<
    Array<{ id: string; title: string; content: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // API Key states
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [hasValidApiKey, setHasValidApiKey] = useState(false);

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

  const filteredNotes = getFilteredAndSortedItems(
    notes.filter(
      (note: any) => !selectedNotes.some((selected) => selected.id === note.id)
    ),
    "note"
  );

  const handleSelectNote = (note: any) => {
    if (selectedNotes.length >= 10) {
      Alert.alert(
        "Limit Reached",
        "You can only select up to 10 notes at a time."
      );
      return;
    }
    setSelectedNotes([
      ...selectedNotes,
      {
        id: note.id,
        title: note.title,
        content: note.content,
      },
    ]);
  };

  const handleRemoveNote = (noteId: string) => {
    setSelectedNotes(selectedNotes.filter((note) => note.id !== noteId));
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
      const result = await GeminiService.queryWithNotes(
        currentQuestion,
        selectedNotes
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
                Gemini API Key
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
                Enter your Google Gemini API key to enable AI-powered note
                queries
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
                  Test & Save API Key
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: "center", padding: 12 }}
              onPress={() => {
                if (hasValidApiKey) {
                  setShowApiKeyModal(false);
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
          <Text
            style={{
              fontSize: 24,
              color: colors.text,
              fontWeight: "700",
              marginLeft: 12,
              flex: 1,
            }}
          >
            Query Notes
          </Text>
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
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

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

        {/* Main Content Area - This will shrink when keyboard is visible */}
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
                  .map((note: any) => (
                    <TouchableOpacity
                      key={note.id}
                      style={{
                        backgroundColor: colors.backgroundCard,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      onPress={() => handleSelectNote(note)}
                      activeOpacity={0.7}
                    >
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
                  ))}
              </ScrollView>
            </View>
          ) : (
            // Chat Area with flexible height
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
                      Ask a question about your selected notes to get AI-powered
                      insights
                    </Text>
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

        {/* Question Input - Always visible at bottom */}
        {selectedNotes.length > 0 && (
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
                    maxHeight: 90, // grows only after 1 line
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
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default QueryNotesScreen;
