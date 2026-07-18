# Money Map Group Balance Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Money Map's two-column circle tiles with a compact full-width ledger that explains each displayed group's net balance through its largest person-level balance.

**Architecture:** Extend `useDashboard` with a prepared `groupBalancePreview` view model while preserving the existing `activeGroups` API for the legacy dashboard. Add a dashboard-specific `GroupBalanceLedger` presentation component and keep calculation, filtering, and ordering out of `MoneyMapScreen`.

**Tech Stack:** React 19, React Native 0.86, Expo Router, Expo Haptics, TypeScript, existing Coral/UI tokens and balance utilities.

## Global Constraints

- Show at most four group rows on Home.
- Treat balances with `Math.abs(value) <= 0.005` as settled.
- When any open groups exist, hide all settled groups; otherwise show the four most recently active settled groups.
- Sort open groups by absolute group net balance descending, then latest expense timestamp descending.
- Use the group net balance in the pill and the largest person-level balance in supporting copy.
- Convey positive, negative, and settled states in text as well as color.
- Keep the existing balance hero, attention rows, recent movement, tab bar, and floating Add Expense action unchanged.
- Add no backend query, dependency, HeroUI component, or Jest test.
- Preserve existing unrelated worktree changes and do not commit implementation unless the user explicitly requests it.

## File Map

- Modify `src/features/dashboard/hooks/useDashboard.ts`: calculate and expose `DashboardGroupBalancePreview[]` while retaining `activeGroups`.
- Create `src/features/dashboard/components/GroupBalanceLedger.tsx`: render the section heading, all-groups action, accessible ledger rows, person explanation, and balance pills.
- Modify `src/features/dashboard/screens-v2/MoneyMapScreen.tsx`: replace the `GroupTile` grid with `GroupBalanceLedger`.

---

### Task 1: Prepare Group Balance Preview Data

**Files:**
- Modify: `src/features/dashboard/hooks/useDashboard.ts:18-54`
- Modify: `src/features/dashboard/hooks/useDashboard.ts:153-193`
- Modify: `src/features/dashboard/hooks/useDashboard.ts:285-321`

**Interfaces:**
- Consumes: `balancesUtil.getUserBalances(currentUserId, groupId, groups, expenses, settlements, preferredCurrency, convertCurrency)`.
- Produces: `DashboardGroupBalancePreview` and `DashboardData.groupBalancePreview`.

- [ ] **Step 1: Define the preview view model**

Add this exported interface before `DashboardData`:

```ts
export interface DashboardGroupBalancePreview {
  group: Group;
  netBalance: number;
  latestExpenseAt: number;
  keyPerson?: User;
  keyPersonBalance?: number;
}
```

Add this property after `activeGroups` in `DashboardData`:

```ts
groupBalancePreview: DashboardGroupBalancePreview[];
```

- [ ] **Step 2: Enrich the existing per-group calculation**

Replace the current `groupNetBalances` memo with this implementation. It computes the key person in `group.members` order, so equal balances have a stable tie break.

```ts
const groupNetBalances = useMemo(() => {
  return groups.map((group): DashboardGroupBalancePreview => {
    const balancesMap = balancesUtil.getUserBalances(
      currentUser.id,
      group.id,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    );
    let netBalance = 0;
    for (const amount of balancesMap.values()) {
      netBalance += amount;
    }

    let keyPerson: User | undefined;
    let keyPersonBalance: number | undefined;
    for (const member of group.members) {
      if (member.userId === currentUser.id) continue;

      const balance = balancesMap.get(member.userId) ?? 0;
      if (Math.abs(balance) <= 0.005) continue;
      if (
        keyPersonBalance === undefined ||
        Math.abs(balance) > Math.abs(keyPersonBalance)
      ) {
        keyPerson = member.user;
        keyPersonBalance = balance;
      }
    }

    const latestExpenseAt = expenses
      .filter((expense) => expense.groupId === group.id)
      .reduce((latest, expense) => {
        const expenseTime = new Date(expense.createdAt).getTime();
        return Math.max(latest, expenseTime);
      }, new Date(group.createdAt).getTime());

    return { group, netBalance, latestExpenseAt, keyPerson, keyPersonBalance };
  });
}, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);
```

- [ ] **Step 3: Build the Home-specific selection without changing legacy `activeGroups`**

Keep the current `activeGroups` memo intact. Add this memo immediately after it:

```ts
const groupBalancePreview = useMemo(() => {
  const openGroups = groupNetBalances.filter(({ netBalance }) => Math.abs(netBalance) > 0.005);
  const candidates = openGroups.length > 0 ? openGroups : groupNetBalances;

  return [...candidates]
    .sort((a, b) => {
      if (openGroups.length > 0) {
        const balanceDifference = Math.abs(b.netBalance) - Math.abs(a.netBalance);
        if (balanceDifference !== 0) return balanceDifference;
      }
      return b.latestExpenseAt - a.latestExpenseAt;
    })
    .slice(0, 4);
}, [groupNetBalances]);
```

- [ ] **Step 4: Expose the preview from the hook**

Add `groupBalancePreview` immediately after `activeGroups` in the returned object:

```ts
activeGroups,
groupBalancePreview,
openGroupCount,
```

- [ ] **Step 5: Verify the dashboard view model compiles**

Run:

```bash
npm run typecheck
```

Expected: exit code `0` with no TypeScript diagnostics.

---

### Task 2: Build And Integrate The Warm Ledger

**Files:**
- Modify: `src/features/dashboard/hooks/useDashboard.ts:222-224`
- Create: `src/features/dashboard/components/GroupBalanceLedger.tsx`
- Modify: `src/features/dashboard/screens-v2/MoneyMapScreen.tsx:6-21`
- Modify: `src/features/dashboard/screens-v2/MoneyMapScreen.tsx:219-247`

**Interfaces:**
- Consumes: `DashboardGroupBalancePreview[]`, preferred currency code, `handleGroupPress(groupId)`, and `handleViewAllGroups()`.
- Produces: `GroupBalanceLedger` with props `{ items, currencyCode, onGroupPress, onViewAll }`.

- [ ] **Step 1: Correct the Groups navigation callback**

In `useDashboard`, change `handleViewAllGroups` to target the dedicated Groups route:

```ts
const handleViewAllGroups = useCallback(() => {
  router.push("/groups");
}, [router]);
```

- [ ] **Step 2: Create the feature-specific ledger component**

Create `src/features/dashboard/components/GroupBalanceLedger.tsx` with:

```tsx
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI } from "@/components/ui";
import type { DashboardGroupBalancePreview } from "@/features/dashboard/hooks/useDashboard";

const SETTLED_THRESHOLD = 0.005;

type GroupBalanceLedgerProps = {
  items: DashboardGroupBalancePreview[];
  currencyCode: string;
  onGroupPress: (groupId: string) => void;
  onViewAll: () => void;
};

function getSupportingCopy(
  item: DashboardGroupBalancePreview,
  currencyCode: string
): string {
  const { keyPerson, keyPersonBalance, netBalance } = item;

  if (Math.abs(netBalance) <= SETTLED_THRESHOLD) return "No open balances";
  if (!keyPerson || keyPersonBalance === undefined) return "Open balance";

  const amount = formatAmount(Math.abs(keyPersonBalance), currencyCode);
  return keyPersonBalance > 0
    ? `${keyPerson.name} owes you ${amount}`
    : `You owe ${keyPerson.name} ${amount}`;
}

function getAccessibilityLabel(
  item: DashboardGroupBalancePreview,
  currencyCode: string
): string {
  if (Math.abs(item.netBalance) <= SETTLED_THRESHOLD) {
    return `${item.group.name}, settled`;
  }

  const amount = formatAmount(Math.abs(item.netBalance), currencyCode);
  return item.netBalance > 0
    ? `${item.group.name}, you are owed ${amount}`
    : `${item.group.name}, you owe ${amount}`;
}

export function GroupBalanceLedger({
  items,
  currencyCode,
  onGroupPress,
  onViewAll,
}: GroupBalanceLedgerProps): JSX.Element | null {
  const { color, radius } = useUI();

  if (items.length === 0) return null;

  return (
    <View style={{ marginTop: 28 }}>
      <View
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 14,
            fontWeight: "600",
            letterSpacing: 0.14,
            color: color.muted,
          }}
        >
          Where you stand
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all groups"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onViewAll();
          }}
          style={({ pressed }) => ({
            minHeight: 44,
            paddingLeft: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            opacity: pressed ? 0.62 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 13,
              color: color.brand,
            }}
          >
            All groups
          </Text>
          <ArrowRight size={15} color={color.brand} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View
        style={{
          overflow: "hidden",
          borderWidth: 1,
          borderColor: color.border,
          borderRadius: radius.lg,
          backgroundColor: color.surface,
        }}
      >
        {items.map((item, index) => {
          const isSettled = Math.abs(item.netBalance) <= SETTLED_THRESHOLD;
          const isNegative = item.netBalance < -SETTLED_THRESHOLD;
          const pillBackground = isSettled
            ? color.subtle
            : isNegative
              ? color.dangerTint
              : color.successTint;
          const pillForeground = isSettled
            ? color.muted
            : isNegative
              ? color.danger
              : color.success;
          const pillCopy = isSettled
            ? "Settled"
            : `${item.netBalance > 0 ? "+" : "-"}${formatAmount(
                Math.abs(item.netBalance),
                currencyCode
              )}`;

          return (
            <Pressable
              key={item.group.id}
              accessibilityRole="button"
              accessibilityLabel={getAccessibilityLabel(item, currencyCode)}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onGroupPress(item.group.id);
              }}
              style={({ pressed }) => ({
                minHeight: 72,
                paddingHorizontal: 14,
                paddingVertical: 11,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: pressed ? color.subtle : color.surface,
                borderBottomWidth: index === items.length - 1 ? 0 : 1,
                borderBottomColor: color.border,
              })}
            >
              <GroupIconBadge group={item.group} size="sm" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 15,
                    fontWeight: "600",
                    color: color.text,
                  }}
                >
                  {item.group.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 3,
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 12,
                    color: color.muted,
                  }}
                >
                  {getSupportingCopy(item, currencyCode)}
                </Text>
              </View>
              <View
                style={{
                  flexShrink: 0,
                  minHeight: 26,
                  paddingHorizontal: 9,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pillBackground,
                }}
              >
                <Text
                  style={{
                    fontFamily: "IBMPlexMono_600SemiBold",
                    fontSize: 11,
                    fontWeight: "600",
                    color: pillForeground,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {pillCopy}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Replace the circle grid in Money Map**

Add the ledger import:

```ts
import { GroupBalanceLedger } from "@/features/dashboard/components/GroupBalanceLedger";
```

Remove the now-unused `GroupIconBadge` import and `GroupTile` from the Coral import list.

Replace the complete `dashboard.activeGroups` block at lines 219-247 with:

```tsx
<GroupBalanceLedger
  items={dashboard.groupBalancePreview}
  currencyCode={currencyCode}
  onGroupPress={dashboard.handleGroupPress}
  onViewAll={dashboard.handleViewAllGroups}
/>
```

- [ ] **Step 4: Format the changed files**

Run:

```bash
npx prettier --write \
  "src/features/dashboard/hooks/useDashboard.ts" \
  "src/features/dashboard/components/GroupBalanceLedger.tsx" \
  "src/features/dashboard/screens-v2/MoneyMapScreen.tsx"
```

Expected: Prettier reports all three files without errors.

- [ ] **Step 5: Verify TypeScript and formatting**

Run:

```bash
npm run typecheck
npx prettier --check \
  "src/features/dashboard/hooks/useDashboard.ts" \
  "src/features/dashboard/components/GroupBalanceLedger.tsx" \
  "src/features/dashboard/screens-v2/MoneyMapScreen.tsx"
```

Expected: both commands exit `0`; Prettier prints `All matched files use Prettier code style!`.

- [ ] **Step 6: Inspect required UI states manually**

Run the app with `npx expo start`, then verify:

- Positive rows say `[Name] owes you [amount]` and use a green signed pill.
- Negative rows say `You owe [Name] [amount]` and use a red signed pill.
- Open groups hide settled groups and cap the list at four rows.
- A fully settled account shows recently active groups with `No open balances` and `Settled`.
- No groups produces no section heading or blank card.
- Long names truncate without overlapping the pill on a narrow phone.
- Row presses open `/group/[id]`; **All groups** opens `/groups`.
- Light and dark themes preserve readable contrast.
