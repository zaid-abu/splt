# Architecture Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the full Splt codebase to separate business logic (hooks) from presentation (UI components), with screens becoming thin composition layers. Max 250 lines per file.

**Architecture:** Extract all data fetching, computed values, and mutation callbacks from screen files into `hooks/` directories. Split large components into focused presentational components. Decommission `native-ui.tsx` (579 lines) into ~25 single-component files under `components/ui/`.

**Tech Stack:** React Native 0.85, Expo 56, TypeScript, React Query v5, Zustand v5, React Hook Form v7 + Zod v4

## Global Constraints

- Never use `UI.color.*`, `UI.radius.*`, `UI.space.*`, `UI.shadow.*` — use `useUI()` hook
- All shared UI components import from `@/components/ui` barrel (not direct paths)
- Screen files must be under 100 lines, ideally under 80
- Component files under 250 lines, ideally under 150
- No `useQuery`/`useMutation`/`useMemo`/`useCallback` in files under `screens/`
- No data fetching in files under `components/`
- `import { useUI } from "@/components/ui"` not `@/components/ui/native-ui`
- Zero TypeScript errors at each commit

---

### Phase 1: Theme Foundation

### Task 1.1: Create theme tokens file

**Files:**

- Create: `src/components/ui/theme/tokens.ts`

- [ ] Extract `LIGHT_COLORS`, `DARK_COLORS`, `RADIUS`, `SPACE`, `SHADOW` from `src/components/ui/native-ui.tsx` into `src/components/ui/theme/tokens.ts`. These are the exact same values currently defined — no changes:

```typescript
export const LIGHT_COLORS = {
  bg: "#EEF6FF",
  surface: "rgba(255, 255, 255, 0.74)",
  control: "rgba(255, 255, 255, 0.74)",
  text: "#102033",
  textStrong: "#102033",
  textInverse: "#FFFFFF",
  muted: "#60708A",
  border: "rgba(255, 255, 255, 0.64)",
  brand: "#4F8CFF",
  ink: "#102033",
  danger: "#EF4444",
  success: "#22C55E",
  subtle: "rgba(238, 246, 255, 0.72)",
  dangerTint: "rgba(239, 68, 68, 0.08)",
  successTint: "rgba(34, 197, 94, 0.08)",
};

export const DARK_COLORS = {
  bg: "#0A1628",
  surface: "rgba(20, 35, 55, 0.74)",
  control: "rgba(20, 35, 55, 0.74)",
  text: "#E8ECF4",
  textStrong: "#E8ECF4",
  textInverse: "#0A1628",
  muted: "#7A8AA8",
  border: "rgba(255, 255, 255, 0.12)",
  brand: "#5B94FF",
  ink: "#E8ECF4",
  danger: "#F87171",
  success: "#4ADE80",
  subtle: "rgba(10, 22, 40, 0.72)",
  dangerTint: "rgba(248, 113, 113, 0.08)",
  successTint: "rgba(74, 222, 128, 0.08)",
};

export const RADIUS = { sm: 16, md: 24, lg: 36, xl: 36, pill: 999 };
export const SPACE = { page: 24 };
export const SHADOW = {
  sm: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: "rgba(79, 140, 255, 0.18)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;
```

- [ ] Run: `npx tsc --noEmit` — expect EXIT 0

### Task 1.2: Create typography themes

**Files:**

- Create: `src/components/ui/theme/typography.ts`

```typescript
export const TYPO = {
  hero: (size = 32) =>
    ({ fontFamily: "Sora_600SemiBold", fontSize: size, letterSpacing: -0.02 }) as const,
  title: (size = 24) =>
    ({ fontFamily: "Sora_600SemiBold", fontSize: size, letterSpacing: -0.01 }) as const,
  body: (size = 17) => ({ fontFamily: "IBMPlexSans_400Regular", fontSize: size }) as const,
  medium: (size = 16) => ({ fontFamily: "IBMPlexSans_500Medium", fontSize: size }) as const,
  semi: (size = 16) => ({ fontFamily: "IBMPlexSans_600SemiBold", fontSize: size }) as const,
  label: () =>
    ({
      fontFamily: "IBMPlexSans_600SemiBold",
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    }) as const,
};
```

- [ ] Run: `npx tsc --noEmit` — expect EXIT 0

### Task 1.3: Create useUI hook

**Files:**

- Create: `src/components/ui/hooks/useUI.ts`

```typescript
import { useMemo } from "react";
import { useUIStore } from "@/store/useUIStore";
import { LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW } from "@/components/ui/theme/tokens";

export function useUI() {
  const isDark = useUIStore((s) => s.isDarkMode);
  return useMemo(
    () => ({
      color: isDark ? DARK_COLORS : LIGHT_COLORS,
      radius: RADIUS,
      space: SPACE,
      shadow: SHADOW,
    }),
    [isDark]
  );
}
```

- [ ] Run: `npx tsc --noEmit` — expect EXIT 0

### Task 1.4: Create barrel index

**Files:**

- Create: `src/components/ui/index.ts`

```typescript
export { useUI } from "./hooks/useUI";
export { LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW } from "./theme/tokens";
export { TYPO } from "./theme/typography";
```

- [ ] Run: `npx tsc --noEmit` — expect EXIT 0

### Task 1.5: Update native-ui.tsx to re-export from new theme

**Files:**

- Modify: `src/components/ui/native-ui.tsx`

- [ ] Replace the `useUI`, `LIGHT_COLORS`, `DARK_COLORS` definitions with re-exports from the new files. Replace:

```typescript
// Remove LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW definitions
// Remove useUI function definition
// Replace with:
export { useUI } from "@/components/ui/hooks/useUI";
export { LIGHT_COLORS, DARK_COLORS } from "@/components/ui/theme/tokens";
export { TYPO } from "@/components/ui/theme/typography";
```

Also update all component functions in native-ui.tsx to import `useUI` from `@/components/ui` instead of calling it locally (they currently call `useUI()` directly, keep that — they just need the import path updated).

- [ ] In each component function, change `const { color, radius, space, shadow } = useUI();` to use the hook as-is (self-reference is fine since it's re-exported from the same file path pattern). Actually, since `useUI` is now re-exported and the components are in the same file, just ensure they call `useUI()` directly. No import needed for same-file functions.

- [ ] Run: `npx tsc --noEmit` — expect EXIT 0

### Task 1.6: Commit Phase 1

```bash
git add src/components/ui/theme/tokens.ts src/components/ui/theme/typography.ts src/components/ui/hooks/useUI.ts src/components/ui/index.ts
git commit -m "refactor: extract theme tokens and useUI hook from native-ui"
```

---

### Phase 2: Split native-ui.tsx into Individual Components

For each component below, create a new file, move the component definition from native-ui.tsx, update imports, and delete from native-ui.tsx.

### Task 2.1: PressableScale

**Files:**

- Create: `src/components/ui/PressableScale.tsx`
- Modify: `src/components/ui/native-ui.tsx` — remove PressableScale definition

```typescript
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, View, Animated } from "react-native";
import type { ViewStyle } from "react-native";

interface PressableScaleProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: ViewStyle;
}

export function PressableScale({ children, onPress, disabled, scaleTo = 0.97, style }: PressableScaleProps): React.JSX.Element {
  const scale = useMemo(() => new Animated.Value(1), []);
  const pressIn = () => { Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, mass: 0.3, stiffness: 200, damping: 12 }).start(); };
  const pressOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true, mass: 0.3, stiffness: 200, damping: 12 }).start(); };
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable accessibilityRole="button" onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} disabled={disabled}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] Run: `npx tsc --noEmit` — update any imports that referenced PressableScale from native-ui. All files importing `PressableScale` from `@/components/ui/native-ui` must change to `@/components/ui`.

### Task 2.2: IconButton

**Files:**

- Create: `src/components/ui/IconButton.tsx`

```typescript
import type { ComponentType } from "react";
import { Pressable } from "react-native";
import type { ViewStyle } from "react-native";
import { useUI } from "@/components/ui";

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface IconButtonProps {
  icon: IconType;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "default" | "danger";
  style?: ViewStyle;
}

export function IconButton({ icon: Icon, onPress, accessibilityLabel, tone = "default", style }: IconButtonProps): React.JSX.Element {
  const { color, radius } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44, height: 44, borderRadius: radius.pill,
        backgroundColor: color.control, borderWidth: 1, borderColor: color.border,
        alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1, ...style,
      })}
    >
      <Icon size={20} color={tone === "danger" ? color.danger : color.text} strokeWidth={1.75} />
    </Pressable>
  );
}
```

- [ ] Run: `npx tsc --noEmit`
- [ ] Remove IconButton from native-ui.tsx

### Task 2.3: PrimaryButton, SectionLabel, SearchField, ScreenHeader, MetricCell, FilterPill, ListSection, EmptyState

**Files:** Create each under `src/components/ui/`, delete from native-ui.tsx

- [ ] `PrimaryButton.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/radius
- [ ] `SectionLabel.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for muted color
- [ ] `SearchField.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/radius
- [ ] `ScreenHeader.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/space
- [ ] `MetricCell.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/radius
- [ ] `FilterPill.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/radius
- [ ] `ListSection.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/space
- [ ] `EmptyState.tsx` — imports `{ useUI } from "@/components/ui"`, uses `useUI()` for colors/radius

For each: copy the exact component from native-ui.tsx, change `useUI()` import path, verify no errors.

- [ ] Run after each: `npx tsc --noEmit`
- [ ] Remove each from native-ui.tsx after creation

### Task 2.4: Barrel index — add all new component exports

**Files:**

- Modify: `src/components/ui/index.ts`

- [ ] Add exports:

```typescript
export { PressableScale } from "./PressableScale";
export { IconButton } from "./IconButton";
export { PrimaryButton } from "./PrimaryButton";
export { SectionLabel } from "./SectionLabel";
export { SearchField } from "./SearchField";
export { ScreenHeader } from "./ScreenHeader";
export { MetricCell } from "./MetricCell";
export { FilterPill } from "./FilterPill";
export { ListSection } from "./ListSection";
export { EmptyState } from "./EmptyState";
```

- [ ] Run: `npx tsc --noEmit`

### Task 2.5: Update ALL imports across codebase

**Files:** Every file currently importing from `@/components/ui/native-ui`

- [ ] Replace all `import { ... } from "@/components/ui/native-ui"` with `import { ... } from "@/components/ui"`

This is a bulk find-and-replace. Use sed:

```bash
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|@/components/ui/native-ui|@/components/ui|g'
```

- [ ] Run: `npx tsc --noEmit`
- [ ] Fix any remaining import errors

### Task 2.6: Move remaining UI components (Card, Skeleton, ErrorState, Toast, etc.)

**Files:** These currently live in `src/components/ui/` as individual files but import from `@/components/ui/native-ui`. They now import from `@/components/ui` (barrel) instead.

- [ ] Update imports in: `Card.tsx`, `Skeleton.tsx`, `ErrorState.tsx`, `Toast.tsx`, `SheetBackground.tsx`, `SheetContainer.tsx`, `AppLoader.tsx`, `BottomActionBar.tsx`, `CategoryIconBadge.tsx`, `GroupIconBadge.tsx`, `HapticButton.tsx`, `ListRow.tsx`, `MemberAvatar.tsx`, `MoneySignal.tsx`
- [ ] Each changes `import { UI, ... }` or `import { useUI, ... }` from `@/components/ui/native-ui` to `import { useUI, ... } from "@/components/ui"`

- [ ] Run: `npx tsc --noEmit`

### Task 2.7: Delete native-ui.tsx

**Files:**

- Delete: `src/components/ui/native-ui.tsx`

- [ ] Verify nothing imports from this file anymore: `grep -r "native-ui" src --include="*.tsx" --include="*.ts" | grep -v node_modules`
- [ ] Should return zero results
- [ ] Run: `npx tsc --noEmit` — expect EXIT 0

### Task 2.8: Commit Phase 2

```bash
git add -A
git commit -m "refactor: split native-ui.tsx into individual component files"
```

---

### Phase 3: Dashboard Feature

### Task 3.1: Create useDashboard hook

**Files:**

- Create: `src/features/dashboard/hooks/useDashboard.ts`
- Modify: `src/features/dashboard/screens/DashboardScreen.tsx` — will use this hook in Task 3.2

- [ ] Extract from DashboardScreen.tsx all data fetching, computed values, and action callbacks into `useDashboard.ts`:

The hook should:

- Import and call: `useGroups`, `useFriends`, `useUserExpenses`, `useUserSettlements`, `useNotifications`, `useAnalytics` from their respective query files
- Import `useAuth` for currentUser
- Import `useUIStore` for currency/preferredCurrency
- Import `balancesUtil.getUserBalances` for perUserBalances
- Compute in useMemo: `owedToYou`, `youOwe`, `oweUsers`, `owedUsers`, `recentExpenses`, `activeGroups`, `openGroupCount`
- Provide callbacks: `handleAddExpense`, `handleSettleUp`, `handleViewAllGroups`, `handleFriendAction`
- Handle state: `balanceTone`, `activeExpenseFilter`, `refreshing`, `onRefresh`
- Handle settle sheet: `settleSheetRef`, `openSettleSheet`, `closeSettleSheet`
- Return typed interface:

```typescript
export interface DashboardData {
  currentUser: User | null;
  preferredCurrency: Currency;

  // Balance
  balanceTone: "danger" | "success" | "surface";
  perUserBalances: Record<string, number>;
  owedToYou: number;
  youOwe: number;

  // Lists
  oweUsers: Array<{ user: User; amount: number }>;
  owedUsers: Array<{ user: User; amount: number }>;
  recentExpenses: Expense[];
  activeGroups: Group[];

  // State
  openGroupCount: number;
  activeExpenseFilter: ExpenseFilterType;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;

  // Actions
  setActiveExpenseFilter: (f: ExpenseFilterType) => void;
  onRefresh: () => void;
  handleAddExpense: () => void;
  handleSettleUp: () => void;
  handleViewAllGroups: () => void;
  handleFriendAction: (user: User, type: "remind" | "settle") => void;

  // Settle sheet
  settleSheetRef: React.RefObject<BottomSheetModal>;
  openSettleSheet: () => void;
  closeSettleSheet: () => void;

  // Loading
  groupsLoading: boolean;
  friendsLoading: boolean;
  expensesLoading: boolean;
}
```

Extract the exact logic from DashboardScreen.tsx lines 75-408 into this file.

- [ ] Run: `npx tsc --noEmit`

### Task 3.2: Rewrite DashboardScreen as thin composition

**Files:**

- Modify: `src/features/dashboard/screens/DashboardScreen.tsx`

- [ ] Replace the entire screen content with a thin composition layer (target ~80 lines):

```typescript
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import DashboardBalance from "@/features/dashboard/components/DashboardBalance";
import DashboardActions from "@/features/dashboard/components/DashboardActions";
import DashboardAttention from "@/features/dashboard/components/DashboardAttention";
import DashboardGroupsPreview from "@/features/dashboard/components/DashboardGroupsPreview";
import DashboardRecentActivity from "@/features/dashboard/components/DashboardRecentActivity";
import DashboardSettleSheet from "@/features/dashboard/components/DashboardSettleSheet";
import DashboardSkeleton from "@/features/dashboard/components/DashboardSkeleton";
import { useUI } from "@/components/ui";
// ... imports for ScrollView, RefreshControl, Animated, etc.

export default function DashboardScreen(): JSX.Element {
  const dashboard = useDashboard();
  const { color } = useUI();

  if (dashboard.isLoading) return <DashboardSkeleton />;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <GlassBackground />
      <ThemedStatusBar />
      <ScrollView refreshControl={<RefreshControl refreshing={dashboard.refreshing} onRefresh={dashboard.onRefresh} />}>
        <DashboardBalance
          balanceTone={dashboard.balanceTone}
          perUserBalances={dashboard.perUserBalances}
          owedToYou={dashboard.owedToYou}
          youOwe={dashboard.youOwe}
          currencyCode={dashboard.preferredCurrency.code}
          oweUsers={dashboard.oweUsers}
          owedUsers={dashboard.owedUsers}
          onOwePress={dashboard.handleFriendAction}
          onOwedPress={dashboard.handleFriendAction}
        />
        <DashboardActions onAddExpense={dashboard.handleAddExpense} onSettleUp={dashboard.openSettleSheet} />
        <DashboardAttention oweUsers={dashboard.oweUsers} owedUsers={dashboard.owedUsers} onAction={dashboard.handleFriendAction} />
        <DashboardGroupsPreview groups={dashboard.activeGroups} openCount={dashboard.openGroupCount} onViewAll={dashboard.handleViewAllGroups} />
        <DashboardRecentActivity expenses={dashboard.recentExpenses} filter={dashboard.activeExpenseFilter} onFilterChange={dashboard.setActiveExpenseFilter} />
      </ScrollView>
      <DashboardSettleSheet ref={dashboard.settleSheetRef} owedUsers={dashboard.owedUsers} oweUsers={dashboard.oweUsers} />
    </View>
  );
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 3.3: Create DashboardBalance component

**Files:**

- Create: `src/features/dashboard/components/DashboardBalance.tsx`
- Extract from: `src/features/dashboard/screens/DashboardScreen.tsx` (the inline hero balance card, lines ~563-800ish)

- [ ] Extract the animated hero balance card (the inline one, NOT the BalanceCard component — that stays as-is). This is the large card with `balanceTone`-based backgrounds, net balance header, "You owe"/"Owed to you" metrics, MoneySignal components, and "This month" stats row.
- [ ] Props interface:

```typescript
interface DashboardBalanceProps {
  balanceTone: "danger" | "success" | "surface";
  perUserBalances: Record<string, number>;
  owedToYou: number;
  youOwe: number;
  currencyCode: string;
  oweUsers: Array<{ user: User; amount: number }>;
  owedUsers: Array<{ user: User; amount: number }>;
  onOwePress: (user: User, type: "remind" | "settle") => void;
  onOwedPress: (user: User, type: "remind" | "settle") => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 3.4: Create DashboardActions, DashboardAttention, DashboardGroupsPreview, DashboardRecentActivity components

**Files:**

- Create each as a new file under `src/features/dashboard/components/`

Each extracts the corresponding section from DashboardScreen:

- `DashboardActions.tsx` — the "Add Expense" + "Settle up" button row (lines ~820-850)
- `DashboardAttention.tsx` — the "Need attention" section with oweUsers/owedUsers lists and Remind/Settle actions (lines ~860-960)
- `DashboardGroupsPreview.tsx` — the top 4 groups section with "View all" and "+" buttons (lines ~970-1070)
- `DashboardRecentActivity.tsx` — the filtered recent activity list with filter pills (lines ~1080-1250)

- [ ] Each receives typed props from the screen, renders purely
- [ ] Run after each: `npx tsc --noEmit`

### Task 3.5: Create DashboardSettleSheet component

**Files:**

- Create: `src/features/dashboard/components/DashboardSettleSheet.tsx`
- Extract from: DashboardScreen's settle-up bottom sheet (~lines 200-350)

- [ ] Props include `ref`, `owedUsers`, `oweUsers`, `onSettleUser`, `onClose`
- [ ] Uses `forwardRef` for Gorhom BottomSheetModal

- [ ] Run: `npx tsc --noEmit`

### Task 3.6: Create DashboardSkeleton component

**Files:**

- Create: `src/features/dashboard/components/DashboardSkeleton.tsx`

- [ ] Extract the skeleton loading state from DashboardScreen (~lines 460-540)

- [ ] Run: `npx tsc --noEmit`

### Task 3.7: Commit Phase 3

```bash
git add -A
git commit -m "refactor: split DashboardScreen into hooks + components (1330 → ~8 files)"
```

### Task 3.8: Verify DashboardScreen line count

```bash
wc -l src/features/dashboard/screens/DashboardScreen.tsx
```

- [ ] Should be under 100 lines

---

### Phase 4: Groups Feature

### Task 4.1: Create useGroupDetail hook

**Files:**

- Create: `src/features/groups/hooks/useGroupDetail.ts`
- Extract from: `src/features/groups/screens/GroupDetailScreen.tsx` (745 lines)

- [ ] Move all data fetching, computed values, action callbacks into the hook
- [ ] Return interface:

```typescript
interface GroupDetailData {
  group: Group | null;
  members: GroupMember[];
  expenses: Expense[];
  balances: Balance[];
  debts: Debt[];
  isAllSettled: boolean;
  isLoading: boolean;
  isError: boolean;
  youOwe: number;
  owedToYou: number;
  currencyCode: string;
  handleSettleUp: () => void;
  handleAddExpense: () => void;
  handleMemberPress: (userId: string) => void;
  handleSettingsPress: () => void;
  handleDeleteExpense: (expenseId: string) => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 4.2: Rewrite GroupDetailScreen as thin composition

**Files:**

- Modify: `src/features/groups/screens/GroupDetailScreen.tsx`

- [ ] Replace content with composition of extracted components using data from `useGroupDetail()`. Target ~80 lines.

### Task 4.3: Create GroupDetail components

**Files:** Create under `src/features/groups/components/`

- [ ] `GroupMemberBar.tsx` — horizontal scrollable member avatars
- [ ] `GroupBalances.tsx` — balance list card ("Owes you"/"You owe"/"All settled")
- [ ] `GroupInviteBanner.tsx` — invite members CTA (shown when < 3 members)
- [ ] `GroupTransactions.tsx` — transaction list with header + rows

- [ ] Run after each: `npx tsc --noEmit`

### Task 4.4: Create useGroupSettings hook

**Files:**

- Create: `src/features/groups/hooks/useGroupSettings.ts`
- Extract from: `src/features/groups/screens/GroupSettingsScreen.tsx` (857 lines)

- [ ] Extract all data, computed values, mutations, and callbacks

### Task 4.5: Rewrite GroupSettingsScreen as thin composition + components

**Files:**

- Modify: `src/features/groups/screens/GroupSettingsScreen.tsx`
- Create components for each section

- [ ] `GroupIdentitySection.tsx` — icon picker + name + description
- [ ] `GroupFinanceSection.tsx` — currency + split method + simplify debts
- [ ] `GroupMembersSection.tsx` — member list + add/remove
- [ ] `GroupDangerZone.tsx` — delete + leave group buttons

- [ ] Run: `npx tsc --noEmit`

### Task 4.6: Create useGroupsList hook

**Files:**

- Create: `src/features/groups/hooks/useGroupsList.ts`
- Extract from: `src/features/groups/screens/GroupsScreen.tsx` (377 lines)

### Task 4.7: Rewrite GroupsScreen as thin composition

**Files:**

- Modify: `src/features/groups/screens/GroupsScreen.tsx`
- Target ~80 lines

### Task 4.8: Commit Phase 4

---

### Phase 5: Friends Feature

### Task 5.1: Create useFriendsList hook

**Files:**

- Create: `src/features/friends/hooks/useFriendsList.ts`
- Extract from: `src/features/friends/screens/FriendsScreen.tsx` (1028 lines)

The hook extracts: `useGroups`, `useUserExpenses`, `useUserSettlements`, `useFriends`, `useAllFriendships`, computed balances (`balancesUtil.getUserBalances`), `friendRows` sorted array, `displayRows` sectioned array, `pendingRequests`, state for `searchQuery`/`activeFilter`, and action callbacks (`handlePrimaryFriendAction`, `handleRemoveFriend`, `handleRequestAction`).

```typescript
export interface FriendsListData {
  currentUser: User | null;
  totalOwedToMe: number;
  totalIOwe: number;
  pendingRequests: Friendship[];
  friendSections: Array<{ title: string; data: FriendListItem[] }>;
  activeFilter: FriendFilter;
  setActiveFilter: (f: FriendFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  handlePrimaryAction: (friend: FriendListItem) => void;
  handleRemoveFriend: (friend: FriendListItem) => void;
  handleRequestAction: (friendship: Friendship, action: "accept" | "reject") => void;
  handleAddFriend: () => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 5.2: Rewrite FriendsScreen + create components

**Files:**

- Create: `src/features/friends/components/FriendsSummary.tsx` — balance summary card (MetricCell row + contextual text)
- Create: `src/features/friends/components/FriendsRequests.tsx` — pending requests with Accept/Reject buttons
- Create: `src/features/friends/components/FriendsSearchFilter.tsx` — SearchField + horizontal FilterPill scroll
- Create: `src/features/friends/components/FriendRow.tsx` — individual friend row wrapped in SwipeableRow with avatar, name, subtitle, balance pill, action button
- Create: `src/features/friends/components/FriendsEmpty.tsx` — contextual empty state for no friends / filtered empty
- Modify: `src/features/friends/screens/FriendsScreen.tsx` — thin composition (~80 lines)

- [ ] Each component receives typed props, no queries
- [ ] Screen: `<ScreenLayout><ThemedStatusBar/><ScreenHeader/><FriendsSummary/><FriendsRequests/><FriendsSearchFilter/><AnimatedFlatList/></ScreenLayout>`
- [ ] Run after each component: `npx tsc --noEmit`

### Task 5.3: Create useFriendDetail hook

**Files:**

- Create: `src/features/friends/hooks/useFriendDetail.ts`
- Extract from: `src/features/friends/screens/FriendDetailScreen.tsx` (1158 lines)

```typescript
export interface FriendDetailData {
  friend: User | null;
  balance: number;
  isSettled: boolean;
  sharedGroups: Group[];
  sharedExpenses: Expense[];
  categoryBreakdown: Array<{ category: string; total: number }>;
  recentActivity: Activity[];
  isLoading: boolean;
  handleRemind: () => void;
  handleSettle: () => void;
  handleAddExpense: () => void;
  handleRemoveFriend: () => void;
  handleShareBalance: () => void;
  handleContactInfo: () => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 5.4: Rewrite FriendDetailScreen + create components

**Files:**

- Create: `src/features/friends/components/FriendBalanceCard.tsx` — hero balance display (settled vs owed states)
- Create: `src/features/friends/components/FriendSharedGroups.tsx` — groups list
- Create: `src/features/friends/components/FriendSpendingCategories.tsx` — category breakdown
- Create: `src/features/friends/components/FriendRecentActivity.tsx` — recent activity list
- Create: `src/features/friends/components/FriendOptionsSheet.tsx` — bottom sheet with Remind/Settle/Share/Remove
- Modify: `src/features/friends/screens/FriendDetailScreen.tsx` — thin composition (~80 lines)

- [ ] Run after each: `npx tsc --noEmit`

### Task 5.5: Commit Phase 5

```bash
git add -A
git commit -m "refactor: split FriendsScreen and FriendDetailScreen into hooks + components"
```

---

### Phase 6: Activity Feature

### Task 6.1: Create useActivity hook

**Files:**

- Create: `src/features/activity/hooks/useActivity.ts`
- Extract from: `src/features/activity/screens/ActivityScreen.tsx` (240 lines)

```typescript
export interface ActivityData {
  sections: Array<{ title: string; data: Activity[] }>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: ActivityFilterType;
  setActiveFilter: (f: ActivityFilterType) => void;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  refetch: () => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 6.2: Rewrite ActivityScreen as thin composition

**Files:**

- Modify: `src/features/activity/screens/ActivityScreen.tsx`
- Create: `src/features/activity/components/ActivitySection.tsx` — wraps a month section with header + card container

- [ ] Screen composes: `<FocusAwareView><GlassBackground/><ThemedStatusBar/><ScreenHeader/><SearchField/><FilterPill scroll/><FlatList with ActivitySection/></FocusAwareView>`
- [ ] Run: `npx tsc --noEmit`

### Task 6.3: Commit Phase 6

---

### Phase 7: Expenses Feature

### Task 7.1: Create useExpenseDetail hook

**Files:**

- Create: `src/features/expenses/hooks/useExpenseDetail.ts`
- Extract from: `src/features/expenses/screens/ExpenseDetailScreen.tsx` (968 lines)

Extracts: `useExpense`, `useExpenseSplits`, `useDeleteExpense`, `useDeleteActivity`, comments state, navigation callbacks.

```typescript
export interface ExpenseDetailData {
  expense: Expense | null;
  splits: ExpenseSplit[];
  comments: Comment[];
  isLoading: boolean;
  handleDelete: () => void;
  handleEdit: () => void;
  handleCommentSubmit: (text: string) => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 7.2: Rewrite ExpenseDetailScreen + create components

**Files:** Create under `src/features/expenses/components/`

- `ExpenseSummary.tsx` — header section with icon, title, amount, date, paid by, group
- `ExpenseSplitBreakdown.tsx` — split participant rows
- `ExpenseComments.tsx` — comment list + input field

- [ ] Screen becomes thin composition: `<View><GlassBackground/><ScreenHeader/><ExpenseSummary/><ExpenseSplitBreakdown/><ExpenseComments/><DeleteButton/></View>`
- [ ] Run: `npx tsc --noEmit`

### Task 7.3: Commit Phase 7

---

### Phase 8: Settlements Feature

### Task 8.1: Create useSettlement hook

**Files:**

- Create: `src/features/settlements/hooks/useSettlement.ts`
- Extract from: `src/features/settlements/screens/SettlementScreen.tsx` (970 lines)

```typescript
export interface SettlementData {
  fromUser: User | null;
  toUser: User | null;
  groupContext: Group | null;
  amount: string;
  setAmount: (a: string) => void;
  note: string;
  setNote: (n: string) => void;
  selectedGroup: Group | null;
  setSelectedGroup: (g: Group | null) => void;
  isPending: boolean;
  handleRecord: () => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 8.2: Rewrite SettlementScreen + create components

**Files:** Create under `src/features/settlements/components/`

- `SettlementParties.tsx` — from/to user display with avatar + swap icon
- `SettlementAmount.tsx` — amount input with preset chip buttons (Full/Half)
- `SettlementConfirmation.tsx` — confirmation card with summary

- [ ] Screen becomes thin composition
- [ ] Run: `npx tsc --noEmit`

### Task 8.3: Commit Phase 8

---

### Phase 9: Analytics Feature

### Task 9.1: Create useAnalytics hook

**Files:**

- Create: `src/features/analytics/hooks/useAnalytics.ts`
- Extract from: `src/features/analytics/screens/AnalyticsScreen.tsx` (325 lines)

```typescript
export interface AnalyticsData {
  period: "Week" | "Month" | "3 Months" | "Year";
  setPeriod: (p: AnalyticsData["period"]) => void;
  totalSpending: number;
  expenseCount: number;
  averageExpense: number;
  trendData: number[];
  categoryData: CategoryBreakdown[];
  topExpenses: Expense[];
  isLoading: boolean;
}
```

- [ ] Also split `CategoryBreakdown.tsx` (289 lines) if it contains mixed logic/UI
- [ ] Run: `npx tsc --noEmit`

### Task 9.2: Rewrite screens as thin composition

**Files:**

- Modify: `src/features/analytics/screens/AnalyticsScreen.tsx`
- Modify: `src/features/analytics/screens/StatsPlaceholderScreen.tsx` (if needed)

### Task 9.3: Commit Phase 9

---

### Phase 10: Profile Feature

### Task 10.1: Create useProfile hook

**Files:**

- Create: `src/features/profile/hooks/useProfile.ts`
- Extract from: `src/features/profile/screens/ProfileScreen.tsx` (537 lines)

```typescript
export interface ProfileData {
  currentUser: User | null;
  netBalance: number;
  groupCount: number;
  handleChangePassword: () => void;
  handleEditProfile: () => void;
  handleShareApp: () => void;
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  handleToggleDarkMode: () => void;
  handleCurrencyChange: () => void;
}
```

- [ ] Run: `npx tsc --noEmit`

### Task 10.2: Rewrite ProfileScreen + create components

**Files:** Create under `src/features/profile/components/`

- `ProfileHeader.tsx` — avatar + name + email
- `ProfileBalance.tsx` — groups count + net balance metric cells
- `ProfilePreferences.tsx` — Dark Mode, Currency pref rows
- `ProfileAccount.tsx` — Change Password, Tell a Friend, Log Out rows + Delete Account

- [ ] Screen becomes thin composition
- [ ] Run: `npx tsc --noEmit`

### Task 10.3: Commit Phase 10

---

### Phase 11: Final Verification

### Task 11.1: Run full typecheck

```bash
npx tsc --noEmit
```

- [ ] EXIT 0

### Task 11.2: Verify no file exceeds 250 lines

```bash
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 250 {print}'
```

- [ ] Fix any files over 250 lines

### Task 11.3: Verify no screen imports data directly

```bash
grep -r "useQuery\|useMutation" src/features/*/screens/ --include="*.tsx"
```

- [ ] Should return zero results (or only in type imports)

### Task 11.4: Verify no component in components/ imports query hooks

```bash
grep -r "from.*queries/" src/features/*/components/ --include="*.tsx"
```

- [ ] Should return zero results (components use props, not queries)

### Task 11.5: Final commit

```bash
git add -A
git commit -m "refactor: complete architecture restructuring"
```
