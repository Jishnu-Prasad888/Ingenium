### Markdown testing

````
# Main Heading (H1)

This is a paragraph with **bold text** and *italic text*. You can also use __underlined text__ if you want.

## Secondary Heading (H2)

Here's a list of items:
- First item
- Second item with **bold**
- Third item with *italic*

### Tertiary Heading (H3)

Ordered list example:
1. First ordered item
2. Second ordered item
3. Third ordered item

## Text Formatting Examples

This text has **bold words** in the middle.
This text has *italicized words* throughout.
This text uses __underline formatting__.
You can also combine **bold and *italic*** together.

## Task Lists

Here are some tasks to complete:
- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked task
- [x] Another checked task

## Code Examples

Inline code: `const x = 5;`

Code block:
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

## Blockquotes

> This is a blockquote. It can span multiple lines if needed. Blockquotes are useful for highlighting important information or quotes from other sources.
>
> This is the second paragraph within the same blockquote.

## Horizontal Rules

Text above the line.

---

Text below the line.

## Links and Images

Here's a link to [Google](https://www.google.com).

## Mixed Formatting Examples

### Testing Spacing

Paragraph 1.

Paragraph 2 with **bold text** and _italic text_.

### Another Heading

This paragraph follows a heading.

- List item 1
- List item 2
  - Nested item
  - Another nested

1. Ordered 1
2. Ordered 2

### Checkbox Testing

- [ ] Task 1: Learn Markdown
- [x] Task 2: Test editor
- [ ] Task 3: Fix spacing issues
- [x] Task 4: Add features

## Long Paragraph Test

This is a longer paragraph that should wrap across multiple lines. It's designed to test how the text flows and whether the line height and spacing remain consistent even with lengthy content. The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Bright vixens jump; dozy fowl quack.

## Edge Cases

Empty line above:

Empty line below.

### Heading with **bold** and _italic_

Paragraph immediately after heading with formatting.

## Special Characters

Here are some special characters: \* asterisk, \*\* double asterisk, \_ underscore, \_\_ double underscore, ` backtick, > greater than.

## Final Section

This is the final paragraph to test overall spacing and layout.

# Another H1 to Test Top Spacing

This should have proper spacing from the previous section.

````

# Folder Structure

src/
├── components/
│ ├── Header.tsx
│ ├── SearchBar.tsx
│ ├── NoteCard.tsx
│ ├── FolderCard.tsx
│ └── ...
├── screens/
│ ├── NotesListScreen.tsx
│ ├── FolderExplorerScreen.tsx
│ └── NoteEditorScreen.tsx
├── context/
│ └── AppContext.tsx
├── services/
│ ├── StorageService.ts
│ └── SyncService.ts
├── theme/
│ └── colors.ts
└── utils/
└── helpers.ts
