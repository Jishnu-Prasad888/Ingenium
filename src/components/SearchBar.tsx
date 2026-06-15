import React from "react";
import { View, TextInput, SafeAreaView } from "react-native";
import { Search } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { cardStyles, layoutStyles } from "../theme/styles";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <SafeAreaView>
      <View style={[layoutStyles.padH, layoutStyles.mb12]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.backgroundCard,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 1,
          }}
        >
          <TextInput
            style={{ flex: 1, fontSize: 17, color: colors.text }}
            placeholder="Search ...."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Search size={20} color={colors.accent} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SearchBar;
