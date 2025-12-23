import React from "react";
import { SafeAreaView, View, Text } from "react-native";
import { colors } from "../theme/colors";

const Header: React.FC = () => (
  <SafeAreaView style={{ backgroundColor: colors.background }}>
    <View style={{ paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20 }}>
      <Text
        style={{
          fontSize: 48,
          fontFamily: "serif",
          textAlign: "center",
          color: colors.text,
          textDecorationLine: "underline",
        }}
      >
        Ingenium
      </Text>
    </View>
  </SafeAreaView>
);

export default Header;
