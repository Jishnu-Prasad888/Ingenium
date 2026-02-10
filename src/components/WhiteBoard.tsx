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

  const toggleTool = () => {
    setIsEraser(!isEraser);
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

          {/* Current Tool Indicator - Now Clickable */}
          <TouchableOpacity
            style={styles.toolIndicator}
            onPress={toggleTool}
            activeOpacity={0.7}
          >
            {isEraser ? (
              <View style={styles.toolContent}>
                <Text style={styles.toolEmoji}>🧹</Text>
                <Text style={styles.toolText}>Eraser</Text>
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
                  <Text style={styles.toolEmoji}>✏️</Text>
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
                  <Text
                    style={[
                      styles.toolButtonText,
                      isEraser && styles.selectedToolText,
                    ]}
                  >
                    🧹 Eraser
                  </Text>
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
    backgroundColor: "#FAFAFA",
  },

  /* Floating menu button */
  menuButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  menuIcon: {
    width: 18,
    height: 14,
    justifyContent: "space-between",
  },
  menuLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#111827",
    borderRadius: 2,
  },

  /* Tool indicator */
  toolIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
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
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  toolEmoji: {
    fontSize: 18,
  },
  toolText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
  tapHint: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 4,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#111827",
  },

  /* Sections */
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Color picker */
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#111827",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  /* Tool buttons */
  toolButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  selectedTool: {
    backgroundColor: "#111827",
  },
  toolButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  selectedToolText: {
    color: "#FFFFFF",
  },

  /* Destructive action */
  clearButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#991B1B",
    fontSize: 15,
    fontWeight: "600",
  },

  /* Close */
  closeButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
});
