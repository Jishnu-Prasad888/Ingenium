// services/GeminiService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "gemini_api_key";
const ENCRYPTION_KEY = "notes_app_encryption_key";

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  // Simple XOR encryption (for demonstration only - consider stronger encryption for production)
  private encrypt(text: string): string {
    const key = ENCRYPTION_KEY;
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
  }

  private decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText);
      const key = ENCRYPTION_KEY;
      let result = "";
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (error) {
      console.error("Decryption failed:", error);
      return "";
    }
  }

  async saveApiKey(apiKey: string): Promise<void> {
    try {
      const encryptedKey = this.encrypt(apiKey);
      await AsyncStorage.setItem(GEMINI_API_KEY, encryptedKey);
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
    } catch (error) {
      console.error("Error saving API key:", error);
      throw error;
    }
  }

  async loadApiKey(): Promise<string | null> {
    try {
      const encryptedKey = await AsyncStorage.getItem(GEMINI_API_KEY);
      if (encryptedKey) {
        const decryptedKey = this.decrypt(encryptedKey);
        this.apiKey = decryptedKey;
        this.genAI = new GoogleGenerativeAI(decryptedKey);
        return decryptedKey;
      }
      return null;
    } catch (error) {
      console.error("Error loading API key:", error);
      return null;
    }
  }

  async removeApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GEMINI_API_KEY);
      this.apiKey = null;
      this.genAI = null;
    } catch (error) {
      console.error("Error removing API key:", error);
      throw error;
    }
  }

  async hasApiKey(): Promise<boolean> {
    const key = await this.loadApiKey();
    return !!key;
  }

  async testApiKey(
    apiKey: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const testGenAI = new GoogleGenerativeAI(apiKey);
      const model = testGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Simple test prompt
      const prompt = "Quote about creativity in one line";

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
      };
    } catch (error: any) {
      console.error("API Key test failed:", error);
      return {
        success: false,
        message: error.message || "Failed to connect to Gemini API",
      };
    }
  }

  async queryWithNotes(
    question: string,
    notes: Array<{ title: string; content: string }>,
    modelName: string = "gemini-2.5-flash"
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      if (!this.genAI) {
        const loadedKey = await this.loadApiKey();
        if (!loadedKey) {
          return {
            success: false,
            error: "No API key found. Please set up your Gemini API key first.",
          };
        }
      }

      const model = this.genAI!.getGenerativeModel({ model: modelName });

      // Construct context from notes
      let context =
        "Here are some notes that provide context for your answer:\n\n";
      notes.forEach((note, index) => {
        context += `Note ${index + 1}: "${note.title}"\n`;
        context += `Content: ${note.content.substring(0, 500)}${
          note.content.length > 500 ? "..." : ""
        }\n\n`;
      });

      const prompt = `${context}

Based ONLY on the notes provided above, please answer the following question:

Question: ${question}

Instructions:
1. Answer strictly based on the information in the provided notes
2. If the notes don't contain enough information to answer, say "I cannot answer this question based on the notes provided"
3. Format your answer using Markdown for better readability
4. Be concise and accurate
5. Do not make up information not present in the notes
6. If referring to specific notes, mention which note(s) you're referencing`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text,
      };
    } catch (error: any) {
      console.error("Error querying Gemini:", error);
      return {
        success: false,
        error: error.message || "Failed to get response from Gemini",
      };
    }
  }
}

export default new GeminiService();
