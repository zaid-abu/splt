# Architecture Refactoring — Full App Restructure

**Date:** 2026-07-17  
**Status:** Design approved, awaiting spec review

## 1. Summary

Refactor the entire Splt codebase (65+ files, 24K+ lines) to achieve clean separation of concerns:

- **Screens** become thin composition layers (50-100 lines) that import hooks and UI components
- **Hooks** (`hooks/*.ts`) contain all business logic: data fetching, computed values, mutations, callbacks
- **UI components** (`components/*.tsx`) are pure presentational — receive data via typed props, emit events via callbacks
- **Shared UI** (`components/ui/`) is split into one file per component (currently 9 components in a single 579-line file)

Target: zero files over 250 lines.

## 2. Target Architecture

```
Screen (50-100 lines)
  └─ imports 1 hook + N UI components
  └─ composes: <Layout><Header/><Content/><Footer/></Layout>

Hook (100-200 lines)
  └─ React Query: useQuery / useMutation
  └─ Computed values: useMemo
  └─ Callbacks: useCallback
  └─ Returns: { data, actions, isLoading, error }
  └─ No JSX

UI Component (30-150 lines)
  └─ Props: data + callbacks (typed interfaces)
  └─ Renders JSX with styles
  └─ Internal hooks: only useUI() + animation hooks
  └─ No data fetching, no business logic
```

## 3. Directory Structure

```
src/
  components/
    ui/                          # NEW: split from native-ui.tsx
      theme/
        tokens.ts                # LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW
        typography.ts            # TYPO helper
      hooks/
        useUI.ts                 # useUI() hook (colors, radius, space, shadow)
      PressableScale.tsx
      IconButton.tsx
      PrimaryButton.tsx
      SectionLabel.tsx
      SearchField.tsx
      ScreenHeader.tsx
      MetricCell.tsx
      FilterPill.tsx
      ListSection.tsx
      EmptyState.tsx
      Card.tsx
      Skeleton.tsx
      ErrorState.tsx
      Toast.tsx
      MoneySignal.tsx
      SheetBackground.tsx
      SheetContainer.tsx
      BottomActionBar.tsx
      ListRow.tsx
      MemberAvatar.tsx
      GroupIconBadge.tsx
      CategoryIconBadge.tsx
      AppLoader.tsx
      HapticButton.tsx
      index.ts                   # barrel re-export
    glassmorphism/               # unchanged, used by auth screens
    forms/                       # unchanged (FormInput, PasswordStrengthMeter, CurrencySelector)
    dialogs/                     # unchanged
    layout/                      # unchanged (AuthFormLayout, SwipeableRow)
    feedback/                    # unchanged

  features/
    dashboard/
      screens/
        DashboardScreen.tsx      # thin: ~80 lines
      hooks/
        useDashboard.ts          # NEW: queries + computed + actions (~200 lines)
      components/
        DashboardBalance.tsx     # NEW: hero balance card
        DashboardActions.tsx     # NEW: Add Expense + Settle up
        DashboardAttention.tsx   # NEW: need attention list
        DashboardGroupsPreview.tsx # NEW: top groups section
        DashboardRecentActivity.tsx # NEW: filtered activity
        DashboardSettleSheet.tsx # NEW: settle up bottom sheet
        BalanceCard.tsx          # unchanged (shared with GroupDetail)
      queries/                   # unchanged
      ...                        # unchanged

    groups/
      screens/
        GroupsScreen.tsx         # thin
        GroupDetailScreen.tsx    # thin
        GroupSettingsScreen.tsx  # thin
        NewGroupScreen.tsx       # thin (already reasonable at 534)
      hooks/
        useGroupsList.ts         # NEW
        useGroupDetail.ts        # NEW
        useGroupSettings.ts      # NEW
      components/
        GroupCard.tsx            # unchanged
        GroupRow.tsx             # unchanged
        GroupMemberBar.tsx       # NEW: horizontal member scroll
        GroupBalances.tsx        # NEW: balance list
        GroupInviteBanner.tsx    # NEW: invite CTA
        GroupTransactions.tsx    # NEW: transaction list
        GroupIdentitySection.tsx # NEW: settings identity
        GroupFinanceSection.tsx  # NEW: settings finance
        GroupMembersSection.tsx  # NEW: settings members
        GroupDangerZone.tsx      # NEW: settings danger zone
        UserSearchBottomSheet.tsx # unchanged

    friends/
      screens/
        FriendsScreen.tsx        # thin
        FriendDetailScreen.tsx   # thin
        NewFriendScreen.tsx      # thin (already reasonable)
      hooks/
        useFriendsList.ts        # NEW
        useFriendDetail.ts       # NEW
      components/
        FriendsSummary.tsx       # NEW: balance summary + action
        FriendsRequests.tsx      # NEW: pending requests
        FriendsSearchFilter.tsx  # NEW: search + filter chips
        FriendRow.tsx            # NEW: individual friend row
        FriendsEmpty.tsx         # NEW: empty state
        FriendBalanceCard.tsx    # NEW: friend detail balance
        FriendSharedGroups.tsx   # NEW: shared groups list
        FriendSpendingCategories.tsx # NEW: category breakdown
        FriendRecentActivity.tsx # NEW: recent activity list
        FriendOptionsSheet.tsx   # NEW: options bottom sheet

    activity/
      screens/
        ActivityScreen.tsx       # thin (already reasonable at 240)
      hooks/
        useActivity.ts           # NEW
      components/
        ActivityItem.tsx         # unchanged
        ActivitySection.tsx      # NEW: section wrapper

    expenses/
      screens/
        ExpenseDetailScreen.tsx  # thin
        NewExpenseScreen.tsx     # thin
      hooks/
        useExpenseDetail.ts      # NEW
        useExpenseForm.ts        # already exists, review for size
      components/
        ExpenseSummary.tsx       # NEW: detail summary card
        ExpenseSplitBreakdown.tsx # NEW: split list
        ExpenseComments.tsx      # NEW: comments section
        (existing components)    # review and split if >200 lines

    settlements/
      screens/
        SettlementScreen.tsx     # thin
      hooks/
        useSettlement.ts         # NEW
      components/
        SettlementParties.tsx    # NEW: payer/receiver display
        SettlementAmount.tsx     # NEW: amount input + chips
        SettlementConfirmation.tsx # NEW: confirmation card

    analytics/
      (review all files, split if >200 lines)

    profile/
      screens/
        ProfileScreen.tsx        # thin (537 → hook + components)
      hooks/
        useProfile.ts            # NEW
      components/
        ProfileHeader.tsx        # NEW
        ProfileBalance.tsx       # NEW
        ProfilePreferences.tsx   # NEW
        ProfileAccount.tsx       # NEW
        SettingsItem.tsx         # unchanged

    auth/                        # already well-structured, minimal changes
    onboarding/                  # already well-structured, minimal changes
    notifications/               # already reasonable
```

## 4. Rules

| Rule                                               | Rationale                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Screens only compose                               | Import 1 hook + N UI components. No useMemo, useQuery, inline styles    |
| Hooks return shape: `{ data, actions, isLoading }` | Consistent interface. No JSX                                            |
| UI components via typed props                      | Everything comes from parent. Only useUI() + animation hooks internally |
| One component per file (shared UI)                 | Easy to find, test, change independently                                |
| Max 250 lines per file                             | If it grows, split it                                                   |
| Feature UI uses domain types                       | Can accept `Group`, `User`, `Expense` as props                          |
| No inline styles outside StyleSheet                | Keeps render clean                                                      |
| Barrel exports (`index.ts`) for shared UI          | `import { Card, Skeleton, ... } from "@/components/ui"`                 |

## 5. Antipatterns to Eliminate

- Direct `useQuery`/`useMutation` calls in screen files
- `useMemo`/`useCallback` in render (move to hooks)
- Styles computed inline during render (use `useMemo` in hook or StyleSheet)
- Components that import query hooks directly
- Files over 250 lines

## 6. Implementation Notes

- Big-bang approach: define all architecture, create all files, then verify
- Zero logic changes — same queries, same mutations, same behavior
- Existing `services/`, `queries/`, `utils/` directories mostly unchanged
- `glassmorphism/` directory unchanged (already well-structured)
- Forms, dialogs, feedback components largely unchanged
- `native-ui.tsx` (579 lines) gets fully decommissioned — replaced by `components/ui/` directory
- Total: ~75 new files, ~65 files modified, ~12 files deleted/merged

## 7. Files to Delete

- `src/components/ui/native-ui.tsx` — split into ~25 individual files
