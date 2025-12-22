import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { List, FilePlus, Folder } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const BottomNavigationBar: React.FC = () => {
    const { currentScreen, setCurrentScreen, setCurrentFolderId, notes, setCurrentNoteId, createNote } = useApp();

    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', backgroundColor: colors.backgroundFolder, borderRadius: 20, padding: 8, shadowColor: colors.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }}>
                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: currentScreen === 'notes-list' ? colors.backgroundCard : 'transparent',
                        borderRadius: 16,
                        padding: 12,
                        alignItems: 'center'
                    }}
                    onPress={() => {
                        setCurrentFolderId(null);
                        setCurrentScreen('notes-list');
                    }}
                >
                    <List size={24} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: currentScreen === 'note-editor' ? colors.backgroundCard : 'transparent',
                        borderRadius: 16,
                        padding: 12,
                        alignItems: 'center'
                    }}
                    onPress={() => {
                        if (notes.length > 0) {
                            const mostRecent = notes.reduce((latest, note) =>
                                note.createdAt > latest.createdAt ? note : latest
                            );
                            setCurrentNoteId(mostRecent.id);
                            setCurrentScreen('note-editor');
                        } else {
                            createNote(null);
                        }
                    }}
                >
                    <FilePlus size={24} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flex: 1,
                        backgroundColor: currentScreen === 'folder-explorer' ? colors.backgroundCard : 'transparent',
                        borderRadius: 16,
                        padding: 12,
                        alignItems: 'center'
                    }}
                    onPress={() => {
                        setCurrentFolderId(null);
                        setCurrentScreen('folder-explorer');
                    }}
                >
                    <Folder size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default BottomNavigationBar;