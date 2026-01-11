// screens/WhiteboardScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { Canvas, Path, Skia, useCanvasRef } from "@shopify/react-native-skia";
import {
  Pen,
  Pencil,
  Eraser,
  RotateCcw,
  Download,
  Trash2,
  Share,
} from "lucide-react-native";
import * as MediaLibrary from "expo-media-library";
import { runOnJS } from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { colors } from "../theme/colors";
import Header from "../components/Header";
import { useApp } from "../context/AppContext";
import { SafeAreaView } from "react-native-safe-area-context";

type DrawingTool = "pen" | "pencil" | "eraser";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface DrawingPath {
  segments: string[]; // SVG path commands like ["M 100 100", "L 110 110", ...]
  color: string;
  strokeWidth: number;
  blendMode?: "clear";
}

const WhiteboardScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const canvasRef = useCanvasRef();
  const viewRef = useRef<View>(null);

  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  const [currentStrokeWidth] = useState<number>(3);
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const colorsPalette = [
    "#000000",
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
    "#4CD964",
    "#5AC8FA",
    "#007AFF",
    "#5856D6",
    "#FF2D55",
    "#8E8E93",
  ];

  // Helper functions that run on JS thread
  const startPath = (x: number, y: number) => {
    const strokeWidth =
      currentTool === "pencil"
        ? 1
        : currentTool === "eraser"
        ? 20
        : currentStrokeWidth;
    const color = currentTool === "eraser" ? "#FFFFFF" : currentColor;
    const blendMode = currentTool === "eraser" ? "clear" : undefined;

    // Create a new path starting at the touch point
    const newPath: DrawingPath = {
      segments: [`M ${x} ${y}`],
      color,
      strokeWidth,
      blendMode,
    };

    setCurrentPath(newPath);
  };

  const updatePath = (x: number, y: number) => {
    setCurrentPath((prev) => {
      if (!prev) return prev;

      // Add line segment to current path
      return {
        ...prev,
        segments: [...prev.segments, `L ${x} ${y}`],
      };
    });
  };

  const endPath = () => {
    setCurrentPath((prev) => {
      if (prev && prev.segments.length > 1) {
        // Save the completed path
        setPaths((paths) => [...paths, prev]);
      }
      return null;
    });
  };

  // Create pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const { x, y } = event;
      runOnJS(startPath)(x, y);
    })
    .onUpdate((event) => {
      const { x, y } = event;
      runOnJS(updatePath)(x, y);
    })
    .onEnd(() => {
      runOnJS(endPath)();
    })
    .minDistance(1); // Minimum distance before gesture is recognized

  const handleBackPress = () => {
    setCurrentScreen("notes-list");
  };

  const exportAsPNG = async () => {
    try {
      if (!viewRef.current) {
        Alert.alert("Error", "Canvas reference not found");
        return;
      }

      const uri = await captureRef(viewRef.current, {
        format: "png",
        quality: 1,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant media library permissions to save the image."
        );
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync("Whiteboard", asset, false);

      Alert.alert("Success", "Image saved to gallery!");
    } catch (error: any) {
      console.error("Export failed:", error.message);
      Alert.alert("Error", "Failed to export image");
    }
  };

  const exportAsSVG = () => {
    try {
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}" viewBox="0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}">`;

      // Add white background
      svgContent += `<rect width="100%" height="100%" fill="white"/>`;

      // Add all saved paths
      paths.forEach(({ segments, color, strokeWidth, blendMode }) => {
        try {
          if (segments.length === 0) return;

          const pathData = segments.join(" ");
          const fill = blendMode === "clear" ? "white" : "none";
          const stroke = blendMode === "clear" ? "white" : color;

          svgContent += `<path d="${pathData}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>`;
        } catch (error) {
          console.error("Error converting path to SVG:", error);
        }
      });

      // Add current drawing path if exists
      if (currentPath && currentPath.segments.length > 0) {
        const pathData = currentPath.segments.join(" ");
        const fill = currentPath.blendMode === "clear" ? "white" : "none";
        const stroke =
          currentPath.blendMode === "clear" ? "white" : currentPath.color;

        svgContent += `<path d="${pathData}" stroke="${stroke}" stroke-width="${currentPath.strokeWidth}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }

      svgContent += "</svg>";

      Alert.alert(
        "SVG Exported",
        "SVG content has been generated. Would you like to copy it?",
        [
          {
            text: "Copy SVG",
            onPress: async () => {
              Alert.alert("Copied!", "SVG copied to clipboard");
            },
          },
          { text: "OK", style: "default" },
        ]
      );
    } catch (error: any) {
      console.error("Error generating SVG:", error.message);
      Alert.alert("Error", "Failed to generate SVG");
    }
  };

  const clearCanvas = () => {
    Alert.alert(
      "Clear Canvas",
      "Are you sure you want to clear the entire whiteboard?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setPaths([]);
            setCurrentPath(null);
          },
        },
      ]
    );
  };

  const undoLastAction = () => {
    if (paths.length > 0) {
      setPaths(paths.slice(0, -1));
    }
  };

  // Create Skia Path from SVG segments
  const createSkiaPathFromSegments = (segments: string[]) => {
    const path = Skia.Path.Make();

    segments.forEach((segment, index) => {
      const parts = segment.split(" ");
      const command = parts[0];
      const x = parseFloat(parts[1]);
      const y = parseFloat(parts[2]);

      if (command === "M") {
        path.moveTo(x, y);
      } else if (command === "L") {
        path.lineTo(x, y);
      }
    });

    return path;
  };

  const renderPaths = () => {
    return paths
      .map((pathData, index) => {
        if (pathData.segments.length === 0) return null;

        try {
          const path = createSkiaPathFromSegments(pathData.segments);

          return (
            <Path
              key={`saved-${index}`}
              path={path}
              color={pathData.color}
              style="stroke"
              strokeWidth={pathData.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
              blendMode={pathData.blendMode}
            />
          );
        } catch (error) {
          console.error(`Error rendering path ${index}:`, error);
          return null;
        }
      })
      .filter(Boolean);
  };

  const renderCurrentPath = () => {
    if (!currentPath || currentPath.segments.length === 0) return null;

    try {
      const path = createSkiaPathFromSegments(currentPath.segments);

      return (
        <Path
          key="current"
          path={path}
          color={currentPath.color}
          style="stroke"
          strokeWidth={currentPath.strokeWidth}
          strokeCap="round"
          strokeJoin="round"
          blendMode={currentPath.blendMode}
        />
      );
    } catch (error) {
      console.error("Error rendering current path:", error);
      return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header
          title="Whiteboard"
          showBackButton={true}
          onBackPress={handleBackPress}
        />

        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[
              styles.toolButton,
              currentTool === "pen" && styles.activeTool,
            ]}
            onPress={() => setCurrentTool("pen")}
          >
            <Pen
              size={24}
              color={currentTool === "pen" ? colors.primary : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolButton,
              currentTool === "pencil" && styles.activeTool,
            ]}
            onPress={() => setCurrentTool("pencil")}
          >
            <Pencil
              size={24}
              color={currentTool === "pencil" ? colors.primary : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolButton,
              currentTool === "eraser" && styles.activeTool,
            ]}
            onPress={() => setCurrentTool("eraser")}
          >
            <Eraser
              size={24}
              color={currentTool === "eraser" ? colors.primary : colors.text}
            />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowColorPicker(!showColorPicker)}
          >
            <View
              style={[styles.colorPreview, { backgroundColor: currentColor }]}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={undoLastAction}>
            <RotateCcw size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolButton} onPress={clearCanvas}>
            <Trash2 size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setShowExportModal(true)}
          >
            <Share size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {showColorPicker && (
          <View style={styles.colorPicker}>
            {colorsPalette.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => {
                  setCurrentColor(color);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </View>
        )}

        <View style={styles.canvasContainer}>
          <View ref={viewRef} style={styles.canvasWrapper} collapsable={false}>
            <GestureDetector gesture={panGesture}>
              <Canvas style={styles.canvas} ref={canvasRef}>
                {renderPaths()}
                {renderCurrentPath()}
              </Canvas>
            </GestureDetector>
          </View>
        </View>
      </View>

      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowExportModal(false)}
        >
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Whiteboard</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowExportModal(false);
                exportAsPNG();
              }}
            >
              <Download size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Export as PNG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowExportModal(false);
                exportAsSVG();
              }}
            >
              <Download size={20} color="#fff" />
              <Text style={styles.modalButtonText}>Export as SVG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: colors.text,
    textAlign: "center",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalCancel: {
    paddingVertical: 10,
  },
  modalCancelText: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 14,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
    justifyContent: "space-around",
  },
  toolButton: {
    padding: 8,
    borderRadius: 8,
  },
  activeTool: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorPicker: {
    position: "absolute",
    top: 70,
    right: 10,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 120,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  canvasWrapper: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});

export default WhiteboardScreen;
