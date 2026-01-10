import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme/colors";
import { useFonts } from "expo-font";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = "Ingenium",
  subtitle = "Harmonising Imagination and Structure",
  showBackButton = false,
  rightIcon,
  onRightPress,
  onBackPress,
}) => {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Logo: require("../../assets/fonts/logo.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left */}
        {showBackButton && onBackPress ? (
          <TouchableOpacity onPress={onBackPress}>
            <ArrowLeft size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconSpacer} />
        )}

        {/* Center */}
        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Right */}
        {rightIcon ? (
          <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
            {rightIcon}
          </TouchableOpacity>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    padding: 6,
  },
  iconSpacer: {
    width: 36,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 52,
    fontFamily: "Logo",
    color: colors.text,
    letterSpacing: -1,
    marginBottom: -6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "serif",
    color: colors.text,
    letterSpacing: 2,
    marginTop: 8,
    textAlign: "center",
  },
});

export default Header;
