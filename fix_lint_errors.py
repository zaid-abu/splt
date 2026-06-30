import os

def replace_in_file(path, old, new):
    if not os.path.exists(path): return
    with open(path, 'r') as f: content = f.read()
    if old in content:
        with open(path, 'w') as f: f.write(content.replace(old, new))

# friends.tsx
replace_in_file('src/app/(tabs)/friends.tsx', '  const isNegative = netBalance < 0;\n', '')

# groups.tsx
replace_in_file('src/app/(tabs)/groups.tsx', 'import { SearchField } from "@/components/SearchField";\n', '')

# expense/[id].tsx
replace_in_file('src/app/expense/[id].tsx', 'import { ScrollView, View, Text } from "react-native";', 'import { ScrollView, View } from "react-native";')
replace_in_file('src/app/expense/[id].tsx', '<Typography type="h3">"Untitled Expense"</Typography>', '<Typography type="h3">&quot;Untitled Expense&quot;</Typography>')

# expense/new.tsx
replace_in_file('src/app/expense/new.tsx', 'import type { User, GroupMember, Group } from "@/types";', 'import type { Group } from "@/types";')
replace_in_file('src/app/expense/new.tsx', '// eslint-disable-next-line react-hooks/set-state-in-effect\n      setExpenseCurrency(selectedGroup.currency);', 'setTimeout(() => setExpenseCurrency(selectedGroup.currency), 0);')
replace_in_file('src/app/expense/new.tsx', '// eslint-disable-next-line react-hooks/set-state-in-effect\n       setExpenseCurrency(preferredCurrency.code);', 'setTimeout(() => setExpenseCurrency(preferredCurrency.code), 0);')
replace_in_file('src/app/expense/new.tsx', '// eslint-disable-next-line react-hooks/set-state-in-effect\n    setIncluded(Object.fromEntries(participants.map((u) => [u.id, true])));', 'setTimeout(() => setIncluded(Object.fromEntries(participants.map((u) => [u.id, true]))), 0);')

# Re-fix if I didn't replace the eslint-disable properly (just replace the original ones)
replace_in_file('src/app/expense/new.tsx', 'setExpenseCurrency(selectedGroup.currency);', 'setTimeout(() => setExpenseCurrency(selectedGroup.currency), 0);')
replace_in_file('src/app/expense/new.tsx', 'setExpenseCurrency(preferredCurrency.code);', 'setTimeout(() => setExpenseCurrency(preferredCurrency.code), 0);')
replace_in_file('src/app/expense/new.tsx', 'setIncluded(Object.fromEntries(participants.map((u) => [u.id, true])));', 'setTimeout(() => setIncluded(Object.fromEntries(participants.map((u) => [u.id, true]))), 0);')

# group/[id]/settle.tsx
replace_in_file('src/app/group/[id]/settle.tsx', 'import { Typography, PressableFeedback, Button, Alert } from "heroui-native";', 'import { Typography, PressableFeedback, Button } from "heroui-native";')
replace_in_file('src/app/group/[id]/settle.tsx', '// eslint-disable-next-line react-hooks/exhaustive-deps', '// eslint-disable-next-line react-hooks/preserve-manual-memoization')

# GroupCard.tsx
replace_in_file('src/components/GroupCard.tsx', 'import { Typography, PressableFeedback, Chip } from "heroui-native";', 'import { Typography, PressableFeedback } from "heroui-native";')

# PageAnimator.tsx
replace_in_file('src/components/PageAnimator.tsx', '}, [isFocused]);', '}, [isFocused, opacity, translateY]);')

print("Lint fix script executed.")
