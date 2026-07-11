# Splt — Implementation Plan & Progress Tracker

Generated from `docs/improvements.md`. Every item is broken into tasks, subtasks, files to touch, and verification steps.

---

## Legend

| Symbol | Meaning           |
| ------ | ----------------- |
| ⬜     | Not started       |
| 🔄     | In progress       |
| ✅     | Done              |
| ❌     | Blocked / Skipped |
| 🔴     | Critical priority |
| 🟠     | High priority     |
| 🟡     | Medium priority   |
| 🟢     | Low priority      |

---

## Phase 1 — Critical Bug Fixes ✅

> **Goal:** Zero typecheck errors, zero lint errors, no silent failures.
> **Exit criteria:** `npm run lint` = 0 errors, `npx tsc --noEmit` = 0 errors.
>
> **Status: ALL COMPLETE ✅**

---

### 1.1 🔴 Fix ActivityScreen unfiltered `invalidateQueries`

| Field     | Value                                              |
| --------- | -------------------------------------------------- |
| Status    | ✅                                                 |
| Estimated | 15 min                                             |
| Files     | `src/features/activity/screens/ActivityScreen.tsx` |
| Source    | A1                                                 |

**Steps:**

- [x] ✅ Line ~36: Replace `queryClient.invalidateQueries()` with `queryClient.invalidateQueries({ queryKey: ["expenses", "settlements"] })`
- [x] ✅ Verify pull-to-refresh only re-fetches expense/settlement queries

**Acceptance:** Pull-to-refresh on Activity screen does not trigger group/friend/user/profile queries. ✅

---

### 1.2 🔴 Fix `currentUser!` non-null assertion in ActivityScreen

| Field     | Value                                              |
| --------- | -------------------------------------------------- |
| Status    | ✅                                                 |
| Estimated | 10 min                                             |
| Files     | `src/features/activity/screens/ActivityScreen.tsx` |
| Source    | A2                                                 |

**Steps:**

- [x] ✅ Removed `currentUser!` non-null assertions (lines 49, 62) — `currentUser` is typed as non-nullable `User` via fallback

**Acceptance:** Screen renders without crash. ✅

---

### 1.3 🟡 Fix hardcoded color in tab bar

| Field     | Value                        |
| --------- | ---------------------------- |
| Status    | ✅                           |
| Estimated | 5 min                        |
| Files     | `src/app/(tabs)/_layout.tsx` |
| Source    | A3                           |

**Steps:**

- [x] ✅ Line 53: Replace `"#8E8E93"` with `UI.color.muted`

**Acceptance:** Inactive tab icon color matches the design system's `muted` token in both light and dark mode. ✅

---

### 1.4 🟡 Delete dead `_QuickAction` + suppress remaining lint warnings

| Field     | Value                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                                                    |
| Estimated | 20 min                                                                                                                                |
| Files     | `src/features/dashboard/screens/DashboardScreen.tsx`, `src/components/animations/PageAnimator.tsx`, `src/components/ui/AppLoader.tsx` |
| Source    | A5                                                                                                                                    |

**Steps:**

- [x] ✅ Deleted the entire `_QuickAction` function from DashboardScreen (~70 lines of dead code)
- [x] ✅ `PageAnimator.tsx:46` — added eslint-disable-next-line for stable Animated.Value refs
- [x] ✅ `AppLoader.tsx:40` — same suppression for rotation/scale Animated.Values
- [x] ✅ `DashboardScreen.tsx:227` — added eslint-disable-next-line since balanceScale is a stable SharedValue

**Acceptance:** `npm run lint` = 0 warnings. ✅

---

### 1.5 🟡 Add skeleton to GroupDetailScreen

| Field     | Value                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Status    | ✅                                                                                                     |
| Estimated | 30 min                                                                                                 |
| Files     | `src/features/groups/screens/GroupDetailScreen.tsx`, `src/features/groups/hooks/useGroupDetailData.ts` |
| Source    | C5                                                                                                     |

**Steps:**

- [x] ✅ Added `isLoading` return to `useGroupDetailData` hook
- [x] ✅ Imported `Skeleton` and `ListRowSkeleton` from `@/components/ui/Skeleton`
- [x] ✅ Added loading check: BalanceCard skeleton (~170px), group balances skeleton (3 rows), transactions skeleton (2 rows)
- [x] ✅ Added `useCallback`, `useState`, `RefreshControl` for pull-to-refresh (combined with 1.6)

**Acceptance:** Screen shows animated skeleton while data loads, transitions smoothly to content. ✅

---

### 1.6 🟡 Add RefreshControl to GroupDetailScreen

| Field     | Value                                               |
| --------- | --------------------------------------------------- |
| Status    | ✅                                                  |
| Estimated | 15 min                                              |
| Files     | `src/features/groups/screens/GroupDetailScreen.tsx` |
| Source    | C4                                                  |

**Steps:**

- [x] ✅ Added `RefreshControl` with `refreshing` state and `onRefresh` callback
- [x] ✅ Wired to ScrollView with targeted `invalidateQueries` using `queryKeys.groupDetails(id)`
- [x] ✅ Imported `useQueryClient` and `queryKeys`

**Acceptance:** Pull-down on group detail refreshes group data, expenses, and balances. ✅

---

### 1.7 🟠 Add confirmation sheet to group member removal

| Field     | Value                                                 |
| --------- | ----------------------------------------------------- |
| Status    | ✅                                                    |
| Estimated | —                                                     |
| Files     | `src/features/groups/screens/GroupSettingsScreen.tsx` |
| Source    | C3                                                    |

Already implemented. GroupSettingsScreen has `ConfirmationSheet` at lines 841-848 with title "Remove Member?", confirmLabel "Remove", and confirmColor danger. The `handleRemoveMemberClick` function presents it with member name.

**Acceptance:** Already working. ✅

---

## Phase 2 — UX Polish Sprint

> **Goal:** Every screen has loading state, pull-to-refresh, and consistent interaction patterns.
> **Exit criteria:** No screen renders blank while loading. Settlement screen shows confirmation.
>
> **Status: 7/7 complete ✅**

---

### 2.1 🟡 Close/back button clarity on NewExpenseScreen

| Field     | Value                                                |
| --------- | ---------------------------------------------------- |
| Status    | ✅                                                   |
| Estimated | 15 min                                               |
| Files     | `src/features/expenses/screens/NewExpenseScreen.tsx` |
| Source    | C1                                                   |

**Steps:**

- [x] ✅ Context-picker step shows `X` icon (dismiss), form step shows `ChevronLeft` (go back)
- [x] ✅ Label changes from "Close" to "Go back" accordingly

**Acceptance:** Context step has clear dismiss icon (X), form step has back icon (ChevronLeft). ✅

---

### 2.2 🟡 Settlement success toast before dismiss

| Field     | Value                                                   |
| --------- | ------------------------------------------------------- |
| Status    | ✅                                                      |
| Estimated | 15 min                                                  |
| Files     | `src/features/settlements/screens/SettlementScreen.tsx` |
| Source    | C8                                                      |

**Steps:**

- [x] ✅ Success toast shows after settlement: "Settlement Recorded — $X paid to [name]"
- [x] ✅ `router.back()` delayed by 600ms so user sees the toast

**Acceptance:** After recording a settlement, user sees a green success toast before navigating back. ✅

---

### 2.3 🟡 NewExpenseScreen header text resize

| Field     | Value                                                |
| --------- | ---------------------------------------------------- |
| Status    | ✅                                                   |
| Estimated | —                                                    |
| Files     | `src/features/expenses/screens/NewExpenseScreen.tsx` |
| Source    | C7                                                   |

Already correct. `headerTitle` style uses `fontSize: 18` (matches design system headline scale). No change needed.

**Acceptance:** Already correct. ✅

---

### 2.4 🟡 Activity feed from database

| Field     | Value                                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                                                                       |
| Estimated | 3 hrs                                                                                                                                                    |
| Files     | `src/features/activity/screens/ActivityScreen.tsx`, `src/features/expenses/queries/useExpenses.ts`, `src/features/settlements/queries/useSettlements.ts` |
| Source    | A4                                                                                                                                                       |

**Steps:**

- [x] ✅ Added `activitiesApi.logActivity` calls to `useAddExpense` and `useAddSettlement` mutation `onSuccess` handlers
- [x] ✅ Replaced `ActivityScreen`'s manual expense/settlement merge with `useUserActivities` query
- [x] ✅ Removed `useUserExpenses`/`useUserSettlements` queries from ActivityScreen
- [x] ✅ Created migration `202607110009_backfill_activities.sql`

**Acceptance:** Activity screen shows all historical activities from the database. New expenses/settlements auto-appear in the feed. ✅:

```sql
INSERT INTO activities (type, expense_id, group_id, user_id, description, amount, currency, date)
SELECT 'expense', id, group_id, paid_by, title, amount, currency, date FROM expenses;

INSERT INTO activities (type, settlement_id, group_id, user_id, description, amount, currency, date)
SELECT 'settlement', id, group_id, from_user_id, 'Settlement', amount, currency, date FROM settlements;
```

**Acceptance:** Activity screen shows all historical activities. New expenses/settlements auto-appear in feed.

---

### 2.5 🟡 Pull-to-refresh on all remaining list screens

| Field     | Value                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                        |
| Estimated | 30 min                                                                                                    |
| Files     | `src/features/friends/screens/FriendDetailScreen.tsx`, `src/features/activity/screens/ActivityScreen.tsx` |
| Source    | C4 (extended)                                                                                             |

**Steps:**

- [x] ✅ FriendDetailScreen: Added RefreshControl with targeted `queryClient.invalidateQueries`
- [x] ✅ ActivityScreen: RefreshControl already existed, scoped to `["activities"]`

**Acceptance:** All scrollable list screens support pull-to-refresh. ✅

---

### 2.6 🟡 Add skeleton to FriendDetailScreen

| Field     | Value                                                 |
| --------- | ----------------------------------------------------- |
| Status    | ✅                                                    |
| Estimated | —                                                     |
| Files     | `src/features/friends/screens/FriendDetailScreen.tsx` |
| Source    | C6                                                    |

Already implemented. FriendDetailScreen has a full `LoadingState` component with balance card skeleton, info rows, and activity list skeletons. Wired via `isLoading` check on all queries.

**Acceptance:** Already done. ✅

---

### 2.7 🟡 Standardize StyleSheet.create pattern

| Field     | Value                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                                                                                                                                        |
| Estimated | 4 hrs                                                                                                                                                                                                                     |
| Files     | `src/features/dashboard/screens/DashboardScreen.tsx`, `src/features/groups/screens/GroupDetailScreen.tsx`, `src/features/settlements/screens/SettlementScreen.tsx`, `src/features/friends/screens/FriendDetailScreen.tsx` |
| Source    | B1                                                                                                                                                                                                                        |

**Steps:**

- [x] ✅ GroupDetailScreen: Full refactor — all inline styles moved to `StyleSheet.create` (screen, header, iconButton, cardSurface, listCard, text styles, action buttons, etc.)
- [x] ✅ SettlementScreen: Added `StyleSheet.create` with common patterns (screen, pillButton, surfaceCard, submitButton, amountInput, swapButton, summaryBox, stickySubmit, etc.)
- [x] ✅ DashboardScreen: Added `StyleSheet.create` with common patterns (screen, surfaceCard, iconShell, text styles, pillButton, etc.)
- [x] ✅ FriendDetailScreen: Added `StyleSheet.create` with common patterns (screen, card, text styles, pillButton, bottomAction, etc.)

**Acceptance:** All 4 screens use `StyleSheet.create` for repeated style patterns. Dynamic styles (pressed state, conditional colors) remain inline. Zero lint warnings. ✅

**Steps:**

- [ ] ⬜ For each screen, move all static styles into `const styles = StyleSheet.create({...})`
- [ ] ⬜ Keep dynamic styles (those using `UI.color.*`, `pressed`, state values) inline — these can't be pre-computed
- [ ] ⬜ Pattern template:
  ```typescript
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: UI.color.bg },
    // ... all static styles
  });
  ```
- [ ] ⬜ Replace `style={styles.xxx}` for static styles
- [ ] ⬜ Keep `style={({ pressed }) => [styles.base, pressed && styles.pressed]}` pattern

**Acceptance:** Each screen has a `styles` StyleSheet for static styles. Dynamic styles remain inline.

---

## Phase 3 — Auth & Media

> **Goal:** Reduce signup friction with social login. Enable receipt photo attachments.
> **Exit criteria:** User can sign up with Google/Apple. User can attach a photo to an expense.
>
> **Status: 4/4 complete ✅**

---

### 3.1 🟠 Social login — Google OAuth ✅

| Field     | Value                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                                                                                     |
| Estimated | 4 hrs                                                                                                                                                                  |
| Files     | `src/app/(auth)/welcome.tsx`, `src/app/(auth)/login.tsx`, `src/services/api/auth.ts`, `src/features/auth/hooks/useAuthMutations.ts`, `src/services/supabase/client.ts` |
| Source    | D5                                                                                                                                                                     |

**Steps:**

- [x] ✅ Added `signInWithGoogle` to AuthService (supabase.auth.signInWithOAuth with Google provider)
- [x] ✅ Added `useSignInWithGoogle` mutation hook
- [x] ✅ Added "Continue with Google" buttons to WelcomeScreen and LoginScreen
- [x] ✅ Fixed OAuth flow for Expo: uses `expo-web-browser` + `expo-auth-session` with `WebBrowser.openAuthSessionAsync` + `skipBrowserRedirect: true` + session exchange via `setSession`
- [x] ✅ Added `flowType: "pkce"` to Supabase client config (required for native OAuth)
- [x] ✅ Installed `expo-web-browser`, `expo-auth-session`, `expo-linking`

**Acceptance:** User can sign up with Google in 2 taps. Name auto-populates from Google profile. ✅

---

### 3.2 🟠 Social login — Apple Sign In ✅

| Field     | Value                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                      |
| Estimated | 3 hrs                                                                                                   |
| Files     | `src/app/(auth)/welcome.tsx`, `src/services/api/auth.ts`, `src/features/auth/hooks/useAuthMutations.ts` |
| Source    | D5                                                                                                      |

**Steps:**

- [x] ✅ Installed `expo-apple-authentication`
- [x] ✅ Added `signInWithApple` to AuthService
- [x] ✅ Added `useSignInWithApple` mutation hook
- [x] ✅ Added "Continue with Apple" button, rendered only on iOS (`Platform.OS === 'ios'`)
- [x] ✅ Loading state handled via ActivityIndicator

**Acceptance:** iOS users see Apple Sign In. Android users see only Google option. ✅

---

### 3.3 🟠 Receipt photo attachment ✅

| Field     | Value                                                                                                                                                                                                                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                                                                                                                                                                                                                       |
| Estimated | 5 hrs                                                                                                                                                                                                                                                                                                    |
| Files     | `src/features/expenses/screens/NewExpenseScreen.tsx`, `src/features/expenses/screens/ExpenseDetailScreen.tsx`, `src/services/storage/index.ts`, `src/features/expenses/hooks/useExpenseForm.ts`, `src/services/api/mappers.ts`, `src/types/index.ts`, `supabase/migrations/202607110011_receipt_url.sql` |
| Source    | D3                                                                                                                                                                                                                                                                                                       |

**Steps:**

- [x] ✅ Installed `expo-image-picker`
- [x] ✅ Created `src/services/storage/index.ts` with `uploadReceipt`, `getReceiptUrl`, `deleteReceipt`
- [x] ✅ Added `receipt_url` column migration
- [x] ✅ Added `receiptUrl` to `Expense` type and mapper functions
- [x] ✅ Added receipt picker button in NewExpenseScreen (camera icon + gallery picker + thumbnail preview + clear button)
- [x] ✅ Added receipt upload flow in `useExpenseForm.handleSubmit` (uploads after expense creation with real ID)
- [x] ✅ Added receipt image display in ExpenseDetailScreen

**Acceptance:** User can attach a photo to a new expense. Photo visible in expense detail. ✅

---

### 3.4 🟡 Group default split method ✅

| Field     | Value                                                                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ✅                                                                                                                                                                                                                      |
| Estimated | 2 hrs                                                                                                                                                                                                                   |
| Files     | `src/types/index.ts`, `src/services/api/mappers.ts`, `src/features/groups/screens/GroupSettingsScreen.tsx`, `src/features/expenses/hooks/useExpenseForm.ts`, `supabase/migrations/202607110010_group_default_split.sql` |
| Source    | D7                                                                                                                                                                                                                      |

**Steps:**

- [x] ✅ Migration: `ALTER TABLE groups ADD COLUMN default_split_method TEXT DEFAULT 'equal'`
- [x] ✅ Updated `Group` type with `defaultSplitMethod?: SplitMethod` field
- [x] ✅ Updated `mapGroup`, `toGroupInsert`, `toGroupUpdate` mappers
- [x] ✅ Added split method picker in GroupSettingsScreen (Finance section)
- [x] ✅ `useExpenseForm` uses `selectedGroup?.defaultSplitMethod` as initial split method
- [x] ✅ User can still override per-expense

**Acceptance:** Creating an expense in a group with default "custom" split auto-selects the custom split method. ✅

---

## Phase 4 — Notifications & Recurring (Sprint 3-4)

> **Goal:** App keeps users engaged without them needing to manually check.
> **Exit criteria:** Push notifications fire for new expenses, settlements, and friend requests. Recurring expenses auto-create.

---

### 4.1 🔴 Push notifications — infrastructure

| Field     | Value                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                                         |
| Estimated | 6 hrs                                                                                                      |
| Files     | `src/services/notifications/`, `supabase/functions/`, `src/app/_layout.tsx`, `src/features/notifications/` |
| Source    | D1                                                                                                         |

**Steps:**

- [ ] ⬜ Install `expo-notifications` and `expo-device`
- [ ] ⬜ Create `src/services/notifications/register.ts`:
  - Request permission
  - Get Expo push token
  - Store token in `users` table via `AuthService.updateProfile`
- [ ] ⬜ Migration: `ALTER TABLE users ADD COLUMN expo_push_token TEXT`
- [ ] ⬜ Create Supabase Edge Function `notify`:
  - Receives: `{ userIds: string[], title: string, body: string, data: object }`
  - Looks up Expo push tokens for each userId
  - Sends via Expo Push API (`https://exp.host/--/api/v2/push/send`)
- [ ] ⬜ Create database triggers that call the edge function:
  - `on_expense_created`: notify all group members except payer
  - `on_settlement_recorded`: notify both parties
  - `on_friend_request`: notify recipient
  - `on_expense_comment`: notify expense participants
- [ ] ⬜ In `src/app/_layout.tsx`, add notification handler:
  - When app is foregrounded: show in-app banner toast
  - When tapped: navigate to relevant screen (expense, settlement, friend request)
- [ ] ⬜ In DashboardScreen, show badge count on bell icon: `useNotifications(currentUser.id).length`

**Edge cases:**

- [ ] ⬜ Handle revoked permission gracefully (no crash, just no push)
- [ ] ⬜ Handle token refresh (Expo tokens can change)
- [ ] ⬜ Rate limit: don't send >5 notifications/hr to same user
- [ ] ⬜ Respect quiet hours setting (future: add setting in Profile)

**Acceptance:** User receives push notification within 5 seconds of a friend adding an expense in their group.

---

### 4.2 🟠 Recurring expenses — schema + creation

| Field     | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Status    | ⬜                                                                     |
| Estimated | 8 hrs                                                                  |
| Files     | `supabase/migrations/`, `src/features/expenses/`, `src/types/index.ts` |
| Source    | D2                                                                     |

**Steps:**

- [ ] ⬜ Migration: Create `recurring_expenses` table:
  ```sql
  CREATE TABLE recurring_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    category TEXT,
    paid_by UUID REFERENCES users(id),
    split_method TEXT DEFAULT 'equal',
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] ⬜ Migration: Create `recurring_expense_splits` table mirroring `expense_splits`
- [ ] ⬜ Add `recurring_expense_id` column to `expenses` table
- [ ] ⬜ Add `RecurringExpense` type
- [ ] ⬜ In NewExpenseScreen, add "Repeat" toggle section:
  - When enabled, show frequency picker (daily/weekly/biweekly/monthly/yearly)
  - Show "Next due" date preview
  - On submit: create both the immediate expense AND the recurring template
- [ ] ⬜ In ExpenseDetailScreen, if expense is recurring, show "Part of recurring series" badge with link to manage series

**Acceptance:** User can create a monthly rent expense. The immediate expense is created AND a recurring template is stored.

---

### 4.3 🟠 Recurring expenses — auto-generation

| Field     | Value                                           |
| --------- | ----------------------------------------------- |
| Status    | ⬜                                              |
| Estimated | 4 hrs                                           |
| Files     | `supabase/functions/`, `src/features/expenses/` |
| Source    | D2                                              |

**Steps:**

- [ ] ⬜ Create Supabase Edge Function `generate-recurring-expenses`:
  - Runs via `pg_cron` or scheduled HTTP trigger (Supabase cron)
  - Queries `recurring_expenses` where `next_due_date <= today` AND `is_active = true`
  - For each: insert new expense, create activity, update `next_due_date` based on frequency
  - Send push notification: "Monthly rent of $X added to [Group]"
- [ ] ⬜ Create Supabase database function `generate_recurring_expenses()` that can be called manually or by cron
- [ ] ⬜ Dashboard: show "Upcoming" section with next 7 days of recurring expenses
- [ ] ⬜ GroupDetailScreen: if group has recurring expenses, show "Upcoming this month" card

**Edge cases:**

- [ ] ⬜ What happens if group is deleted? → CASCADE handles it
- [ ] ⬜ What if payer leaves group? → Mark series as paused, notify group
- [ ] ⬜ What if amount/currency changes? → Edit series, future instances use new values

**Acceptance:** On the 1st of each month, recurring rent expenses auto-create. Users receive a push notification.

---

## Phase 5 — Advanced Splits & Quality (Sprint 5)

> **Goal:** Cover the remaining Splitwise use cases. Add undo capability.
> **Exit criteria:** Shares split method works. Users can undo recent deletions.

---

### 5.1 🟡 Split by shares (weighted split)

| Field     | Value                                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                                                                                                   |
| Estimated | 4 hrs                                                                                                                                                                |
| Files     | `src/features/expenses/hooks/useExpenseForm.ts`, `src/features/expenses/screens/NewExpenseScreen.tsx`, `src/features/expenses/utils/splits.ts`, `src/types/index.ts` |
| Source    | D6                                                                                                                                                                   |

**Steps:**

- [ ] ⬜ Add `'shares'` to `SplitMethod` type
- [ ] ⬜ Add share count field per participant in the participants editor (`ParticipantEditor`)
- [ ] ⬜ Each participant gets a `+` / `-` stepper for their share count (default: 1)
- [ ] ⬜ Calculate: `totalShares = sum of all shares`, `perShareAmount = parsedAmount / totalShares`
- [ ] ⬜ Each person pays: `perShareAmount * theirShares`
- [ ] ⬜ Validate: at least 1 share across all included participants
- [ ] ⬜ Add shares label to SPLIT_METHODS array with icon `Hash`
- [ ] ⬜ Update `generateSplits()` to handle shares
- [ ] ⬜ Update `PreviewCard` to show "X shares" instead of amount/percentage when method is shares

**Acceptance:** Splitting $1000 rent with "John: 2 shares, Mary: 1 share" results in John = $666.67, Mary = $333.33.

---

### 5.2 🟠 Undo for destructive actions

| Field     | Value                                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                                                                                                              |
| Estimated | 3 hrs                                                                                                                                                                           |
| Files     | `src/features/expenses/queries/useExpenses.ts`, `src/features/settlements/queries/useSettlements.ts`, `src/features/friends/queries/useFriends.ts`, `src/hooks/useAppToast.tsx` |
| Source    | C2                                                                                                                                                                              |

**Steps:**

- [ ] ⬜ Create a reusable `undoMiddleware` for React Query mutations:
  ```typescript
  function withUndo<T>(mutationFn, undoFn, toastLabel) {
    return {
      mutationFn,
      onSuccess: () =>
        toast.show({ label: toastLabel, action: { label: "Undo", onPress: undoFn } }),
    };
  }
  ```
- [ ] ⬜ Apply to: `useDeleteExpense`, `useDeleteSettlement`, `useRemoveFriend`, `useRejectFriend`
- [ ] ⬜ Toast shows "Expense deleted" with "Undo" button
- [ ] ⬜ Undo re-creates the record with original data (stored in closure)
- [ ] ⬜ Auto-dismiss toast (and permanently delete) after 5 seconds if no undo

**Acceptance:** Deleting an expense shows "Expense deleted — Undo" toast. Tapping Undo restores it.

---

### 5.3 🟡 Haptic feedback on tab bar (active tab)

| Field     | Value                        |
| --------- | ---------------------------- |
| Status    | ⬜                           |
| Estimated | 10 min                       |
| Files     | `src/app/(tabs)/_layout.tsx` |
| Source    | C11                          |

**Steps:**

- [ ] ⬜ Line ~39: Remove the `!isFocused` guard. Fire `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on every tab press.
- [ ] ⬜ For active tab, use `Haptics.ImpactFeedbackStyle.Soft` instead of `Light` to indicate "already here"

**Acceptance:** Tapping the active tab gives subtle feedback. Tapping a different tab gives the usual haptic.

---

## Phase 6 — Ecosystem & Polish (Sprint 6+)

> **Goal:** Contacts, export, live rates, and long-term design system health.
> **Exit criteria:** All "later" items implemented.

---

### 6.1 🟡 Data export (CSV)

| Field     | Value                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| Status    | ⬜                                                                            |
| Estimated | 3 hrs                                                                         |
| Files     | `src/features/profile/screens/ProfileScreen.tsx`, `src/utils/export.ts` (new) |
| Source    | D8                                                                            |

**Steps:**

- [ ] ⬜ Create `src/utils/export.ts` with `exportExpensesAsCSV(expenses, currentUser)` and `exportBalancesAsCSV(balances)`
- [ ] ⬜ Use `expo-sharing` and `expo-file-system` to write CSV and open share sheet
- [ ] ⬜ Add "Export expenses" button in ProfileScreen (in the Account section)
- [ ] ⬜ Also add to GroupSettingsScreen: "Export group expenses"

**Acceptance:** User can export a CSV file and share it via any app (email, AirDrop, Files, etc.).

---

### 6.2 🟢 Contacts integration

| Field     | Value                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                                    |
| Estimated | 4 hrs                                                                                                 |
| Files     | `src/features/friends/screens/NewFriendScreen.tsx`, `src/features/friends/services/contacts.ts` (new) |
| Source    | D9                                                                                                    |

**Steps:**

- [ ] ⬜ Install `expo-contacts`
- [ ] ⬜ Create `src/features/friends/services/contacts.ts`:
  - `requestContactsPermission()` → boolean
  - `getPhoneContacts()` → `{ name, phoneNumbers, emails }[]`
  - `findUsersOnSplt(contacts)` → queries Supabase for users matching contact emails/phones
- [ ] ⬜ In NewFriendScreen, add a "From Contacts" section:
  - Requests contacts permission on mount
  - Shows "Friends on Splt" list (contacts who are registered users)
  - Shows "Invite" button next to contacts not on Splt (opens share sheet with app link)

**Privacy note:** Contacts are processed on-device. Only email/phone hashes are sent to Supabase for matching. No raw contacts are uploaded.

**Acceptance:** User can find friends from their phone contacts who are already on Splt.

---

### 6.3 🟢 Multi-currency live refresh

| Field     | Value                     |
| --------- | ------------------------- |
| Status    | ⬜                        |
| Estimated | 1 hr                      |
| Files     | `src/store/useUIStore.ts` |
| Source    | D10                       |

**Steps:**

- [ ] ⬜ Add `lastRatesUpdate` timestamp to UIState
- [ ] ⬜ Add `useEffect` in `AppProvider` that calls `fetchExchangeRates()` on mount
- [ ] ⬜ Add `setInterval` in `useUIStore.fetchExchangeRates` implementation to refresh every 4 hours
- [ ] ⬜ Clear interval on store reset/hydration
- [ ] ⬜ Show "Rates updated X hours ago" in CurrencySelector

**Acceptance:** Exchange rates auto-refresh while app is open. User sees last-updated timestamp.

---

### 6.4 🟡 Single source-of-truth design tokens

| Field     | Value                                                                     |
| --------- | ------------------------------------------------------------------------- |
| Status    | ⬜                                                                        |
| Estimated | 3 hrs                                                                     |
| Files     | `src/components/ui/native-ui.tsx`, `src/global.css`, `design-tokens.json` |
| Source    | B2                                                                        |

**Steps:**

- [ ] ⬜ Clean up `design-tokens.json` to be the canonical source
- [ ] ⬜ Write a build script `scripts/generate-tokens.ts` that reads `design-tokens.json` and outputs:
  - `src/components/ui/tokens.generated.ts` — the JS color/radius/space constants
  - CSS variables injected into `global.css` via `@theme` block
- [ ] ⬜ Update `native-ui.tsx` to import from `tokens.generated.ts` instead of hardcoding
- [ ] ⬜ Add `npm run tokens:generate` script and hook into `prebuild`

**Acceptance:** Changing a value in `design-tokens.json` and running `npm run tokens:generate` updates both JS and CSS themes.

---

### 6.5 🟢 Tab bar first-run tooltip

| Field     | Value                                                                              |
| --------- | ---------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                 |
| Estimated | 2 hrs                                                                              |
| Files     | `src/features/dashboard/screens/DashboardScreen.tsx`, `src/app/(tabs)/_layout.tsx` |
| Source    | C9                                                                                 |

**Steps:**

- [ ] ⬜ Store `@splt_has_seen_tabs` flag in AsyncStorage (similar to `@splt_onboarded`)
- [ ] ⬜ On first Dashboard render after onboarding, show a subtle tooltip: "Tap an icon to navigate" with arrow pointing to tab bar
- [ ] ⬜ Dismiss on any tab interaction or after 5 seconds
- [ ] ⬜ Never show again on subsequent app opens

**Acceptance:** New user sees a one-time tab bar explanation. Returning users never see it.

---

### 6.6 🟢 Consolidate duplicate SearchField

| Field     | Value                                                                                   |
| --------- | --------------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                      |
| Estimated | 1.5 hrs                                                                                 |
| Files     | `src/features/expenses/screens/NewExpenseScreen.tsx`, `src/components/ui/native-ui.tsx` |
| Source    | C12                                                                                     |

**Steps:**

- [ ] ⬜ Update the `SearchField` in `native-ui.tsx` to accept a `placeholder` prop and a `variant` prop (`"card"` for lg radius, `"pill"` for pill radius)
- [ ] ⬜ Replace the inline `SearchField` component in NewExpenseScreen with the shared one
- [ ] ⬜ Verify all existing usages still render correctly

**Acceptance:** Only one SearchField implementation exists. All screens use it.

---

### 6.7 🟡 OCR receipt scanning

| Field     | Value                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------- |
| Status    | ⬜                                                                                                  |
| Estimated | 8 hrs                                                                                               |
| Files     | `src/features/expenses/services/ocr.ts` (new), `src/features/expenses/screens/NewExpenseScreen.tsx` |
| Source    | D4                                                                                                  |

**Steps:**

- [ ] ⬜ Install `expo-vision` or `react-native-vision-camera` + frame processor
- [ ] ⬜ Create `src/features/expenses/services/ocr.ts`:
  - `scanReceipt(imageUri): Promise<{ amount?: number, merchant?: string, date?: Date }>`
  - Use Apple's Vision framework on iOS (VNRecognizeTextRequest)
  - Use Google ML Kit on Android
- [ ] ⬜ After taking/selecting receipt photo, show a processing spinner
- [ ] ⬜ Pre-fill expense form with extracted values (highlight in form, let user edit)
- [ ] ⬜ Fallback gracefully if OCR fails: "Couldn't read receipt — enter details manually"

**Acceptance:** Taking a photo of a receipt auto-fills the amount and title. User confirms before saving.

---

### 6.8 🟢 Font weight loading

| Field     | Value                                                    |
| --------- | -------------------------------------------------------- |
| Status    | ⬜                                                       |
| Estimated | 30 min                                                   |
| Files     | `assets/fonts/`, `src/app/_layout.tsx`, `src/global.css` |
| Source    | B3, B4                                                   |

**Steps:**

- [ ] ⬜ Download `IBMPlexSans-Bold.ttf` (700 weight) from Google Fonts
- [ ] ⬜ Download `IBMPlexSans-BoldItalic.ttf` if available
- [ ] ⬜ Update `useFonts` in `_layout.tsx` to load new fonts
- [ ] ⬜ Update `font-bold` utility to load Bold weight
- [ ] ⬜ Update `font-heading-italic` to load an actual italic Sora variant or remove the utility
- [ ] ⬜ If no Sora italic exists, remove `font-heading-italic` utility entirely

**Acceptance:** Bold text renders with actual 700 weight, not 600 SemiBold.

---

### 6.9 🟢 Amount formatting threshold adjustment

| Field     | Value                                 |
| --------- | ------------------------------------- |
| Status    | ⬜                                    |
| Estimated | 10 min                                |
| Files     | `src/components/ui/AmountDisplay.tsx` |
| Source    | C10                                   |

**Steps:**

- [ ] ⬜ Change compact notation threshold from `1_000_000` to `10_000_000` (10M)
- [ ] ⬜ Change K notation threshold from `10_000` to `100_000` for zero-decimal currencies
- [ ] ⬜ Rationale: personal finance amounts rarely exceed 10M, and showing full numbers is more trustworthy

**Acceptance:** ¥8,000,000 shows as ¥8,000,000.00, not ¥8.0M. $12,000,000 shows as $12.0M.

---

## Appendix A: Anti-Features (Do NOT Build)

| #   | Feature                         | Reason                                                                      |
| --- | ------------------------------- | --------------------------------------------------------------------------- |
| E1  | Integrated payment processing   | Regulatory burden, fraud liability. Keep "record and track" positioning.    |
| E2  | Gamification / streaks          | Violates PRODUCT.md. Money is stressful, not a game.                        |
| E3  | Web app / responsive dashboard  | Design system is RN-native. Web would double maintenance.                   |
| E4  | Public API / developer platform | Premature. No proven demand yet.                                            |
| E5  | In-app chat / messaging         | Expense comments are sufficient. Chat = scope creep + moderation liability. |

---

## Appendix B: Pre-Build Checklist (Every Task)

Before marking any task as ✅, verify ALL of the following:

```
[ ] npx tsc --noEmit          → 0 errors
[ ] npm run lint               → 0 errors, 0 new warnings
[ ] npm run test               → all tests pass (if tests exist for the changed code)
[ ] iOS simulator              → feature works, dark mode renders correctly
[ ] Android simulator          → feature works, dark mode renders correctly
[ ] Empty state                → renders correctly (e.g., empty list, no data)
[ ] Loading state              → skeleton or spinner shows, no blank flash
[ ] Error state                → error boundary works, toast shows on mutation failure
[ ] Haptics                    → relevant interactions fire haptic feedback
[ ] Safe area                  → content not hidden behind notch/status bar/nav bar
[ ] Console                    → no redbox errors or yellowbox warnings in dev mode
[ ] Accessibility              → all touchable elements have accessibilityLabel/accessibilityRole
```

---

## Appendix C: File Impact Map

Quick reference: which files change for each phase.

```
Phase 1 (Bug Fixes):
  ✎ src/features/activity/screens/ActivityScreen.tsx
  ✎ src/app/(tabs)/_layout.tsx
  ✎ src/features/dashboard/screens/DashboardScreen.tsx
  ✎ src/components/animations/PageAnimator.tsx
  ✎ src/components/ui/AppLoader.tsx
  ✎ src/features/groups/screens/GroupDetailScreen.tsx
  ✎ src/features/groups/screens/GroupSettingsScreen.tsx

Phase 2 (UX Polish):
  ✎ src/features/expenses/screens/NewExpenseScreen.tsx
  ✎ src/features/settlements/screens/SettlementScreen.tsx
  ✎ src/features/activity/screens/ActivityScreen.tsx
  ✎ src/features/friends/screens/FriendDetailScreen.tsx
  ✎ src/features/dashboard/screens/DashboardScreen.tsx
  ✎ src/features/groups/screens/GroupDetailScreen.tsx
  ✎ src/features/settlements/screens/SettlementScreen.tsx
  ✎ src/features/friends/screens/FriendDetailScreen.tsx
  ✎ supabase/migrations/ (new migration)

Phase 3 (Auth & Media):
  ✎ src/app/(auth)/welcome.tsx
  ✎ src/app/(auth)/login.tsx
  ✎ src/app/_layout.tsx
  ✎ src/services/api/auth.ts
  ✎ src/features/auth/hooks/useAuthMutations.ts
  ✎ src/features/expenses/screens/NewExpenseScreen.tsx
  ✎ src/features/expenses/screens/ExpenseDetailScreen.tsx
  ✎ src/features/expenses/hooks/useExpenseForm.ts
  ✎ src/features/groups/screens/NewGroupScreen.tsx
  ✎ src/features/groups/screens/GroupSettingsScreen.tsx
  ✎ src/types/index.ts
  + src/services/storage/index.ts (new)
  ✎ supabase/migrations/ (3 new migrations)

Phase 4 (Notifications & Recurring):
  + src/services/notifications/register.ts (new)
  + supabase/functions/notify/index.ts (new)
  + supabase/functions/generate-recurring/index.ts (new)
  ✎ src/app/_layout.tsx
  ✎ src/features/dashboard/screens/DashboardScreen.tsx
  ✎ src/features/expenses/screens/NewExpenseScreen.tsx
  ✎ src/features/expenses/screens/ExpenseDetailScreen.tsx
  ✎ src/features/expenses/hooks/useExpenseForm.ts
  ✎ src/types/index.ts
  ✎ supabase/migrations/ (3 new migrations)

Phase 5 (Advanced Splits & Quality):
  ✎ src/features/expenses/hooks/useExpenseForm.ts
  ✎ src/features/expenses/screens/NewExpenseScreen.tsx
  ✎ src/features/expenses/utils/splits.ts
  ✎ src/features/expenses/queries/useExpenses.ts
  ✎ src/features/settlements/queries/useSettlements.ts
  ✎ src/features/friends/queries/useFriends.ts
  ✎ src/hooks/useAppToast.tsx
  ✎ src/types/index.ts
  ✎ src/app/(tabs)/_layout.tsx

Phase 6 (Ecosystem & Polish):
  + src/utils/export.ts (new)
  + src/features/friends/services/contacts.ts (new)
  + src/features/expenses/services/ocr.ts (new)
  + scripts/generate-tokens.ts (new)
  ✎ src/store/useUIStore.ts
  ✎ src/providers/AppProvider.tsx
  ✎ src/components/ui/native-ui.tsx
  ✎ src/global.css
  ✎ src/features/profile/screens/ProfileScreen.tsx
  ✎ src/features/friends/screens/NewFriendScreen.tsx
  ✎ src/features/expenses/screens/NewExpenseScreen.tsx
  ✎ src/components/ui/AmountDisplay.tsx
  ✎ src/features/dashboard/screens/DashboardScreen.tsx
  ✎ src/app/(tabs)/_layout.tsx
  ✎ design-tokens.json
  ✎ assets/fonts/ (new font files)
  ✎ src/app/_layout.tsx
```

---

## Appendix D: Supabase Migrations Summary

| #   | Phase | Migration                 | Description                                                                 |
| --- | ----- | ------------------------- | --------------------------------------------------------------------------- |
| M1  | 2.4   | `backfill_activities`     | Insert activity rows for all existing expenses and settlements              |
| M2  | 3.3   | `add_receipt_url`         | Add `receipt_url TEXT` to `expenses`                                        |
| M3  | 3.4   | `add_default_split`       | Add `default_split_method TEXT DEFAULT 'equal'` to `groups`                 |
| M4  | 4.1   | `add_push_token`          | Add `expo_push_token TEXT` to `users`                                       |
| M5  | 4.2   | `create_recurring_tables` | Create `recurring_expenses` and `recurring_expense_splits` tables           |
| M6  | 4.2   | `add_recurring_fk`        | Add `recurring_expense_id UUID` to `expenses`                               |
| M7  | 4.3   | `generate_recurring_fn`   | Create `generate_recurring_expenses()` database function                    |
| M8  | 4.1   | `notification_triggers`   | Create triggers that call edge function on expense/settlement/friend events |

---

## Summary: Phase Timeline

| Phase                         | Est. Days   | Cumulative | Key Deliverable                                                               |
| ----------------------------- | ----------- | ---------- | ----------------------------------------------------------------------------- |
| 1 — Bug Fixes                 | 2           | 2          | ✅ 0 lint errors, 0 type errors, skeletons on group detail                    |
| 2 — UX Polish                 | 3           | 5          | ✅ Activity from DB, settlement toast, close button fix, skeletons everywhere |
| 3 — Auth & Media              | 5           | 10         | ✅ Google+Apple sign-in, receipt photos, group default splits                 |
| 4 — Notifications & Recurring | 10          | 20         | Push notifications, recurring expenses auto-create                            |
| 5 — Advanced Splits & Quality | 4           | 24         | Shares split method, undo for deletions                                       |
| 6 — Ecosystem & Polish        | 6           | 30         | CSV export, contacts, OCR, token generation                                   |
| **Total**                     | **30 days** |            | Feature-complete against Splitwise, design-system clean                       |
