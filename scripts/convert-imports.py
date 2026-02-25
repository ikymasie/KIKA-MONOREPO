import os
import re

def convert_imports(root_dir):
    app_dir = os.path.join(root_dir, 'app')
    
    for subdir, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                file_path = os.path.join(subdir, file)
                process_file(file_path, root_dir)

def process_file(file_path, root_dir):
    # Calculate depth relative to root
    rel_path = os.path.relpath(file_path, root_dir)
    segments = rel_path.split(os.sep)
    # Number of ../ needed is length of segments - 1
    depth = len(segments) - 1
    prefix = "../" * depth if depth > 0 else "./"
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace "@/..." with "RELATIVE_PREFIX/..."
    # Pattern looks for "@/ followed by any character until next quote
    # We use a non-greedy match to avoid capturing too much
    new_content = re.sub(r'from [\'"]@/(.*?)[\'"]', f'from "{prefix}\\1"', content)
    new_content = re.sub(r'import\([\'"]@/(.*?)[\'"]\)', f'import("{prefix}\\1")', content)
    
    if content != new_content:
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Converted: {rel_path}")

if __name__ == "__main__":
    # Get current directory as root
    root = os.getcwd()
    convert_imports(root)
