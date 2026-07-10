import React from "react";
import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { colors } from "../theme/colors";
import { SafeAreaView } from "react-native";

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useApp();

  return (
    <SafeAreaView>
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.backgroundCard,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Search size={20} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: colors.text,
              fontFamily: "SpaceGrotesk_500Medium",
              paddingVertical: 10,
            }}
            placeholder="Search notes, folders or ideas"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SearchBar;
