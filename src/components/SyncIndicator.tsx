import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { cardStyles } from '../theme/styles';

const SyncIndicator: React.FC = () => {
    const { isSyncing } = useApp();

    if (!isSyncing) return null;

    return (
        <View style={[cardStyles.cardCompact, { position: 'absolute', top: 60, right: 20, flexDirection: 'row', alignItems: 'center' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ marginLeft: 8, color: colors.text }}>Syncing...</Text>
        </View>
    );
};

export default SyncIndicator;
