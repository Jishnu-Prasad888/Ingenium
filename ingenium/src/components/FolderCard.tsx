import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';
import { Folder } from '../services/StorageService';

interface FolderCardProps {
    folder: Folder;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
    const { setCurrentFolderId } = useApp();

    return (
        <TouchableOpacity
            style={{ backgroundColor: colors.backgroundFolder, borderRadius: 12, padding: 16, marginBottom: 12 }}
            onPress={() => setCurrentFolderId(folder.id)}
        >
            <Text style={{ fontSize: 18, color: colors.primary, fontFamily: 'serif' }}>
                /{folder.name}
            </Text>
        </TouchableOpacity>
    );
};

export default FolderCard;