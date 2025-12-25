import { Linking } from "react-native";

const linking = {
  prefixes: ['ingenium://', 'https://ingenium.example.com'],
  
  // Configure which screens should be opened for deep links
  config: {
    screens: {
      ShareScreen: 'share',
      NotesListScreen: 'notes',
      NoteEditorScreen: 'note/:id',
    },
  },
  
  // Custom function to handle incoming links
  async getInitialURL() {
    // Check if app was opened from a share
    const url = await Linking.getInitialURL();
    return url;
  },
  
  // Function to parse the URL and extract content
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => {
      listener(url);
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription.remove();
    };
  },
};

export default linking;