import os

# Define the project structure
structure = {
    "src": {
        "components": [
            "Header.tsx",
            "SearchBar.tsx",
            "NoteCard.tsx",
            "FolderCard.tsx"
        ],
        "screens": [
            "NotesListScreen.tsx",
            "FolderExplorerScreen.tsx",
            "NoteEditorScreen.tsx"
        ],
        "context": [
            "AppContext.tsx"
        ],
        "services": [
            "StorageService.ts",
            "SyncService.ts"
        ],
        "theme": [
            "colors.ts"
        ],
        "utils": [
            "helpers.ts"
        ]
    }
}

def create_structure(base_path, structure):
    """
    Create folders and files based on the provided structure.

    Args:
        base_path: Root directory path
        structure: Dictionary defining folders and files
    """
    for folder, contents in structure.items():
        folder_path = os.path.join(base_path, folder)

        # Create folder if it doesn't exist
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            print(f"✓ Created folder: {folder_path}")
        else:
            print(f"- Folder already exists: {folder_path}")

        # Handle nested structure
        if isinstance(contents, dict):
            create_structure(folder_path, contents)
        elif isinstance(contents, list):
            # Create files in the folder
            for file in contents:
                file_path = os.path.join(folder_path, file)
                if not os.path.exists(file_path):
                    with open(file_path, 'w') as f:
                        f.write("")  # Create empty file
                    print(f"✓ Created file: {file_path}")
                else:
                    print(f"- File already exists: {file_path}")

if __name__ == "__main__":
    # Get current directory
    root_dir = os.getcwd()

    print(f"Creating project structure in: {root_dir}\n")
    print("=" * 50)

    # Create the structure
    create_structure(root_dir, structure)

    print("=" * 50)
    print("\n✓ Project structure creation complete!")