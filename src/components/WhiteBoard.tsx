import React, { useState, useRef } from "react";
import { View, PanResponder, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

type Stroke = {
  path: string;
  color: string;
  width: number;
};

export default function Whiteboard() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPath = useRef("");

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current = `M ${locationX} ${locationY}`;
        setStrokes((prev) => [
          ...prev,
          { path: currentPath.current, color: "#000", width: 4 },
        ]);
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPath.current += ` L ${locationX} ${locationY}`;

        setStrokes((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            path: currentPath.current,
          };
          return updated;
        });
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Svg style={StyleSheet.absoluteFill}>
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
    zIndex: 100,
    marginBottom: 100,
  },
});
