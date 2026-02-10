import React from "react";
import { SafeAreaView, View, Text } from "react-native";
import { colors } from "../theme/colors";
import { useFonts } from "expo-font";

const Header: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Logo: require("../../assets/fonts/logo.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <View
        style={{ paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <Text
          style={{
            fontSize: 52,
            fontFamily: "Logo",
            textAlign: "center",
            color: colors.text,
            letterSpacing: -1,
            paddingTop: 10,
            marginBottom: -6,
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
          }}
        >
          Harmonising Imagination and Structure
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Header;
