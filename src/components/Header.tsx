import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity } from "react-native";
import { Menu } from "lucide-react-native";
import { colors } from "../theme/colors";

interface HeaderProps {
  onMenuPress?: () => void;
  rightSlot?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress, rightSlot }) => {
  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: 10,
          paddingBottom: 12,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {onMenuPress && (
          <TouchableOpacity
            accessibilityLabel="Open menu"
            onPress={onMenuPress}
            activeOpacity={0.9}
            style={{
              position: "absolute",
              left: 20,
              top: 10,
              width: 46,
              height: 46,
              borderRadius: 16,
              backgroundColor: colors.backgroundCard,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Menu size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 34,
              fontFamily: "Logo",
              color: colors.text,
              letterSpacing: -0.5,
              textAlign: "center",
            }}
          >
            Ingenium
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: 10,
              color: colors.textSecondary,
              fontFamily: "SpaceGrotesk_600SemiBold",
              letterSpacing: 0.8,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            Harmonising Imagination and Structure
          </Text>
        </View>

        {rightSlot && (
          <View style={{ position: "absolute", right: 20, top: 10 }}>{rightSlot}</View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Header;
