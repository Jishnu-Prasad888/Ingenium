import React from "react";
import { SafeAreaView, View, Text } from "react-native";
import { colors } from "../theme/colors";

const Header: React.FC = () => (
  <SafeAreaView style={{ backgroundColor: colors.background }}>
    <View style={{ paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20 }}>
      <Text
        style={{
          fontSize: 52,
          fontFamily: "serif",
          textAlign: "center",
          color: colors.text,
          letterSpacing: -1,
          fontWeight: "300",
        }}
      >
        Ingenium
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "serif",
          textAlign: "center",
          color: colors.text,
          marginTop: 8,
          letterSpacing: 2,
          fontWeight: "300",
        }}
      >
        Harmonising Imagination and Structure
      </Text>
    </View>
  </SafeAreaView>
);

export default Header;
