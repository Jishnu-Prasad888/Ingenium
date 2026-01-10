import "react-native";

declare module "react-native" {
  interface TextInputProps {
    caretColor?: string;
  }
  interface ClipboardStatic {
    setString(text: string): Promise<void>;
    getString(): Promise<string>;
  }

  export const Clipboard: ClipboardStatic;
}
