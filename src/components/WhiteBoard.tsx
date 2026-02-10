import React, { useState, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type Stroke = {
  path: string;
  color: string;
  width: number;
};

export default function Whiteboard() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

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
        { path: currentPath.current, color: "#000", width: 4 },
      ]);
      console.log("Started drawing");
    } else if (touches.length === 2) {
      // Start pinch
      isDrawing.current = false;
      initialPinchDistance.current = getDistance(touches[0], touches[1]);
      initialPinchScale.current = scale;
      initialPinchMidpoint.current = getMidpoint(touches[0], touches[1]);
      initialTranslate.current = { x: translateX, y: translateY };
      console.log(
        "Started pinch - distance:",
        initialPinchDistance.current,
        "scale:",
        scale,
      );
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

        console.log("Pinching:", {
          currentDistance,
          initialDistance: initialPinchDistance.current,
          scaleRatio,
          newScale,
          oldScale: scale,
        });

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
      console.log("All touches ended - final scale:", scale);
    } else if (touches.length === 1 && lastTouchCount.current === 2) {
      // One finger lifted from pinch
      isDrawing.current = false;
    }

    lastTouchCount.current = touches.length;
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
          <Text style={styles.debug}>Scale: {scale.toFixed(2)}</Text>
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
  debug: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: 8,
    borderRadius: 4,
    fontSize: 16,
    fontWeight: "bold",
  },
});
