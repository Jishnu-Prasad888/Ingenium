import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';

const Header: React.FC = () => (
    <View style={{ backgroundColor: colors.background, paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 48, fontFamily: 'serif', textAlign: 'center', color: colors.text, textDecorationLine: 'underline' }}>
            Ingenium
        </Text>
    </View>
);

export default Header;