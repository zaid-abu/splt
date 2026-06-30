const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const {old, new: newStr} of replacements) {
        content = content.replace(old, newStr);
    }
    fs.writeFileSync(filePath, content);
}

replaceInFile('src/app/(tabs)/friends.tsx', [
    { old: 'const isNegative = netBalance < 0;', new: '' }
]);

replaceInFile('src/app/(tabs)/groups.tsx', [
    { old: 'import { SearchField } from "@/components/SearchField";', new: '' }
]);

replaceInFile('src/app/(tabs)/index.tsx', [
    { old: "You're all settled up!", new: "You&apos;re all settled up!" }
]);

replaceInFile('src/app/expense/[id].tsx', [
    { old: 'import { ScrollView, View, Text } from "react-native";', new: 'import { ScrollView, View } from "react-native";' },
    { old: 'Typography type="h3">"Untitled Expense"</Typography>', new: 'Typography type="h3">&quot;Untitled Expense&quot;</Typography>' }
]);

replaceInFile('src/app/expense/new.tsx', [
    { old: 'import type { User, GroupMember, Group } from "@/types";', new: 'import type { Group } from "@/types";' }
]);

replaceInFile('src/app/group/[id]/settle.tsx', [
    { old: "import { Alert, Button, Typography, PressableFeedback } from \"heroui-native\";", new: "import { Button, Typography, PressableFeedback } from \"heroui-native\";" },
    { old: "You don't have any outstanding", new: "You don&apos;t have any outstanding" }
]);

replaceInFile('src/app/group/new.tsx', [
    { old: "You don't have any friends yet.", new: "You don&apos;t have any friends yet." }
]);

replaceInFile('src/components/GroupCard.tsx', [
    { old: 'import { Typography, PressableFeedback, Chip } from "heroui-native";', new: 'import { Typography, PressableFeedback } from "heroui-native";' }
]);

replaceInFile('src/components/PageAnimator.tsx', [
    { old: '}, [isFocused]);', new: '}, [isFocused, opacity, translateY]);' }
]);

console.log('Fixed lint errors');
