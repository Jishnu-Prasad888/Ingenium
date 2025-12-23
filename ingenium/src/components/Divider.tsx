import React from "react";
import { View, Text } from "react-native";
import { colors } from "../theme/colors";

interface DividerProps {
  text: string;
}

const Divider: React.FC<DividerProps> = ({ text }) => (
  <View style={{ alignItems: "center", marginTop: -1, marginVertical: 12 }}>
    <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.text }} />
      <Text
        style={{
          marginHorizontal: 16,
          fontSize: 12,
          fontFamily: "serif",
          fontStyle: "italic",
          color: colors.primary,
        }}
      >
        {text}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.text }} />
    </View>
  </View>
);

export default Divider;
