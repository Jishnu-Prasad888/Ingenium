import React, { useState, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Modal } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type Stroke = {
  path: string;
  color: string;
  width: number;
  isEraser?: boolean;
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

export default function Whiteboard() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [isEraser, setIsEraser] = useState(false);

  const currentPath = useRef("");
  const isDrawing = useRef(false);
  const lastTouchCount = useRef(0);
  const initialPinchDistance = useRef(0);
  const initialPinchScale = useRef(1);
  const initialPinchMidpoint = useRef({ x: 0, y: 0 });
  const initialTranslate = useRef({ x: 0, y: 0 });

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
    const touches = e.nativeEvent.touches;
    lastTouchCount.current = touches.length;

    if (touches.length === 1) {
      // Start drawing
      isDrawing.current = true;
      const touch = touches[0];
      const canvasPoint = screenToCanvas(touch.locationX, touch.locationY);
      currentPath.current = `M ${canvasPoint.x} ${canvasPoint.y}`;
      setStrokes((prev) => [
        ...prev,
        {
          path: currentPath.current,
          color: isEraser ? "#FFFFFF" : currentColor,
          width: isEraser ? 20 : 4,
          isEraser: isEraser,
        },
      ]);
    } else if (touches.length === 2) {
      // Start pinch
      isDrawing.current = false;
      initialPinchDistance.current = getDistance(touches[0], touches[1]);
      initialPinchScale.current = scale;
      initialPinchMidpoint.current = getMidpoint(touches[0], touches[1]);
      initialTranslate.current = { x: translateX, y: translateY };
    }
  };

  const handleTouchMove = (e: any) => {
    const touches = e.nativeEvent.touches;

    if (touches.length === 1 && isDrawing.current) {
      // Continue drawing
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
      // Continue pinch
      const currentDistance = getDistance(touches[0], touches[1]);
      const currentMidpoint = getMidpoint(touches[0], touches[1]);

      if (initialPinchDistance.current > 0) {
        // Calculate new scale
        const scaleRatio = currentDistance / initialPinchDistance.current;
        const newScale = Math.max(
          0.5,
          Math.min(5, initialPinchScale.current * scaleRatio),
        );

        // Calculate pan based on midpoint movement
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
      // One finger lifted from pinch
      isDrawing.current = false;
    }

    lastTouchCount.current = touches.length;
  };

  const handleColorSelect = (color: string) => {
    setCurrentColor(color);
    setIsEraser(false);
    setMenuOpen(false);
  };

  const handleEraserSelect = () => {
    setIsEraser(true);
    setMenuOpen(false);
  };

  const handleClearAll = () => {
    setStrokes([]);
    setMenuOpen(false);
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
          <View style={styles.toolIndicator}>
            {isEraser ? (
              <Text style={styles.toolText}>✏️ Eraser</Text>
            ) : (
              <View style={styles.colorIndicatorContainer}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: currentColor },
                  ]}
                />
                <Text style={styles.toolText}>Pen</Text>
              </View>
            )}
          </View>

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

                {/* Colors */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pen Colors</Text>
                  <View style={styles.colorGrid}>
                    {COLORS.map((color) => (
                      <TouchableOpacity
                        key={color.value}
                        style={[
                          styles.colorButton,
                          { backgroundColor: color.value },
                          currentColor === color.value &&
                            !isEraser &&
                            styles.selectedColor,
                        ]}
                        onPress={() => handleColorSelect(color.value)}
                      >
                        {currentColor === color.value && !isEraser && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Eraser */}
                <TouchableOpacity
                  style={[styles.toolButton, isEraser && styles.selectedTool]}
                  onPress={handleEraserSelect}
                >
                  <Text style={styles.toolButtonText}>✏️ Eraser</Text>
                </TouchableOpacity>

                {/* Clear All */}
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearAll}
                >
                  <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
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
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  colorIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  toolText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
});
