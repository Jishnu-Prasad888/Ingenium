import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { colors } from "../../theme/colors";

interface MarkdownRendererProps {
  content: string;
  onContentChange: (content: string) => void;
  scrollEnabled?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onContentChange,
  scrollEnabled = true,
}) => {
  const handleCheckboxToggle = (lineIndex: number) => {
    const lines = content.split("\n");
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    if (!line) return;

    if (/^[\s]*-\s*\[ \]/.test(line)) {
      lines[lineIndex] = line.replace(/(^[\s]*-\s*)\[ \]/, "$1[x]");
    } else if (/^[\s]*-\s*\[[xX]\]/.test(line)) {
      lines[lineIndex] = line.replace(/(^[\s]*-\s*)\[[xX]\]/, "$1[ ]");
    } else {
      return;
    }

    onContentChange(lines.join("\n"));
  };

  const renderContent = () => {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeBlockContent = "";
    const renderedElements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = "";
          continue;
        } else {
          inCodeBlock = false;
          renderedElements.push(
            <View
              key={`code-${i}`}
              style={{
                backgroundColor: colors.backgroundCard,
                padding: 12,
                borderRadius: 8,
                marginVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  fontSize: 14,
                  color: colors.text,
                }}
              >
                {codeBlockContent}
              </Text>
            </View>,
          );
          continue;
        }
      }

      if (inCodeBlock) {
        codeBlockContent += line + "\n";
        continue;
      }

      const trimmedLine = line.trim();
      const isCheckbox = /^-\s*\[[ xX]\]/.test(trimmedLine);

      if (isCheckbox) {
        const checkboxMatch = trimmedLine.match(/^-\s*\[([ xX])\]/);
        const isChecked = checkboxMatch
          ? checkboxMatch[1].toLowerCase() === "x"
          : false;
        const textAfterCheckbox = trimmedLine.replace(/^-\s*\[[ xX]\]\s*/, "");

        renderedElements.push(
          <Pressable
            key={`checkbox-${i}-${isChecked}`}
            onPress={() => handleCheckboxToggle(i)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "flex-start",
              marginVertical: 4,
              paddingVertical: 2,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 18,
                marginRight: 12,
                marginTop: 2,
                color: isChecked ? colors.primary : colors.text,
              }}
            >
              {isChecked ? "☑" : "☐"}
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                flex: 1,
                color: isChecked ? colors.textSecondary : colors.text,
                textDecorationLine: isChecked ? "line-through" : "none",
              }}
            >
              {textAfterCheckbox}
            </Text>
          </Pressable>,
        );
        continue;
      }

      let markdownContent = "";
      let startLine = i;
      while (
        i < lines.length &&
        !lines[i].trim().startsWith("```") &&
        !/^-\s*\[[ xX]\]/.test(lines[i].trim())
      ) {
        markdownContent += lines[i] + "\n";
        i++;
      }
      i--;

      if (markdownContent.trim()) {
        renderedElements.push(
          <Markdown
            key={`md-${startLine}`}
            style={{
              body: { color: colors.text, fontSize: 16, lineHeight: 24 },
              heading1: {
                fontSize: 28,
                color: colors.primary,
                fontWeight: "800" as const,
                marginTop: 24,
                marginBottom: 12,
              },
              heading2: {
                fontSize: 24,
                fontWeight: "700" as const,
                marginTop: 20,
                marginBottom: 10,
              },
              heading3: {
                fontSize: 20,
                fontWeight: "600" as const,
                marginTop: 16,
                marginBottom: 8,
              },
              bullet_list: { marginVertical: 8, marginLeft: 20 },
              ordered_list: { marginVertical: 8, marginLeft: 20 },
              list_item: { marginVertical: 4 },
              code_inline: {
                backgroundColor: colors.backgroundCard,
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
              },
              blockquote: {
                backgroundColor: colors.backgroundCard,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
                paddingLeft: 12,
                paddingVertical: 8,
                marginVertical: 8,
              },
              hr: {
                backgroundColor: colors.border,
                height: 1,
                marginVertical: 16,
              },
            }}
          >
            {markdownContent}
          </Markdown>,
        );
      }
    }

    return renderedElements;
  };

  const Wrapper = scrollEnabled ? ScrollView : View;
  const wrapperProps = scrollEnabled
    ? {
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "always" as const,
        contentContainerStyle: { padding: 16, paddingBottom: 120 },
      }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      {renderContent()}
    </Wrapper>
  );
};

export default MarkdownRenderer;
