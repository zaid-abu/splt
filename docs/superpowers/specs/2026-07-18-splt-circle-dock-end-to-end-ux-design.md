# Splt Circle Dock End-to-End UX Design

**Date:** 2026-07-18
**Status:** Approved for prototype production
**Product:** Splt
**Platforms:** iOS and Android

## Summary

Redesign every Splt screen and flow around a new **Circle Dock** experience architecture while preserving the current Coral Ledger visual philosophy: cool mineral surfaces, coral brand actions, emerald credit, crimson debt, Instrument Sans interface typography, IBM Plex Mono financial values, restrained translucency, explicit financial language, and platform-aware native behavior.

This is an experience redesign, not a theme swap. Navigation, routing semantics, flow structure, state handling, copy, reachability, and component contracts may change. The visual philosophy, product identity, backend capabilities, and user data remain.

The work serves social expense splitting and recurring household costs equally. Recurring schedules live inside groups and aggregate into a global Upcoming agenda rather than becoming a separate primary product mode.

## Product Principles

1. **People and groups are circles.** A circle is any relationship in which shared money exists.
2. **Make the next useful action visible.** Do not require users to infer what a row press will do.
3. **Explain money before exposing accounting detail.** Every amount states its direction and scope.
4. **Fast defaults, explicit confirmation.** Ordinary actions remain fast; consequential changes are reviewable.
5. **Show only real capabilities.** Inert settings, fake draft actions, decorative tabs, and non-functional payment claims are removed.
6. **One lifecycle per concept.** One auth state machine, one screen-state contract, one navigation model, and one component vocabulary.
7. **Social and household use cases share one product.** Do not force users to classify groups into separate app modes.

## Visual Philosophy

### Color

- App background: cool mineral blue-gray.
- Content surface: opaque near-white mineral surface.
- Foreground: dark navy-blue ink.
- Muted copy: medium mineral gray.
- Brand action: coral.
- Positive financial state: emerald.
- Negative financial state: crimson.
- Warning or review state: restrained amber.
- Hero balance surface: dark navy.
- Blur is restricted to system chrome, the Circle Dock, and task sheets.
- Content cards remain opaque.

All text meets WCAG AA contrast. Semantic state must also be expressed through signs and plain-language copy.

### Typography

- Instrument Sans: titles, body copy, labels, controls, navigation.
- IBM Plex Mono: amounts, rates, percentages, verification codes, and dates when numeric alignment matters.
- Large titles use weight 600 and restrained negative tracking.
- Financial values use tabular figures.
- Hierarchy comes from weight, spacing, and placement rather than oversized type.

### Geometry

- Controls and form fields: `14px` radius.
- Actionable content cards: `16px` radius.
- Task sheets: `24px` radius.
- Compact Circle Dock: `18-20px` radius.
- iOS minimum targets: `44pt`.
- Android minimum targets: `48dp`.
- Shadows are limited to raised navigation, sheets, transient feedback, and the central Add action.

### Platform Character

- iOS uses circular or softly rounded controls, stronger system-material translucency, horizontal pushes, and native bottom sheets.
- Android uses rounded rectangles, more opaque material, fade-through transitions, and 48dp controls.
- Reduced motion replaces spatial transitions with short crossfades.

## Experience Architecture

The authenticated app has five persistent Circle Dock actions:

1. **Home**: the Money Map.
2. **Circles**: unified Groups and People.
3. **Add**: a central coral creation action.
4. **Activity**: Timeline and Upcoming.
5. **More**: account and secondary tools.

### Home

Home answers only:

- Where do I stand overall?
- What needs my attention?
- What happens next?

It contains the overall balance hero, a compact group/person balance ledger, and the next actionable schedule item or recent movement. New-user Home presents Create Group, Add Person, and Add Expense actions rather than disappearing sections.

### Circles

Circles has **Groups** and **People** segments. Search spans the active segment. Rows always open detail. Contextual actions live inside detail screens, eliminating the current behavior where row presses unexpectedly remind, settle, or add an expense.

### Add

The center Add action opens a task sheet containing:

- Add expense
- Settle up
- Create group
- Add person
- Schedule expense

Add is creation, never navigation. Starting from a person or group preselects context and skips unnecessary selection.

### Activity

Activity contains:

- **Timeline**: posted expenses, settlements, group events, friendship events.
- **Upcoming**: recurring schedules, required reviews, expected postings, reminders.

Every row opens its source. Search, filtering, refresh, loading, empty, and error states are visible.

### More

More contains only implemented destinations:

- Profile and security
- Notifications
- Insights
- Currencies
- Export data
- Appearance
- Help, support, terms, and privacy

Unavailable concepts such as payment processing are omitted until functional.

## Navigation Contract

- Primary dock destinations switch stable navigation stacks rather than pushing duplicate copies.
- Detail screens push within the active stack.
- Expense detail and compact confirmations may use platform-native presentation, but forms remain full-screen when keyboard-heavy.
- The Circle Dock hides on auth, verification, setup, expense entry, settlement, schedule entry, and other focused task flows.
- Settings and secondary destinations retain the More stack context.
- Back always returns to the source context; completion actions may explicitly return to the affected circle.
- Cold deep links hydrate data before rendering not-found states.

## Account Lifecycle

There is one account state machine:

```text
signed out
  -> register or social authentication
  -> verify email when required
  -> profile setup
  -> optional first useful action
  -> authenticated app
```

- Verification, setup, and onboarding status are server- or user-scoped, never device-global.
- Social authentication enters the same setup state machine.
- Profile setup configures photo, display name, home currency, and theme.
- First-use activation offers Create Group, Add People, Add Expense, Schedule Bill, or Skip.
- Tutorial slides and duplicate profile setup are removed.
- Password recovery supports request, inbox confirmation, deep-linked new password, success, and sign-in.
- Password copy and validation use the same rules.

## Money Flow Contract

### Add Expense

- Global Add first selects a circle.
- Contextual Add skips circle selection.
- A single composer shows amount, description, context, payer, split, date, category, receipt, and submit action.
- Payer, split, date, category, context, and receipt use focused task sheets or pickers.
- Split supports Equal, Exact Amounts, Percentages, and Weighted Shares as distinct calculations.
- Participants can be included or excluded.
- Save Draft appears only when persisted draft behavior exists.
- Completion states explain who now owes whom and provide View Expense and Return to Circle actions.
- A short undo action may delete a newly created expense when permissions allow.

### Expense Detail

- Display total expense, payer, category, date, circle, split method, and receipt.
- Show the user's actual share separately from money lent or borrowed.
- Never label total divided by participant count as “per person” for custom splits.
- Split rows show each person's actual share and direction.
- Receipt viewing, comments, edit, delete, and settlement actions must function.
- Edit and delete controls respect creator and group permissions.

### Settlement

- Initialize only after balances and parties load.
- State the direction in words: `You pay Keran` or `Keran pays you`.
- Amount defaults to the open balance and cannot exceed it.
- Full, Half, and Custom shortcuts remain available.
- Cash, bank transfer, and other describe how an external settlement was recorded; the app does not imply it processes payment.
- Group attribution and affected debts are visible before confirmation.
- A review step states the exact balance consequence.
- Success states provide a receipt and return to the affected relationship.

### Recurring Expense

- Schedules are created and managed inside a group.
- Global Upcoming aggregates all schedules and required reviews.
- Schedules support fixed or variable amount, payer, real split configuration, frequency, interval, start date, reminder, and posting mode.
- Posting modes are explicit: **Review before posting** or **Post automatically**.
- Variable schedules default to review.
- Schedule detail separates status, future occurrences, generated expenses, pause/resume, edit, and delete.
- Reviewing an occurrence allows amount and metadata correction before creating the expense while preserving the next occurrence.

## Relationship Flows

### Groups

- Group creation collects identity, currency, and members without sending invitations until final submission.
- Group detail has real **Overview**, **Expenses**, and **Schedule** subviews.
- Overview shows group-specific net position, pairwise explanation, people, upcoming items, and contextual actions.
- Expenses explains each row as `your share`, `you lent`, or `you borrowed`.
- Schedule separates Needs Review, Active, and Paused schedules.
- Settings hydrate before editable state is initialized and support identity, preferences, members, leave, and delete.
- Group settlement is reachable from Overview.

### People

- People list rows open person detail.
- Person detail shows bilateral aggregate balance, explicit Add Expense and Settle/Remind actions, group-specific balances, and shared activity.
- Shared-group rows never repeat the global bilateral total.
- Friend requests have explicit Accept and Decline actions in People and Notifications.
- Removal and blocking behavior communicate effects on shared groups and history.

## Information And Utility Flows

### Notifications

- Requests, schedule reviews, failed postings, important settlements, and account events have real actions.
- Read state is implemented before Mark All Read appears.
- Loading, empty, error, refresh, and pagination states are explicit.

### Insights

- Every aggregate states whether it represents total group spend or the user's share.
- Period controls remain usable at compact widths.
- Categories and top expenses navigate to filtered expense lists.
- Loading, empty, partial, and error states do not display misleading zeroes.

### Currencies

- Home currency selection uses actual current state and confirmation feedback.
- Rate freshness distinguishes live and fallback data.
- Expense-date conversion appears only if the product supports correction and settlement behavior end to end.

### Profile, Security, Export, And Help

- Profile edit supports actual avatar and display-name changes.
- Security connects password update, biometric state, active sessions, and account deletion only where implemented.
- Export provides format, date range, generation progress, completion, and error states.
- Help provides searchable guides, support contact, terms, and privacy.

## Screen-State Contract

Every route and major module defines:

- Initial loading or skeleton
- Refreshing
- Empty first-use
- Empty filtered/search result
- Recoverable error with retry
- Offline with preserved cached content when available
- Disabled and submitting states
- Success and completion state
- Permission-restricted state
- Not-found state only after hydration completes
- Destructive confirmation where relevant

Forms preserve entered data through recoverable failures. Query retries do not erase local state.

## Financial Copy Contract

- Relationship: `Ritwika owes you $40.00` or `You owe Keran $17.87`.
- Group: `You are owed $120.00 in Apartment`.
- Expense: distinguish `Total`, `Your share`, `You lent`, and `You borrowed`.
- Settlement: state payer, recipient, amount, group attribution, and resulting balance.
- Insights: label `Your share of spending` or `Total group spending`.
- Positive and negative colors never appear without text or signed values.
- Avoid `-0.00`, ambiguous unsigned balances, and unexplained accounting terminology.

## Shared Component Model

The production UI converges on:

- `SpltScreen`
- `SpltTopBar`
- `CircleDock`
- `GlobalActionSheet`
- `TaskSheet`
- `LargeTitle`
- `Eyebrow`
- `BalanceHero`
- `MoneyAmount`
- `MoneyRow`
- `CircleRow`
- `BalancePill`
- `Avatar`
- `AvatarStack`
- `GroupBadge`
- `CategoryBadge`
- `PrimaryButton`
- `SecondaryButton`
- `DangerButton`
- `SearchField`
- `SegmentedControl`
- `FilterChip`
- `FormField`
- `DateField`
- `CurrencyField`
- `QueryState`
- `EmptyState`
- `Snackbar`
- `ConfirmationSheet`
- `CompletionReceipt`

Coral, legacy generic UI, HeroUI-backed primitives, native Modal, Gorhom sheets, and custom sheet implementations are consolidated after behavior parity. No duplicate component survives without a distinct documented responsibility.

## HTML Prototype Package

After final approval, create `design/circle-dock-redesign/` containing:

- `index.html`: launcher and full screen inventory.
- `prototype.css`: shared tokens, platform frames, components, states, and responsive behavior.
- `prototype.js`: launcher filtering, theme/platform controls, sheets, segments, and flow navigation.
- `screens/`: one HTML file per screen or materially distinct screen state.
- `flows/`: one HTML walkthrough per end-to-end flow.
- `README.md`: prototype use, file map, interaction notes, and implementation contract.

### Required Screen Files

#### Entry And Account

- `welcome.html`
- `login.html`
- `register.html`
- `forgot-password.html`
- `reset-password.html`
- `verify-email.html`
- `profile-setup.html`
- `first-action.html`

#### Core Shell

- `home.html`
- `circles-groups.html`
- `circles-people.html`
- `global-add.html`
- `activity-timeline.html`
- `activity-upcoming.html`
- `more.html`

#### Groups And People

- `group-create.html`
- `group-overview.html`
- `group-expenses.html`
- `group-schedule.html`
- `group-settings.html`
- `person-add.html`
- `person-detail.html`

#### Expenses And Settlements

- `expense-context.html`
- `expense-compose.html`
- `expense-split.html`
- `expense-success.html`
- `expense-detail.html`
- `expense-edit.html`
- `expense-list.html`
- `settlement-compose.html`
- `settlement-review.html`
- `settlement-success.html`

#### Recurring

- `schedule-create.html`
- `schedule-detail.html`
- `schedule-edit.html`
- `schedule-review.html`

#### Secondary Tools

- `notifications.html`
- `insights.html`
- `currencies.html`
- `profile.html`
- `profile-edit.html`
- `security.html`
- `notification-settings.html`
- `appearance.html`
- `export.html`
- `help.html`
- `legal.html`

#### State Reference

- `screen-states.html`

### Required Flow Files

- `auth-flow.html`
- `recovery-flow.html`
- `first-use-flow.html`
- `expense-flow.html`
- `settlement-flow.html`
- `group-flow.html`
- `people-flow.html`
- `recurring-flow.html`
- `activity-flow.html`
- `notification-flow.html`
- `account-flow.html`

Each file is directly openable, links to adjacent screens, uses shared assets, works at `360x800`, `390x844`, and `430x932`, and contains no framework or preview-tool chrome.

## Delivery Decomposition

### Phase 0: Prototype Contract

- Complete every required HTML screen and flow.
- Validate visual consistency, responsive behavior, and flow links.
- Freeze tokens, components, navigation, copy, and state contracts.

### Phase 1: Lifecycle And Shell

- Implement the account state machine, deep links, stable dock navigation, route presentations, and shared screen-state components.

### Phase 2: Home And Circles

- Implement Home, Groups, People, group/person detail, creation, settings, requests, and contextual actions.

### Phase 3: Money Tasks

- Implement expense entry/detail, split editor, settlement, completion receipts, permissions, and financial-copy corrections.

### Phase 4: Schedules And Time

- Implement recurring create/detail/review, Activity Timeline, Upcoming, and actionable notifications.

### Phase 5: Secondary Tools

- Implement Insights, currencies, profile, security, export, appearance, and help.

### Phase 6: Hardening And Cleanup

- Validate offline behavior, cold deep links, narrow devices, large text, keyboard handling, reduced motion, dark mode, multi-currency math, permissions, and all screen states.
- Remove superseded V2, legacy, inert, and duplicate implementations only after parity.

Each phase receives a separate implementation spec and plan. The product-wide blueprint is not executed as one monolithic code change.

## Verification

- Screenshot comparison at `360x800`, `390x844`, and `430x932` for iOS and Android treatments.
- No horizontal overflow at supported phone widths.
- WCAG AA text contrast and 3:1 non-text control contrast.
- Minimum 44pt iOS and 48dp Android targets.
- Reduced-motion behavior.
- Screen-reader labels and logical focus order.
- Auth, recovery, first-use, expense, split, settlement, group, people, recurring, activity, notification, and account walkthroughs.
- Financial-copy validation against positive, negative, settled, multi-person, custom-split, partial-settlement, and multi-currency scenarios.
- Loading, empty, filtered-empty, offline, error, success, permission, and not-found states.

## Migration And Current Work

- Existing Coral screens remain operational while the redesign is prototyped and implemented by phase.
- The recently added Money Map group ledger is conceptually retained in the approved Home design, but tactical visual polish is superseded by this broader prototype contract.
- Existing uncommitted user work is not reverted or mass-rewritten.
- Production routes switch only when their replacement flow has real data, complete states, accessibility checks, and manual verification.

## Success Criteria

- A new user reaches a useful first action through one coherent account lifecycle.
- A returning user can understand overall position, urgent balances, and upcoming bills from Home.
- People and groups are discoverable through one Circles model without losing relationship-specific detail.
- Adding an ordinary expense is fast, while advanced split behavior remains correct and inspectable.
- Settlement language never implies payment processing the app does not perform.
- Household schedules are first-class inside groups and globally visible in Upcoming.
- Every visible action works, every amount explains its meaning, and every screen handles real states.
- The HTML package provides a directly inspectable visual contract for every screen and end-to-end flow before React Native implementation begins.
