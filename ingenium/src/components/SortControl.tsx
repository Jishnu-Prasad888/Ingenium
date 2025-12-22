import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const SortControl: React.FC = () => {
    const { sortBy, setSortBy } = useApp();

    const options = ['date-desc', 'date-asc', 'alpha-asc', 'alpha-desc'];

    const getDisplayText = (sortOption: string) => {
        switch (sortOption) {
            case 'date-desc': return 'Date ↓';
            case 'date-asc': return 'Date ↑';
            case 'alpha-asc': return 'A → Z';
            case 'alpha-desc': return 'Z → A';
            default: return 'Date ↓';
        }
    };

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 12, alignItems: 'center' }}>
            <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
                onPress={() => {
                    const current = options.indexOf(sortBy);
                    setSortBy(options[(current + 1) % options.length]);
                }}
            >
                <ChevronDown size={16} color={colors.text} />
                <Text style={{ marginLeft: 4, marginRight: 8, color: colors.text }}>
                    {getDisplayText(sortBy)}
                </Text>
                <ChevronDown size={16} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ marginLeft: 8, color: colors.text }}>: Sort By</Text>
        </View>
    );
};

export default SortControl;