import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";

interface DividerProps {
  text: string;
}

const Divider: React.FC<DividerProps> = ({ text }) => (
  <View style={{ alignItems: "center", marginVertical: 14, paddingHorizontal: 20 }}>
    <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <View
        style={{
          marginHorizontal: 12,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: colors.backgroundAlt,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontFamily: "SpaceGrotesk_600SemiBold",
            color: colors.textSecondary,
            letterSpacing: 0.4,
          }}
        >
          {text}
        </Text>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  </View>
);

export default Divider;
