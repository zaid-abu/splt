# Splt Coral Ledger Rewrite Design

**Date:** 2026-07-18
**Status:** Approved for implementation planning
**Design source:** `design/new-design/`

## Summary

Rewrite the Splt mobile application using the complete Suma/Coral Ledger design in
`design/new-design/` while retaining the Splt name, bundle identity, existing backend behavior,
and unmatched existing product features.

This is a product-shell rewrite rather than a theme swap. It replaces ornamental glassmorphism,
the four-tab navigator, current typography, and current screen composition. The new application
uses opaque mineral content surfaces, coral brand actions, contextual navigation, a floating
command control, and blur only for native top bars and task sheets.

The current routes remain operational while a parallel v2 shell is built. The v2 shell replaces
production routes only after all new flows are connected to real data and manually verified.

## Product Identity

- The production name remains **Splt**.
- The scheme remains `splt` and the bundle identifier remains `com.splt.app`.
- Suma-specific product naming in the prototype is replaced with Splt.
- Coral Ledger visual hierarchy, interaction patterns, layout, and copy style remain authoritative.
- Real Splt user, group, expense, balance, and settlement data replace prototype placeholders.

## Architecture

The rewrite uses four isolated layers:

```text
Supabase
  recurring expense schema, RLS, generation function, scheduled job

Services and Queries
  existing APIs preserved
  recurring API and React Query hooks added

Feature Controllers
  data fetching, derived values, mutations, and navigation actions
  view-model mapping for presentation components
  no JSX or styling

Coral Ledger UI
  opaque content surfaces
  translucent top bars and command sheets only
  typed data and callbacks received through props
```

The parallel implementation shell may use a temporary `src/app-v2/` or equivalent internal
namespace while existing Expo Router files stay functional. Feature logic remains under
`src/features/`; it must not be duplicated in the temporary shell. Once verified, v2 route files
replace the current route files and the temporary shell is deleted.

## Visual System

`src/global.css` is the canonical design-token source.

### Colors

- Background: cool mineral blue-gray
- Surface: opaque near-white mineral surface
- Raised material: translucent only for native navigation and task sheets
- Foreground: dark blue-gray
- Muted text: medium mineral gray
- Accent: coral
- Positive: emerald
- Negative: crimson
- Balance hero: dark navy with light foreground

Native libraries that require raw color strings, including Lucide icons, status bars, charts, and
native date pickers, use generated sRGB equivalents of the same CSS tokens. Raw-color exports must
not become a second independently maintained theme.

### Typography

- Instrument Sans: titles, body, controls, labels, and navigation
- IBM Plex Mono: amounts, exchange rates, verification codes, and other numeric financial data
- Large titles: 36px iOS, 32px Android, weight 600, `-0.025em` tracking
- Rows: 16px primary copy and 13px secondary copy
- Money values: tabular figures, weight 500-600, no tighter than `-0.015em` tracking

Fonts are bundled and loaded through Expo. Tailwind/Uniwind utilities in `global.css` expose both
families.

### Geometry And Elevation

- Controls and fields: 14px radius
- Actionable cards: 16px radius
- Task sheets: 24px radius
- iOS minimum target: 44pt
- Android minimum target: 48dp
- Shadows are compact and reserved for actionable cards and sheets
- Content cards are opaque and do not use blur
- Blur is restricted to status bars, sticky top bars, and command/task sheets

### Shared Components

The production UI is built from focused primitives:

```text
SpltScreen
SpltTopBar
LargeTitle
Eyebrow
MoneyAmount
BalanceHero
MoneyRow
GroupCard
StatPair
PrimaryButton
SecondaryButton
DangerButton
SearchField
SegmentedControl
FilterChip
FormField
Avatar
AvatarStack
FloatingCommandButton
CommandSheet
TaskSheet
Snackbar
EmptyState
```

Existing glass components, ambient orbs, glass section wrappers, glass balance components, and
blue glass tokens are removed after migration.

## Navigation

The four-tab navigator is removed. Authenticated product screens use a root stack and a floating
coral command control.

```text
(auth)/welcome
(auth)/login
(auth)/register
(auth)/forgot-password
(auth)/verify-email
profile-setup

home
friends
friend/[id]
group/[id]
group/new
group/[id]/settings
activity
expense/new
expense/[id]
settle/[id]
recurring
recurring/new
recurring/[id]
currencies
notifications
settings
profile/edit
profile/change-password
analytics
```

Navigation behavior:

- Home is the vertically flowing money map.
- The profile avatar opens Settings.
- The notification icon opens Notifications.
- Rows navigate directly to their person, group, expense, settlement, or recurring item.
- The floating command button opens global search and destinations for People, Activity,
  Recurring, Currencies, and Add Expense.
- iOS uses horizontal stack pushes and circular floating controls.
- Android uses fade-through navigation and a rounded-rectangle FAB.
- Auth screens, keyboard-heavy task flows, and modal forms hide the command button.
- Existing unmatched routes remain accessible through contextual actions and Settings.

## Screen Mapping

| Design Screen    | Production Route          |
| ---------------- | ------------------------- |
| Welcome          | `/(auth)/welcome`         |
| Sign in          | `/(auth)/login`           |
| Create account   | `/(auth)/register`        |
| Reset password   | `/(auth)/forgot-password` |
| Verify email     | `/(auth)/verify-email`    |
| Profile setup    | `/profile-setup`          |
| Money map        | `/home`                   |
| People           | `/friends`                |
| Friend detail    | `/friend/[id]`            |
| Group detail     | `/group/[id]`             |
| Activity         | `/activity`               |
| Add expense      | `/expense/new`            |
| Expense detail   | `/expense/[id]`           |
| Settle up        | `/settle/[id]`            |
| Recurring list   | `/recurring`              |
| Recurring detail | `/recurring/[id]`         |
| Currencies       | `/currencies`             |
| Notifications    | `/notifications`          |
| Settings         | `/settings`               |

Unmatched existing flows use the nearest Coral Ledger pattern:

- New group: Add Expense form pattern
- Group settings: Settings rows and form fields
- Add friend: People search pattern
- Profile edit: Profile Setup pattern
- Change password: Sign In form pattern
- Analytics: Balance Hero, Stat Pair, and opaque chart surfaces
- Recurring creation: Add Expense form pattern with scheduling fields
- Expense comments and advanced splits: continuous transparent rows under eyebrow headings

## Recurring Expense Backend

### Tables

`recurring_expenses`:

- `id uuid primary key`
- `group_id uuid not null`
- `created_by uuid not null`
- `paid_by_user_id uuid not null`
- `title text not null`
- `amount numeric nullable` for variable expenses
- `currency_code text not null`
- `split_method text not null`
- `split_config jsonb not null`
- `frequency text not null` supporting weekly, monthly, and yearly
- `interval integer not null default 1`
- `day_of_week integer nullable`
- `day_of_month integer nullable`
- `start_date date not null`
- `next_run_date date not null`
- `reminder_days_before integer not null default 2`
- `auto_post boolean not null default false`
- `status text not null` supporting active and paused
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

`recurring_occurrences`:

- `id uuid primary key`
- `recurring_expense_id uuid not null`
- `scheduled_for date not null`
- `expense_id uuid nullable`
- `status text not null` supporting pending, generated, skipped, and failed
- `created_at timestamptz not null`
- unique constraint on `(recurring_expense_id, scheduled_for)`

`expenses` gains nullable `recurring_expense_id`.

### Behavior

- Fixed and variable recurring amounts are supported.
- Existing equal, amount, percentage, and shares split methods are supported through
  `split_config`.
- Active schedules persist their next run date.
- Auto-post schedules create expenses automatically.
- Review schedules create pending occurrences and notifications.
- Paused schedules remain editable but create no occurrences.
- Deleting a schedule does not delete historical expenses.
- Generation is transactional, idempotent, and retry-safe.
- A daily scheduled Supabase job invokes the generation function.

### Security

- Group members may read recurring schedules and occurrences for their groups.
- The schedule creator and group creator may create, update, pause, resume, and delete schedules.
- Generated expenses remain governed by existing expense and group RLS policies.

### Client API

The client exposes list, detail, create, update, pause, resume, review, skip, and delete operations
through a service module and React Query hooks. Generated expenses invalidate recurring, expense,
group, balance, activity, and notification query keys.

## States And Errors

Every screen and module includes real loading, empty, error, success, disabled, and destructive
confirmation states.

- Errors use the existing toast/snackbar infrastructure with plain-language copy.
- Destructive operations require confirmation.
- Settlement and recurring generation remain reversible until confirmation where the backend
  behavior permits it.
- Retry actions preserve entered form state.
- The command sheet preserves its search text during navigation failures.
- Color never communicates balance status without supporting text.

## Accessibility And Motion

- Meet WCAG AA contrast.
- Support reduced motion.
- Use semantic labels and roles for all controls.
- Maintain 44pt iOS and 48dp Android minimum targets.
- Core actions remain available without swipe gestures.
- iOS uses 180-240ms horizontal pushes.
- Android uses 180-240ms fade-through transitions.
- Sheets rise from the bottom; reduced motion uses short crossfades.

## Verification

No new unit or component tests will be added.

Verification consists of:

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- Supabase migration validation
- Manual recurring CRUD and generation checks
- Manual auth, command navigation, expense, settlement, currency, and settings flows
- Accessibility checks for labels, contrast, reduced motion, and touch targets
- Screenshot comparison at 360x800, 390x844, and 430x932 on iOS and Android
- Existing tests may continue running, but the rewrite introduces no new test files

## Rollout

1. Add Coral Ledger tokens, fonts, and shared UI primitives.
2. Add recurring migrations, RLS, generation function, scheduled job, services, and hooks.
3. Build the authenticated v2 shell and command navigation.
4. Port auth, verification, and profile setup.
5. Port home, people, groups, activity, expense, and settlement flows.
6. Port recurring, currencies, notifications, and settings.
7. Adapt unmatched existing screens.
8. Perform manual visual, interaction, accessibility, and migration verification.
9. Switch Expo Router production entry points to v2.
10. Remove old glass UI, tab navigation, obsolete tokens, and temporary v2 files.

## Completion Criteria

- Every route in the screen map uses Coral Ledger UI and real application data.
- Existing unmatched functionality remains available.
- Persistent tabs are removed.
- Command navigation works on iOS and Android.
- Recurring expenses are fully persisted and generated without duplicates.
- Content cards are opaque; blur appears only on approved navigation and task layers.
- Splt naming and identifiers remain intact.
- Typecheck, lint, and format checks pass.
- Manual viewport and flow verification is complete.
