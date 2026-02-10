import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Stroke = {
  path: string;
  color: string;
  width: number;
  isEraser?: boolean;
  isPencil?: boolean;
};

type ToolType = "pen" | "pencil" | "eraser";

type WhiteboardState = {
  strokes: Stroke[];
  scale: number;
  translateX: number;
  translateY: number;
};

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
];

const STORAGE_KEY = "@whiteboard_autosave";

export default function Whiteboard() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentTool, setCurrentTool] = useState<ToolType>("pen");

  const currentPath = useRef("");
  const isDrawing = useRef(false);
  const lastTouchCount = useRef(0);
  const initialPinchDistance = useRef(0);
  const initialPinchScale = useRef(1);
  const initialPinchMidpoint = useRef({ x: 0, y: 0 });
  const initialTranslate = useRef({ x: 0, y: 0 });

  // Auto-save whenever strokes change
  React.useEffect(() => {
    const saveToStorage = async () => {
      try {
        const state: WhiteboardState = {
          strokes,
          scale,
          translateX,
          translateY,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Error auto-saving:", error);
      }
    };

    if (strokes.length > 0) {
      saveToStorage();
    }
  }, [strokes, scale, translateX, translateY]);

  // Load from storage on mount
  React.useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const savedState = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const state: WhiteboardState = JSON.parse(savedState);
          setStrokes(state.strokes);
          setScale(state.scale);
          setTranslateX(state.translateX);
          setTranslateY(state.translateY);
        }
      } catch (error) {
        console.error("Error loading:", error);
      }
    };

    loadFromStorage();
  }, []);

  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touch1: any, touch2: any) => {
    return {
      x: (touch1.pageX + touch2.pageX) / 2,
      y: (touch1.pageY + touch2.pageY) / 2,
    };
  };

  const screenToCanvas = (x: number, y: number) => {
    return {
      x: (x - translateX) / scale,
      y: (y - translateY) / scale,
    };
  };

  const handleTouchStart = (e: any) => {
    if (menuOpen || confirmClearOpen) return;

    const touches = e.nativeEvent.touches;
    lastTouchCount.current = touches.length;

    if (touches.length === 1) {
      isDrawing.current = true;
      const touch = touches[0];
      const canvasPoint = screenToCanvas(touch.locationX, touch.locationY);
      currentPath.current = `M ${canvasPoint.x} ${canvasPoint.y}`;

      const strokeConfig = {
        path: currentPath.current,
        color: currentTool === "eraser" ? "#FFFFFF" : currentColor,
        width: currentTool === "eraser" ? 20 : currentTool === "pencil" ? 2 : 4,
        isEraser: currentTool === "eraser",
        isPencil: currentTool === "pencil",
      };

      setStrokes((prev) => [...prev, strokeConfig]);
    } else if (touches.length === 2) {
      isDrawing.current = false;
      initialPinchDistance.current = getDistance(touches[0], touches[1]);
      initialPinchScale.current = scale;
      initialPinchMidpoint.current = getMidpoint(touches[0], touches[1]);
      initialTranslate.current = { x: translateX, y: translateY };
    }
  };

  const handleTouchMove = (e: any) => {
    if (menuOpen || confirmClearOpen) return;

    const touches = e.nativeEvent.touches;

    if (touches.length === 1 && isDrawing.current) {
      const touch = touches[0];
      const canvasPoint = screenToCanvas(touch.locationX, touch.locationY);
      currentPath.current += ` L ${canvasPoint.x} ${canvasPoint.y}`;

      setStrokes((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            path: currentPath.current,
          };
        }
        return updated;
      });
    } else if (touches.length === 2) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const currentMidpoint = getMidpoint(touches[0], touches[1]);

      if (initialPinchDistance.current > 0) {
        const scaleRatio = currentDistance / initialPinchDistance.current;
        const newScale = Math.max(
          0.5,
          Math.min(5, initialPinchScale.current * scaleRatio),
        );

        const dx = currentMidpoint.x - initialPinchMidpoint.current.x;
        const dy = currentMidpoint.y - initialPinchMidpoint.current.y;

        setScale(newScale);
        setTranslateX(initialTranslate.current.x + dx);
        setTranslateY(initialTranslate.current.y + dy);
      }
    }
  };

  const handleTouchEnd = (e: any) => {
    const touches = e.nativeEvent.touches;

    if (touches.length === 0) {
      isDrawing.current = false;
    } else if (touches.length === 1 && lastTouchCount.current === 2) {
      isDrawing.current = false;
    }

    lastTouchCount.current = touches.length;
  };

  const handleColorSelect = (color: string) => {
    setCurrentColor(color);
    setCurrentTool("pen");
    setMenuOpen(false);
  };

  const handlePencilColorSelect = (color: string) => {
    setCurrentColor(color);
    setCurrentTool("pencil");
    setMenuOpen(false);
  };

  const handleEraserSelect = () => {
    setCurrentTool("eraser");
    setMenuOpen(false);
  };

  const toggleTool = () => {
    if (currentTool === "pen") {
      setCurrentTool("pencil");
    } else if (currentTool === "pencil") {
      setCurrentTool("eraser");
    } else {
      setCurrentTool("pen");
    }
  };

  const handleClearRequest = () => {
    setMenuOpen(false);
    setConfirmClearOpen(true);
  };

  const handleConfirmClear = async () => {
    setStrokes([]);
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setConfirmClearOpen(false);

    // Clear auto-save
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  };

  const handleCancelClear = () => {
    setConfirmClearOpen(false);
  };

  // Export to file and share to apps (WhatsApp, email, etc.)
  const handleExport = async () => {
    try {
      const state: WhiteboardState = {
        strokes,
        scale,
        translateX,
        translateY,
      };

      const jsonContent = JSON.stringify(state, null, 2);
      const filename = `whiteboard_${new Date().getTime()}.json`;

      // Try to get a filesystem directory
      const fs = FileSystem as any;
      let directory = fs.cacheDirectory || fs.documentDirectory;

      if (!directory) {
        // Fallback for Expo Go or web: Show data and allow manual save
        Alert.alert(
          "Export Whiteboard",
          "File system not available in this environment. Copy the data below and save it manually to a .json file.",
          [
            {
              text: "Show Data",
              onPress: () => {
                console.log("Whiteboard Data:", jsonContent);
                Alert.alert(
                  "Whiteboard Data",
                  `Data logged to console. Check developer console to copy full data.\n\nPreview:\n${jsonContent.substring(0, 200)}...`,
                  [{ text: "OK" }],
                );
              },
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
        setMenuOpen(false);
        return;
      }

      const fileUri = directory + filename;

      // Write file to filesystem
      await FileSystem.writeAsStringAsync(fileUri, jsonContent);

      // Share the file to various apps (WhatsApp, Email, Files, etc.)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Share Whiteboard",
          UTI: "public.json",
        });

        // Success message after sharing
        setMenuOpen(false);
      } else {
        // If sharing is not available, just show success
        Alert.alert(
          "Exported Successfully",
          `Whiteboard saved to:\n${fileUri}\n\nYou can find it in your device's file manager.`,
          [{ text: "OK" }],
        );
        setMenuOpen(false);
      }
    } catch (error) {
      Alert.alert(
        "Export Error",
        `Failed to export whiteboard.\n\nError: ${(error as Error).message}\n\nTip: If using Expo Go, try building a standalone app for full file system access.`,
      );
      console.error("Export error:", error);
    }
  };

  // Import from file
  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      // Handle both old and new DocumentPicker API
      if (
        "canceled" in result &&
        !result.canceled &&
        result.assets &&
        result.assets.length > 0
      ) {
        // New API (Expo SDK 48+)
        const asset = result.assets[0];
        const content = await FileSystem.readAsStringAsync(asset.uri);
        const state: WhiteboardState = JSON.parse(content);

        setStrokes(state.strokes);
        setScale(state.scale);
        setTranslateX(state.translateX);
        setTranslateY(state.translateY);

        Alert.alert("Success", "Whiteboard loaded successfully!");
      } else if ("type" in result && result.type === "success") {
        // Old API (Expo SDK < 48)
        const content = await FileSystem.readAsStringAsync((result as any).uri);
        const state: WhiteboardState = JSON.parse(content);

        setStrokes(state.strokes);
        setScale(state.scale);
        setTranslateX(state.translateX);
        setTranslateY(state.translateY);

        Alert.alert("Success", "Whiteboard loaded successfully!");
      }

      setMenuOpen(false);
    } catch (error) {
      Alert.alert(
        "Import Error",
        `Failed to import whiteboard.\n\nError: ${(error as Error).message}`,
      );
      console.error("Import error:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={styles.container}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Svg style={StyleSheet.absoluteFill}>
            <G scale={scale} translateX={translateX} translateY={translateY}>
              {strokes.map((stroke, index) => (
                <Path
                  key={index}
                  d={stroke.path}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={stroke.isPencil ? 0.7 : 1}
                />
              ))}
            </G>
          </Svg>

          {/* Toolbar Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuOpen(true)}
          >
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </TouchableOpacity>

          {/* Current Tool Indicator */}
          <TouchableOpacity
            style={styles.toolIndicator}
            onPress={toggleTool}
            activeOpacity={0.7}
          >
            {currentTool === "eraser" ? (
              <View style={styles.toolContent}>
                <Text style={styles.toolEmoji}>🧹</Text>
                <Text style={styles.toolText}>Eraser</Text>
              </View>
            ) : currentTool === "pencil" ? (
              <View style={styles.toolContent}>
                <View style={styles.penIndicator}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: currentColor },
                    ]}
                  />
                  <Text style={styles.toolEmoji}>✏️</Text>
                </View>
                <Text style={styles.toolText}>Pencil</Text>
              </View>
            ) : (
              <View style={styles.toolContent}>
                <View style={styles.penIndicator}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: currentColor },
                    ]}
                  />
                  <Text style={styles.toolEmoji}>🖊️</Text>
                </View>
                <Text style={styles.toolText}>Pen</Text>
              </View>
            )}
            <Text style={styles.tapHint}>Tap to switch</Text>
          </TouchableOpacity>

          {/* Menu Modal */}
          <Modal
            visible={menuOpen}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setMenuOpen(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setMenuOpen(false)}
            >
              <View style={styles.menuContainer}>
                <Text style={styles.menuTitle}>Tools</Text>

                {/* Save/Load Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💾 Save & Load</Text>
                  <View style={styles.saveLoadButtons}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleExport}
                    >
                      <Text style={styles.saveButtonText}>📤 Export</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.loadButton}
                      onPress={handleImport}
                    >
                      <Text style={styles.loadButtonText}>📥 Import</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.autoSaveHint}>
                    Auto-saves locally • Export shares to WhatsApp, Email, Files
                    & more
                  </Text>
                </View>

                {/* Pen Colors */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🖊️ Pen Colors (Bold)</Text>
                  <View style={styles.colorGrid}>
                    {COLORS.map((color) => (
                      <TouchableOpacity
                        key={`pen-${color.value}`}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color.value },
                          currentColor === color.value &&
                            currentTool === "pen" &&
                            styles.selectedColor,
                        ]}
                        onPress={() => handleColorSelect(color.value)}
                      >
                        {currentColor === color.value &&
                          currentTool === "pen" && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Pencil Colors */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    ✏️ Pencil Colors (Thin)
                  </Text>
                  <View style={styles.colorGrid}>
                    {COLORS.map((color) => (
                      <TouchableOpacity
                        key={`pencil-${color.value}`}
                        style={[
                          styles.colorButton,
                          styles.pencilButton,
                          { backgroundColor: color.value },
                          currentColor === color.value &&
                            currentTool === "pencil" &&
                            styles.selectedColor,
                        ]}
                        onPress={() => handlePencilColorSelect(color.value)}
                      >
                        {currentColor === color.value &&
                          currentTool === "pencil" && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Eraser */}
                <TouchableOpacity
                  style={[
                    styles.toolButton,
                    currentTool === "eraser" && styles.selectedTool,
                  ]}
                  onPress={handleEraserSelect}
                >
                  <Text
                    style={[
                      styles.toolButtonText,
                      currentTool === "eraser" && styles.selectedToolText,
                    ]}
                  >
                    🧹 Eraser
                  </Text>
                </TouchableOpacity>

                {/* Clear All */}
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearRequest}
                >
                  <Text style={styles.clearButtonText}>
                    🗑️ Clear Entire Screen
                  </Text>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setMenuOpen(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Confirmation Dialog */}
          <Modal
            visible={confirmClearOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCancelClear}
          >
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmDialog}>
                <Text style={styles.confirmTitle}>Clear Entire Screen?</Text>
                <Text style={styles.confirmMessage}>
                  This will erase all your drawings. This action cannot be
                  undone.
                </Text>

                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelClear}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmClear}
                  >
                    <Text style={styles.confirmButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  menuButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: "space-between",
  },
  menuLine: {
    width: "100%",
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  toolIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toolContent: {
    alignItems: "center",
  },
  penIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  toolEmoji: {
    fontSize: 24,
  },
  toolText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  tapHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginTop: 4,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  saveLoadButtons: {
    flexDirection: "row",
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadButton: {
    flex: 1,
    backgroundColor: "#10B981",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  loadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  autoSaveHint: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  pencilButton: {
    opacity: 0.8,
  },
  selectedColor: {
    borderColor: "#000",
    borderWidth: 3,
  },
  checkmark: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  toolButton: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  selectedTool: {
    backgroundColor: "#000",
  },
  toolButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  selectedToolText: {
    color: "#fff",
  },
  clearButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#e0e0e0",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmDialog: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
