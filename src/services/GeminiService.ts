// services/GeminiService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface QueryResult {
  success: boolean;
  response?: string;
  error?: string;
}

export interface ApiKeyTestResult {
  success: boolean;
  message?: string;
}

class GeminiService {
  private static API_KEY_STORAGE_KEY = "gemini_api_key";

  // ✅ Use gemini-2.5-flash ONLY
  private static MODEL_NAME = "gemini-2.5-flash";
  private static BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models";

  private static getApiUrl() {
    return `${this.BASE_URL}/${this.MODEL_NAME}:generateContent`;
  }

  /**
   * Save API key to AsyncStorage
   */
  static async saveApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    } catch (error) {
      console.error("Error saving API key:", error);
      throw new Error("Failed to save API key");
    }
  }

  /**
   * Get saved API key from AsyncStorage
   */
  static async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.API_KEY_STORAGE_KEY);
    } catch (error) {
      console.error("Error getting API key:", error);
      return null;
    }
  }

  /**
   * Remove API key from AsyncStorage
   */
  static async removeApiKey(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.API_KEY_STORAGE_KEY);
    } catch (error) {
      console.error("Error removing API key:", error);
      throw new Error("Failed to remove API key");
    }
  }

  /**
   * Check if API key exists
   */
  static async hasApiKey(): Promise<boolean> {
    try {
      const apiKey = await AsyncStorage.getItem(this.API_KEY_STORAGE_KEY);
      return !!apiKey && apiKey.trim().length > 0;
    } catch (error) {
      console.error("Error checking API key:", error);
      return false;
    }
  }

  /**
   * Test if API key is valid
   */
  static async testApiKey(apiKey: string): Promise<ApiKeyTestResult> {
    try {
      const response = await fetch(`${this.getApiUrl()}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Hello" }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error?.message || "Invalid API key",
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error testing API key:", error);
      return {
        success: false,
        message: error.message || "Network error",
      };
    }
  }

  /**
   * Query Gemini with notes as context
   */
  static async queryWithNotes(
    question: string,
    notes: Array<{ title: string; content: string }>,
    maxTokens: number = 1000
  ): Promise<QueryResult> {
    try {
      const apiKey = await this.getApiKey();

      if (!apiKey) {
        return {
          success: false,
          error: "API key not found. Please set up your API key first.",
        };
      }

      const context = notes
        .map(
          (note) =>
            `Note: ${note.title}\nContent: ${note.content.substring(0, 500)}${
              note.content.length > 500 ? "..." : ""
            }`
        )
        .join("\n\n");

      const prompt = `You are a helpful assistant that answers questions using only the provided notes.

Context Notes:
${context}

Question: ${question}

If the answer is not contained in the notes, respond with:
"I cannot find this information in the provided notes."`;

      const response = await fetch(`${this.getApiUrl()}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || "API request failed",
        };
      }

      const data = await response.json();
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!answer) {
        return {
          success: false,
          error: "No response received from AI",
        };
      }

      return {
        success: true,
        response: answer,
      };
    } catch (error: any) {
      console.error("Error querying Gemini API:", error);
      return {
        success: false,
        error: error.message || "Network error",
      };
    }
  }
}

export default GeminiService;
