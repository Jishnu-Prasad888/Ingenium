import os
from pathlib import Path

def print_directory_tree(
        root_dir='.',
        max_depth=None,
        show_hidden=False,
        ignore_list=None
):
    """
    Print directory tree with optional ignore list

    Parameters:
    -----------
    root_dir: str or Path
        Root directory to start from
    max_depth: int or None
        Maximum depth to traverse
    show_hidden: bool
        Whether to show hidden files/folders
    ignore_list: list or set
        List of folder names to ignore
    """
    if ignore_list is None:
        ignore_list = []

    # Convert to set for faster lookups
    ignore_set = set(ignore_list)

    root_path = Path(root_dir).resolve()
    root_name = root_path.name

    print(f"📁 {root_name}/")
    print(f"🚫 Ignoring: {', '.join(ignore_list) if ignore_list else 'None'}")
    print("-" * 60)

    _walk_tree(root_path, level=0, max_depth=max_depth,
               show_hidden=show_hidden, ignore_set=ignore_set)

def _walk_tree(current_path, level, max_depth, show_hidden, ignore_set, prefix=""):
    """Recursive helper function to walk through directory tree"""

    try:
        # Get all items
        items = list(current_path.iterdir())
    except PermissionError:
        print(f"{prefix}[Permission Denied: {current_path.name}]")
        return

    # Filter items based on settings
    filtered_items = []
    for item in items:
        # Skip hidden if not showing hidden
        if not show_hidden and item.name.startswith('.'):
            continue

        # Skip ignored folders
        if item.is_dir() and item.name in ignore_set:
            continue

        filtered_items.append(item)

    # Separate directories and files
    dirs = sorted([item for item in filtered_items if item.is_dir()])
    files = sorted([item for item in filtered_items if item.is_file()])

    # Print directories
    for i, d in enumerate(dirs):
        is_last_dir = (i == len(dirs) - 1) and (len(files) == 0)

        # Build the tree connectors
        if level == 0:
            connector = '└── ' if is_last_dir and len(files) == 0 else '├── '
        else:
            connector = '└── ' if is_last_dir and len(files) == 0 else '├── '

        # Show ignored marker if this folder would have been ignored
        is_ignored = d.name in ignore_set
        ignored_marker = " [IGNORED]" if is_ignored else ""

        print(f"{prefix}{connector}{d.name}/{ignored_marker}")

        # Recursively process subdirectories if not at max depth
        if (max_depth is None or level < max_depth - 1) and not is_ignored:
            extension = '    ' if is_last_dir and len(files) == 0 else '│   '
            _walk_tree(d, level + 1, max_depth, show_hidden, ignore_set,
                       prefix + extension)

    # Print files
    for i, f in enumerate(files):
        is_last_item = i == len(files) - 1
        connector = '└── ' if is_last_item else '├── '

        # Show file size
        try:
            size = f.stat().st_size
            size_str = format_file_size(size)
        except:
            size_str = "?"

        print(f"{prefix}{connector}{f.name} ({size_str})")

def format_file_size(size_in_bytes):
    """Format file size in human-readable format"""
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes/1024:.1f} KB"
    elif size_in_bytes < 1024 * 1024 * 1024:
        return f"{size_in_bytes/(1024*1024):.1f} MB"
    else:
        return f"{size_in_bytes/(1024*1024*1024):.1f} GB"

def main():
    """Main function with example ignore list"""

    # ===== CONFIGURE YOUR IGNORE LIST HERE =====
    IGNORE_LIST = [
        '__pycache__',
        '.git',
        '.venv',
        'venv',
        'env',
        'node_modules',
        'dist',
        'build',
        '.idea',
        '.vscode',
        '.DS_Store',
        '*.pyc',
        '.expo',
        '.vscode',
        'app',
        'assets',
    ]

    # ===== CONFIGURE OTHER SETTINGS =====
    MAX_DEPTH = None  # Set to a number to limit depth, e.g., 3
    SHOW_HIDDEN = False  # Set to True to show hidden files/folders
    TARGET_DIR = '.'  # Directory to scan, '.' for current directory

    print("📂 Directory Structure Scanner")
    print("=" * 60)

    print_directory_tree(
        root_dir=TARGET_DIR,
        max_depth=MAX_DEPTH,
        show_hidden=SHOW_HIDDEN,
        ignore_list=IGNORE_LIST
    )

    print("\n" + "=" * 60)
    print(f"Total ignored folders: {len(IGNORE_LIST)}")

if __name__ == "__main__":
    main()