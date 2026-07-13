# Fix FAB, Tabs, and Performance — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix tab bar selection, broken FAB/QuickAdd, and lazy-loading sluggishness while accelerating v2 Feed (collapsible header + quick stats).

**Architecture:** In-place refactors. `index.tsx` becomes a redirect to `feed`. Four tab routes drop `React.lazy()`. FAB styling fixed, QuickAddSheet made functional (navigates to expense/new with amount). FeedScreen gains collapsible BalanceHeader + QuickStatsRow. All FlashLists get `estimatedItemSize`.

**Tech Stack:** React Native 0.85, Expo SDK 56, Expo Router, Reanimated v4, FlashList, Gorhom Bottom Sheet v5, HeroUI Native

## Global Constraints

- All new components use inline `style` objects with `UI.color.*`, `UI.space.*`, `UI.radius.*` tokens (consistent with existing codebase patterns)
- No shadow on any components (flat-by-default design system)
- All interactive elements must have `accessibilityLabel`, `accessibilityRole`
- No semicolons (Prettier: semi: true)
- Keep existing `withErrorBoundary` wrapper on route exports
- Follow existing import patterns and code style

---

## File Structure Map

### Files to Create
```
src/features/feed/components/BalanceHeader.tsx    (NEW — collapsible scroll-aware balance card)
src/features/feed/components/QuickStatsRow.tsx     (NEW — 3 tappable stat pills)
```

### Files to Modify
```
src/app/(tabs)/index.tsx                           (REWRITE — redirect stub)
src/app/(tabs)/feed.tsx                            (REMOVE lazy + Suspense)
src/app/(tabs)/groups.tsx                          (REMOVE lazy + Suspense)
src/app/(tabs)/friends.tsx                         (REMOVE lazy + Suspense)
src/app/(tabs)/profile.tsx                         (REMOVE lazy + Suspense)
src/features/quick-add/components/FloatingAddButton.tsx (REMOVE shadow, fix bg class)
src/features/quick-add/screens/QuickAddSheet.tsx   (MAKE functional, remove step dots)
src/features/feed/screens/FeedScreen.tsx           (RESTRUCTURE with Animated.ScrollView + new components)
src/features/activity/screens/ActivityScreen.tsx   (ADD estimatedItemSize)
src/features/groups/screens/GroupsScreen.tsx       (ADD estimatedItemSize)
src/features/groups/components/GroupExpensesTab.tsx (ADD estimatedItemSize + useCallback renderItem)
src/features/friends/components/FriendsSectionList.tsx (ADD estimatedItemSize)
```

---

## Task 1: Tab Fix — Redirect index to feed

**Files:**
- Modify: `src/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `router` from `expo-router`
- Produces: Tab screen that immediately redirects to `/(tabs)/feed`

- [ ] **Step 1: Rewrite index.tsx as redirect stub**

Replace the entire contents of `src/app/(tabs)/index.tsx`:

```typescript
import { router } from "expo-router"
import { useEffect } from "react"

export default function TabsIndex() {
  useEffect(() => {
    router.replace("/(tabs)/feed")
  }, [])
  return null
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: Zero errors related to the index file.

- [ ] **Step 3: Commit**

```bash
git add src/app/(tabs)/index.tsx
git commit -m "fix: redirect tabs index to feed so tab bar shows active state"
```

---

## Task 2: Remove React.lazy() from Tab Routes

**Files:**
- Modify: `src/app/(tabs)/feed.tsx`
- Modify: `src/app/(tabs)/groups.tsx`
- Modify: `src/app/(tabs)/friends.tsx`
- Modify: `src/app/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: Screen components from feature modules
- Produces: Route exports with direct imports (no lazy loading)

- [ ] **Step 1: Fix feed.tsx**

Replace contents of `src/app/(tabs)/feed.tsx`:

```typescript
import FeedScreen from "@/features/feed/screens/FeedScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function FeedRoute() {
  return <FeedScreen />
}

export default withErrorBoundary(FeedRoute, "Feed")
```

- [ ] **Step 2: Fix groups.tsx**

Replace contents of `src/app/(tabs)/groups.tsx`:

```typescript
import GroupsScreen from "@/features/groups/screens/GroupsScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function GroupsRoute() {
  return <GroupsScreen />
}

export default withErrorBoundary(GroupsRoute, "Groups")
```

- [ ] **Step 3: Fix friends.tsx**

Replace contents of `src/app/(tabs)/friends.tsx`:

```typescript
import FriendsScreen from "@/features/friends/screens/FriendsScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function FriendsRoute() {
  return <FriendsScreen />
}

export default withErrorBoundary(FriendsRoute, "Friends")
```

- [ ] **Step 4: Fix profile.tsx**

Replace contents of `src/app/(tabs)/profile.tsx`:

```typescript
import ProfileScreen from "@/features/profile/screens/ProfileScreen"
import { withErrorBoundary } from "@/components/feedback/withErrorBoundary"

function ProfileRoute() {
  return <ProfileScreen />
}

export default withErrorBoundary(ProfileRoute, "Profile")
```

- [ ] **Step 5: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/(tabs)/feed.tsx src/app/(tabs)/groups.tsx src/app/(tabs)/friends.tsx src/app/(tabs)/profile.tsx
git commit -m "perf: remove React.lazy from tab routes to eliminate Suspense flash on tab switch"
```

---

## Task 3: FAB Styling Fix

**Files:**
- Modify: `src/features/quick-add/components/FloatingAddButton.tsx`

**Interfaces:**
- Consumes: Reanimated `useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withTiming`, `withSequence`, `Easing`
- Produces: Same `FloatingAddButton` component with flat styling

- [ ] **Step 1: Remove shadow and fix background class**

Apply these changes to `src/features/quick-add/components/FloatingAddButton.tsx`:

**Remove all shadow props** from the `Pressable` style:
```typescript
// DELETE these lines:
shadowColor: "#000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.2,
shadowRadius: 8,
elevation: 8,
```

**Replace `bg-ink` with `bg-[#1A1A1A]`** and **change `bottom` from 80 to 24**:

```typescript
// In the Animated.View wrapper style:
{
  position: "absolute",
  bottom: 24,          // was 80
  alignSelf: "center",
  zIndex: 100,
}

// In the Pressable className:
className="w-14 h-14 rounded-full bg-[#1A1A1A] items-center justify-center"
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/quick-add/components/FloatingAddButton.tsx
git commit -m "fix: remove shadow from FAB, use explicit color, tighten bottom spacing"
```

---

## Task 4: QuickAddSheet — Make Functional

**Files:**
- Modify: `src/features/quick-add/screens/QuickAddSheet.tsx`

**Interfaces:**
- Consumes: `useRouter` from `expo-router`, `useSafeAreaInsets`
- Produces: Functional QuickAddSheet that navigates to `/expense/new` with amount param
- Breaking change: Removes `onSuccess` prop — parents should no longer pass it

- [ ] **Step 1: Rewrite QuickAddSheet with navigation**

Replace contents of `src/features/quick-add/screens/QuickAddSheet.tsx`:

```typescript
import { useState, useCallback } from "react"
import { View, Pressable, Text } from "react-native"
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { HapticButton } from "@/components/ui/HapticButton"
import { UI } from "@/components/ui/native-ui"
import * as Haptics from "expo-haptics"

interface QuickAddSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>
}

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
]

export function QuickAddSheet({ sheetRef }: QuickAddSheetProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [amount, setAmount] = useState("")

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    [],
  )

  const handleAddExpense = useCallback(() => {
    sheetRef.current?.dismiss()
    router.push(`/expense/new?amount=${amount}`)
  }, [amount, router, sheetRef])

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
      handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: UI.space.page,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Text
          style={{
            fontFamily: "Sora_600SemiBold",
            fontSize: 32,
            color: UI.color.textStrong,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {amount ? `$${amount}` : "$0"}
        </Text>

        <View style={{ gap: 8 }}>
          {KEY_ROWS.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-around" }}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    if (key === "⌫") {
                      setAmount((a) => a.slice(0, -1))
                    } else if (key === "." && amount.includes(".")) {
                      return
                    } else {
                      setAmount((a) => a + key)
                    }
                  }}
                  style={({ pressed }) => ({
                    width: 80,
                    height: 64,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: UI.radius.md,
                    backgroundColor: UI.color.control,
                    opacity: pressed ? 0.7 : 1,
                  })}
                  accessibilityLabel={key === "⌫" ? "Delete" : `Number ${key}`}
                >
                  <Text
                    style={{
                      fontFamily: "Sora_600SemiBold",
                      fontSize: 24,
                      color: UI.color.textStrong,
                    }}
                  >
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <HapticButton tone="ink" onPress={handleAddExpense} disabled={!amount}>
            Add Expense
          </HapticButton>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
```

Changes from original:
- Removed `onSuccess` from `QuickAddSheetProps` interface
- Added `useRouter()` import and `router` variable
- Added `handleAddExpense` callback that dismisses sheet AND navigates to `/expense/new?amount=X`
- Removed step indicator dots
- Removed `step` state
- `HapticButton` now calls `handleAddExpense` instead of `onSuccess`

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/quick-add/screens/QuickAddSheet.tsx
git commit -m "fix: make QuickAddSheet functional — navigate to expense/new with amount on submit"
```

---

## Task 5: Create Collapsible BalanceHeader

**Files:**
- Create: `src/features/feed/components/BalanceHeader.tsx`

**Interfaces:**
- Consumes: Reanimated `useAnimatedStyle`, `interpolate`, `Extrapolation`, `SharedValue`
- Produces: `BalanceHeader` component
- Props: `scrollY: SharedValue<number>`, `netBalance: number`, `balanceTone: "danger" | "success" | "neutral"`, `balanceTitle: string`, `balanceSubtitle: string`, `onAnalyticsPress: () => void`

- [ ] **Step 1: Create BalanceHeader component**

Create `src/features/feed/components/BalanceHeader.tsx`:

```typescript
import type { ComponentType, JSX } from "react"
import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import * as icons from "lucide-react-native"
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"
import { UI } from "@/components/ui/native-ui"

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

function IconShell({ icon: Icon, tone }: { icon: LucideIcon; tone: string }): JSX.Element {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor:
          tone === "danger"
            ? UI.color.dangerTint
            : tone === "success"
              ? UI.color.successTint
              : UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        size={18}
        color={
          tone === "danger"
            ? UI.color.danger
            : tone === "success"
              ? UI.color.success
              : UI.color.muted
        }
        strokeWidth={2}
      />
    </View>
  )
}

interface BalanceHeaderProps {
  scrollY: SharedValue<number>
  netBalance: number
  balanceTone: "danger" | "success" | "neutral"
  balanceTitle: string
  balanceSubtitle: string
  onAnalyticsPress: () => void
}

export function BalanceHeader({
  scrollY,
  netBalance,
  balanceTone,
  balanceTitle,
  balanceSubtitle,
  onAnalyticsPress,
}: BalanceHeaderProps): JSX.Element {
  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, 150], [180, 60], Extrapolation.CLAMP),
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
  }))

  const amountStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(scrollY.value, [0, 150], [36, 20], Extrapolation.CLAMP),
  }))

  return (
    <View style={{ paddingHorizontal: UI.space.page, marginBottom: 16 }}>
      <Animated.View
        style={[
          {
            backgroundColor:
              balanceTone === "danger"
                ? UI.color.dangerTint
                : balanceTone === "success"
                  ? UI.color.successTint
                  : UI.color.surface,
            borderRadius: UI.radius.lg,
            borderWidth: 1,
            borderColor: UI.color.border,
            overflow: "hidden",
          },
          headerStyle,
        ]}
      >
        <Pressable
          onPress={onAnalyticsPress}
          style={{ flex: 1, padding: 16, justifyContent: "center" }}
          accessibilityLabel="View analytics"
          accessibilityRole="button"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <IconShell
              icon={
                balanceTone === "danger"
                  ? icons.ArrowUpRight
                  : balanceTone === "success"
                    ? icons.ArrowDownLeft
                    : icons.Check
              }
              tone={balanceTone}
            />
            <Animated.Text
              style={[
                {
                  fontFamily: "Sora_600SemiBold",
                  color: UI.color.textStrong,
                  letterSpacing: -0.3,
                },
                amountStyle,
              ]}
              numberOfLines={1}
            >
              {balanceTitle}
            </Animated.Text>
          </View>

          <Animated.View style={contentStyle}>
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                lineHeight: 20,
              }}
            >
              {balanceSubtitle}
            </Typography>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/feed/components/BalanceHeader.tsx
git commit -m "feat: add collapsible BalanceHeader with scroll-aware animation"
```

---

## Task 6: Create QuickStatsRow

**Files:**
- Create: `src/features/feed/components/QuickStatsRow.tsx`

**Interfaces:**
- Consumes: `Pressable` from RN, `Typography` from HeroUI Native, `UI` tokens
- Produces: `QuickStatsRow` component
- Props: `pills: Array<{ label: string; value: string; onPress: () => void }>`

- [ ] **Step 1: Create QuickStatsRow component**

Create `src/features/feed/components/QuickStatsRow.tsx`:

```typescript
import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import { UI } from "@/components/ui/native-ui"

interface StatPill {
  label: string
  value: string
  onPress: () => void
}

interface QuickStatsRowProps {
  pills: StatPill[]
}

export function QuickStatsRow({ pills }: QuickStatsRowProps) {
  return (
    <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: UI.space.page, marginBottom: 20 }}>
      {pills.map((pill) => (
        <Pressable
          key={pill.label}
          onPress={pill.onPress}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: UI.color.surface,
            borderRadius: UI.radius.md,
            borderWidth: 1,
            borderColor: UI.color.border,
            paddingVertical: 10,
            paddingHorizontal: 12,
            opacity: pressed ? 0.7 : 1,
          })}
          accessibilityLabel={`${pill.label}: ${pill.value}`}
          accessibilityRole="button"
        >
          <Typography
            style={{
              fontSize: 11,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_600SemiBold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 2,
            }}
          >
            {pill.label}
          </Typography>
          <Typography
            style={{
              fontSize: 15,
              color: UI.color.text,
              fontFamily: "Sora_600SemiBold",
            }}
            numberOfLines={1}
          >
            {pill.value}
          </Typography>
        </Pressable>
      ))}
    </View>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/feed/components/QuickStatsRow.tsx
git commit -m "feat: add QuickStatsRow component with tappable stat pills"
```

---

## Task 7: Restructure FeedScreen

**Files:**
- Modify: `src/features/feed/screens/FeedScreen.tsx`

**Interfaces:**
- Consumes: New `BalanceHeader` and `QuickStatsRow`, existing dashboard components, Reanimated `useAnimatedScrollHandler` and `useSharedValue`
- Produces: FeedScreen with collapsible balance header, quick stats, and functional FAB

- [ ] **Step 1: Update imports**

Remove these lines:
```typescript
import { BalanceWidget } from "@/features/dashboard/components/BalanceWidget"
import { ScrollView, View, RefreshControl, StyleSheet } from "react-native"
```

Add these:
```typescript
import { View, RefreshControl } from "react-native"
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated"
import { BalanceHeader } from "@/features/feed/components/BalanceHeader"
import { QuickStatsRow } from "@/features/feed/components/QuickStatsRow"
import { formatAmount } from "@/components/ui/AmountDisplay"
```

- [ ] **Step 2: Remove unused StyleSheet and add shared value**

Delete the `styles` useMemo block. Add `const scrollY = useSharedValue(0)` after `const queryClient = useQueryClient()`.

- [ ] **Step 3: Add QuickStats data computation**

After `balanceSubtitle`, before `openGroupCount`, add:
```typescript
const statsPills = useMemo(() => [
  {
    label: "Groups",
    value: String(groups.length),
    onPress: () => router.push("/(tabs)/groups"),
  },
  {
    label: "Expenses",
    value: String(expenses.length),
    onPress: () => router.push("/stats"),
  },
  {
    label: "This month",
    value: formatAmount(totalSpent, preferredCurrency.code),
    onPress: () => router.push("/stats"),
  },
], [groups.length, expenses.length, totalSpent, preferredCurrency.code, router])
```

- [ ] **Step 4: Add scroll handler**

Before `onRefresh`:
```typescript
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y
  },
})
```

- [ ] **Step 5: Replace ScrollView with Animated.ScrollView**

Replace `<ScrollView ...>` with `<Animated.ScrollView ... onScroll={scrollHandler} scrollEventThrottle={16} ...>`. Replace `</ScrollView>` with `</Animated.ScrollView>`. Replace outer `<View style={styles.screen}>` with `<View style={{ flex: 1, backgroundColor: UI.color.bg }}>`.

- [ ] **Step 6: Replace BalanceWidget with BalanceHeader + QuickStatsRow**

Replace the `<BalanceWidget ... />` block with:
```typescript
<BalanceHeader
  scrollY={scrollY}
  netBalance={netBalance}
  balanceTone={balanceTone}
  balanceTitle={balanceTitle}
  balanceSubtitle={balanceSubtitle}
  onAnalyticsPress={() => router.push("/stats")}
/>

<QuickStatsRow pills={statsPills} />
```

- [ ] **Step 7: Remove onSuccess prop from QuickAddSheet**

Change:
```typescript
<QuickAddSheet
  sheetRef={quickAddSheetRef}
  onSuccess={() => quickAddSheetRef.current?.dismiss()}
/>
```
To:
```typescript
<QuickAddSheet
  sheetRef={quickAddSheetRef}
/>
```

- [ ] **Step 8: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 9: Commit**

```bash
git add src/features/feed/screens/FeedScreen.tsx
git commit -m "feat: restructure FeedScreen with collapsible BalanceHeader, QuickStatsRow, and fixed QuickAdd"
```

---

## Task 8: FlashList estimatedItemSize + GroupExpensesTab renderItem fix

**Files:**
- Modify: `src/features/activity/screens/ActivityScreen.tsx:223`
- Modify: `src/features/groups/screens/GroupsScreen.tsx:354`
- Modify: `src/features/groups/components/GroupExpensesTab.tsx:98-115`
- Modify: `src/features/friends/components/FriendsSectionList.tsx:59`

**Interfaces:**
- Consumes: FlashList props from `@shopify/flash-list`
- Produces: Same FlashList components with added `estimatedItemSize` props and stabilized renderItem

- [ ] **Step 1: Fix ActivityScreen**

In `src/features/activity/screens/ActivityScreen.tsx`, add `estimatedItemSize={200}` to the `<FlashList>`.

- [ ] **Step 2: Fix GroupsScreen**

In `src/features/groups/screens/GroupsScreen.tsx`, add `estimatedItemSize={90}` to the `<FlashList>`.

- [ ] **Step 3: Fix GroupExpensesTab — add estimatedItemSize**

In `src/features/groups/components/GroupExpensesTab.tsx`, add `estimatedItemSize={70}` to the `<FlashList>`.

- [ ] **Step 4: Fix GroupExpensesTab — stabilize renderItem**

Add `import { useCallback } from "react"`. Extract inline `renderItem` (lines 101-115) to a `useCallback`:
```typescript
const renderItem = useCallback(
  ({ item: expense, index }: { item: any; index: number }) => {
    const mySplit = expense.splits.find((s: any) => s.userId === currentUser.id)
    const paidByUser = userById.get(expense.paidBy)
    return (
      <TransactionRow
        expense={expense}
        currentUserId={currentUser.id}
        paidByUser={paidByUser}
        myShare={mySplit?.amount ?? 0}
        isLast={index === expenses.length - 1}
        onPress={() => router.push(`/expense/${expense.id}`)}
        showAvatarBadge
      />
    )
  },
  [currentUser.id, userById, expenses.length, router]
)
```
Then use `renderItem={renderItem}` in the `<FlashList>` instead of the inline version.

- [ ] **Step 5: Fix FriendsSectionList**

In `src/features/friends/components/FriendsSectionList.tsx`, add `estimatedItemSize={78}` to the `<FlashList>`.

- [ ] **Step 6: Verify typecheck**

Run: `npm run typecheck`
Expected: Zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/activity/screens/ActivityScreen.tsx src/features/groups/screens/GroupsScreen.tsx src/features/groups/components/GroupExpensesTab.tsx src/features/friends/components/FriendsSectionList.tsx
git commit -m "perf: add estimatedItemSize to FlashLists, stabilize GroupExpensesTab renderItem"
```
