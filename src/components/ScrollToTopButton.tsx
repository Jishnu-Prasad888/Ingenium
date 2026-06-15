import React, { RefObject } from "react";
import { TouchableOpacity, ScrollView } from "react-native";
import { ChevronUp } from "lucide-react-native";
import { colors } from "../theme/colors";
import { buttonStyles } from "../theme/styles";

interface ScrollToTopButtonProps {
  scrollRef: RefObject<ScrollView | null>;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ scrollRef }) => (
  <TouchableOpacity
    style={[buttonStyles.icon, { position: "absolute", bottom: 120, right: 20 }]}
    onPress={() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }}
  >
    <ChevronUp size={28} color={colors.text} />
  </TouchableOpacity>
);

export default ScrollToTopButton;
