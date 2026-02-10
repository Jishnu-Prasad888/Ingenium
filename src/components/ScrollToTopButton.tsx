import React, { RefObject } from "react";
import { TouchableOpacity, ScrollView } from "react-native";
import { ChevronUp } from "lucide-react-native";
import { colors } from "../theme/colors";

interface ScrollToTopButtonProps {
  scrollRef: RefObject<ScrollView | null>;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ scrollRef }) => (
  <TouchableOpacity
    style={{
      position: "absolute",
      bottom: 120,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.backgroundFolder,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    }}
    onPress={() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }}
  >
    <ChevronUp size={28} color={colors.text} />
  </TouchableOpacity>
);

export default ScrollToTopButton;
