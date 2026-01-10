// screens/WhiteboardScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  Alert,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import {
  Canvas,
  Path,
  SkPath,
  Skia,
  useCanvasRef,
  matchFont,
  Text as SkiaText,
  Vector,
} from "@shopify/react-native-skia";
import {
  Pen,
  Pencil,
  Eraser,
  Type,
  RotateCcw,
  Download,
  Trash2,
} from "lucide-react-native";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { colors } from "../theme/colors";
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";
import { WhiteboardScreenNavigationProp } from "../types/navigation";

type DrawingTool = "pen" | "pencil" | "eraser" | "text";
type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

const WhiteboardScreen: React.FC = () => {
  const navigation = useNavigation<WhiteboardScreenNavigationProp>();
  const canvasRef = useCanvasRef();
  const viewRef = useRef<View>(null);
  const [paths, setPaths] = useState<
    Array<{ path: SkPath; color: string; strokeWidth: number }>
  >([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  const [currentStrokeWidth] = useState<number>(3);
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

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

  const font = matchFont({
    fontFamily: "System",
    fontSize: 24,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        if (currentTool === "text") {
          setIsAddingText(true);
          return;
        }

        const newPath = Skia.Path.Make();
        newPath.moveTo(x, y);
        setCurrentPath(newPath);
      },
      onPanResponderMove: (e) => {
        if (!currentPath || currentTool === "text") return;
        const { locationX: x, locationY: y } = e.nativeEvent;

        currentPath.lineTo(x, y);
        setCurrentPath(currentPath.copy());
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          const strokeWidth =
            currentTool === "pencil"
              ? 1
              : currentTool === "eraser"
              ? 20
              : currentStrokeWidth;
          const color = currentTool === "eraser" ? "#FFFFFF" : currentColor;

          setPaths([...paths, { path: currentPath, color, strokeWidth }]);
          setCurrentPath(null);
        }
      },
    })
  ).current;

  const addTextElement = () => {
    if (textInput.trim()) {
      const newText: TextElement = {
        id: Date.now().toString(),
        text: textInput,
        x: 100,
        y: 100,
        fontSize: 24,
        color: currentColor,
      };
      setTextElements([...textElements, newText]);
      setTextInput("");
      setIsAddingText(false);
    }
  };

  const exportAsPNG = async () => {
    try {
      const uri = await captureRef(viewRef, {
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
    } catch (error) {
      console.error("Error exporting PNG:", error);
      Alert.alert("Error", "Failed to export image");
    }
  };

  const exportAsSVG = () => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">`;

    paths.forEach(({ path, color, strokeWidth }) => {
      const svgPath = path.toSVGString();
      svgContent += `<path d="${svgPath}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"/>`;
    });

    textElements.forEach((text) => {
      svgContent += `<text x="${text.x}" y="${text.y}" font-family="System" font-size="${text.fontSize}" fill="${text.color}">${text.text}</text>`;
    });

    svgContent += "</svg>";

    Alert.alert("SVG Content", "SVG generated! Copy the content below:", [
      {
        text: "Copy",
        onPress: () => {
          Alert.alert("Copied to clipboard!");
        },
      },
      { text: "OK" },
    ]);
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
            setTextElements([]);
          },
        },
      ]
    );
  };

  const undoLastAction = () => {
    if (textElements.length > 0) {
      setTextElements(textElements.slice(0, -1));
    } else if (paths.length > 0) {
      setPaths(paths.slice(0, -1));
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Whiteboard"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
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

        <TouchableOpacity
          style={[
            styles.toolButton,
            currentTool === "text" && styles.activeTool,
          ]}
          onPress={() => setCurrentTool("text")}
        >
          <Type
            size={24}
            color={currentTool === "text" ? colors.primary : colors.text}
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

      <View
        ref={viewRef}
        style={styles.canvasContainer}
        {...panResponder.panHandlers}
      >
        <Canvas style={styles.canvas} ref={canvasRef}>
          {paths.map(({ path, color, strokeWidth }, index) => (
            <Path
              key={index}
              path={path}
              color={color}
              style="stroke"
              strokeWidth={strokeWidth}
            />
          ))}
          {currentPath && (
            <Path
              path={currentPath}
              color={currentTool === "eraser" ? "#FFFFFF" : currentColor}
              style="stroke"
              strokeWidth={currentTool === "eraser" ? 20 : currentStrokeWidth}
            />
          )}
          {textElements.map((text) => (
            <SkiaText
              key={text.id}
              x={text.x}
              y={text.y}
              text={text.text}
              font={font}
              color={text.color}
            />
          ))}
        </Canvas>
      </View>

      <View style={styles.exportButtons}>
        <TouchableOpacity style={styles.exportButton} onPress={exportAsPNG}>
          <Download size={20} color={colors.text} />
          <Text style={styles.exportButtonText}>Export PNG</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportButton} onPress={exportAsSVG}>
          <Download size={20} color={colors.text} />
          <Text style={styles.exportButtonText}>Export SVG</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isAddingText}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddingText(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Text</Text>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Enter text..."
              autoFocus
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsAddingText(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addTextElement}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  canvas: {
    flex: 1,
  },
  exportButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 24,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "transparent",
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default WhiteboardScreen;
