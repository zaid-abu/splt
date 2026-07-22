import os
import re

components_to_replace = {
    'Typography': 'Text',
    'Spinner': 'ActivityIndicator',
    'Switch': 'Switch',
    'TextField': 'TextInput',
    'Input': 'TextInput',
    'PressableFeedback': 'Pressable',
    'AvatarSize': 'any',
    'useThemeColor': 'useCoralColors',
    'useToast as useHeroToast': ''
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    if 'heroui-native' not in content:
        return

    # Find the import line
    import_pattern = r'import\s+\{([^}]+)\}\s+from\s+["\']heroui-native["\'];?'
    match = re.search(import_pattern, content)
    
    if not match:
        return
        
    imports = [i.strip() for i in match.group(1).split(',')]
    
    # Store original imports string to replace later
    original_imports_str = match.group(1)
    new_imports_str = original_imports_str
    
    for imp in imports:
        replacement = components_to_replace.get(imp, imp)
        
        # Add to react-native imports if needed
        if replacement in ['Text', 'ActivityIndicator', 'Switch', 'TextInput', 'Pressable']:
            rn_import_pattern = r'import\s+\{([^}]+)\}\s+from\s+["\']react-native["\'];?'
            rn_match = re.search(rn_import_pattern, content)
            if rn_match:
                rn_imports = [i.strip() for i in rn_match.group(1).split(',')]
                if replacement not in rn_imports:
                    new_rn_imports = rn_match.group(1) + f', {replacement}'
                    content = content.replace(rn_match.group(0), f'import {{ {new_rn_imports} }} from "react-native";')
            else:
                content = f'import {{ {replacement} }} from "react-native";\n' + content

        # Replace in JSX
        if imp != replacement and replacement != 'any' and replacement != 'useCoralColors' and replacement != '':
            content = re.sub(rf'<{imp}\b', f'<{replacement}', content)
            content = re.sub(rf'</{imp}>', f'</{replacement}>', content)
        
        # Replace Type usages (like type AvatarSize = ...)
        if imp == 'AvatarSize':
            content = re.sub(r'\bAvatarSize\b', 'string', content)

        # Replace in hooks
        if imp == 'useThemeColor':
            content = content.replace('useThemeColor()', 'useCoralColors()')
            content = f'import {{ useCoralColors }} from "@/components/coral";\n' + content

        # Remove from heroui-native import string
        new_imports_str = re.sub(rf'\b{imp}\b,?\s*', '', new_imports_str)
        
    # Replace the imports string
    if new_imports_str.strip():
        content = content.replace(f'{{{original_imports_str}}}', f'{{{new_imports_str}}}')
    else:
        # Clean up empty heroui-native imports
        content = re.sub(r'import\s*\{\s*([^}]*)\s*\}\s*from\s+["\']heroui-native["\'];?\n?', '', content)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
