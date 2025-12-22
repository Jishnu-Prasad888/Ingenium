import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const SearchBar: React.FC = () => {
    const { searchQuery, setSearchQuery } = useApp();

    return (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
                <TextInput
                    style={{ flex: 1, fontSize: 16, color: colors.text }}
                    placeholder="Search ...."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <Search size={20} color={colors.accent} />
            </View>
        </View>
    );
};

export default SearchBar;