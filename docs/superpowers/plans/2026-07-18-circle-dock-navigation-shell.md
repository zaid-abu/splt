# Phase 1B Circle Dock Navigation Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the global Coral tab/FAB overlay with a pathless four-tab Circle Dock shell, canonical Circles and More destinations, and a global Add sheet whose five actions all reach valid focused flows.

**Architecture:** The root Expo Router `Stack` owns authentication, setup, redirects, and every focused task/detail route. A pathless `(shell)` child owns Expo Router 57 JavaScript `Tabs`, four pathless nested tab `Stack`s, the custom `CircleDock`, and `GlobalActionSheet` state; explicit leaf filenames preserve `/home`, `/circles`, `/activity`, `/more`, `/analytics`, `/notifications`, and `/currencies` without route collisions. Pure navigation contracts centralize tab configuration, canonical hrefs, compatibility redirects, action hrefs, circle-segment parsing, and the settlement fallback.

**Tech Stack:** Expo SDK 57, Expo Router 57 `expo-router/js-tabs`, React Native 0.86, React 19, TypeScript 6 strict mode, React Navigation bottom-tab types bundled by Expo Router, Jest 29 with `jest-expo`, React Native Testing Library 14, Lucide React Native, Expo Blur/Haptics, TanStack React Query, Zustand.

## Global Constraints

- Scope is Phase 1B Navigation Shell only; do not redesign Phase 1A lifecycle behavior or unrelated money/detail flows.
- Use `Tabs` from `expo-router/js-tabs`; do not install `@react-navigation/bottom-tabs` or any other bottom-tab dependency.
- The root `Stack` owns focused routes; `src/app/(shell)/_layout.tsx` owns tabs and global action-sheet state.
- The shell has exactly four stable tabs: Home, Circles, Activity, More. Add is a button, never a route or fifth tab.
- Each tab is a pathless nested `Stack` with explicit route filenames. Do not add a pathless `index.tsx` beneath any tab group.
- Move `/home`, `/activity`, `/analytics`, `/notifications`, and `/currencies` wrappers atomically into shell stacks. At every completed task boundary, each public URL has exactly one wrapper.
- Keep group, friend, expense, settlement, recurring, profile-edit, security, auth, verification, and setup routes in the root stack so the dock is structurally absent.
- Redirect `/groups` to `/circles?segment=groups`, `/people` to `/circles?segment=people`, and `/settings` to `/more`.
- Circles rows always open `/group/[id]` or `/friend/[id]`; a row press must never remind, settle, share, or create an expense based on balance.
- More exposes only working controls: edit profile, change password, notifications, insights, currencies, appearance, and sign out. Omit payment methods, export, help, privacy/security claims, and other inert controls.
- Global Add exposes exactly Add expense, Settle up, Create group, Add person, Schedule expense; every option navigates.
- Settle up without a selected person always navigates to `/settle/new`; never create `/settle/undefined`.
- Remove dock-height assumptions from `CoralScreen`; retain only normal bottom safe-area/content padding and let the tab navigator measure the dock.
- Preserve existing Phase 1A lifecycle decisions, auth redirects, deep links, and uncommitted user changes. Read the current file before applying every replacement and merge around concurrent edits.
- Retire old tab, FAB, command sheet, floating command button, and command-provider files only after the new shell is mounted and verified.
- Default to the existing Coral Ledger tokens, Instrument Sans, IBM Plex Mono, iOS `44pt` targets, Android `48dp` targets, light/dark themes, safe areas, keyboard dismissal, and reduced-motion behavior.
- Do not add snapshots.
- Do not add commit steps or commit the implementation.

---

## File Map

### Create

- `src/features/navigation/shell.ts`: Pure shell route/configuration contracts shared by routes, dock, sheets, and screens.
- `src/features/navigation/shell.test.ts`: TDD coverage for parsing, canonical links, redirects, action hrefs, settlement fallback, and the unique four-tab contract.
- `src/features/circles/screens/CirclesScreen.tsx`: Unified Groups/People tab with active-segment search and detail-only row presses.
- `src/features/profile/screens-v2/MoreScreen.tsx`: Working account, tools, appearance, and sign-out tab root.
- `src/features/settlements/screens-v2/NewSettlementScreen.tsx`: Minimal balance-backed settlement-person selector.
- `src/components/coral/CircleDock.tsx`: Custom tab bar rendered by Expo Router JavaScript tabs.
- `src/components/coral/CircleDock.test.tsx`: Focused interaction/accessibility tests for four tabs and central Add.
- `src/components/coral/GlobalActionSheet.tsx`: Five-action shell task sheet.
- `src/components/coral/GlobalActionSheet.test.tsx`: Focused action and visibility tests without snapshots.
- `src/app/(shell)/_layout.tsx`: Shell owner for tabs, dock, and action-sheet state.
- `src/app/(shell)/(home-tab)/_layout.tsx`: Home nested stack.
- `src/app/(shell)/(home-tab)/home.tsx`: Canonical `/home` wrapper.
- `src/app/(shell)/(circles-tab)/_layout.tsx`: Circles nested stack.
- `src/app/(shell)/(circles-tab)/circles.tsx`: Canonical `/circles` wrapper.
- `src/app/(shell)/(activity-tab)/_layout.tsx`: Activity nested stack.
- `src/app/(shell)/(activity-tab)/activity.tsx`: Canonical `/activity` wrapper.
- `src/app/(shell)/(more-tab)/_layout.tsx`: More nested stack and secondary-destination owner.
- `src/app/(shell)/(more-tab)/more.tsx`: Canonical `/more` wrapper.
- `src/app/(shell)/(more-tab)/analytics.tsx`: Preserved `/analytics` wrapper.
- `src/app/(shell)/(more-tab)/notifications.tsx`: Preserved `/notifications` wrapper.
- `src/app/(shell)/(more-tab)/currencies.tsx`: Preserved `/currencies` wrapper.
- `src/app/settle/new.tsx`: Focused `/settle/new` wrapper.

### Modify

- `src/app/_layout.tsx`: Register `(shell)` and remove global chrome/provider plus moved direct screens.
- `src/app/groups.tsx`: Redirect-only legacy wrapper.
- `src/app/people.tsx`: Redirect-only legacy wrapper.
- `src/app/settings.tsx`: Redirect-only legacy wrapper.
- `src/components/coral/CoralScreen.tsx`: Remove the unconditional `76px` dock allowance.
- `src/components/coral/CoralSheet.tsx`: Honor reduced motion for the new global sheet and existing sheet consumers.
- `src/components/coral/MoneyRow.tsx`: Give every pressable money row a button role and composed accessible name.
- `src/components/coral/index.ts`: Export new shell components and remove retired exports.
- `src/features/friends/hooks/useFriendsList.ts`: Expose balance rows and include all row-source queries in loading, error, and retry state.
- `src/features/friends/queries/useFriends.ts`: Expose direct-friend query `isError` and `refetch` to composed consumers.
- `src/features/groups/hooks/useGroupsList.ts`: Include balance-source hydration in Groups loading, error, retry, and refresh states.
- `src/features/profile/screens-v2/SettingsScreen.tsx`: Temporarily re-export the working More screen until the legacy `/settings` wrapper becomes a redirect, then delete it.
- `src/features/notifications/screens-v2/NotificationsScreen.tsx`: Remove inert Mark All Read and show real loading/error states.
- `src/features/currencies/screens-v2/CurrenciesScreen.tsx`: Remove the inert expense-date conversion switch and unsupported correction copy.
- `src/features/dashboard/hooks/useDashboard.ts`: Use canonical shell links and settlement fallback.
- `src/features/activity/screens-v2/ActivityScreen.tsx`: Remove obsolete root-stack back/context chrome from the stable Activity tab root.
- `src/features/friends/screens-v2/NewFriendScreen.tsx`: Use canonical People segment fallback.
- `src/features/friends/screens-v2/FriendDetailScreen.tsx`: Use canonical People segment fallback.

### Move Without Content Changes

- `src/app/home.tsx` -> `src/app/(shell)/(home-tab)/home.tsx`
- `src/app/activity.tsx` -> `src/app/(shell)/(activity-tab)/activity.tsx`
- `src/app/analytics.tsx` -> `src/app/(shell)/(more-tab)/analytics.tsx`
- `src/app/notifications.tsx` -> `src/app/(shell)/(more-tab)/notifications.tsx`
- `src/app/currencies.tsx` -> `src/app/(shell)/(more-tab)/currencies.tsx`

### Delete Only After Shell Verification

- `src/app/home.tsx`
- `src/app/activity.tsx`
- `src/app/analytics.tsx`
- `src/app/notifications.tsx`
- `src/app/currencies.tsx`
- `src/components/coral/CoralTabBar.tsx`
- `src/components/coral/CoralPillBar.tsx`
- `src/components/coral/CommandSheet.tsx`
- `src/components/coral/FloatingCommandButton.tsx`
- `src/features/navigation/CommandNavigationProvider.tsx`
- `src/features/navigation/useCommandNavigation.ts`
- `src/features/profile/screens-v2/SettingsScreen.tsx`

---

### Task 1: Lock the Pure Navigation Contract With TDD

**Files:**

- Create: `src/features/navigation/shell.test.ts`
- Create: `src/features/navigation/shell.ts`

**Interfaces:**

- Consumes: `Href` from `expo-router` only as a compile-time type.
- Produces: `CircleSegment`, `ShellTabKey`, `ShellTabRouteName`, `GlobalActionId`, `SHELL_HREFS`, `SHELL_TABS`, `LEGACY_REDIRECT_HREFS`, `GLOBAL_ACTIONS`, `parseCircleSegment(value)`, `legacyRedirectHref(route)`, and `settlementHref(friendId)` with the exact signatures below.

- [ ] **Step 1: Write the failing pure contract tests**

Create `src/features/navigation/shell.test.ts`:

```ts
import {
  GLOBAL_ACTIONS,
  LEGACY_REDIRECT_HREFS,
  SHELL_HREFS,
  SHELL_TABS,
  legacyRedirectHref,
  parseCircleSegment,
  settlementHref,
} from "./shell";

describe("Circle Dock navigation contract", () => {
  it.each([
    [undefined, "groups"],
    ["", "groups"],
    ["groups", "groups"],
    ["people", "people"],
    ["unexpected", "groups"],
    [["people", "groups"], "people"],
  ] as const)("parses circle segment %p as %s", (value, expected) => {
    expect(parseCircleSegment(value)).toBe(expected);
  });

  it("defines the canonical shell and secondary links", () => {
    expect(SHELL_HREFS).toEqual({
      home: "/home",
      circles: "/circles",
      circlesGroups: "/circles?segment=groups",
      circlesPeople: "/circles?segment=people",
      activity: "/activity",
      more: "/more",
      analytics: "/analytics",
      notifications: "/notifications",
      currencies: "/currencies",
      settleNew: "/settle/new",
    });
  });

  it("defines exact legacy redirects", () => {
    expect(LEGACY_REDIRECT_HREFS).toEqual({
      groups: "/circles?segment=groups",
      people: "/circles?segment=people",
      settings: "/more",
    });
    expect(legacyRedirectHref("groups")).toBe("/circles?segment=groups");
    expect(legacyRedirectHref("people")).toBe("/circles?segment=people");
    expect(legacyRedirectHref("settings")).toBe("/more");
  });

  it("defines five working global actions", () => {
    expect(GLOBAL_ACTIONS).toEqual([
      { id: "add-expense", label: "Add expense", href: "/expense/new" },
      { id: "settle-up", label: "Settle up", href: "/settle/new" },
      { id: "create-group", label: "Create group", href: "/group/new" },
      { id: "add-person", label: "Add person", href: "/friend/new" },
      { id: "schedule-expense", label: "Schedule expense", href: "/recurring/new" },
    ]);
  });

  it("falls back to the selector instead of creating settle/undefined", () => {
    expect(settlementHref()).toBe("/settle/new");
    expect(settlementHref(null)).toBe("/settle/new");
    expect(settlementHref("   ")).toBe("/settle/new");
    expect(settlementHref("friend-42")).toEqual({
      pathname: "/settle/[id]",
      params: { id: "friend-42" },
    });
    expect(JSON.stringify(settlementHref())).not.toContain("undefined");
  });

  it("contains four unique stable tabs and no Add route", () => {
    expect(SHELL_TABS).toHaveLength(4);
    expect(SHELL_TABS.map((tab) => tab.key)).toEqual(["home", "circles", "activity", "more"]);
    expect(new Set(SHELL_TABS.map((tab) => tab.key)).size).toBe(4);
    expect(new Set(SHELL_TABS.map((tab) => tab.routeName)).size).toBe(4);
    expect(new Set(SHELL_TABS.map((tab) => tab.href)).size).toBe(4);
    expect(SHELL_TABS.some((tab) => String(tab.key).toLowerCase() === "add")).toBe(false);
    expect(SHELL_TABS.some((tab) => String(tab.routeName).toLowerCase().includes("add"))).toBe(
      false
    );
  });
});
```

- [ ] **Step 2: Run the contract tests and verify RED**

Run:

```bash
npm test -- --runInBand src/features/navigation/shell.test.ts
```

Expected: FAIL with `Cannot find module './shell'`.

- [ ] **Step 3: Implement the complete pure navigation contract**

Create `src/features/navigation/shell.ts`:

```ts
import type { Href } from "expo-router";

export type CircleSegment = "groups" | "people";
export type ShellTabKey = "home" | "circles" | "activity" | "more";
export type ShellTabRouteName = "(home-tab)" | "(circles-tab)" | "(activity-tab)" | "(more-tab)";
export type LegacyShellRoute = "groups" | "people" | "settings";
export type GlobalActionId =
  "add-expense" | "settle-up" | "create-group" | "add-person" | "schedule-expense";

export const SHELL_HREFS = {
  home: "/home",
  circles: "/circles",
  circlesGroups: "/circles?segment=groups",
  circlesPeople: "/circles?segment=people",
  activity: "/activity",
  more: "/more",
  analytics: "/analytics",
  notifications: "/notifications",
  currencies: "/currencies",
  settleNew: "/settle/new",
} as const;

export const SHELL_TABS: readonly {
  key: ShellTabKey;
  routeName: ShellTabRouteName;
  label: string;
  href: Href;
}[] = [
  { key: "home", routeName: "(home-tab)", label: "Home", href: SHELL_HREFS.home },
  {
    key: "circles",
    routeName: "(circles-tab)",
    label: "Circles",
    href: SHELL_HREFS.circles,
  },
  {
    key: "activity",
    routeName: "(activity-tab)",
    label: "Activity",
    href: SHELL_HREFS.activity,
  },
  { key: "more", routeName: "(more-tab)", label: "More", href: SHELL_HREFS.more },
];

export const LEGACY_REDIRECT_HREFS: Record<LegacyShellRoute, Href> = {
  groups: SHELL_HREFS.circlesGroups,
  people: SHELL_HREFS.circlesPeople,
  settings: SHELL_HREFS.more,
};

export const GLOBAL_ACTIONS: readonly {
  id: GlobalActionId;
  label: string;
  href: Href;
}[] = [
  { id: "add-expense", label: "Add expense", href: "/expense/new" },
  { id: "settle-up", label: "Settle up", href: SHELL_HREFS.settleNew },
  { id: "create-group", label: "Create group", href: "/group/new" },
  { id: "add-person", label: "Add person", href: "/friend/new" },
  { id: "schedule-expense", label: "Schedule expense", href: "/recurring/new" },
];

export function parseCircleSegment(value: string | string[] | undefined): CircleSegment {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "people" ? "people" : "groups";
}

export function legacyRedirectHref(route: LegacyShellRoute): Href {
  return LEGACY_REDIRECT_HREFS[route];
}

export function settlementHref(friendId?: string | null): Href {
  const id = friendId?.trim();
  if (!id) return SHELL_HREFS.settleNew;
  return { pathname: "/settle/[id]", params: { id } };
}
```

- [ ] **Step 4: Run the contract tests and verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/navigation/shell.test.ts
```

Expected: PASS, 11 tests.

- [ ] **Step 5: Format and re-run the focused test**

Run:

```bash
npx prettier --write src/features/navigation/shell.ts src/features/navigation/shell.test.ts
npm test -- --runInBand src/features/navigation/shell.test.ts
```

Expected: both files format successfully; test suite PASS.

---

### Task 2: Build the Real Circles Screen

**Files:**

- Modify: `src/features/friends/hooks/useFriendsList.ts`
- Modify: `src/features/friends/queries/useFriends.ts`
- Modify: `src/features/groups/hooks/useGroupsList.ts`
- Modify: `src/components/coral/MoneyRow.tsx`
- Create: `src/features/circles/screens/CirclesScreen.tsx`

**Interfaces:**

- Consumes: `parseCircleSegment(value: string | string[] | undefined): "groups" | "people"`, `SHELL_HREFS.circlesGroups`, `SHELL_HREFS.circlesPeople`, `useGroupsList(): UseGroupsListReturn`, and `useFriendsList()`.
- Produces: default `CirclesScreen(): JSX.Element`; both list hooks wait for every balance source before presenting money rows; `useFriendsList()` additionally returns `friendRows: FriendListItem[]`.

- [ ] **Step 1: Correct the friends-list loading/data interface**

In `src/features/friends/queries/useFriends.ts`, replace the returned object from `useFriends` with:

```ts
return {
  data: combinedFriends,
  isLoading: friendsQuery.isLoading || isLoadingGroups,
  isError: friendsQuery.isError,
  error: friendsQuery.error,
  refetch: friendsQuery.refetch,
};
```

In `src/features/friends/hooks/useFriendsList.ts`, replace the expense and settlement query destructuring blocks exactly:

```ts
const {
  data: expenses = [],
  isLoading: isLoadingExpenses,
  isError: isExpensesError,
  refetch: refetchExpenses,
} = useUserExpenses(currentUser?.id);
const {
  data: settlements = [],
  isLoading: isLoadingSettlements,
  isError: isSettlementsError,
  refetch: refetchSettlements,
} = useUserSettlements(currentUser?.id);
const {
  data: friends = [],
  isLoading: isLoadingFriends,
  isError: isFriendsError,
  refetch: refetchFriends,
} = useFriends(currentUser?.id);
const {
  data: allFriendships = [],
  isLoading: isLoadingFriendships,
  isError: isFriendshipsError,
  refetch: refetchFriendships,
} = useAllFriendships(currentUser?.id);
```

Replace the `isLoading` declaration exactly:

```ts
const isLoading =
  isLoadingGroups ||
  isLoadingFriends ||
  isLoadingFriendships ||
  isLoadingExpenses ||
  isLoadingSettlements;
```

Delete the original one-line `useFriends(...)` and `useAllFriendships(...)` declarations because the replacement block above owns both queries.

Replace the `isError` declaration with:

```ts
const isError =
  isGroupsError || isFriendsError || isFriendshipsError || isExpensesError || isSettlementsError;
```

Replace `refetchAll` completely:

```ts
const refetchAll = useCallback(() => {
  if (isGroupsError) void refetchGroups();
  if (isFriendsError) void refetchFriends();
  if (isFriendshipsError) void refetchFriendships();
  if (isExpensesError) void refetchExpenses();
  if (isSettlementsError) void refetchSettlements();
}, [
  isGroupsError,
  isFriendsError,
  isFriendshipsError,
  isExpensesError,
  isSettlementsError,
  refetchGroups,
  refetchFriends,
  refetchFriendships,
  refetchExpenses,
  refetchSettlements,
]);
```

Add `friendRows` immediately before `displayRows` in the returned object:

```ts
    friendRows,
    displayRows,
```

- [ ] **Step 2: Make Groups wait for its balance sources**

In `src/features/groups/hooks/useGroupsList.ts`, replace all three query destructuring blocks with:

```ts
const {
  data: groups = [],
  isLoading: isLoadingGroups,
  isError: isGroupsError,
  refetch: refetchGroups,
} = useGroups(currentUser?.id);
const {
  data: expenses = [],
  isLoading: isLoadingExpenses,
  isError: isExpensesError,
  refetch: refetchExpenses,
} = useUserExpenses(currentUser?.id);
const {
  data: settlements = [],
  isLoading: isLoadingSettlements,
  isError: isSettlementsError,
  refetch: refetchSettlements,
} = useUserSettlements(currentUser?.id);

const isLoading = isLoadingGroups || isLoadingExpenses || isLoadingSettlements;
const isError = isGroupsError || isExpensesError || isSettlementsError;
```

Immediately before the returned object, add:

```ts
const refetch = useCallback(() => {
  void Promise.all([refetchGroups(), refetchExpenses(), refetchSettlements()]);
}, [refetchExpenses, refetchGroups, refetchSettlements]);
```

Replace `onRefresh` completely so pull-to-refresh updates the same balance snapshot:

```ts
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  try {
    await Promise.all([refetchGroups(), refetchExpenses(), refetchSettlements()]);
  } finally {
    setRefreshing(false);
  }
}, [refetchExpenses, refetchGroups, refetchSettlements]);
```

Delete the now-unused `useQueryClient` import and `const queryClient = useQueryClient();` declaration.

In the returned object, replace `refetch: refetchGroups` with:

```ts
refetch,
```

- [ ] **Step 3: Make shared pressable money rows accessible**

In `src/components/coral/MoneyRow.tsx`, add this optional prop to `MoneyRowProps`:

```ts
accessibilityLabel?: string;
```

Add `accessibilityLabel,` immediately after `rightElement,` in the function parameter destructuring, then replace the pressable return block with:

```tsx
if (onPress) {
  const accessibleName = accessibilityLabel ?? [title, subtitle, amount].filter(Boolean).join(", ");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibleName}
      onPress={onPress}
      style={{ width: "100%" }}
    >
      {content}
    </Pressable>
  );
}
```

- [ ] **Step 4: Create the complete Circles screen**

Create `src/features/circles/screens/CirclesScreen.tsx`:

```tsx
import type { JSX, ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralButton,
  CoralScreen,
  CoralSearchField,
  CoralSegment,
  CoralTopBar,
  Eyebrow,
  LargeTitle,
  MoneyRow,
} from "@/components/coral";
import { useUI } from "@/components/ui";
import { useFriendsList, type DisplayItem } from "@/features/friends/hooks/useFriendsList";
import { useGroupsList } from "@/features/groups/hooks/useGroupsList";
import { parseCircleSegment, SHELL_HREFS, type CircleSegment } from "@/features/navigation/shell";

const SEGMENTS = [
  { label: "Groups", value: "groups" },
  { label: "People", value: "people" },
] as const;

function CenteredState({ children }: { children: ReactNode }) {
  return (
    <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
      {children}
    </View>
  );
}

function signedAmount(amount: number, currency: string): string {
  if (amount > 0) return `+${formatAmount(amount, currency)}`;
  if (amount < 0) return `-${formatAmount(Math.abs(amount), currency)}`;
  return formatAmount(0, currency);
}

export default function CirclesScreen(): JSX.Element {
  const params = useLocalSearchParams<{ segment?: string | string[] }>();
  const router = useRouter();
  const { color } = useUI();
  const segment = parseCircleSegment(params.segment);
  const groups = useGroupsList();
  const people = useFriendsList();

  const search = segment === "groups" ? groups.search : people.search;
  const setSearch = segment === "groups" ? groups.setSearch : people.setSearch;
  const isLoading = segment === "groups" ? groups.isLoading : people.isLoading;
  const isError = segment === "groups" ? groups.isError : people.isError;

  const selectSegment = (next: CircleSegment) => {
    router.setParams({ segment: next });
  };

  const retry = () => {
    if (segment === "groups") {
      groups.refetch();
    } else {
      people.refetchAll();
    }
  };

  const renderPersonItem = (item: DisplayItem) => {
    if (item.kind === "section") {
      return <Eyebrow key={item.id}>{`${item.title} · ${item.count}`}</Eyebrow>;
    }

    const { friend, balance, recentExpense } = item.item;
    const subtitle =
      balance > 0
        ? `${friend.name.split(" ")[0]} owes you ${formatAmount(balance, people.preferredCurrency.code)}`
        : balance < 0
          ? `You owe ${friend.name.split(" ")[0]} ${formatAmount(Math.abs(balance), people.preferredCurrency.code)}`
          : (recentExpense?.title ?? "Settled");

    return (
      <MoneyRow
        key={item.id}
        avatar={<AppUserAvatar user={friend} size="sm" />}
        title={friend.name}
        subtitle={subtitle}
        amount={
          Math.abs(balance) <= 0.005
            ? "Settled"
            : signedAmount(balance, people.preferredCurrency.code)
        }
        amountTone={balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral"}
        onPress={() => router.push({ pathname: "/friend/[id]", params: { id: friend.id } })}
      />
    );
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Circles" />
      <LargeTitle>Your circles.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: color.muted,
          marginBottom: 16,
        }}
      >
        Groups and people with shared money.
      </Text>

      <CoralSegment
        options={[...SEGMENTS]}
        selected={segment}
        onSelect={(value) => selectSegment(value as CircleSegment)}
      />

      <CoralSearchField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder={segment === "groups" ? "Search groups" : "Search people"}
        style={{ marginTop: 14, marginBottom: 8 }}
      />

      {isError ? (
        <CenteredState>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
            Could not load {segment}.
          </Text>
          <CoralButton label="Try again" variant="secondary" onPress={retry} />
        </CenteredState>
      ) : isLoading ? (
        <CenteredState>
          <ActivityIndicator color={color.text} accessibilityLabel={`Loading ${segment}`} />
        </CenteredState>
      ) : segment === "groups" ? (
        groups.filtered.length > 0 ? (
          <>
            <Eyebrow>{`${groups.filtered.length} groups`}</Eyebrow>
            {groups.filtered.map(({ group, netBalance }) => {
              const subtitle =
                netBalance > 0
                  ? `You are owed ${formatAmount(netBalance, groups.preferredCurrencyCode)}`
                  : netBalance < 0
                    ? `You owe ${formatAmount(Math.abs(netBalance), groups.preferredCurrencyCode)}`
                    : "Settled";

              return (
                <MoneyRow
                  key={group.id}
                  avatar={<GroupIconBadge group={group} size="sm" />}
                  title={group.name}
                  subtitle={`${group.members.length} people · ${subtitle}`}
                  amount={
                    Math.abs(netBalance) <= 0.005
                      ? "Settled"
                      : signedAmount(netBalance, groups.preferredCurrencyCode)
                  }
                  amountTone={netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral"}
                  onPress={() => groups.handleGroupPress(group.id)}
                />
              );
            })}
          </>
        ) : (
          <CenteredState>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 15,
                color: color.muted,
              }}
            >
              {search ? "No groups match your search." : "No groups yet."}
            </Text>
          </CenteredState>
        )
      ) : people.displayRows.length > 0 ? (
        people.displayRows.map(renderPersonItem)
      ) : (
        <CenteredState>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 15,
              color: color.muted,
            }}
          >
            {search ? "No people match your search." : "No people yet."}
          </Text>
        </CenteredState>
      )}

      <View style={{ marginTop: 20 }}>
        <CoralButton
          label={segment === "groups" ? "Create group" : "Add person"}
          variant="secondary"
          onPress={() => router.push(segment === "groups" ? "/group/new" : "/friend/new")}
        />
      </View>
    </CoralScreen>
  );
}
```

- [ ] **Step 5: Verify format and lint boundaries for Circles**

Run:

```bash
npx prettier --write src/components/coral/MoneyRow.tsx src/features/friends/hooks/useFriendsList.ts src/features/friends/queries/useFriends.ts src/features/groups/hooks/useGroupsList.ts src/features/circles/screens/CirclesScreen.tsx
npx eslint src/components/coral/MoneyRow.tsx src/features/friends/hooks/useFriendsList.ts src/features/friends/queries/useFriends.ts src/features/groups/hooks/useGroupsList.ts src/features/circles/screens/CirclesScreen.tsx
```

Expected: Prettier writes all five files and ESLint exits 0. Defer full typecheck until Task 6 creates the canonical `/circles`, `/more`, and `/settle/new` wrappers and regenerates Expo's typed-route declaration.

- [ ] **Step 6: Manually validate direct row semantics after the route is mounted in Task 6**

At both `/circles?segment=groups` and `/circles?segment=people`, search for one item and press its row.

Expected: group rows open `/group/<id>`; person rows open `/friend/<id>` regardless of positive, negative, or settled balance. No Share sheet, settlement screen, or expense composer opens from a Circles row.

---

### Task 3: Replace Inert Settings With a Working More Screen

**Files:**

- Create: `src/features/profile/screens-v2/MoreScreen.tsx`
- Modify temporarily: `src/features/profile/screens-v2/SettingsScreen.tsx`
- Modify: `src/features/notifications/screens-v2/NotificationsScreen.tsx`
- Modify: `src/features/currencies/screens-v2/CurrenciesScreen.tsx`

**Interfaces:**

- Consumes: `SHELL_HREFS.analytics`, `SHELL_HREFS.notifications`, `SHELL_HREFS.currencies`, `useProfile()`, and `useUIStore()` theme state.
- Produces: default `MoreScreen(): JSX.Element` with only working actions; Notifications and Currencies expose no inert buttons/switches.

- [ ] **Step 1: Create the complete More implementation**

Create `src/features/profile/screens-v2/MoreScreen.tsx`:

```tsx
import type { JSX, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";

import {
  CoralButton,
  CoralScreen,
  CoralSegment,
  CoralTopBar,
  Eyebrow,
  LargeTitle,
} from "@/components/coral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { SHELL_HREFS } from "@/features/navigation/shell";
import { useUIStore, type ThemePreference } from "@/store/useUIStore";

interface MoreRowProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  left?: ReactNode;
}

const APPEARANCE_OPTIONS = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

function MoreRow({ title, subtitle, onPress, left }: MoreRowProps) {
  const { color } = useUI();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            color: color.text,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            color: color.muted,
            marginTop: 3,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
    </Pressable>
  );
}

export default function MoreScreen(): JSX.Element {
  const router = useRouter();
  const { color } = useUI();
  const { currentUser, preferredCurrency, signOut } = useProfile();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <CoralScreen>
      <CoralTopBar title="More" />
      <LargeTitle>More.</LargeTitle>

      <Eyebrow>Your account</Eyebrow>
      <MoreRow
        title={currentUser.name || "Profile"}
        subtitle="Edit your name and avatar"
        left={currentUser.id ? <AppUserAvatar user={currentUser} size="sm" /> : undefined}
        onPress={() => router.push("/profile/edit")}
      />
      <MoreRow
        title="Change password"
        subtitle="Update your account password"
        onPress={() => router.push("/profile/change-password")}
      />
      <MoreRow
        title="Notifications"
        subtitle="Requests and account events"
        onPress={() => router.push(SHELL_HREFS.notifications)}
      />

      <Eyebrow>Money tools</Eyebrow>
      <MoreRow
        title="Insights"
        subtitle="Spending trends and categories"
        onPress={() => router.push(SHELL_HREFS.analytics)}
      />
      <MoreRow
        title="Currencies"
        subtitle={`${preferredCurrency.code} home currency`}
        onPress={() => router.push(SHELL_HREFS.currencies)}
      />

      <Eyebrow>Appearance</Eyebrow>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 13,
          lineHeight: 19,
          color: color.muted,
          marginBottom: 10,
        }}
      >
        Choose how Splt looks on this device.
      </Text>
      <CoralSegment
        options={[...APPEARANCE_OPTIONS]}
        selected={theme}
        onSelect={(value) => setTheme(value as ThemePreference)}
      />

      <View style={{ marginTop: 30, marginBottom: 18 }}>
        <CoralButton label="Sign out" variant="danger" onPress={() => signOut()} />
      </View>
    </CoralScreen>
  );
}
```

- [ ] **Step 2: Keep the existing wrapper valid until the atomic route migration**

Replace `src/features/profile/screens-v2/SettingsScreen.tsx` completely with this temporary re-export:

```ts
export { default } from "./MoreScreen";
```

Task 6 deletes this re-export only after `src/app/settings.tsx` becomes a redirect and the new `/more` wrapper imports `MoreScreen` directly.

- [ ] **Step 3: Remove the fake Mark All Read control and expose real query states**

Replace `src/features/notifications/screens-v2/NotificationsScreen.tsx` completely:

```tsx
import type { JSX } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BellOff } from "lucide-react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { EmptyState } from "@/components/coral/EmptyState";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { useCoralColors } from "@/components/coral/useCoral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { useAuth } from "@/context/AppContext";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { AppNotification } from "@/types";

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsV2Screen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();
  const { currentUser } = useAuth();
  const {
    data: notifications = [],
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useNotifications(currentUser?.id);

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <CoralTopBar title="Notifications" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
            Could not load notifications.
          </Text>
          <CoralButton label="Try again" variant="secondary" onPress={() => void refetch()} />
        </View>
      </CoralScreen>
    );
  }

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Notifications" onBack={() => router.back()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListHeaderComponent={<LargeTitle>Worth knowing.</LargeTitle>}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={color.text} accessibilityLabel="Loading notifications" />
            </View>
          ) : (
            <EmptyState
              visual={<BellOff size={48} color={coral.muted} strokeWidth={1.2} />}
              title="All caught up!"
              subtitle="You have no new notifications right now."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={color.text}
          />
        }
        renderItem={({ item }: { item: AppNotification }) => {
          const dateLabel = formatRelativeDate(item.date);
          const friendUser = item.type === "friend_request" ? item.data?.friendUser : undefined;
          return (
            <MoneyRow
              avatar={friendUser ? <AppUserAvatar user={friendUser} size="md" /> : undefined}
              title={item.title}
              subtitle={`${item.subtitle} · ${dateLabel}`}
              amount=""
              amountTone="neutral"
            />
          );
        }}
      />
    </CoralScreen>
  );
}
```

- [ ] **Step 4: Remove the unsupported conversion switch from Currencies**

In `src/features/currencies/screens-v2/CurrenciesScreen.tsx`, delete everything from the second `<Eyebrow>Conversion preference</Eyebrow>` through the explanatory `</Text>` immediately before `</CoralScreen>`. The end of the component must be exactly:

```tsx
      {CURRENCIES.map((c) => {
        const isHome = preferredCurrency.code === c.code;
        const rateLabel = getExchangeLabel(c.code);
        return (
          <Pressable
            key={c.code}
            accessibilityRole="button"
            accessibilityLabel={`Use ${c.name} as home currency`}
            onPress={() => handleSelectCurrency(c)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              minHeight: 68,
              paddingVertical: 10,
              gap: 12,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: isHome ? coral.accentSoft : color.surface,
                borderWidth: isHome ? 1 : undefined,
                borderColor: isHome ? coral.accent : undefined,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: isHome ? coral.accent : color.text,
                }}
              >
                {c.symbol}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: color.text,
                }}
              >
                {c.code} · {c.name}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 13,
                  color: color.muted,
                  marginTop: 3,
                }}
              >
                {isHome ? "Home currency" : rateLabel}
              </Text>
            </View>
            {isHome ? (
              <Check size={22} color={coral.accent} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
            )}
          </Pressable>
        );
      })}
    </CoralScreen>
  );
}
```

Also remove `ScrollView` from the React Native import and replace `getExchangeLabel` so the UI does not claim a refresh timestamp the store does not track:

```ts
const getExchangeLabel = (code: string): string => {
  if (code === "USD") return "Base currency for reference rates";
  const rate = exchangeRates[code] || exchangeRates["USD"] || 1;
  return `1 USD = ${rate.toLocaleString("en-US", {
    maximumFractionDigits:
      code === "IDR" || code === "KRW" || code === "JPY" || code === "VND" ? 0 : 2,
  })} ${code}`;
};
```

- [ ] **Step 5: Format and lint More and its destinations**

Run:

```bash
npx prettier --write src/features/profile/screens-v2/MoreScreen.tsx src/features/profile/screens-v2/SettingsScreen.tsx src/features/notifications/screens-v2/NotificationsScreen.tsx src/features/currencies/screens-v2/CurrenciesScreen.tsx
npx eslint src/features/profile/screens-v2/MoreScreen.tsx src/features/profile/screens-v2/SettingsScreen.tsx src/features/notifications/screens-v2/NotificationsScreen.tsx src/features/currencies/screens-v2/CurrenciesScreen.tsx
```

Expected: focused lint exits 0. Defer full typecheck until Task 6 regenerates Expo's typed-route declaration for the new canonical routes.

---

### Task 4: Add a Safe Global Settlement Selector

**Files:**

- Create: `src/features/settlements/screens-v2/NewSettlementScreen.tsx`
- Create: `src/app/settle/new.tsx`

**Interfaces:**

- Consumes: `useFriendsList().friendRows`, `settlementHref(friendId?: string | null): Href`, and `SHELL_HREFS.circlesPeople`.
- Produces: default `NewSettlementScreen(): JSX.Element`; `/settle/new` always selects a real non-zero balance before replacing itself with `/settle/[id]`.

- [ ] **Step 1: Create the complete settlement selector screen**

Create `src/features/settlements/screens-v2/NewSettlementScreen.tsx`:

```tsx
import type { JSX } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CircleCheckBig } from "lucide-react-native";

import {
  CoralButton,
  CoralScreen,
  CoralTopBar,
  EmptyState,
  LargeTitle,
  MoneyRow,
} from "@/components/coral";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { useFriendsList } from "@/features/friends/hooks/useFriendsList";
import { SHELL_HREFS, settlementHref } from "@/features/navigation/shell";

export default function NewSettlementScreen(): JSX.Element {
  const router = useRouter();
  const { color } = useUI();
  const { friendRows, isLoading, isError, refetchAll, preferredCurrency } = useFriendsList();
  const candidates = friendRows.filter((row) => Math.abs(row.balance) > 0.005);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(SHELL_HREFS.home);
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Settle up" onBack={goBack} />
      <LargeTitle>Choose a balance.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: color.muted,
          marginBottom: 12,
        }}
      >
        Select who you are recording an external payment with.
      </Text>

      {isError ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
            Could not load balances.
          </Text>
          <CoralButton label="Try again" variant="secondary" onPress={refetchAll} />
        </View>
      ) : isLoading ? (
        <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={color.text} accessibilityLabel="Loading balances" />
        </View>
      ) : candidates.length === 0 ? (
        <EmptyState
          visual={<CircleCheckBig size={48} color={color.muted} strokeWidth={1.4} />}
          title="No open balances"
          subtitle="Everyone is settled. Open People to review your circles."
        >
          <View style={{ width: "100%", marginTop: 18 }}>
            <CoralButton
              label="View people"
              variant="secondary"
              onPress={() => router.replace(SHELL_HREFS.circlesPeople)}
            />
          </View>
        </EmptyState>
      ) : (
        candidates.map(({ friend, balance }) => {
          const isOwed = balance > 0;
          return (
            <MoneyRow
              key={friend.id}
              avatar={<AppUserAvatar user={friend} size="sm" />}
              title={friend.name}
              subtitle={
                isOwed
                  ? `${friend.name.split(" ")[0]} pays you`
                  : `You pay ${friend.name.split(" ")[0]}`
              }
              amount={formatAmount(Math.abs(balance), preferredCurrency.code)}
              amountTone={isOwed ? "positive" : "negative"}
              onPress={() => router.replace(settlementHref(friend.id))}
            />
          );
        })
      )}
    </CoralScreen>
  );
}
```

- [ ] **Step 2: Add the focused route wrapper**

Create `src/app/settle/new.tsx`:

```tsx
import NewSettlementScreen from "@/features/settlements/screens-v2/NewSettlementScreen";

export default NewSettlementScreen;
```

- [ ] **Step 3: Verify selector formatting, lint, and fallback test**

Run:

```bash
npx prettier --write src/features/settlements/screens-v2/NewSettlementScreen.tsx src/app/settle/new.tsx
npx eslint src/features/settlements/screens-v2/NewSettlementScreen.tsx src/app/settle/new.tsx
npm test -- --runInBand src/features/navigation/shell.test.ts -t "falls back"
```

Expected: focused test PASS and focused lint exits 0. Defer full typecheck until Task 6 regenerates Expo's typed-route declaration.

---

### Task 5: Build and Test CircleDock and GlobalActionSheet

**Files:**

- Create: `src/components/coral/CircleDock.test.tsx`
- Create: `src/components/coral/CircleDock.tsx`
- Create: `src/components/coral/GlobalActionSheet.test.tsx`
- Create: `src/components/coral/GlobalActionSheet.tsx`
- Modify: `src/components/coral/CoralSheet.tsx`

**Interfaces:**

- Consumes: `BottomTabBarProps` from `expo-router/js-tabs`, `SHELL_TABS`, `GLOBAL_ACTIONS`, `GlobalActionId`, Coral colors, safe-area insets supplied by the tab navigator, and `useReducedMotion()`.
- Produces: `CircleDock(props: BottomTabBarProps & { onAddPress(): void }): JSX.Element`; `GlobalActionSheet(props: { visible: boolean; onClose(): void; onActionPress(href: Href): void }): JSX.Element`.

- [ ] **Step 1: Write the failing CircleDock interaction test**

Create `src/components/coral/CircleDock.test.tsx`:

```tsx
import { fireEvent, render } from "@testing-library/react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";

import { CircleDock } from "./CircleDock";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: (state: { isDarkMode: boolean }) => unknown) =>
    selector({ isDarkMode: false }),
}));

function makeProps() {
  const routes = ["(home-tab)", "(circles-tab)", "(activity-tab)", "(more-tab)"].map(
    (name, index) => ({ key: `${index}-key`, name, params: undefined })
  );
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();
  const props = {
    state: { index: 0, routes },
    descriptors: Object.fromEntries(
      routes.map((route) => [route.key, { options: {}, route, navigation: {} }])
    ),
    navigation: { emit, navigate },
    insets: { top: 0, right: 0, bottom: 20, left: 0 },
  } as unknown as BottomTabBarProps;
  return { props, emit, navigate };
}

describe("CircleDock", () => {
  it("renders four tabs and a separate central Add button", () => {
    const onAddPress = jest.fn();
    const { props } = makeProps();
    const screen = render(<CircleDock {...props} onAddPress={onAddPress} />);

    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByLabelText("Home")).toBeTruthy();
    expect(screen.getByLabelText("Circles")).toBeTruthy();
    expect(screen.getByLabelText("Activity")).toBeTruthy();
    expect(screen.getByLabelText("More")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Add actions" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Open Add actions" }));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  it("emits tabPress and navigates to the selected stable stack", () => {
    const { props, emit, navigate } = makeProps();
    const screen = render(<CircleDock {...props} onAddPress={jest.fn()} />);

    fireEvent.press(screen.getByLabelText("Circles"));

    expect(emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "1-key",
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith("(circles-tab)", undefined);
  });
});
```

- [ ] **Step 2: Run CircleDock test and verify RED**

Run:

```bash
npm test -- --runInBand src/components/coral/CircleDock.test.tsx
```

Expected: FAIL with `Cannot find module './CircleDock'`.

- [ ] **Step 3: Implement CircleDock completely**

Create `src/components/coral/CircleDock.tsx`:

```tsx
import type { ComponentType, JSX } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import * as Haptics from "expo-haptics";
import { CirclePlus, Clock3, Home, Menu, Orbit } from "lucide-react-native";

import { SHELL_TABS, type ShellTabKey } from "@/features/navigation/shell";
import { useUIStore } from "@/store/useUIStore";
import { useCoralColors } from "./useCoral";

type DockIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const ICONS: Record<ShellTabKey, DockIcon> = {
  home: Home,
  circles: Orbit,
  activity: Clock3,
  more: Menu,
};

export type CircleDockProps = BottomTabBarProps & {
  onAddPress: () => void;
};

export function CircleDock({
  state,
  descriptors,
  navigation,
  insets,
  onAddPress,
}: CircleDockProps): JSX.Element {
  const coral = useCoralColors();
  const isDark = useUIStore((state) => state.isDarkMode);
  const targetSize = Platform.OS === "ios" ? 44 : 48;

  const tabButtons = state.routes.map((route, index) => {
    const tab = SHELL_TABS.find((item) => item.routeName === route.name);
    if (!tab) return null;
    const focused = state.index === index;
    const options = descriptors[route.key]?.options;
    const Icon = ICONS[tab.key];

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.label}
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            void Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          }
        }}
        onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          minHeight: targetSize,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          borderRadius: 12,
          opacity: pressed ? 0.62 : 1,
        })}
      >
        <Icon
          size={22}
          color={focused ? coral.foreground : coral.muted}
          strokeWidth={focused ? 2.2 : 1.7}
        />
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.15}
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 10,
            color: focused ? coral.foreground : coral.muted,
          }}
        >
          {tab.label}
        </Text>
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: coral.accent,
            opacity: focused ? 1 : 0,
          }}
        />
      </Pressable>
    );
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingTop: 20,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: "transparent",
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          minHeight: 74,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 7,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 20,
          overflow: "visible",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.28 : 0.14,
          shadowRadius: 14,
          elevation: 12,
        }}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 55}
          tint={isDark ? "dark" : "light"}
          blurReductionFactor={2}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: Platform.OS === "android" ? coral.surface : "transparent",
          }}
        />
        {tabButtons[0]}
        {tabButtons[1]}
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Add actions"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAddPress();
            }}
            style={({ pressed }) => ({
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: coral.accent,
              transform: [{ translateY: -16 }, { scale: pressed ? 0.96 : 1 }],
              shadowColor: coral.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.34,
              shadowRadius: 9,
              elevation: 10,
            })}
          >
            <CirclePlus size={28} color={coral.inkOnAccent} strokeWidth={2.2} />
          </Pressable>
        </View>
        {tabButtons[2]}
        {tabButtons[3]}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run CircleDock test and verify GREEN**

Run:

```bash
npm test -- --runInBand src/components/coral/CircleDock.test.tsx
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Write the failing GlobalActionSheet test**

Create `src/components/coral/GlobalActionSheet.test.tsx`:

```tsx
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { GlobalActionSheet } from "./GlobalActionSheet";

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn() }));

jest.mock("./CoralSheet", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    CoralSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? React.createElement(View, null, children) : null,
  };
});

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: (state: { isDarkMode: boolean }) => unknown) =>
    selector({ isDarkMode: false }),
}));

describe("GlobalActionSheet", () => {
  it("renders no actions while closed", () => {
    const screen = render(
      <GlobalActionSheet visible={false} onClose={jest.fn()} onActionPress={jest.fn()} />
    );
    expect(screen.queryByText("What would you like to do?")).toBeNull();
  });

  it("exposes all five actions and returns the selected href", () => {
    const onActionPress = jest.fn();
    const screen = render(
      <GlobalActionSheet visible onClose={jest.fn()} onActionPress={onActionPress} />
    );

    expect(screen.getByRole("button", { name: "Add expense" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settle up" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create group" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add person" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Schedule expense" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Settle up" }));
    expect(onActionPress).toHaveBeenCalledWith("/settle/new");
  });
});
```

- [ ] **Step 6: Run GlobalActionSheet test and verify RED**

Run:

```bash
npm test -- --runInBand src/components/coral/GlobalActionSheet.test.tsx
```

Expected: FAIL with `Cannot find module './GlobalActionSheet'`.

- [ ] **Step 7: Implement GlobalActionSheet completely**

Create `src/components/coral/GlobalActionSheet.tsx`:

```tsx
import type { ComponentType, JSX } from "react";
import { Pressable, Text, View } from "react-native";
import type { Href } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  CalendarPlus,
  CircleDollarSign,
  ReceiptText,
  UserPlus,
  UsersRound,
} from "lucide-react-native";

import { GLOBAL_ACTIONS, type GlobalActionId } from "@/features/navigation/shell";
import { CoralSheet } from "./CoralSheet";
import { useCoralColors } from "./useCoral";

type ActionIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const ICONS: Record<GlobalActionId, ActionIcon> = {
  "add-expense": ReceiptText,
  "settle-up": CircleDollarSign,
  "create-group": UsersRound,
  "add-person": UserPlus,
  "schedule-expense": CalendarPlus,
};

export interface GlobalActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onActionPress: (href: Href) => void;
}

export function GlobalActionSheet({
  visible,
  onClose,
  onActionPress,
}: GlobalActionSheetProps): JSX.Element {
  const coral = useCoralColors();

  return (
    <CoralSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 22,
            letterSpacing: -0.025 * 22,
            color: coral.foreground,
          }}
        >
          What would you like to do?
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 14,
            lineHeight: 20,
            color: coral.muted,
            marginTop: 6,
            marginBottom: 14,
          }}
        >
          Choose an action. People and groups are selected inside the focused flow.
        </Text>

        {GLOBAL_ACTIONS.map((action) => {
          const Icon = ICONS[action.id];
          const primary = action.id === "add-expense";
          return (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                void Haptics.selectionAsync();
                onActionPress(action.href);
              }}
              style={({ pressed }) => ({
                minHeight: 56,
                flexDirection: "row",
                alignItems: "center",
                gap: 13,
                paddingHorizontal: 14,
                marginBottom: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: primary ? coral.accent : coral.border,
                backgroundColor: primary ? coral.accent : coral.surface,
                opacity: pressed ? 0.68 : 1,
              })}
            >
              <Icon
                size={22}
                color={primary ? coral.inkOnAccent : coral.foreground}
                strokeWidth={1.9}
              />
              <Text
                style={{
                  flex: 1,
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: primary ? coral.inkOnAccent : coral.foreground,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Add actions"
          onPress={onClose}
          style={({ pressed }) => ({
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 15,
              color: coral.muted,
            }}
          >
            Close
          </Text>
        </Pressable>
      </View>
    </CoralSheet>
  );
}
```

- [ ] **Step 8: Make CoralSheet reduced-motion safe**

In `src/components/coral/CoralSheet.tsx`, add this import:

```ts
import { useReducedMotion } from "@/utils/useReducedMotion";
```

After `const coral = useCoralColors();`, add:

```ts
const reduceMotion = useReducedMotion();
```

Replace the entire `animateOut` callback with:

```ts
const animateOut = useCallback(
  (callback?: () => void) => {
    if (reduceMotion) {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      setModalVisible(false);
      callback?.();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      callback?.();
    });
  },
  [backdropOpacity, reduceMotion, translateY]
);
```

Inside the opening branch of the effect, immediately after `setModalVisible(true);`, insert:

```ts
if (reduceMotion) {
  translateY.setValue(0);
  backdropOpacity.setValue(1);
  prevVisible.current = visible;
  return;
}
```

Add `reduceMotion` and `visible` to that effect's dependency list. The final list must be:

```ts
  }, [visible, animateOut, translateY, backdropOpacity, reduceMotion]);
```

- [ ] **Step 9: Run both component suites and verify GREEN**

Run:

```bash
npx prettier --write src/components/coral/CircleDock.tsx src/components/coral/CircleDock.test.tsx src/components/coral/GlobalActionSheet.tsx src/components/coral/GlobalActionSheet.test.tsx src/components/coral/CoralSheet.tsx
npm test -- --runInBand src/components/coral/CircleDock.test.tsx src/components/coral/GlobalActionSheet.test.tsx
npx eslint src/components/coral/CircleDock.tsx src/components/coral/GlobalActionSheet.tsx src/components/coral/CoralSheet.tsx
```

Expected: 2 suites PASS, 4 tests PASS, and focused lint exits 0. Defer full typecheck until Task 6 regenerates Expo's typed-route declaration.

---

### Task 6: Mount the Pathless Four-Stack Shell and Move Public Wrappers Atomically

**Files:**

- Create: all files under `src/app/(shell)/` listed in the File Map
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/groups.tsx`
- Modify: `src/app/people.tsx`
- Modify: `src/app/settings.tsx`
- Delete after corresponding destination exists: root `home.tsx`, `activity.tsx`, `analytics.tsx`, `notifications.tsx`, `currencies.tsx`

**Interfaces:**

- Consumes: `CircleDock`, `GlobalActionSheet`, `SHELL_TABS`, `legacyRedirectHref`, `CirclesScreen`, `MoreScreen`, and existing V2 destination screens.
- Produces: one pathless `(shell)` route group with four stable nested stacks and no Add tab; canonical URLs and compatibility redirects listed in Global Constraints.

- [ ] **Step 1: Create the shell owner**

Create `src/app/(shell)/_layout.tsx`:

```tsx
import type { JSX } from "react";
import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import Tabs from "expo-router/js-tabs";

import { CircleDock } from "@/components/coral/CircleDock";
import { GlobalActionSheet } from "@/components/coral/GlobalActionSheet";
import { useCoralColors } from "@/components/coral/useCoral";
import { SHELL_TABS } from "@/features/navigation/shell";
import { useReducedMotion } from "@/utils/useReducedMotion";

export default function ShellLayout(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const reduceMotion = useReducedMotion();
  const [actionsVisible, setActionsVisible] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: coral.bg }}>
      <Tabs
        initialRouteName="(home-tab)"
        tabBar={(props) => <CircleDock {...props} onAddPress={() => setActionsVisible(true)} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          animation: reduceMotion ? "none" : "fade",
          sceneStyle: { backgroundColor: coral.bg },
        }}
      >
        {SHELL_TABS.map((tab) => (
          <Tabs.Screen
            key={tab.key}
            name={tab.routeName}
            options={{
              title: tab.label,
              href: tab.href,
              tabBarAccessibilityLabel: tab.label,
            }}
          />
        ))}
      </Tabs>
      <GlobalActionSheet
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        onActionPress={(href) => {
          setActionsVisible(false);
          router.push(href);
        }}
      />
    </View>
  );
}
```

- [ ] **Step 2: Create the four nested stack layouts**

Create `src/app/(shell)/(home-tab)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function HomeTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
    </Stack>
  );
}
```

Create `src/app/(shell)/(circles-tab)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function CirclesTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="circles" />
    </Stack>
  );
}
```

Create `src/app/(shell)/(activity-tab)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function ActivityTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="activity" />
    </Stack>
  );
}
```

Create `src/app/(shell)/(more-tab)/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function MoreTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="more" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="currencies" />
    </Stack>
  );
}
```

- [ ] **Step 3: Create all explicit shell leaf wrappers before deleting originals**

Create `src/app/(shell)/(home-tab)/home.tsx`:

```tsx
import MoneyMapScreen from "@/features/dashboard/screens-v2/MoneyMapScreen";

export default MoneyMapScreen;
```

Create `src/app/(shell)/(circles-tab)/circles.tsx`:

```tsx
import CirclesScreen from "@/features/circles/screens/CirclesScreen";

export default CirclesScreen;
```

Create `src/app/(shell)/(activity-tab)/activity.tsx`:

```tsx
import ActivityScreen from "@/features/activity/screens-v2/ActivityScreen";

export default ActivityScreen;
```

Create `src/app/(shell)/(more-tab)/more.tsx`:

```tsx
import MoreScreen from "@/features/profile/screens-v2/MoreScreen";

export default MoreScreen;
```

Create `src/app/(shell)/(more-tab)/analytics.tsx`:

```tsx
import AnalyticsScreen from "@/features/analytics/screens-v2/AnalyticsScreen";

export default AnalyticsScreen;
```

Create `src/app/(shell)/(more-tab)/notifications.tsx`:

```tsx
import NotificationsV2Screen from "@/features/notifications/screens-v2/NotificationsScreen";

export default NotificationsV2Screen;
```

Create `src/app/(shell)/(more-tab)/currencies.tsx`:

```tsx
import CurrenciesScreen from "@/features/currencies/screens-v2/CurrenciesScreen";

export default CurrenciesScreen;
```

- [ ] **Step 4: Replace the root layout with root-stack-only ownership**

Replace `src/app/_layout.tsx` completely:

```tsx
import { Stack, SplashScreen } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from "@expo-google-fonts/ibm-plex-mono";
import * as SystemUI from "expo-system-ui";
import { Uniwind } from "uniwind";

import { CORAL_COLORS } from "@/components/coral/theme";
import { AppProvider } from "@/providers/AppProvider";
import { useUIStore } from "@/store/useUIStore";
import "../global.css";

export { ErrorFallback as ErrorBoundary } from "@/components/feedback/ErrorFallback";

void SplashScreen.preventAutoHideAsync();

const TextComponent = Text as typeof Text & { defaultProps?: Record<string, unknown> };
const TextInputComponent = TextInput as typeof TextInput & {
  defaultProps?: Record<string, unknown>;
};

TextComponent.defaultProps = {
  ...TextComponent.defaultProps,
  maxFontSizeMultiplier: 1.3,
};
TextInputComponent.defaultProps = {
  ...TextInputComponent.defaultProps,
  maxFontSizeMultiplier: 1.3,
};

export default function RootLayout(): JSX.Element | null {
  const [loaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const backgroundColor = isDarkMode ? CORAL_COLORS.dark.bg : CORAL_COLORS.light.bg;

  Uniwind.setTheme(isDarkMode ? "dark" : "light");

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <Stack
        key={isDarkMode ? "dark" : "light"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(shell)" options={{ animation: "fade" }} />

        <Stack.Screen name="onboarding" />
        <Stack.Screen name="profile-setup" />
        <Stack.Screen name="first-action" />
        <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
        <Stack.Screen name="verify-email" />

        <Stack.Screen name="groups" />
        <Stack.Screen name="people" />
        <Stack.Screen name="settings" />

        <Stack.Screen name="friend/[id]" />
        <Stack.Screen name="friend/new" />

        <Stack.Screen name="group/[id]" />
        <Stack.Screen name="group/[id]/settings" />
        <Stack.Screen name="group/new" />

        <Stack.Screen name="expense/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="expense/new" />

        <Stack.Screen name="settle/new" />
        <Stack.Screen name="settle/[id]" options={{ presentation: "modal" }} />

        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/change-password" />

        <Stack.Screen name="recurring/index" />
        <Stack.Screen name="recurring/[id]" />
        <Stack.Screen name="recurring/[id]/edit" />
        <Stack.Screen name="recurring/new" />
      </Stack>
    </AppProvider>
  );
}
```

- [ ] **Step 5: Replace all three legacy wrappers with exact redirects**

Replace `src/app/groups.tsx`:

```tsx
import { Redirect } from "expo-router";

import { legacyRedirectHref } from "@/features/navigation/shell";

export default function LegacyGroupsRedirect() {
  return <Redirect href={legacyRedirectHref("groups")} />;
}
```

Replace `src/app/people.tsx`:

```tsx
import { Redirect } from "expo-router";

import { legacyRedirectHref } from "@/features/navigation/shell";

export default function LegacyPeopleRedirect() {
  return <Redirect href={legacyRedirectHref("people")} />;
}
```

Replace `src/app/settings.tsx`:

```tsx
import { Redirect } from "expo-router";

import { legacyRedirectHref } from "@/features/navigation/shell";

export default function LegacySettingsRedirect() {
  return <Redirect href={legacyRedirectHref("settings")} />;
}
```

- [ ] **Step 6: Delete the five original wrappers in the same edit**

Delete:

```text
src/app/home.tsx
src/app/activity.tsx
src/app/analytics.tsx
src/app/notifications.tsx
src/app/currencies.tsx
```

Also delete the now-unreferenced temporary re-export:

```text
src/features/profile/screens-v2/SettingsScreen.tsx
```

Do not pause between Steps 3 and 6 for a review or handoff. The intended completed-task state has exactly one wrapper for each moved URL.

- [ ] **Step 7: Verify route source uniqueness before starting Metro**

Run:

```bash
for route in home activity analytics notifications currencies; do count=$(rg --files src/app | rg "/${route}\.tsx$" | wc -l | tr -d ' '); test "$count" = "1" || { printf '%s has %s wrappers\n' "$route" "$count"; exit 1; }; done
test "$(rg --files 'src/app/(shell)' | rg '/index\.tsx$' | wc -l | tr -d ' ')" = "0"
```

Expected: both shell assertions exit 0 with no output. Exactly these paths remain for moved wrappers:

```text
src/app/(shell)/(home-tab)/home.tsx
src/app/(shell)/(activity-tab)/activity.tsx
src/app/(shell)/(more-tab)/analytics.tsx
src/app/(shell)/(more-tab)/notifications.tsx
src/app/(shell)/(more-tab)/currencies.tsx
```

- [ ] **Step 8: Start Expo and verify route manifest/runtime resolution**

Run:

```bash
npx expo start --clear
```

Expected: Metro starts without `A navigator can only contain Screen`, duplicate route, unmatched route, or missing default export errors. Open `/home`, `/circles`, `/activity`, `/more`, `/analytics`, `/notifications`, and `/currencies`; each resolves once and the Circle Dock remains mounted.

- [ ] **Step 9: Typecheck after Expo regenerates the route declaration**

After Metro reports ready and `.expo/types/router.d.ts` contains `/circles`, `/more`, and `/settle/new`, run in a second terminal:

```bash
npm run typecheck
```

Expected: TypeScript exits 0. If unrelated dirty files fail the full typecheck, preserve those diagnostics separately and confirm no Phase 1B file appears in them.

---

### Task 7: Remove Old Chrome, Canonicalize Exposed Links, and Transfer Dock Spacing

**Files:**

- Modify: `src/components/coral/CoralScreen.tsx`
- Modify: `src/components/coral/index.ts`
- Modify: `src/features/dashboard/hooks/useDashboard.ts`
- Modify: `src/features/activity/screens-v2/ActivityScreen.tsx`
- Modify: `src/features/friends/screens-v2/NewFriendScreen.tsx`
- Modify: `src/features/friends/screens-v2/FriendDetailScreen.tsx`
- Delete: old chrome/command files listed in the File Map

**Interfaces:**

- Consumes: `SHELL_HREFS`, `settlementHref`, mounted `CircleDock`, and mounted `GlobalActionSheet`.
- Produces: no pathname-based global chrome, no `76px` screen-level dock clearance, and no exposed navigation that intentionally enters a legacy redirect.

- [ ] **Step 1: Remove unconditional dock clearance from CoralScreen**

In `src/components/coral/CoralScreen.tsx`, replace:

```ts
const bottomClearance = insets.bottom + 76;
```

with:

```ts
const bottomClearance = Math.max(insets.bottom, 16);
```

This retains ordinary safe-area/content padding on root focused screens. The tab navigator's measured custom tab bar now owns all additional dock spacing.

- [ ] **Step 2: Canonicalize Dashboard navigation and settlement fallback**

In `src/features/dashboard/hooks/useDashboard.ts`, add:

```ts
import { SHELL_HREFS, settlementHref } from "@/features/navigation/shell";
```

Replace the complete `handleSettleUp`, `handleViewAllGroups`, `handleViewAllActivity`, `handleViewProfile`, `handleViewNotifications`, `handleViewStats`, and `handleSettleUser` blocks with:

```ts
const handleSettleUp = useCallback(() => {
  if (owedUsers.length > 0 && oweUsers.length > 0) {
    settleSheetRef.current?.present();
  } else if (owedToYou > 0) {
    router.push(settlementHref(owedUsers[0]?.id));
  } else if (youOwe > 0) {
    router.push(settlementHref(oweUsers[0]?.id));
  } else {
    router.push(SHELL_HREFS.circlesPeople);
  }
}, [owedUsers, oweUsers, owedToYou, youOwe, router]);

const handleViewAllGroups = useCallback(() => {
  router.push(SHELL_HREFS.circlesGroups);
}, [router]);

const handleViewAllActivity = useCallback(() => {
  router.push(SHELL_HREFS.activity);
}, [router]);

const handleViewProfile = useCallback(() => {
  router.push(SHELL_HREFS.more);
}, [router]);

const handleViewNotifications = useCallback(() => {
  router.push(SHELL_HREFS.notifications);
}, [router]);

const handleViewStats = useCallback(() => {
  router.push(SHELL_HREFS.analytics);
}, [router]);

const handleSettleUser = useCallback(
  (userId: string) => {
    router.push(settlementHref(userId));
  },
  [router]
);
```

- [ ] **Step 3: Canonicalize focused People fallbacks**

In `src/features/friends/screens-v2/NewFriendScreen.tsx`, add:

```ts
import { SHELL_HREFS } from "@/features/navigation/shell";
```

Replace:

```ts
router.replace("/people");
```

with:

```ts
router.replace(SHELL_HREFS.circlesPeople);
```

In `src/features/friends/screens-v2/FriendDetailScreen.tsx`, add the same import and replace its fallback:

```ts
router.replace(SHELL_HREFS.circlesPeople);
```

- [ ] **Step 4: Remove root-stack navigation chrome from the Activity tab root**

In `src/features/activity/screens-v2/ActivityScreen.tsx`, delete:

```ts
import { useRouter } from "expo-router";
```

Remove `ContextBar` from the Coral import list and delete:

```ts
const router = useRouter();
```

Replace the complete top-bar/context block:

```tsx
      <CoralTopBar
        title="Activity"
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/home");
          }
        }}
      />
      <ContextBar title="Activity" backTo={{ label: "Home", route: "/home" }} />
```

with:

```tsx
<CoralTopBar title="Activity" />
```

- [ ] **Step 5: Replace the Coral barrel exports**

Replace `src/components/coral/index.ts` completely:

```ts
export { useCoralColors } from "./useCoral";
export { LargeTitle } from "./LargeTitle";
export { Eyebrow } from "./Eyebrow";
export { MoneyAmount } from "./MoneyAmount";
export { CoralButton } from "./CoralButton";
export { CoralField } from "./CoralField";
export { CoralSearchField } from "./CoralSearchField";
export { CoralSelect } from "./CoralSelect";
export type { SelectOption } from "./CoralSelect";
export { CoralSheet } from "./CoralSheet";
export { ContextBar } from "./ContextBar";
export { CircleDock } from "./CircleDock";
export { GlobalActionSheet } from "./GlobalActionSheet";
export { BalanceHero } from "./BalanceHero";
export { MoneyRow } from "./MoneyRow";
export { GroupTile } from "./GroupTile";
export { StatPair } from "./StatPair";
export { CoralChip } from "./CoralChip";
export { CoralSegment } from "./CoralSegment";
export { CoralTopBar } from "./CoralTopBar";
export { CoralSnackbar } from "./CoralSnackbar";
export { CoralScreen } from "./CoralScreen";
export { EmptyState } from "./EmptyState";
```

- [ ] **Step 6: Confirm no consumers remain, then delete retired navigation chrome**

Run:

```bash
rg "CoralTabBar|CoralFAB|CommandSheet|FloatingCommandButton|CommandNavigationProvider|useCommandNavigation" src --glob '*.{ts,tsx}'
```

Expected before deletion: matches only occur inside the six retired files themselves. If another consumer appears, stop and migrate that consumer to `CircleDock`, `GlobalActionSheet`, or direct canonical routing before deleting anything.

Delete:

```text
src/components/coral/CoralTabBar.tsx
src/components/coral/CoralPillBar.tsx
src/components/coral/CommandSheet.tsx
src/components/coral/FloatingCommandButton.tsx
src/features/navigation/CommandNavigationProvider.tsx
src/features/navigation/useCommandNavigation.ts
```

- [ ] **Step 7: Verify cleanup and canonical routes**

Run:

```bash
test -z "$(rg "CoralTabBar|CoralFAB|CommandSheet|FloatingCommandButton|CommandNavigationProvider|useCommandNavigation" src --glob '*.{ts,tsx}' || true)"
test -z "$(rg 'router\.(push|replace)\("/(groups|people|settings)"\)' src/features/dashboard src/features/friends/screens-v2 --glob '*.{ts,tsx}' || true)"
npx prettier --write src/components/coral/CoralScreen.tsx src/components/coral/index.ts src/features/dashboard/hooks/useDashboard.ts src/features/activity/screens-v2/ActivityScreen.tsx src/features/friends/screens-v2/NewFriendScreen.tsx src/features/friends/screens-v2/FriendDetailScreen.tsx
npx eslint src/components/coral/CoralScreen.tsx src/components/coral/index.ts src/features/dashboard/hooks/useDashboard.ts src/features/activity/screens-v2/ActivityScreen.tsx src/features/friends/screens-v2/NewFriendScreen.tsx src/features/friends/screens-v2/FriendDetailScreen.tsx
npm test -- --runInBand src/features/navigation/shell.test.ts src/components/coral/CircleDock.test.tsx src/components/coral/GlobalActionSheet.test.tsx
npm run typecheck
```

Expected: both search assertions exit 0; 3 suites and 15 tests PASS; focused lint and typecheck exit 0.

---

### Task 8: Final Automated and Device Verification

**Files:**

- Verify only; modify a scoped file only if a check exposes a Phase 1B defect.

**Interfaces:**

- Consumes: the complete Phase 1B route graph and all interfaces from Tasks 1-7.
- Produces: recorded evidence that route uniqueness, redirects, action reachability, structural dock hiding, safe areas, keyboard, themes, reduced motion, and supported widths satisfy the contract.

- [ ] **Step 1: Run the exact focused test suite**

Run:

```bash
npm test -- --runInBand src/features/navigation/shell.test.ts src/components/coral/CircleDock.test.tsx src/components/coral/GlobalActionSheet.test.tsx
```

Expected: 3 suites PASS, 15 tests PASS, 0 snapshots.

- [ ] **Step 2: Run full automated checks**

Run:

```bash
npm test -- --runInBand
npm run typecheck
npx eslint src/app/_layout.tsx 'src/app/(shell)/**/*.{ts,tsx}' src/app/groups.tsx src/app/people.tsx src/app/settings.tsx src/app/settle/new.tsx src/components/coral/CircleDock.tsx src/components/coral/GlobalActionSheet.tsx src/components/coral/MoneyRow.tsx src/components/coral/CoralScreen.tsx src/components/coral/CoralSheet.tsx src/features/navigation/shell.ts src/features/circles/screens/CirclesScreen.tsx src/features/profile/screens-v2/MoreScreen.tsx src/features/settlements/screens-v2/NewSettlementScreen.tsx src/features/friends/hooks/useFriendsList.ts src/features/friends/queries/useFriends.ts src/features/groups/hooks/useGroupsList.ts src/features/dashboard/hooks/useDashboard.ts src/features/activity/screens-v2/ActivityScreen.tsx src/features/friends/screens-v2/NewFriendScreen.tsx src/features/friends/screens-v2/FriendDetailScreen.tsx src/features/notifications/screens-v2/NotificationsScreen.tsx src/features/currencies/screens-v2/CurrenciesScreen.tsx
npx prettier --check src/app/_layout.tsx 'src/app/(shell)/**/*.{ts,tsx}' src/app/groups.tsx src/app/people.tsx src/app/settings.tsx src/app/settle/new.tsx src/components/coral/CircleDock.tsx src/components/coral/CircleDock.test.tsx src/components/coral/GlobalActionSheet.tsx src/components/coral/GlobalActionSheet.test.tsx src/components/coral/MoneyRow.tsx src/components/coral/CoralScreen.tsx src/components/coral/CoralSheet.tsx src/features/navigation/shell.ts src/features/navigation/shell.test.ts src/features/circles/screens/CirclesScreen.tsx src/features/profile/screens-v2/MoreScreen.tsx src/features/settlements/screens-v2/NewSettlementScreen.tsx src/features/friends/hooks/useFriendsList.ts src/features/friends/queries/useFriends.ts src/features/groups/hooks/useGroupsList.ts src/features/dashboard/hooks/useDashboard.ts src/features/activity/screens-v2/ActivityScreen.tsx src/features/friends/screens-v2/NewFriendScreen.tsx src/features/friends/screens-v2/FriendDetailScreen.tsx src/features/notifications/screens-v2/NotificationsScreen.tsx src/features/currencies/screens-v2/CurrenciesScreen.tsx
```

Expected: tests PASS; typecheck exits 0; focused ESLint exits 0; Prettier reports all listed files use code style. If the full test/typecheck encounters unrelated dirty-worktree failures, preserve their complete output, prove focused checks pass, and do not edit unrelated files.

- [ ] **Step 3: Re-run route uniqueness and no-Add assertions against source**

Run:

```bash
for route in home circles activity more analytics notifications currencies; do count=$(rg --files src/app | rg "/${route}\.tsx$" | wc -l | tr -d ' '); test "$count" = "1" || { printf '%s has %s wrappers\n' "$route" "$count"; exit 1; }; done
test "$(rg --files 'src/app/(shell)' | rg '/index\.tsx$' | wc -l | tr -d ' ')" = "0"
test "$(rg 'name=.*add|routeName:.*add' 'src/app/(shell)' src/features/navigation/shell.ts --glob '*.{ts,tsx}' | wc -l | tr -d ' ')" = "0"
```

Expected: all assertions exit 0. There is exactly one source wrapper for every canonical shell URL, no pathless shell index, and no Add tab route.

- [ ] **Step 4: Verify canonical and legacy deep links from cold start**

With Metro running, cold-open each URL using the platform link command:

```bash
npx uri-scheme open 'splt://home' --ios
npx uri-scheme open 'splt://circles?segment=groups' --ios
npx uri-scheme open 'splt://circles?segment=people' --ios
npx uri-scheme open 'splt://activity' --ios
npx uri-scheme open 'splt://more' --ios
npx uri-scheme open 'splt://analytics' --ios
npx uri-scheme open 'splt://notifications' --ios
npx uri-scheme open 'splt://currencies' --ios
npx uri-scheme open 'splt://groups' --ios
npx uri-scheme open 'splt://people' --ios
npx uri-scheme open 'splt://settings' --ios
```

Repeat with `--android` on Android.

Expected:

```text
/groups   -> /circles?segment=groups with Groups selected
/people   -> /circles?segment=people with People selected
/settings -> /more
```

Canonical routes open directly without duplicate pushes. Phase 1A sends signed-out/setup users through the existing lifecycle and returns ready users to the requested ready-app destination where supported; no lifecycle file changes are required.

- [ ] **Step 5: Verify all five Add actions and structural dock hiding**

From each of Home, Circles, Activity, and More, open the central Add button and press every option once.

Expected matrix:

```text
Add expense      -> /expense/new
Settle up        -> /settle/new, then a selected non-zero row -> /settle/<real-id>
Create group     -> /group/new
Add person       -> /friend/new
Schedule expense -> /recurring/new with its existing group selector
```

On every focused destination, inspect the React Navigation hierarchy or screen visually: the Circle Dock is absent because those routes are root-stack siblings of `(shell)`, not because `usePathname()` hid an overlay. Search runtime logs and URLs to confirm no `/settle/undefined` occurs.

- [ ] **Step 6: Verify stable tab stacks and back behavior**

Perform this sequence:

```text
1. Open More.
2. Push /analytics.
3. Switch to Home.
4. Switch back to More.
5. Confirm Analytics is still the More stack's active child.
6. Press back and confirm More appears.
7. Open /friend/<id> from Circles, press back, and confirm the same Circles segment/search context returns.
```

Expected: primary tabs switch stable stacks without pushing duplicate shell copies; nested More state is retained; root focused routes return to their source shell context.

- [ ] **Step 7: Verify safe areas, keyboard, widths, themes, and reduced motion**

Test iOS and Android at `360x800`, `390x844`, and `430x932` in light and dark themes.

Expected checklist:

```text
[ ] Dock remains 12px from horizontal edges and clears home indicator/navigation bar.
[ ] Four labels and icons do not overlap the 56px central Add control at 360px.
[ ] All dock targets are at least 44pt on iOS and 48dp on Android.
[ ] Screen content ends above the navigator-measured dock without a duplicate 76px gap.
[ ] Root focused screens retain at least safe-area/16px bottom content padding.
[ ] Opening search or any focused form keyboard hides the dock; dismissing restores it.
[ ] Add sheet clears the bottom safe area and Android back closes it before navigation.
[ ] Coral blur/material, borders, text, active dot, and central Add retain contrast in both themes.
[ ] With Reduce Motion enabled, tab changes do not spatially animate and CoralSheet does not slide.
[ ] No horizontal overflow appears at any required width.
```

- [ ] **Step 8: Review the final diff without changing unrelated work**

Run:

```bash
git status --short
git diff -- src/app src/components/coral src/features/navigation src/features/circles src/features/profile/screens-v2 src/features/settlements/screens-v2 src/features/friends/hooks/useFriendsList.ts src/features/friends/queries/useFriends.ts src/features/groups/hooks/useGroupsList.ts src/features/dashboard/hooks/useDashboard.ts src/features/activity/screens-v2/ActivityScreen.tsx src/features/friends/screens-v2/NewFriendScreen.tsx src/features/friends/screens-v2/FriendDetailScreen.tsx src/features/notifications/screens-v2/NotificationsScreen.tsx src/features/currencies/screens-v2/CurrenciesScreen.tsx
```

Expected: only scoped Phase 1B changes are attributable to this plan. Existing unrelated modifications and deletions remain untouched. Do not stage or commit.

---

## Self-Review Record

- Route conflicts: every pathless tab group has a uniquely named explicit leaf; moved wrappers are deleted in the same task; no shell `index.tsx` exists.
- Type consistency: tab route names in `SHELL_TABS` exactly match directory names and `Tabs.Screen` names; shell/action targets use Expo Router's `Href`; settlement objects use the existing `/settle/[id]` route parameter shape.
- Imports: all new aliases resolve under `@/*`; Expo Router JavaScript tabs and their `BottomTabBarProps` come only from `expo-router/js-tabs`; no new package is required.
- Exposed actions: five Add actions navigate; Circles rows open detail only; More omits inert destinations; Notifications loses fake Mark All Read; Currencies loses its fake conversion switch.
- Structural dock behavior: only `(shell)` renders `CircleDock`; focused root routes cannot render it; no pathname allowlist remains after cleanup.
- Lifecycle scope: `AuthLifecycleGuard`, `lifecycle.ts`, account state, and Phase 1A route decisions remain unchanged.
- Cleanup order: old tab/FAB/command code is deleted only in Task 7 after shell mounting and runtime verification in Task 6.
- Testing: pure helpers follow exact RED/GREEN commands; supported dock/sheet components use focused behavior tests; no snapshots are introduced.
- Scope: no Phase 2 detail redesign, Phase 3 money rewrite, Phase 4 Upcoming work, or unavailable Phase 5 export/help implementation is included.
