import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { NotebookPen } from "lucide-react-native";
import { colors } from "../theme/colors";

export function EmptyNotesState() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingBottom: 120,
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
          alignItems: "center",
          backgroundColor: colors.backgroundCard,
          borderRadius: 20,
          paddingVertical: 40,
          paddingHorizontal: 24,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
        }}
      >
        {/* Icon Illustration */}
        <View
          style={{
            backgroundColor: colors.backgroundAlt,
            borderRadius: 48,
            padding: 18,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <NotebookPen size={36} color={colors.primary} />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontFamily: "SpaceGrotesk_700Bold",
            color: colors.text,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Welcome
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            fontFamily: "SpaceGrotesk_500Medium",
          }}
        >
          You don’t have any notes yet. Tap{" "}
          <Text style={{ color: colors.primary, fontFamily: "SpaceGrotesk_700Bold" }}>
            Create a new note +
          </Text>{" "}
          to get started.
        </Text>
      </Animated.View>
    </View>
  );
}
