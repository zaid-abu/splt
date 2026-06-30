import os
import re

files_to_process = [
    "src/app/(tabs)/index.tsx",
    "src/app/(tabs)/activity.tsx",
    "src/app/(tabs)/friends.tsx",
    "src/app/(tabs)/groups.tsx",
    "src/app/friend/[id].tsx",
    "src/app/profile.tsx"
]

for file_path in files_to_process:
    with open(file_path, 'r') as f:
        content = f.read()

    # Remove PageAnimator import
    content = re.sub(r'import\s+{\s*PageAnimator\s*}\s+from\s+["\']@/components/PageAnimator["\'];\n?', '', content)

    # Ensure react-native-reanimated is imported if not present
    if "react-native-reanimated" not in content:
        # insert after expo-router or similar
        content = re.sub(
            r'(import .* from "expo-router";\n)',
            r'\1import Animated, { FadeInDown } from "react-native-reanimated";\n',
            content
        )

    # Replace <PageAnimator>
    content = content.replace('<PageAnimator>', '<Animated.View style={{ flex: 1 }} entering={FadeInDown.duration(300).springify()}>')
    content = content.replace('</PageAnimator>', '</Animated.View>')

    with open(file_path, 'w') as f:
        f.write(content)

print("Done")
