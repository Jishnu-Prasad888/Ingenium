// src/services/DeepLinkService.ts
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

class DeepLinkService {
  private static instance: DeepLinkService;
  
  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  // Handle different types of shares
  parseShareUrl(url: string): { content: string; title?: string } {
    try {
      console.log("Parsing share URL:", url);
      
      // For iOS shares (ingenium://share?text=...)
      if (url.startsWith('ingenium://')) {
        const parsed = Linking.parse(url);
        if (parsed.hostname === 'share') {
          const text = parsed.queryParams?.text as string || '';
          const title = parsed.queryParams?.title as string || '';
          return {
            content: decodeURIComponent(text),
            title: title ? decodeURIComponent(title) : undefined
          };
        }
      }
      
      // For Android shares (content:// or file://)
      if (url.includes('text=')) {
        const urlObj = new URL(url);
        const text = urlObj.searchParams.get('text');
        const title = urlObj.searchParams.get('title');
        return {
          content: text ? decodeURIComponent(text) : '',
          title: title ? decodeURIComponent(title) : undefined
        };
      }
      
      // For web shares (https://)
      if (url.startsWith('https://')) {
        const urlObj = new URL(url);
        const text = urlObj.searchParams.get('text');
        const title = urlObj.searchParams.get('title');
        return {
          content: text ? decodeURIComponent(text) : '',
          title: title ? decodeURIComponent(title) : undefined
        };
      }
      
      // If URL is just plain text
      return { content: url };
    } catch (error) {
      console.error("Error parsing share URL:", error);
      return { content: url };
    }
  }

  // Setup deep linking
  async setupDeepLinking(onShareReceived: (content: string, title?: string) => void) {
    // Get initial URL if app was opened from a link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.handleIncomingLink(initialUrl, onShareReceived);
    }

    // Listen for incoming links when app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleIncomingLink(url, onShareReceived);
    });

    return () => {
      subscription.remove();
    };
  }

  private handleIncomingLink(url: string, onShareReceived: (content: string, title?: string) => void) {
    try {
      console.log("Handling incoming link:", url);
      const { content, title } = this.parseShareUrl(url);
      
      if (content && content.trim()) {
        onShareReceived(content, title);
      }
    } catch (error) {
      console.error("Error handling incoming link:", error);
    }
  }

  // Create a shareable link (if needed for sharing from your app)
  createShareLink(content: string, title?: string): string {
    const encodedContent = encodeURIComponent(content);
    const encodedTitle = title ? encodeURIComponent(title) : '';
    
    if (Platform.OS === 'ios') {
      return `ingenium://share?text=${encodedContent}${title ? `&title=${encodedTitle}` : ''}`;
    } else {
      return `https://ingenium.example.com/share?text=${encodedContent}${title ? `&title=${encodedTitle}` : ''}`;
    }
  }
}

export default DeepLinkService.getInstance();