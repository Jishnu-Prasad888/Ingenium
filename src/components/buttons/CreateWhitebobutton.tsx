import React from "react";
import { TouchableOpacity } from "react-native";
import { Pencil } from "lucide-react-native";
import { colors } from "../../theme/colors";

interface WhiteboardButtonProps {
  onPress: () => void;
}

const WhiteboardButton: React.FC<WhiteboardButtonProps> = ({ onPress }) => (
  <TouchableOpacity
    style={{
      position: "absolute",
      bottom: 150,
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
    onPress={onPress}
  >
    <Pencil size={26} color={colors.text} />
  </TouchableOpacity>
);

export default WhiteboardButton;
