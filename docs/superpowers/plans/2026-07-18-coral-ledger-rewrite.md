# Splt Coral Ledger Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the complete Splt mobile application using the production design in `design/new-design/`, replace persistent tabs with command navigation, and add fully persisted recurring expenses.

**Architecture:** Build a parallel `/v2` Expo Router shell while preserving current routes. Existing feature services, queries, and controllers supply real data to new Coral Ledger presentation components. After manual and static verification, replace production routes with v2 and delete glass-specific UI and obsolete navigation.

**Tech Stack:** Expo 57, React Native 0.86, React 19, Expo Router 57, Supabase, TanStack React Query 5, Zustand 5, React Hook Form 7, Zod 4, HeroUI Native, Uniwind/Tailwind CSS 4, Reanimated 4

## Global Constraints

- Keep the Splt product name, `splt` scheme, and `com.splt.app` bundle identifier.
- `design/new-design/` is the visual and interaction source of truth.
- Content surfaces are opaque. Blur is allowed only on status bars, sticky top bars, command sheets, and task sheets.
- Use Instrument Sans for product UI and IBM Plex Mono only for financial/numeric values.
- Use coral for brand actions, emerald for positive money, crimson for negative money.
- Controls use 14px radii, cards use 16px, and sheets use 24px.
- iOS targets are at least 44pt; Android targets are at least 48dp.
- Remove persistent tabs; authenticated navigation uses a floating command control.
- Existing backend behavior and unmatched existing screens remain available.
- Add no new unit, component, or snapshot test files.
- Required verification: typecheck, lint, format check, migration validation, manual flow checks, accessibility checks, and screenshots.
- Do not commit unless the user explicitly requests a commit.

---

## File Map

### New Foundation

- `src/components/coral/CoralScreen.tsx` — safe-area screen layout and optional command button
- `src/components/coral/CoralTopBar.tsx` — translucent sticky/native top bar
- `src/components/coral/BalanceHero.tsx` — dark money summary
- `src/components/coral/MoneyRow.tsx` — continuous transparent list row
- `src/components/coral/GroupTile.tsx` — opaque actionable group card
- `src/components/coral/StatPair.tsx` — two-column stat layout
- `src/components/coral/CoralButton.tsx` — primary, secondary, and danger actions
- `src/components/coral/CoralField.tsx` — text/select form field
- `src/components/coral/CoralSearchField.tsx` — 48px search control
- `src/components/coral/CoralChip.tsx` — filter chip
- `src/components/coral/CoralSegment.tsx` — segmented selection
- `src/components/coral/MoneyAmount.tsx` — IBM Plex Mono amount
- `src/components/coral/Eyebrow.tsx` — section heading
- `src/components/coral/LargeTitle.tsx` — 36/32px platform title
- `src/components/coral/FloatingCommandButton.tsx` — platform-specific coral FAB
- `src/components/coral/CommandSheet.tsx` — search and global destinations
- `src/components/coral/CoralSnackbar.tsx` — undo/status feedback
- `src/components/coral/index.ts` — public exports
- `src/components/coral/theme.ts` — raw native color equivalents generated from CSS source
- `scripts/generate-coral-tokens.mjs` — converts canonical OKLCH tokens to sRGB

### Parallel Routes

- `src/app/v2/_layout.tsx`
- `src/app/v2/home.tsx`
- `src/app/v2/friends.tsx`
- `src/app/v2/friend/[id].tsx`
- `src/app/v2/group/[id].tsx`
- `src/app/v2/group/new.tsx`
- `src/app/v2/group/[id]/settings.tsx`
- `src/app/v2/activity.tsx`
- `src/app/v2/expense/new.tsx`
- `src/app/v2/expense/[id].tsx`
- `src/app/v2/settle/[id].tsx`
- `src/app/v2/recurring/index.tsx`
- `src/app/v2/recurring/new.tsx`
- `src/app/v2/recurring/[id].tsx`
- `src/app/v2/currencies.tsx`
- `src/app/v2/notifications.tsx`
- `src/app/v2/settings.tsx`
- `src/app/v2/analytics.tsx`
- `src/app/v2/profile/edit.tsx`
- `src/app/v2/profile/change-password.tsx`
- `src/app/v2/(auth)/welcome.tsx`
- `src/app/v2/(auth)/login.tsx`
- `src/app/v2/(auth)/register.tsx`
- `src/app/v2/(auth)/forgot-password.tsx`
- `src/app/v2/(auth)/verify-email.tsx`
- `src/app/v2/profile-setup.tsx`

### Recurring Feature

- `supabase/migrations/202607180001_recurring_expenses.sql`
- `src/types/recurring.ts`
- `src/features/recurring/services/recurringApi.ts`
- `src/features/recurring/queries/useRecurringExpenses.ts`
- `src/features/recurring/hooks/useRecurringList.ts`
- `src/features/recurring/hooks/useRecurringDetail.ts`
- `src/features/recurring/hooks/useRecurringForm.ts`
- `src/features/recurring/components/RecurringRow.tsx`
- `src/features/recurring/components/RecurringScheduleForm.tsx`
- `src/features/recurring/components/RecurringDetailSummary.tsx`
- `src/features/recurring/screens/RecurringListScreen.tsx`
- `src/features/recurring/screens/RecurringDetailScreen.tsx`
- `src/features/recurring/screens/NewRecurringScreen.tsx`

---

## Task 1: Install Fonts And Token Generator

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/generate-coral-tokens.mjs`
- Create: `src/components/coral/theme.ts`

**Produces:** Instrument Sans and IBM Plex Mono font assets plus generated raw native colors.

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install @expo-google-fonts/instrument-sans @expo-google-fonts/ibm-plex-mono
npm install --save-dev culori
```

Expected: dependencies are recorded without peer-resolution errors.

- [ ] **Step 2: Add token generator**

Create `scripts/generate-coral-tokens.mjs`:

```javascript
import { converter, formatHex } from "culori";
import { writeFile } from "node:fs/promises";

const toRgb = converter("rgb");
const themes = {
  light: {
    bg: "oklch(97% 0.012 245)",
    surface: "oklch(99% 0.006 245)",
    foreground: "oklch(22% 0.032 255)",
    muted: "oklch(46% 0.026 250)",
    border: "oklch(87% 0.022 245)",
    accent: "oklch(66% 0.19 28)",
    accentInk: "oklch(31% 0.11 25)",
    accentSoft: "oklch(93% 0.05 28)",
    inkOnAccent: "oklch(99% 0.004 25)",
    positive: "oklch(52% 0.145 157)",
    positiveSoft: "oklch(93% 0.045 157)",
    negative: "oklch(50% 0.19 18)",
    negativeSoft: "oklch(94% 0.04 18)",
    warning: "oklch(66% 0.14 78)",
    balanceSurface: "oklch(25% 0.045 255)",
    balanceForeground: "oklch(97% 0.008 245)",
    avatarSoft: "oklch(92% 0.035 245)",
    avatarInk: "oklch(35% 0.07 250)",
  },
  dark: {
    bg: "oklch(17% 0.02 255)",
    surface: "oklch(21% 0.024 255)",
    foreground: "oklch(95% 0.008 245)",
    muted: "oklch(72% 0.025 245)",
    border: "oklch(32% 0.026 255)",
    accent: "oklch(72% 0.18 28)",
    accentInk: "oklch(91% 0.055 28)",
    accentSoft: "oklch(29% 0.065 28)",
    inkOnAccent: "oklch(18% 0.035 25)",
    positive: "oklch(72% 0.14 157)",
    positiveSoft: "oklch(27% 0.055 157)",
    negative: "oklch(72% 0.17 18)",
    negativeSoft: "oklch(27% 0.06 18)",
    warning: "oklch(76% 0.13 78)",
    balanceSurface: "oklch(13% 0.035 255)",
    balanceForeground: "oklch(97% 0.008 245)",
    avatarSoft: "oklch(28% 0.05 245)",
    avatarInk: "oklch(88% 0.045 245)",
  },
};

const converted = Object.fromEntries(
  Object.entries(themes).map(([theme, tokens]) => [
    theme,
    Object.fromEntries(
      Object.entries(tokens).map(([key, value]) => [key, formatHex(toRgb(value))])
    ),
  ])
);

const source = `export const CORAL_COLORS = ${JSON.stringify(converted, null, 2)} as const;\n`;
await writeFile("src/components/coral/theme.ts", source);
```

- [ ] **Step 3: Generate native tokens**

Run:

```bash
node scripts/generate-coral-tokens.mjs
npm run typecheck
```

Expected: `theme.ts` contains light and dark hexadecimal tokens; typecheck exits 0.

## Task 2: Replace Global Design Tokens And Fonts

**Files:**

- Modify: `src/global.css`
- Modify: `src/app/_layout.tsx`
- Modify: `src/components/ui/hooks/useUI.ts`
- Modify: `src/components/ui/theme/tokens.ts`
- Modify: `src/components/ui/theme/typography.ts`

**Consumes:** `CORAL_COLORS` from Task 1.
**Produces:** Coral Ledger theme available to Uniwind and raw-color consumers.

- [ ] **Step 1: Replace CSS theme values**

Copy the canonical `:root` and dark-mode values from
`design/new-design/suma-prototype.css` into `src/global.css`. Map semantic Tailwind aliases:

```css
--color-background: var(--bg);
--color-surface: var(--surface);
--color-foreground: var(--fg);
--color-muted-foreground: var(--muted);
--color-border: var(--border);
--color-primary: var(--accent);
--color-primary-foreground: var(--ink-on-accent);
--color-success: var(--positive);
--color-danger: var(--negative);
--radius-sm: 12px;
--radius-md: 14px;
--radius-lg: 16px;
--radius-xl: 24px;
```

Replace current font utilities with:

```css
@utility font-ui {
  font-family: "InstrumentSans_400Regular";
}
@utility font-ui-medium {
  font-family: "InstrumentSans_500Medium";
}
@utility font-ui-semibold {
  font-family: "InstrumentSans_600SemiBold";
}
@utility font-numeric {
  font-family: "IBMPlexMono_500Medium";
}
@utility font-numeric-semibold {
  font-family: "IBMPlexMono_600SemiBold";
}
```

- [ ] **Step 2: Load fonts in root layout**

Update `useFonts` in `src/app/_layout.tsx` to load:

```typescript
InstrumentSans_400Regular,
InstrumentSans_500Medium,
InstrumentSans_600SemiBold,
IBMPlexMono_500Medium,
IBMPlexMono_600SemiBold,
```

from the installed Expo Google Font packages. Replace system background colors with
`CORAL_COLORS.light.bg` and `CORAL_COLORS.dark.bg`.

- [ ] **Step 3: Update native theme hook**

Map `useUI()` legacy fields to Coral colors so existing routes remain visually usable during v2
development:

```typescript
color: {
  bg,
  surface,
  control: surface,
  text: foreground,
  textStrong: foreground,
  textInverse: inkOnAccent,
  muted,
  border,
  brand: accent,
  ink: foreground,
  danger: negative,
  success: positive,
  subtle: accentSoft,
  dangerTint: negativeSoft,
  successTint: positiveSoft,
}
```

- [ ] **Step 4: Verify**

Run:

```bash
npm run typecheck
npm run lint
npm run format:check
```

Expected: all three exit successfully.

## Task 3: Build Coral Ledger UI Primitives

**Files:** Create all files listed under “New Foundation” and modify `src/components/coral/index.ts`.

**Consumes:** Coral colors and fonts from Tasks 1-2.
**Produces:** Stable presentation API for all v2 screens.

- [ ] **Step 1: Implement typography and amount primitives**

Create `LargeTitle`, `Eyebrow`, and `MoneyAmount` with these contracts:

```typescript
type LargeTitleProps = { children: ReactNode; style?: TextStyle };
type EyebrowProps = { children: ReactNode; style?: TextStyle };
type MoneyAmountProps = {
  children: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "inverse";
  size?: "sm" | "md" | "lg" | "hero";
  style?: TextStyle;
};
```

Use Instrument Sans for the first two and IBM Plex Mono for `MoneyAmount`.

- [ ] **Step 2: Implement action and field primitives**

`CoralButton` contract:

```typescript
type CoralButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  disabled?: boolean;
  loading?: boolean;
};
```

`CoralField` wraps HeroUI Native input behavior with 54px height, 14px radius, labels, errors, and
React Hook Form compatibility. `CoralSearchField` is 48px high.

- [ ] **Step 3: Implement content primitives**

Create `BalanceHero`, `MoneyRow`, `GroupTile`, `StatPair`, `CoralChip`, `CoralSegment`, and
`EmptyState` matching `suma-prototype.css`. Content primitives use opaque surfaces and no blur.

- [ ] **Step 4: Implement navigation material**

Create `CoralTopBar`, `FloatingCommandButton`, `CommandSheet`, and `CoralSnackbar`. Use `BlurView`
only in `CoralTopBar` and `CommandSheet`.

- [ ] **Step 5: Implement `CoralScreen`**

```typescript
type CoralScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  commandButton?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};
```

It handles status bar, background, safe areas, 20/22px platform gutters, 112px command clearance,
and conditional command button.

- [ ] **Step 6: Export and verify**

Export every component from `src/components/coral/index.ts`, then run typecheck and lint.

## Task 4: Add Recurring Expense Database

**Files:**

- Create: `supabase/migrations/202607180001_recurring_expenses.sql`
- Modify: `src/services/supabase/database.types.ts`
- Create: `src/types/recurring.ts`

**Produces:** Idempotent recurring schedule and occurrence persistence.

- [ ] **Step 1: Create tables and constraints**

The migration creates `recurring_expenses` and `recurring_occurrences` exactly as specified in the
design document, adds nullable `recurring_expense_id` to `expenses`, and adds:

```sql
unique (recurring_expense_id, scheduled_for)
check (frequency in ('weekly', 'monthly', 'yearly'))
check (status in ('active', 'paused'))
check (split_method in ('equal', 'amount', 'percentage', 'shares'))
```

- [ ] **Step 2: Add RLS policies**

Use existing `public.is_group_member(group_id, auth.uid())`. Group members may select. Schedule
creators and group creators may insert, update, and delete. Occurrences inherit schedule access.

- [ ] **Step 3: Add scheduling functions**

Create:

```sql
public.next_recurring_date(frequency text, interval_value integer, current_date_value date,
  day_of_week integer, day_of_month integer) returns date

public.generate_due_recurring_expenses(run_date date default current_date) returns integer
```

The generation function inserts an occurrence first, uses `on conflict do nothing`, creates the
expense and splits only when the occurrence insert succeeds, links the generated expense, advances
`next_run_date`, and returns the generated count.

- [ ] **Step 4: Schedule daily generation**

Enable `pg_cron` when available and schedule `generate_due_recurring_expenses(current_date)` daily
at 02:00 UTC. Guard extension and schedule creation so local migration environments do not fail
when cron is unavailable.

- [ ] **Step 5: Update generated TypeScript database types**

Add exact row, insert, update, relationship, and function signatures for both tables and the new
expense relationship.

- [ ] **Step 6: Validate migration**

Run the project’s configured Supabase local migration command if available. Otherwise run SQL
parsing through the local Supabase CLI and record the blocker if the CLI is unavailable. Then run
`npm run typecheck`.

## Task 5: Add Recurring Services, Queries, And Controllers

**Files:** Create all files listed under “Recurring Feature”; modify `src/queries/queryKeys.ts`.

**Consumes:** Recurring schema from Task 4.
**Produces:** CRUD, pause/resume, review/skip, and detail/list view models.

- [ ] **Step 1: Define domain types**

Create `RecurringExpense`, `RecurringOccurrence`, `RecurringFrequency`, `RecurringStatus`,
`RecurringFormValues`, and schedule display helpers in `src/types/recurring.ts`.

- [ ] **Step 2: Implement service API**

`recurringApi` methods:

```typescript
fetchRecurringExpenses(userId: string): Promise<RecurringExpense[]>;
fetchRecurringExpense(id: string): Promise<RecurringExpense>;
createRecurringExpense(input: RecurringFormValues): Promise<RecurringExpense>;
updateRecurringExpense(id: string, input: Partial<RecurringFormValues>): Promise<RecurringExpense>;
setRecurringStatus(id: string, status: "active" | "paused"): Promise<void>;
deleteRecurringExpense(id: string): Promise<void>;
fetchOccurrences(id: string): Promise<RecurringOccurrence[]>;
reviewOccurrence(id: string, action: "generate" | "skip"): Promise<void>;
```

- [ ] **Step 3: Add query keys and React Query hooks**

Add `recurring.all`, `recurring.list(userId)`, `recurring.detail(id)`, and
`recurring.occurrences(id)`. Mutations invalidate recurring, expenses, groups, activity,
notifications, and balance data.

- [ ] **Step 4: Add list, detail, and form controllers**

Controllers expose presentation-ready strings, loading/error flags, navigation callbacks, and
form actions. They contain no JSX.

- [ ] **Step 5: Verify**

Run typecheck, lint, and format check.

## Task 6: Build Parallel V2 Navigation Shell

**Files:**

- Create: `src/app/v2/_layout.tsx`
- Create: `src/features/navigation/CommandNavigationProvider.tsx`
- Create: `src/features/navigation/useCommandNavigation.ts`
- Create: all empty route adapters listed under “Parallel Routes” as their screens are introduced

**Consumes:** Coral primitives from Task 3.
**Produces:** Authenticated stack shell with floating command navigation.

- [ ] **Step 1: Create command navigation provider**

It owns command-sheet visibility and search text. It exposes:

```typescript
type CommandNavigationContextValue = {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (value: string) => void;
  navigate: (destination: CommandDestination) => void;
};
```

- [ ] **Step 2: Create v2 stack**

Use iOS `slide_from_right`; use Android `fade`. Auth routes and keyboard-heavy tasks disable the
command button. Product routes render command navigation through `CoralScreen`.

- [ ] **Step 3: Implement command destinations**

Destinations are People, Activity, Recurring, Currencies, and Add Expense. Search results combine
friends, groups, and recent expenses using existing query hooks.

- [ ] **Step 4: Verify navigation manually**

Start Expo and confirm the v2 home route can open/close the command sheet, retain query text, and
navigate to every destination without persistent tabs.

## Task 7: Rewrite Auth And Setup Screens

**Files:**

- Create v2 auth route adapters
- Create: `src/features/auth/screens-v2/WelcomeScreen.tsx`
- Create: `src/features/auth/screens-v2/LoginScreen.tsx`
- Create: `src/features/auth/screens-v2/RegisterScreen.tsx`
- Create: `src/features/auth/screens-v2/ForgotPasswordScreen.tsx`
- Create: `src/features/auth/screens-v2/VerifyEmailScreen.tsx`
- Create: `src/features/profile/screens-v2/ProfileSetupScreen.tsx`

**Consumes:** Existing auth mutations and Coral form primitives.

- [ ] **Step 1: Port welcome, login, register, and forgot password**

Match prototype hierarchy and copy while preserving existing Supabase auth, Apple, Google,
biometrics, haptics, validation, and onboarding checks.

- [ ] **Step 2: Implement verification**

Use Supabase OTP verification for six digits. Provide resend, pending, invalid-code, and expired-code
states. Route successful verification to profile setup.

- [ ] **Step 3: Implement profile setup**

Reuse current profile update and currency persistence. Route completion to `/v2/home`.

- [ ] **Step 4: Manually verify all auth paths**

Verify email/password, OAuth, reset, resend, verification, setup, validation, keyboard behavior,
and back navigation.

## Task 8: Rewrite Home, People, Groups, And Activity

**Files:**

- Create: `src/features/dashboard/screens-v2/MoneyMapScreen.tsx`
- Create: `src/features/friends/screens-v2/PeopleScreen.tsx`
- Create: `src/features/friends/screens-v2/FriendDetailScreen.tsx`
- Create: `src/features/groups/screens-v2/GroupDetailScreen.tsx`
- Create: `src/features/activity/screens-v2/ActivityScreen.tsx`
- Create corresponding v2 route adapters

**Consumes:** Existing feature controllers and Coral primitives.

- [ ] **Step 1: Build money map**

Render top bar, greeting, contextual lede, balance hero, needs-attention rows, asymmetric group grid,
recent movement, and command FAB using real data.

- [ ] **Step 2: Build People and friend detail**

People uses search plus continuous balance rows. Friend detail uses centered amount, plain-language
balance copy, two contextual actions, shared groups, and history.

- [ ] **Step 3: Build group detail**

Render group header, avatar stack, stat pair, overview/activity/currencies/recurring chips, balances,
latest movement, and Add Expense action.

- [ ] **Step 4: Build Activity**

Render large title, chips, grouped continuous rows, pull-to-refresh, loading, error, and empty states.

- [ ] **Step 5: Manually verify data and navigation**

Check real balances, groups, rows, contextual actions, empty states, and command navigation.

## Task 9: Rewrite Expense And Settlement Flows

**Files:**

- Create: `src/features/expenses/screens-v2/NewExpenseScreen.tsx`
- Create: `src/features/expenses/screens-v2/ExpenseDetailScreen.tsx`
- Create: `src/features/settlements/screens-v2/SettlementScreen.tsx`
- Create corresponding route adapters

- [ ] **Step 1: Build Add Expense**

Preserve existing form controller and split calculations. Match the design’s field sequence,
segmented split method, continuous member rows, receipt action, group selector, save action, and
draft state.

- [ ] **Step 2: Build Expense Detail**

Render centered amount and plain-language metadata, stat pair, continuous split rows, edit action,
comments, and destructive options.

- [ ] **Step 3: Build Settlement**

Render payer/recipient avatars, direction line, centered amount, payment method, note, confirmation,
and explanatory copy. Preserve existing settlement mutation and balance invalidation.

- [ ] **Step 4: Manually verify**

Exercise equal, amount, percentage, and shares splits; receipt action; edit/delete; comments;
settlement create/delete; validation; loading; and error feedback.

## Task 10: Build Recurring, Currencies, Notifications, And Settings

**Files:**

- Create recurring feature screens/components listed in the file map
- Create: `src/features/currencies/screens-v2/CurrenciesScreen.tsx`
- Create: `src/features/notifications/screens-v2/NotificationsScreen.tsx`
- Create: `src/features/profile/screens-v2/SettingsScreen.tsx`
- Create corresponding route adapters

- [ ] **Step 1: Build recurring list and detail**

List rows show amount/variable status, cadence, group, and state. Detail shows schedule, reminder,
auto-post toggle, history, pause/resume, edit, and delete.

- [ ] **Step 2: Build recurring form**

Collect title, fixed/variable amount, currency, group, payer, split method, frequency, interval,
weekday/day-of-month, start date, reminder days, and auto-post. Validate frequency-specific fields.

- [ ] **Step 3: Build currencies**

Use existing currency and exchange-rate state. Preserve original amounts, home currency selection,
expense-date conversion preference, rate timestamp, and correction affordance.

- [ ] **Step 4: Build notifications**

Render prioritized continuous rows and mark-all-read action using existing notification queries.

- [ ] **Step 5: Build settings**

Render profile identity, preferences, payment methods, appearance, security, data export, help, and
sign out. Existing unsupported actions show explicit informational sheets rather than inert rows.

- [ ] **Step 6: Manually verify recurring generation**

Create fixed and variable schedules; pause/resume; generate one due occurrence; rerun generation to
confirm no duplicate; review and skip pending occurrences; verify historical expenses survive
schedule deletion.

## Task 11: Adapt Existing Unmatched Screens

**Files:**

- Create v2 screens for group creation/settings, friend creation, profile editing/password, analytics
- Create corresponding v2 route adapters

- [ ] **Step 1: Adapt group and friend creation**

Use Coral form, search, continuous row, and task-sheet patterns while preserving existing mutations.

- [ ] **Step 2: Adapt group settings**

Use eyebrow sections and setting rows for identity, finance, members, and destructive actions.

- [ ] **Step 3: Adapt profile editing and password change**

Use Profile Setup and Sign In form patterns.

- [ ] **Step 4: Adapt analytics**

Use balance hero, stat pair, opaque chart surfaces, category rows, and top expense rows.

- [ ] **Step 5: Verify all adapted actions**

Exercise each mutation and navigation action with loading, success, error, and destructive states.

## Task 12: Production Route Cutover

**Files:**

- Modify: `src/app/_layout.tsx`
- Replace current route adapter files with v2 adapters
- Delete: `src/app/(tabs)/`
- Delete temporary `src/app/v2/` after moving route adapters

- [ ] **Step 1: Switch authenticated entry**

Route authenticated and onboarded users to `/home`. Route authenticated incomplete profiles to
`/profile-setup`. Keep unauthenticated users in `(auth)`.

- [ ] **Step 2: Move v2 route adapters into production paths**

Preserve URL parameters and modal presentations. Ensure no duplicate Expo Router paths remain.

- [ ] **Step 3: Remove tab navigation**

Delete `(tabs)` and all tab-specific route references. Search for `/(tabs)` and replace every
navigation target with its production destination.

- [ ] **Step 4: Verify deep links**

Open friend, group, expense, settlement, recurring, notification, settings, and auth routes directly.

## Task 13: Remove Old Glass UI And Obsolete Assets

**Files:**

- Delete: `src/components/glassmorphism/`
- Delete: `src/components/ui/GlassHeroBalance.tsx`
- Delete: `src/components/ui/GlassSection.tsx`
- Delete: `src/components/ui/GlassRow.tsx`
- Remove obsolete exports and tokens
- Remove old Sora and IBM Plex Sans font assets only after no imports remain

- [ ] **Step 1: Replace all glass imports**

Run:

```bash
rg "glassmorphism|GlassHeroBalance|GlassSection|GlassRow|GlassSurface|GlassBackground" src
```

Replace every production occurrence with Coral primitives.

- [ ] **Step 2: Delete obsolete files and exports**

Delete only after the search returns no production importers.

- [ ] **Step 3: Remove old font loading and CSS utilities**

Search for Sora and IBM Plex Sans identifiers and remove them after all UI uses Instrument Sans or
IBM Plex Mono.

- [ ] **Step 4: Verify**

Run typecheck, lint, and format check.

## Task 14: Final Manual Verification

**Files:** No implementation files unless verification finds a defect.

- [ ] **Step 1: Static checks**

```bash
npm run typecheck
npm run lint
npm run format:check
```

Expected: all commands exit 0.

- [ ] **Step 2: Migration checks**

Apply migrations to a disposable/local Supabase database. Verify RLS with a group member, group
creator, and unrelated user. Verify recurring generation idempotency manually.

- [ ] **Step 3: iOS screenshots**

Capture representative auth, home, command sheet, people, group, expense, settlement, recurring,
currencies, notifications, and settings screens at 360x800, 390x844, and 430x932.

- [ ] **Step 4: Android screenshots**

Capture the same matrix and verify Android FAB, fade-through transitions, 48dp targets, and sheet
geometry.

- [ ] **Step 5: Accessibility checks**

Verify labels, roles, contrast, reduced motion, dynamic text limits, touch targets, and non-gesture
access to every core action.

- [ ] **Step 6: Final source searches**

```bash
rg "Suma" src
rg "\(tabs\)" src
rg "glassmorphism|GlassSurface|GlassBackground|GlassHeroBalance|GlassSection|GlassRow" src
```

Expected: no unintended product naming, tab routing, or retired glass UI remains.
