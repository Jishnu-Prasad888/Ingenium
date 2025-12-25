import React from "react";
import { TouchableOpacity, Text, Alert } from "react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";

const TestShareTrigger: React.FC = () => {
  const { setIsSharing, setSharedContent, setCurrentScreen } = useApp();

  const testShare = () => {
    const testContent =
      "This is a test shared content from another app. It could be a link: https://example.com or just some text.";

    setSharedContent(testContent);
    setIsSharing(true);
    setCurrentScreen("folder-explorer");

    Alert.alert("Test Share", "Simulating incoming share from another app.");
  };

  return (
    <TouchableOpacity
      onPress={testShare}
      style={{
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: colors.primary,
        padding: 10,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: colors.white, fontSize: 12 }}>Test Share</Text>
    </TouchableOpacity>
  );
};

export default TestShareTrigger;
