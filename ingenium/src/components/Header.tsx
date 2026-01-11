// components/Header.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../theme/colors";
import { ArrowLeft } from "lucide-react-native";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = "Ingenium",
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightPress,
}) => {
  return (
    <View style={styles.container}>
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <Text style={styles.title}>{title}</Text>

      {rightIcon ? (
        <TouchableOpacity style={styles.rightButton} onPress={onRightPress}>
          {rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  rightButton: {
    padding: 4,
  },
  spacer: {
    width: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: colors.text,
  },
});

export default Header;
