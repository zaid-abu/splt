# App Performance Optimization — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Improve Splt's startup time, screen transitions, scrolling, and data loading with 8 workstreams targeting mid-range devices.

**Architecture:** All changes are in-place refactors or additive. No new third-party dependencies. No database schema changes. Each task produces independently testable deliverables.

**Tech Stack:** React Native 0.85, Expo SDK 56, TanStack React Query v5, FlashList, expo-image, Supabase

---

## Task 1: Service Layer N+1 Fixes

**Files:**
- Modify: `src/features/groups/services/api.ts:81-92`
- Modify: `src/features/expenses/services/api.ts:63-86`, `src/features/expenses/services/api.ts:88-116`

**Interfaces:**
- Consumes: existing `supabase` client, `toExpenseInsert`, `toExpenseSplitInsert`, `toGroupInsert`, `mapExpense`, `mapGroup`
- Produces: unchanged signatures — `addMembers(groupId, userIds)` still returns `void`, `addExpense` still returns `Expense`, etc.

- [ ] **Step 1: Fix `addMembers` — replace sequential loop with bulk insert**

In `src/features/groups/services/api.ts`, replace the for-loop in `addMembers` (lines 81-92):

```typescript
async addMembers(groupId: string, userIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(userIds));
  const members = uniqueIds.map((id) => ({
    group_id: groupId,
    user_id: id,
    balance: 0,
  }));
  const { error } = await supabase.from("group_members").insert(members);
  if (error) throw error;
},
```

- [ ] **Step 2: Fix `addExpense` — return joined data from insert**

In `src/features/expenses/services/api.ts`, modify `addExpense` (lines 63-86):

```typescript
async addExpense(expenseData: Partial<Expense>): Promise<Expense> {
  const { splits, ...coreData } = expenseData;

  // Insert core expense and return with joins
  const { data: expData, error: expError } = await supabase
    .from("expenses")
    .insert(toExpenseInsert(coreData))
    .select(expenseSelect)
    .single()
    .returns<ExpenseRow>();

  if (expError) throw expError;

  // Insert splits if provided
  if (splits && splits.length > 0) {
    const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expData.id, split));
    const { error: splitError } = await supabase.from("expense_splits").insert(splitsToInsert);
    if (splitError) throw splitError;
  }

  // If splits were inserted, we need to re-fetch to get joined split data
  return splits && splits.length > 0 ? await this.fetchExpense(expData.id) : mapExpense(expData);
},
```

- [ ] **Step 3: Fix `updateExpense` — return joined data from update**

In `src/features/expenses/services/api.ts`, modify `updateExpense` (lines 88-116):

```typescript
async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
  const { splits, ...coreData } = updates;

  // Update core expense and return with joins
  if (Object.keys(coreData).length > 0) {
    const { data: updatedData, error: expError } = await supabase
      .from("expenses")
      .update(toExpenseUpdate(coreData))
      .eq("id", expenseId)
      .select(expenseSelect)
      .single()
      .returns<ExpenseRow>();

    if (expError) throw expError;

    // If no splits to update, return immediately
    if (!splits) return mapExpense(updatedData);
  }

  // Update splits if provided (delete and recreate)
  if (splits) {
    await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
    if (splits.length > 0) {
      const splitsToInsert = splits.map((split) => toExpenseSplitInsert(expenseId, split));
      const { error: splitError } = await supabase.from("expense_splits").insert(splitsToInsert);
      if (splitError) throw splitError;
    }
  }

  // Re-fetch to get joined split data
  return await this.fetchExpense(expenseId);
},
```

- [ ] **Step 4: Fix `createGroup` — return joined data from create**

In `src/features/groups/services/api.ts`, modify `createGroup` (lines 42-58):

```typescript
async createGroup(groupData: Partial<Group>): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .insert(toGroupInsert(groupData))
    .select("*, members:group_members(*, user:users(*))")
    .single()
    .returns<GroupRow>();

  if (error) throw error;

  const memberIds = groupData.members?.map((member) => member.userId) ?? [];
  if (memberIds.length > 0) {
    await this.addMembers(data.id, memberIds);
  }

  return mapGroup(data);
},
```

- [ ] **Step 5: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 2: Image Optimization (expo-image)

**Files:**
- Modify: `src/components/ui/MemberAvatar.tsx:126-134`
- Modify: `src/features/expenses/screens/ExpenseDetailScreen.tsx:612`

**Interfaces:**
- Consumes: `User` type, existing props
- Produces: same component signatures, same visual output with disk caching

- [ ] **Step 1: Add expo-image import to MemberAvatar**

In `src/components/ui/MemberAvatar.tsx`:
```typescript
// Remove: import { Image, View } from "react-native";
// Add: import { View } from "react-native";
import { Image } from "expo-image";
```

- [ ] **Step 2: Replace Image component for avatar**

Replace lines 126-134:
```typescript
{user.avatar ? (
  <Image
    source={{ uri: user.avatar }}
    contentFit="cover"
    cachePolicy="memory-disk"
    style={{
      width: "100%",
      height: "100%",
      borderRadius: contentRadius,
    }}
  />
) : (
  <AvatarFallback initials={user.initials} fontSize={dims.font} textColor={tone.text} />
)}
```

- [ ] **Step 3: Update ExpenseDetailScreen receipt image**

In `src/features/expenses/screens/ExpenseDetailScreen.tsx`:
```typescript
// Add import
import { Image } from "expo-image";

// Replace <Image> usage for receipt photos
<Image
  source={{ uri: receiptUrl }}
  contentFit="contain"
  cachePolicy="memory-disk"
  style={{ width: "100%", height: 300, borderRadius: 12 }}
/>
```

- [ ] **Step 4: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 3: FlashList Migration — FriendsScreen

**Files:**
- Modify: `src/features/friends/screens/FriendsScreen.tsx`
  - Line 19: replace `Animated, { FadeInDown, LinearTransition }` import — keep `Animated` for layout animations but remove `Animated.FlatList`
  - Line 1003: replace `Animated.FlatList` with `FlashList`

- [ ] **Step 1: Update imports**

Replace line 19:
```typescript
import Animated, { FadeInDown } from "react-native-reanimated";
```

Add FlashList import at the top with other imports:
```typescript
import { FlashList } from "@shopify/flash-list";
```

- [ ] **Step 2: Replace Animated.FlatList with FlashList**

Replace lines 1003-1020:
```typescript
<FlashList
  data={displayRows}
  keyExtractor={(item: DisplayItem) => item.id}
  renderItem={renderItem}
  estimatedItemSize={78}
  keyboardShouldPersistTaps="handled"
  ListHeaderComponent={renderHeader}
  ListEmptyComponent={renderEmpty}
  contentContainerStyle={{ paddingBottom: 140 }}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={UI.color.text}
      progressViewOffset={10}
    />
  }
/>
```

Note: FlashList's `renderItem` receives `{ item, index, target }` where `item` is typed from `data`. The existing `renderItem` callback handles `DisplayItem` with kind discrimination using `item.kind` (section vs friend), so it works with FlashList unchanged.

- [ ] **Step 3: Remove `LinearTransition` import if no longer used**

If `LinearTransition` was only used inside the `renderItem` and is no longer needed:
```typescript
// Already removed from import in Step 1
```

- [ ] **Step 4: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 4: FlashList Migration — Activity, Notifications, Onboarding

**Files:**
- Modify: `src/features/activity/screens/ActivityScreen.tsx`
  - Line 183: replace `Animated.FlatList` with `FlashList`
  - Line 194: wrap `renderItem` in `useCallback`
- Modify: `src/features/notifications/screens/NotificationsScreen.tsx`
  - Line 168: replace `FlatList` with `FlashList`
  - Line 51: stabilize `renderItem` with `useCallback`
- Modify: `src/features/onboarding/screens/OnboardingScreen.tsx`
  - Line 119: replace `FlatList` with `FlashList`

- [ ] **Step 1: Migrate ActivityScreen**

Add FlashList import:
```typescript
import { FlashList } from "@shopify/flash-list";
```

Replace `Animated.FlatList` (lines 183-236):
```typescript
<FlashList
  data={groupedActivities}
  keyExtractor={(item: { title: string; data: Activity[] }) => item.title}
  estimatedItemSize={200}
  keyboardShouldPersistTaps="handled"
  renderItem={renderItem}
  ListEmptyComponent={ListEmptyComponent}
  contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={UI.color.text}
    />
  }
/>
```

Remove unused `Animated` from the import on line 11 if `FadeInDown` is not imported elsewhere in the component. Actually `FadeInDown` is used on lines 138, 143, 171 for the header/search/filter. So the import becomes:
```typescript
import Animated, { FadeInDown } from "react-native-reanimated";
```

- [ ] **Step 2: Stabilize renderItem in ActivityScreen**

Wrap the inline `renderItem` in a `useCallback`. Add this before the return:

```typescript
const renderItem = useCallback(
  ({ item: section }: { item: { title: string; data: Activity[] } }) => (
    <View style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}>
      <Typography
        style={{
          fontSize: 11,
          fontFamily: "IBMPlexSans_600SemiBold",
          color: UI.color.muted,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          marginBottom: 10,
          paddingLeft: 2,
        }}
      >
        {section.title}
      </Typography>
      <View
        style={{
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          overflow: "hidden",
        }}
      >
        {section.data.map((activity, idx) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            index={idx}
            isLast={idx === section.data.length - 1}
          />
        ))}
      </View>
    </View>
  ),
  []
);
```

And remove the inline `renderItem` prop from `<FlashList>`, replacing it with `renderItem={renderItem}`.

- [ ] **Step 3: Migrate NotificationsScreen**

Add FlashList import:
```typescript
import { FlashList } from "@shopify/flash-list";
```

Remove `FlatList` from the react-native import on line 1:
```typescript
import { View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
```

Wrap `renderItem` in a `useCallback`:
```typescript
const renderItem = useCallback(
  ({ item, index }: { item: AppNotification; index: number }) => {
    // existing renderItem body (lines 51-152) — unchanged
  },
  [acceptFriend, rejectFriend, isAccepting, isRejecting]
);
```

Replace `FlatList` (lines 168-193):
```typescript
<FlashList
  data={notifications}
  keyExtractor={(item: AppNotification) => item.id}
  renderItem={renderItem}
  estimatedItemSize={150}
  contentContainerStyle={{ paddingBottom: 100 }}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={UI.color.text}
    />
  }
  ListEmptyComponent={
    <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
      {isLoading ? (
        <ActivityIndicator size="large" color={UI.color.text} />
      ) : (
        <EmptyState
          icon={icons.BellOff}
          title="All caught up!"
          subtitle="You have no new notifications right now."
        />
      )}
    </View>
  }
/>
```

- [ ] **Step 4: Migrate OnboardingScreen**

Add FlashList import:
```typescript
import { FlashList } from "@shopify/flash-list";
```

Remove `FlatList` from the react-native import:
```typescript
import { View, Dimensions, Pressable } from "react-native";
```

Replace the `useRef` type and component (line 23-24):
```typescript
const flatListRef = useRef<FlashList<any>>(null);
```

Replace `FlatList` (lines 119-147):
```typescript
<FlashList
  ref={flatListRef}
  data={ONBOARDING_SLIDES}
  keyExtractor={(item: typeof ONBOARDING_SLIDES[0]) => item.id}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  bounces={false}
  onMomentumScrollEnd={onMomentumScrollEnd}
  estimatedItemSize={SCREEN_WIDTH}
  renderItem={({ item, index }) => (
    <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
      <OnboardingSlide item={item} width={SCREEN_WIDTH} />
      {index === ONBOARDING_SLIDES.length - 1 && (
        <Animated.View
          entering={FadeIn.delay(500).duration(400)}
          style={{ paddingHorizontal: 32, paddingBottom: 64 }}
        >
          <CurrencySelector
            label="DEFAULT CURRENCY"
            value={preferredCurrency.code}
            onChange={setCurrency}
          />
        </Animated.View>
      )}
    </View>
  )}
/>
```

Note: `scrollToIndex` on the ref still works with FlashList.

- [ ] **Step 5: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 5: Shared Balance Hook

**Files:**
- Create: `src/features/settlements/hooks/useBalances.ts`
- Modify: `src/features/dashboard/screens/DashboardScreen.tsx:265-363`
- Modify: `src/features/groups/screens/GroupsScreen.tsx:58-93`
- Modify: `src/features/friends/screens/FriendsScreen.tsx:116-128`

**Interfaces:**
- Produces:
  - `useOverallBalances(userId, groups, expenses, settlements, preferredCurrency, convertCurrency)` → `Map<string, number>`
  - `useGroupBalance(userId, groupId, groups, expenses, settlements, preferredCurrency, convertCurrency)` → `Map<string, number>`

- [ ] **Step 1: Create useBalances.ts**

```typescript
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { getUserBalances } from "@/features/settlements/utils/balances";
import type { Group, Expense, Settlement, Currency } from "@/types";

type CurrencyConverter = (amount: number, from: string, to: string) => number;

export function useOverallBalances(
  userId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
) {
  return useQuery({
    queryKey: [
      ...queryKeys.userBalances(userId),
      { groupsHash: hashData(groups), expensesHash: hashData(expenses), settlementsHash: hashData(settlements) },
    ],
    queryFn: () =>
      getUserBalances(userId, undefined, groups, expenses, settlements, preferredCurrency, convertCurrency),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupBalance(
  userId: string,
  groupId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
) {
  return useQuery({
    queryKey: [
      ...queryKeys.groupBalances(groupId),
      { groupsHash: hashData(groups), expensesHash: hashData(expenses), settlementsHash: hashData(settlements) },
    ],
    queryFn: () =>
      getUserBalances(userId, groupId, groups, expenses, settlements, preferredCurrency, convertCurrency),
    enabled: !!userId && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

function hashData(data: unknown[]): number {
  let hash = 0;
  for (const item of data) {
    const id = (item as { id?: string }).id || "";
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
  }
  return hash;
}
```

- [ ] **Step 2: Update DashboardScreen to use shared hook**

In `src/features/dashboard/screens/DashboardScreen.tsx`:

```typescript
// Add import
import { useOverallBalances, useGroupBalance } from "@/features/settlements/hooks/useBalances";

// Replace lines 265-277 (perUserBalances):
const { data: perUserBalances = new Map() } = useOverallBalances(
  currentUser.id,
  groups,
  expenses,
  settlements,
  preferredCurrency,
  convertCurrency
);

// Replace lines 329-363 (activeGroups groupBalances):
const activeGroups = useMemo(() => {
  // Use per-group balance queries
  const groupBalances = groups.map((group) => {
    // For each group, the balance is the sum of the shared group balance Map values
    const { data: groupBalanceMap } = useGroupBalance(
      currentUser.id,
      group.id,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    );
    let netBalance = 0;
    const balanceMap = groupBalanceMap ?? new Map();
    for (const amount of balanceMap.values()) {
      netBalance += amount;
    }
    // ...rest of existing logic for latestExpenseAt
    const latestExpenseAt = expenses
      .filter((expense) => expense.groupId === group.id)
      .reduce((latest, expense) => {
        const expenseTime = new Date(expense.createdAt).getTime();
        return Math.max(latest, expenseTime);
      }, new Date(group.createdAt).getTime());
    return { group, netBalance, latestExpenseAt };
  });

  groupBalances.sort((a, b) => {
    const aHasBalance = Math.abs(a.netBalance) > 0.005;
    const bHasBalance = Math.abs(b.netBalance) > 0.005;
    if (aHasBalance !== bHasBalance) return aHasBalance ? -1 : 1;
    if (a.latestExpenseAt !== b.latestExpenseAt) return b.latestExpenseAt - a.latestExpenseAt;
    return Math.abs(b.netBalance) - Math.abs(a.netBalance);
  });

  return groupBalances.slice(0, 4);
}, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);
```

- [ ] **Step 2: Update FriendsScreen**

Replace lines 116-128:
```typescript
const { data: balances = new Map() } = useOverallBalances(
  currentUser.id,
  groups,
  expenses,
  settlements,
  preferredCurrency,
  convertCurrency
);
```

- [ ] **Step 3: Update DashboardScreen**

Replace lines 265-277:
```typescript
const { data: perUserBalances = new Map() } = useOverallBalances(
  currentUser.id,
  groups,
  expenses,
  settlements,
  preferredCurrency,
  convertCurrency
);
```

Keep the activeGroups `useMemo` as-is — it computes per-group balances inline which is fine since it shares the same underlying data cache.

- [ ] **Step 4: Update GroupsScreen**

Replace lines 58-93 balance computation... actually, GroupsScreen already calls `getUserBalances` per group inside a `useMemo`. The shared hook doesn't help much here since the per-group computation is per-group.

A better approach for GroupsScreen: keep the current computation but add a comment that the balance data is cached via `useOverallBalances` in the parent screens. No change needed here — GroupsScreen's computation is already inside `useMemo`.

Alternatively, we can keep GroupsScreen's computation as-is but add a simple memoized `useOverallBalances` call that makes it cache-aware. Let me keep GroupsScreen unchanged — the heavy win is in Dashboard and Friends sharing the same global balance computation.

So actually:
- FriendsScreen: replace with `useOverallBalances`
- DashboardScreen: replace with `useOverallBalances`
- GroupsScreen: keep existing, no change needed

- [ ] **Step 5: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 6: FriendsScreen Decomposition

**Files:**
- Create: `src/features/friends/components/FriendsBalanceHeader.tsx`
- Create: `src/features/friends/components/FriendsSearchBar.tsx`
- Create: `src/features/friends/components/PendingRequestsBanner.tsx`
- Create: `src/features/friends/components/FriendsSectionList.tsx`
- Modify: `src/features/friends/screens/FriendsScreen.tsx` — shrink to ~150 lines

**Interfaces:**
- `FriendsBalanceHeader({ totalOwedToMe, totalIOwe, filterCounts })` — displays balance summary card
- `FriendsSearchBar({ search, onSearchChange, onClear, filter, onFilterChange, filterCounts })` — search + filter pills
- `PendingRequestsBanner({ pendingRequests, onAccept, onReject, topBalanceAction, onPrimaryAction })` — collapsible requests + attention item
- `FriendsSectionList({ displayRows, renderFriendRow, onRefresh, refreshing, hasActiveFilters, onClearFilters, isLoading, isEmpty })` — the FlashList with sections

- [ ] **Step 1: Create FriendsBalanceHeader**

```typescript
import { memo } from "react";
import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { MetricCell, UI } from "@/components/ui/native-ui";
import { formatAmount } from "@/components/ui/AmountDisplay";

interface FriendsBalanceHeaderProps {
  totalOwedToMe: number;
  totalIOwe: number;
  preferredCurrencyCode: string;
  filterCounts: { all: number; owes_you: number; you_owe: number; settled: number };
}

export const FriendsBalanceHeader = memo(function FriendsBalanceHeader({
  totalOwedToMe,
  totalIOwe,
  preferredCurrencyCode,
  filterCounts,
}: FriendsBalanceHeaderProps): JSX.Element {
  return (
    <View style={{ paddingHorizontal: UI.space.page, marginBottom: 16 }}>
      <View
        style={{
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <MetricCell
            label="Owed to you"
            value={formatAmount(totalOwedToMe, preferredCurrencyCode)}
            tone={totalOwedToMe > 0 ? "success" : "neutral"}
          />
          <MetricCell
            label="You owe"
            value={formatAmount(totalIOwe, preferredCurrencyCode)}
            tone={totalIOwe > 0 ? "danger" : "neutral"}
          />
        </View>
        <Typography
          style={{
            marginTop: 12,
            fontSize: 13,
            lineHeight: 18,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {filterCounts.all === 0
            ? "Add people you split with most often."
            : `${filterCounts.owes_you + filterCounts.you_owe} open balance${filterCounts.owes_you + filterCounts.you_owe === 1 ? "" : "s"} across ${filterCounts.all} friend${filterCounts.all === 1 ? "" : "s"}.`}
        </Typography>
      </View>
    </View>
  );
});
```

- [ ] **Step 2: Create PendingRequestsBanner**

```typescript
import { memo } from "react";
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { UI } from "@/components/ui/native-ui";
import type { Friendship, User } from "@/types";

interface PendingRequestsBannerProps {
  pendingRequests: Friendship[];
  topBalanceAction: { friend: User; balance: number } | null;
  preferredCurrencyCode: string;
  onAccept: (friendshipId: string) => void;
  onReject: (friendshipId: string) => void;
  onPrimaryAction: (row: { friend: User; balance: number }) => void;
}

export const PendingRequestsBanner = memo(function PendingRequestsBanner({
  pendingRequests,
  topBalanceAction,
  preferredCurrencyCode,
  onAccept,
  onReject,
  onPrimaryAction,
}: PendingRequestsBannerProps): JSX.Element | null {
  const router = useRouter();

  if (pendingRequests.length === 0 && !topBalanceAction) return null;

  const visibleRequests = pendingRequests.length > 3 ? pendingRequests.slice(0, 3) : pendingRequests;
  const remainingCount = pendingRequests.length - visibleRequests.length;

  return (
    <View style={{ paddingHorizontal: UI.space.page, marginBottom: 18 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Typography
          style={{
            fontSize: 18,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {pendingRequests.length > 0
            ? `${pendingRequests.length} ${pendingRequests.length === 1 ? "person" : "people"} want to connect`
            : "Needs attention"}
        </Typography>
        <Typography
          style={{
            fontSize: 13,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {pendingRequests.length + (topBalanceAction ? 1 : 0)} item
          {pendingRequests.length + (topBalanceAction ? 1 : 0) === 1 ? "" : "s"}
        </Typography>
      </View>

      <View
        style={{
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          paddingHorizontal: 14,
        }}
      >
        {visibleRequests.map((request, index) => {
          const requester = request.friendUser!;
          const hasDivider = index < visibleRequests.length - 1 || remainingCount > 0 || !!topBalanceAction;

          return (
            <View
              key={request.id}
              style={{
                minHeight: 68,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: hasDivider ? 1 : 0,
                borderBottomColor: UI.color.border,
                paddingVertical: 12,
              }}
            >
              <AppUserAvatar user={requester} size="sm" />
              <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                <Typography
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    lineHeight: 20,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {requester.name}
                </Typography>
                <Typography
                  numberOfLines={1}
                  style={{
                    marginTop: 1,
                    fontSize: 13,
                    lineHeight: 17,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  Wants to connect
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Reject ${requester.name}'s request`}
                onPress={() => onReject(request.id)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 999,
                  borderWidth: 1, borderColor: UI.color.border,
                  alignItems: "center", justifyContent: "center",
                  marginRight: 8, opacity: pressed ? 0.62 : 1,
                })}
              >
                <icons.X size={18} color={UI.color.muted} strokeWidth={2} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Accept ${requester.name}'s request`}
                onPress={() => onAccept(request.id)}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 999,
                  backgroundColor: UI.color.text,
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <icons.Check size={18} color={UI.color.textInverse} strokeWidth={2} />
              </Pressable>
            </View>
          );
        })}

        {remainingCount > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => ({
              minHeight: 56, flexDirection: "row", alignItems: "center",
              justifyContent: "space-between", paddingVertical: 12,
              borderBottomWidth: !!topBalanceAction ? 1 : 0,
              borderBottomColor: UI.color.border, opacity: pressed ? 0.62 : 1,
            })}
          >
            <Typography style={{ fontSize: 14, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" }}>
              View all {pendingRequests.length} requests →
            </Typography>
            <icons.ChevronRight size={18} color={UI.color.muted} strokeWidth={2} />
          </Pressable>
        )}

        {topBalanceAction && (
          <View
            style={{
              minHeight: 68, flexDirection: "row", alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <AppUserAvatar user={topBalanceAction.friend} size="sm" balance={topBalanceAction.balance} />
            <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
              <Typography
                numberOfLines={1}
                style={{ fontSize: 15, lineHeight: 20, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" }}
              >
                {topBalanceAction.friend.name}
              </Typography>
              <Typography
                numberOfLines={1}
                style={{
                  marginTop: 1, fontSize: 13, lineHeight: 17,
                  color: topBalanceAction.balance > 0 ? UI.color.success : UI.color.danger,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {topBalanceAction.balance > 0 ? "Remind about " : "Settle "}
                {formatAmount(Math.abs(topBalanceAction.balance), preferredCurrencyCode)}
              </Typography>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onPrimaryAction(topBalanceAction)}
              style={({ pressed }) => ({
                minHeight: 36, paddingHorizontal: 14, borderRadius: 999,
                backgroundColor: UI.color.text, alignItems: "center", justifyContent: "center",
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Typography style={{ fontSize: 13, color: UI.color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}>
                {topBalanceAction.balance > 0 ? "Remind" : "Settle"}
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
});
```

- [ ] **Step 3: Create FriendsSearchBar**

```typescript
import { memo } from "react";
import type { JSX } from "react";
import { View, ScrollView, LayoutAnimation } from "react-native";
import { SearchField, FilterPill, UI } from "@/components/ui/native-ui";
import type { FriendFilter } from "@/types";

interface FriendsSearchBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onSearchClear: () => void;
  filter: FriendFilter;
  onFilterChange: (filter: FriendFilter) => void;
  filterCounts: { all: number; owes_you: number; you_owe: number; settled: number };
}

const FILTERS = ["all", "owes_you", "you_owe", "settled"] as const;
const LABELS: Record<FriendFilter, string> = {
  all: "All", owes_you: "Owes you", you_owe: "You owe", settled: "Settled",
};

export const FriendsSearchBar = memo(function FriendsSearchBar({
  search, onSearchChange, onSearchClear, filter, onFilterChange, filterCounts,
}: FriendsSearchBarProps): JSX.Element {
  return (
    <>
      <View style={{ paddingHorizontal: UI.space.page, marginBottom: 12 }}>
        <SearchField
          value={search}
          onChangeText={onSearchChange}
          onClear={onSearchClear}
          placeholder="Search friends or email"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: UI.space.page, paddingBottom: 4, gap: 8 }}
      >
        {FILTERS.map((value) => (
          <FilterPill
            key={value}
            label={`${LABELS[value]} ${filterCounts[value]}`}
            isActive={filter === value}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onFilterChange(value);
            }}
          />
        ))}
      </ScrollView>
    </>
  );
});
```

- [ ] **Step 4: Create FriendsSectionList**

```typescript
import { memo } from "react";
import type { JSX } from "react";
import { View, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Typography } from "heroui-native";
import { UI, EmptyState } from "@/components/ui/native-ui";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { Pressable } from "react-native";
import * as icons from "lucide-react-native";
import { useRouter } from "expo-router";
import type { DisplayItem, FriendListItem } from "../screens/FriendsScreen";

interface FriendsSectionListProps {
  displayRows: DisplayItem[];
  renderFriendRow: (row: FriendListItem, sectionIndex: number, sectionCount: number) => JSX.Element;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isLoading: boolean;
  ListHeaderComponent: () => JSX.Element;
  insetsBottom: number;
}

// renderItem is not memoized here — it receives renderFriendRow from props
// and passes it through to the item-level render

export const FriendsSectionList = memo(function FriendsSectionList({
  displayRows, renderFriendRow, onRefresh, refreshing, hasActiveFilters,
  onClearFilters, isLoading, ListHeaderComponent, insetsBottom,
}: FriendsSectionListProps): JSX.Element {
  const router = useRouter();

  // Stabilized renderItem that handles both section headers and friend items
  const renderItem = useCallback(
    ({ item }: { item: DisplayItem }) => {
      if (item.kind === "section") {
        return (
          <View
            style={{
              paddingHorizontal: UI.space.page, paddingTop: 18, paddingBottom: 9,
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <Typography
              style={{
                fontSize: 18, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold", letterSpacing: -0.2,
              }}
            >
              {item.title}
            </Typography>
            <Typography style={{ fontSize: 13, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}>
              {item.count}
            </Typography>
          </View>
        );
      }
      // Friend item — render via the injected renderFriendRow callback
      return renderFriendRow(item.item, item.sectionIndex, item.sectionCount);
    },
    [renderFriendRow]
  );

  return (
    <FlashList
      data={displayRows}
      keyExtractor={(item: DisplayItem) => item.id}
      renderItem={renderItem}
      estimatedItemSize={78}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: UI.space.page }}>
          {isLoading ? (
            <View style={{ paddingTop: 20 }}>
              {[1, 2, 3, 4].map((i) => <ListRowSkeleton key={i} />)}
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <EmptyState
                icon={icons.Users}
                title={hasActiveFilters ? "No friends match this view" : "Add the people you split with"}
                subtitle={hasActiveFilters ? "Try a different name, email, or balance filter." : "Friends and shared-group contacts will appear here with balances and recent activity."}
              />
              <View style={{ marginTop: 16, alignItems: "center" }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={hasActiveFilters ? onClearFilters : () => router.push("/friend/new")}
                  style={({ pressed }) => ({
                    minHeight: 44, paddingHorizontal: 18, borderRadius: UI.radius.pill,
                    backgroundColor: hasActiveFilters ? UI.color.control : UI.color.text,
                    borderWidth: 1, borderColor: hasActiveFilters ? UI.color.border : UI.color.text,
                    alignItems: "center", justifyContent: "center", opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Typography style={{ fontSize: 14, color: hasActiveFilters ? UI.color.text : UI.color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}>
                    {hasActiveFilters ? "Clear filters" : "Add friend"}
                  </Typography>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      }
      contentContainerStyle={{ paddingBottom: insetsBottom + 140 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.color.text} progressViewOffset={10} />
      }
    />
  );
});
```

- [ ] **Step 5: Rewrite FriendsScreen orchestrator**

Replace the content of `src/features/friends/screens/FriendsScreen.tsx` with:

```typescript
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { Alert, Share, View } from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { getBalanceCopy } from "@/utils/balance";
import { formatActivityDate } from "@/utils/date";
import { ErrorState } from "@/components/ui/ErrorState";
import { UI, ScreenHeader, IconButton } from "@/components/ui/native-ui";
import { useAuth } from "@/context/AppContext";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import {
  useAcceptFriend, useAllFriendships, useFriends, useRejectFriend, useRemoveFriend,
} from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useOverallBalances } from "@/features/settlements/hooks/useBalances";
import { useAppToast } from "@/hooks/useAppToast";
import { queryKeys } from "@/queries/keys";
import { useUIStore } from "@/store/useUIStore";
import type { Expense, Friendship, User, FriendFilter } from "@/types";

import { FriendsBalanceHeader } from "../components/FriendsBalanceHeader";
import { FriendsSearchBar } from "../components/FriendsSearchBar";
import { PendingRequestsBanner } from "../components/PendingRequestsBanner";
import { FriendsSectionList } from "../components/FriendsSectionList";

export type FriendListItem = {
  friend: User;
  balance: number;
  recentExpense: Expense | null;
  friendship?: Friendship;
};

type DisplayItem =
  | { kind: "section"; id: string; title: string; count: number }
  | { kind: "friend"; id: string; item: FriendListItem; sectionIndex: number; sectionCount: number };

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useAppToast();

  const { data: groups = [], isLoading: isLoadingGroups, isError: isGroupsError, refetch: refetchGroups } = useGroups(currentUser?.id);
  const { data: expenses = [], isError: isExpensesError, refetch: refetchExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isError: isSettlementsError, refetch: refetchSettlements } = useUserSettlements(currentUser?.id);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const { data: allFriendships = [] } = useAllFriendships(currentUser?.id);
  const { mutateAsync: acceptFriend } = useAcceptFriend();
  const { mutateAsync: rejectFriend } = useRejectFriend();
  const { mutateAsync: removeFriend } = useRemoveFriend();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FriendFilter>("all");

  const isLoading = isLoadingGroups || isLoadingFriends;

  // Shared balance hook — cached across screens via React Query
  const { data: balances = new Map() } = useOverallBalances(
    currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency
  );

  const totalOwedToMe = useMemo(() => {
    let total = 0;
    for (const balance of balances.values()) { if (balance > 0) total += balance; }
    return total;
  }, [balances]);

  const totalIOwe = useMemo(() => {
    let total = 0;
    for (const balance of balances.values()) { if (balance < 0) total += balance; }
    return Math.abs(total);
  }, [balances]);

  const acceptedFriendshipsByUserId = useMemo(() => {
    const map = new Map<string, Friendship>();
    allFriendships.forEach((f) => { if (f.status === "accepted" && f.friendUser) map.set(f.friendUser.id, f); });
    return map;
  }, [allFriendships]);

  const pendingRequests = useMemo(() =>
    allFriendships.filter((f) => f.status === "pending" && f.friendId === currentUser.id && f.friendUser),
    [allFriendships, currentUser.id]
  );

  const getRecentExpense = useCallback((friendId: string) => {
    const shared = expenses.filter((e) =>
      (e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id)) &&
      (e.paidBy === friendId || e.splits.some((s) => s.userId === friendId))
    );
    if (shared.length === 0) return null;
    return shared.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [currentUser.id, expenses]);

  const friendRows = useMemo<FriendListItem[]>(() =>
    friends.map((friend) => ({
      friend, balance: balances.get(friend.id) || 0,
      recentExpense: getRecentExpense(friend.id),
      friendship: acceptedFriendshipsByUserId.get(friend.id),
    })).sort((a, b) => {
      const rank = (balance: number) => balance > 0 ? 0 : balance < 0 ? 1 : 2;
      const rankDelta = rank(a.balance) - rank(b.balance);
      if (rankDelta !== 0) return rankDelta;
      const aDate = a.recentExpense ? new Date(a.recentExpense.date).getTime() : 0;
      const bDate = b.recentExpense ? new Date(b.recentExpense.date).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
      return a.friend.name.localeCompare(b.friend.name);
    }),
    [acceptedFriendshipsByUserId, balances, friends, getRecentExpense]
  );

  const filterCounts = useMemo(() => ({
    all: friendRows.length,
    owes_you: friendRows.filter((r) => r.balance > 0).length,
    you_owe: friendRows.filter((r) => r.balance < 0).length,
    settled: friendRows.filter((r) => r.balance === 0).length,
  }), [friendRows]);

  const searchMatchedRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return friendRows.filter((r) => !query || r.friend.name.toLowerCase().includes(query) || r.friend.email.toLowerCase().includes(query));
  }, [friendRows, debouncedSearch]);

  const displayRows = useMemo<DisplayItem[]>(() => {
    const sectionConfigs = [
      { key: "owes_you" as const, title: "Owes you" },
      { key: "you_owe" as const, title: "You owe" },
      { key: "settled" as const, title: "Settled" },
    ];
    const sections = filter === "all" ? sectionConfigs : sectionConfigs.filter((s) => s.key === filter);
    return sections.flatMap((section) => {
      const rows = searchMatchedRows.filter((r) => {
        if (section.key === "owes_you") return r.balance > 0;
        if (section.key === "you_owe") return r.balance < 0;
        return r.balance === 0;
      });
      if (rows.length === 0) return [];
      return [
        { kind: "section" as const, id: `section-${section.key}`, title: section.title, count: rows.length },
        ...rows.map((item, idx) => ({ kind: "friend" as const, id: `friend-${item.friend.id}`, item, sectionIndex: idx, sectionCount: rows.length })),
      ];
    });
  }, [filter, searchMatchedRows]);

  const topBalanceAction = useMemo(() =>
    friendRows.find((r) => r.balance < 0) ?? friendRows.find((r) => r.balance > 0) ?? null,
    [friendRows]
  );

  const hasActiveFilters = search.trim().length > 0 || filter !== "all";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.friends }),
        queryClient.refetchQueries({ queryKey: queryKeys.groups }),
        queryClient.refetchQueries({ queryKey: queryKeys.expenses }),
        queryClient.refetchQueries({ queryKey: queryKeys.settlements }),
        queryClient.refetchQueries({ queryKey: ["notifications"] }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally { setRefreshing(false); }
  }, [queryClient]);

  const handleRequestAction = useCallback(async (friendshipId: string, action: "accept" | "reject") => {
    try {
      if (action === "accept") await acceptFriend({ friendshipId });
      else await rejectFriend({ friendshipId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      toast.show({ label: "Request failed", description: error instanceof Error ? error.message : "Please try again.", variant: "danger", placement: "top" });
    }
  }, [acceptFriend, rejectFriend, toast]);

  const handleRemoveFriend = useCallback((row: FriendListItem) => {
    if (!row.friendship) {
      Alert.alert("Shared group contact", `${row.friend.name} appears here because you share a group. Remove them from the shared group to hide them from this list.`);
      return;
    }
    Alert.alert("Remove friend?", "This removes the direct friendship. Shared group history and group membership stay unchanged.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try {
            await removeFriend({ friendshipId: row.friendship!.id });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show({ label: "Friend removed", description: `${row.friend.name} was removed from your direct friends.`, variant: "success", placement: "top" });
          } catch (error) {
            toast.show({ label: "Could not remove friend", description: error instanceof Error ? error.message : "Please try again.", variant: "danger", placement: "top" });
          }
        },
      },
    ]);
  }, [removeFriend, toast]);

  const handlePrimaryFriendAction = useCallback(async (row: FriendListItem) => {
    if (row.balance > 0) {
      await Share.share({ message: `Hey ${row.friend.name.split(" ")[0]}! Just a quick reminder that you owe me ${formatAmount(Math.abs(row.balance), preferredCurrency.code)} on Splt. Let me know when you can settle up.` });
      return;
    }
    if (row.balance < 0) { router.push({ pathname: "/settle/[id]", params: { id: row.friend.id } }); return; }
    router.push({ pathname: "/expense/new", params: { friendId: row.friend.id } });
  }, [preferredCurrency.code, router]);

  const clearSearchAndFilter = useCallback(() => { setSearch(""); setFilter("all"); }, [setSearch]);

  // Friend row renderer — used by FriendsSectionList
  // Extract the full renderFriendRow function from the original FriendsScreen.tsx (lines 770-914)
  // and keep it here as a useCallback with the same dependency array
  const renderFriendRow = useCallback(
    (row: FriendListItem, sectionIndex: number, sectionCount: number) => {
      const { friend, balance, recentExpense } = row;
      const balanceCopy = getBalanceCopy(balance, preferredCurrency.code);
      const isFirst = sectionIndex === 0;
      const isLast = sectionIndex === sectionCount - 1;
      const actionLabel = balance > 0 ? "Remind" : balance < 0 ? "Settle" : "Add";
      const ActionIcon = balance > 0 ? icons.Bell : balance < 0 ? icons.CheckCircle2 : icons.Plus;

      return (
        <SwipeableRow
          onDelete={() => handleRemoveFriend(row)}
          onSettle={balance !== 0 ? () => router.push({ pathname: "/settle/[id]", params: { id: friend.id } }) : undefined}
          onRemind={balance > 0 ? () => handlePrimaryFriendAction(row) : undefined}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/friend/${friend.id}`); }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", minHeight: 78, paddingVertical: 12,
              paddingHorizontal: 14, backgroundColor: UI.color.surface, borderWidth: 1,
              borderColor: UI.color.border, borderTopWidth: isFirst ? 1 : 0,
              borderTopLeftRadius: isFirst ? UI.radius.lg : 0,
              borderTopRightRadius: isFirst ? UI.radius.lg : 0,
              borderBottomLeftRadius: isLast ? UI.radius.lg : 0,
              borderBottomRightRadius: isLast ? UI.radius.lg : 0,
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <AppUserAvatar user={friend} size="md" balance={balance} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 10 }}>
              <Typography numberOfLines={1} style={{ fontSize: 16, lineHeight: 21, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold", letterSpacing: -0.2 }}>
                {friend.name}
              </Typography>
              <Typography numberOfLines={1} style={{ marginTop: 2, fontSize: 13, lineHeight: 17, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}>
                {recentExpense ? `${recentExpense.title} - ${formatActivityDate(recentExpense.date)}` : row.friendship ? friend.email : "Shared group contact"}
              </Typography>
            </View>
            <View style={{ alignItems: "flex-end", maxWidth: 116 }}>
              <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: balanceCopy.bg, borderWidth: 1, borderColor: UI.color.border }}>
                <Typography numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 13, lineHeight: 16, color: balanceCopy.color, fontFamily: "IBMPlexSans_600SemiBold" }}>
                  {balance === 0 ? balanceCopy.label : balanceCopy.amount}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={(event) => { event.stopPropagation(); handlePrimaryFriendAction(row); }}
                style={({ pressed }) => ({
                  marginTop: 7, minHeight: 36, paddingHorizontal: 9, borderRadius: 999,
                  backgroundColor: balance === 0 ? UI.color.control : UI.color.text,
                  borderWidth: 1, borderColor: balance === 0 ? UI.color.border : UI.color.text,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <ActionIcon size={13} color={balance === 0 ? UI.color.text : UI.color.textInverse} strokeWidth={2} />
                <Typography style={{ fontSize: 12, lineHeight: 15, color: balance === 0 ? UI.color.text : UI.color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}>
                  {actionLabel}
                </Typography>
              </Pressable>
            </View>
          </Pressable>
        </SwipeableRow>
      );
    },
    [handlePrimaryFriendAction, handleRemoveFriend, preferredCurrency.code, router]
  );

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />
      <Animated.View entering={FadeInDown.duration(350).springify()} style={{ paddingTop: insets.top + 16, backgroundColor: UI.color.bg }}>
        <ScreenHeader title="Friends" rightAction={<IconButton icon={icons.Plus} accessibilityLabel="Add friend" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/friend/new"); }} />} />
      </Animated.View>
      {isGroupsError || isExpensesError || isSettlementsError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={() => { if (isGroupsError) refetchGroups(); if (isExpensesError) refetchExpenses(); if (isSettlementsError) refetchSettlements(); }} />
        </View>
      ) : (
        <FriendsSectionList
          displayRows={displayRows}
          renderFriendRow={renderFriendRow}
          onRefresh={onRefresh}
          refreshing={refreshing}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearSearchAndFilter}
          isLoading={isLoading}
          ListHeaderComponent={useCallback(() => (
            <>
              <FriendsBalanceHeader totalOwedToMe={totalOwedToMe} totalIOwe={totalIOwe} preferredCurrencyCode={preferredCurrency.code} filterCounts={filterCounts} />
              <PendingRequestsBanner pendingRequests={pendingRequests} topBalanceAction={topBalanceAction} preferredCurrencyCode={preferredCurrency.code} onAccept={(id) => handleRequestAction(id, "accept")} onReject={(id) => handleRequestAction(id, "reject")} onPrimaryAction={(row) => handlePrimaryFriendAction({ ...row, recentExpense: getRecentExpense(row.friend.id), friendship: acceptedFriendshipsByUserId.get(row.friend.id) })} />
              <FriendsSearchBar search={search} onSearchChange={setSearch} onSearchClear={() => setSearch("")} filter={filter} onFilterChange={setFilter} filterCounts={filterCounts} />
            </>
          ), [totalOwedToMe, totalIOwe, preferredCurrency.code, filterCounts, pendingRequests, topBalanceAction, handleRequestAction, handlePrimaryFriendAction, acceptedFriendshipsByUserId, getRecentExpense, search, setSearch, filter, setFilter])}
          insetsBottom={insets.bottom}
        />
      )}
    </FocusAwareView>
  );
}
```

**Important:** Due to the complexity of this decomposition, ensure the `renderFriendRow` inline function and `ListHeaderComponent` are properly memoized. The `renderFriendRow` function contains the SwipeableRow and friend card UI — copy it from the original file (lines 770-914) as-is, just extract it into the orchestrator scope.

- [ ] **Step 6: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 7: Route Lazy Loading

**Files:** All route files under `src/app/` that import screen components.

Route files to modify:
- `src/app/(tabs)/index.tsx` — imports DashboardScreen
- `src/app/(tabs)/groups.tsx` — imports GroupsScreen
- `src/app/(tabs)/friends.tsx` — imports FriendsScreen
- `src/app/(tabs)/activity.tsx` — imports ActivityScreen
- `src/app/group/new.tsx` — imports GroupCreateScreen (or similar)
- `src/app/group/[id]/index.tsx` — imports GroupDetailScreen
- `src/app/group/[id]/settings.tsx` — imports GroupSettingsScreen
- `src/app/group/[id]/settle.tsx` — imports GroupSettleScreen
- `src/app/expense/new.tsx` — imports ExpenseCreationScreen
- `src/app/expense/[id].tsx` — imports ExpenseDetailScreen
- `src/app/friend/new.tsx` — imports AddFriendScreen
- `src/app/friend/[id].tsx` — imports FriendDetailScreen
- `src/app/settle/[id].tsx` — imports SettleScreen
- `src/app/onboarding.tsx` — imports OnboardingScreen
- `src/app/notifications.tsx` — imports NotificationsScreen
- `src/app/profile.tsx` — imports ProfileScreen
- `src/app/(auth)/welcome.tsx` — imports WelcomeScreen
- `src/app/(auth)/login.tsx` — imports LoginScreen
- `src/app/(auth)/register.tsx` — imports RegisterScreen
- `src/app/(auth)/forgot-password.tsx` — imports ForgotPasswordScreen

- [ ] **Step 1: Transform each route file**

Each route file follows the same pattern. Transform from:
```typescript
import DashboardScreen from "@/features/dashboard/screens/DashboardScreen";
export default DashboardScreen;
```

To:
```typescript
import { lazy, Suspense } from "react";
import DashboardScreenSkeleton from "@/features/dashboard/screens/DashboardScreenSkeleton"; // if skeleton exists, otherwise use a generic fallback

const DashboardScreen = lazy(() => import("@/features/dashboard/screens/DashboardScreen"));

export default function DashboardRoute() {
  return (
    <Suspense fallback={<DashboardScreenSkeleton />}>
      <DashboardScreen />
    </Suspense>
  );
}
```

For screens without a dedicated skeleton component, use a generic fallback:
```typescript
import { lazy, Suspense } from "react";
import { View, ActivityIndicator } from "react-native";
import { UI } from "@/components/ui/native-ui";

const LazyScreen = lazy(() => import("@/features/path/to/Screen"));

export default function LazyRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: UI.color.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={UI.color.text} />
      </View>
    }>
      <LazyScreen />
    </Suspense>
  );
}
```

Apply this pattern to all route files listed above.

- [ ] **Step 2: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 8: Optimistic Updates

**Files:**
- Modify: `src/features/expenses/queries/useExpenses.ts:31-54` (useAddExpense)
- Modify: `src/features/expenses/queries/useExpenses.ts:74-86` (useDeleteExpense)
- Modify: `src/features/settlements/queries/useSettlements.ts:23-49` (useAddSettlement)

- [ ] **Step 1: Add optimistic update to useAddExpense**

Replace the mutation in `src/features/expenses/queries/useExpenses.ts`:

```typescript
export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseData: Partial<Expense>) => expensesApi.addExpense(expenseData),
    onMutate: async (newExpense) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses });

      // Snapshot previous value
      const previousExpenses = queryClient.getQueryData(queryKeys.expenses);

      // Optimistically update the cache
      const optimisticExpense: Expense = {
        ...newExpense as Expense,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        date: newExpense.date ?? new Date(),
      };

      queryClient.setQueryData(queryKeys.expenses, (old: Expense[] = []) => [optimisticExpense, ...old]);

      if (newExpense.groupId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
        queryClient.setQueryData(queryKeys.groupExpenses(newExpense.groupId), (old: Expense[] = []) => [optimisticExpense, ...old]);
      }

      return { previousExpenses };
    },
    onError: (err, newExpense, context) => {
      // Roll back on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.expenses, context.previousExpenses);
      }
      if (newExpense.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
    },
    onSettled: (_data, _error, newExpense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      if (newExpense.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
    },
    onSuccess: (newExpense) => {
      activitiesApi.logActivity({
        type: "expense",
        expense: { id: newExpense.id } as Expense,
        groupId: newExpense.groupId,
        userId: newExpense.paidBy,
        user: newExpense.paidByUser,
        description: newExpense.title,
        amount: newExpense.amount,
        currency: newExpense.currency,
        date: newExpense.date,
      });
    },
  });
}
```

- [ ] **Step 2: Add optimistic update to useDeleteExpense**

Replace the mutation:

```typescript
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(expenseId),
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses });

      const previousExpenses = queryClient.getQueryData<Expense[]>(queryKeys.expenses);

      queryClient.setQueryData(queryKeys.expenses, (old: Expense[] = []) =>
        old.filter((e) => e.id !== expenseId)
      );

      return { previousExpenses };
    },
    onError: (err, expenseId, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.expenses, context.previousExpenses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}
```

- [ ] **Step 3: Add optimistic update to useAddSettlement**

Replace the mutation in `src/features/settlements/queries/useSettlements.ts`:

```typescript
export function useAddSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementData: Partial<Settlement>) =>
      settlementsApi.addSettlement(settlementData),
    onMutate: async (newSettlement) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settlements });

      const previousSettlements = queryClient.getQueryData(queryKeys.settlements);

      const optimisticSettlement: Settlement = {
        ...newSettlement as Settlement,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        date: newSettlement.date ?? new Date(),
      };

      queryClient.setQueryData(queryKeys.settlements, (old: Settlement[] = []) => [optimisticSettlement, ...old]);

      if (newSettlement.groupId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.groupSettlements(newSettlement.groupId) });
        queryClient.setQueryData(queryKeys.groupSettlements(newSettlement.groupId), (old: Settlement[] = []) => [optimisticSettlement, ...old]);
      }

      return { previousSettlements };
    },
    onError: (err, newSettlement, context) => {
      if (context?.previousSettlements) {
        queryClient.setQueryData(queryKeys.settlements, context.previousSettlements);
      }
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupSettlements(newSettlement.groupId) });
      }
    },
    onSettled: (_data, _error, newSettlement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupSettlements(newSettlement.groupId) });
      }
    },
    onSuccess: (newSettlement) => {
      activitiesApi.logActivity({
        type: "settlement",
        settlement: { id: newSettlement.id } as Settlement,
        groupId: newSettlement.groupId,
        userId: newSettlement.fromUserId,
        user: newSettlement.fromUser,
        description: `Settlement of ${newSettlement.currency} ${newSettlement.amount}`,
        amount: newSettlement.amount,
        currency: newSettlement.currency,
        date: newSettlement.date,
      });
    },
  });
}
```

- [ ] **Step 4: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

---

## Task 9: Startup Parallelization

**Files:**
- Modify: `src/app/_layout.tsx:51-62`
- Modify: `src/providers/AppProvider.tsx:27-29`

- [ ] **Step 1: Parallelize fonts + auth in root layout**

In `src/app/_layout.tsx`, replace lines 55-62:

```typescript
useEffect(() => {
  if (!loaded) return;

  supabase.auth.getSession().then(() => {
    setAuthReady(true);
    SplashScreen.hideAsync();
  });
}, [loaded]);
```

The font loading (`useFonts`) and session check already run somewhat independently — `useFonts` is synchronous-ish (returns `loaded` after fonts are ready), and the session effect depends on `loaded`. To truly parallelize, we need to start the session check at the same time as font loading:

```typescript
export default function RootLayout(): JSX.Element | null {
  const [loaded, error] = useFonts({...});
  const [authReady, setAuthReady] = useState(false);
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  // Fire auth session check immediately — parallel with font loading
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setAuthReady(true);
    });
  }, []);

  // Hide splash only when both are ready
  useEffect(() => {
    if (loaded && authReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authReady]);
```

- [ ] **Step 2: Fire exchange rates as fire-and-forget**

In `src/providers/AppProvider.tsx`, replace lines 27-29:

```typescript
useEffect(() => {
  fetchExchangeRates();
}, [fetchExchangeRates]);
```

The exchange rate fetch is already fire-and-forget (no `await` or `.then()` gating the render). The fix is to ensure it doesn't block the rendering tree. Currently it doesn't — the `useEffect` runs after mount. No change needed here.

However, we should ensure the exchange rate fetch doesn't delay anything. Looking at the code, it's already fire-and-forget in a `useEffect`, so the provider tree mounts immediately and exchange rates load asynchronously in the background. This is correct.

- [ ] **Step 3: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```
