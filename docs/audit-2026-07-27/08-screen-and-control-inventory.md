# Screen and Control Inventory

## Decision legend

- **Keep:** purpose is sound; bring under target contracts.
- **Rewrite:** route/purpose remains, internals and interaction change.
- **Merge:** behavior moves into a canonical flow.
- **Hide:** remove navigation until a complete feature exists.
- **Redirect/remove:** compatibility only; remove after migration evidence.

## Top-level and onboarding

| Surface                               | Decision        | Required change                                                                  |
| ------------------------------------- | --------------- | -------------------------------------------------------------------------------- |
| Entry/auth callback/guards            | Keep            | Test deep links, resume, offline session, and all guard transitions              |
| Welcome/login/register/reset          | Keep and polish | Field semantics, keyboard, error mapping, large text, native auth tests          |
| Onboarding/profile setup/first action | Merge/rewrite   | One short value path; do not duplicate setup or creation choices                 |
| Home                                  | Rewrite         | Currency-separated balances, next actions, recent activity, direct Add expense   |
| Circles                               | Keep/rewrite    | People/Groups, search, contextual create actions                                 |
| Activity                              | Rewrite         | Server paginated ledger with context and signed effect                           |
| More                                  | Keep/rewrite    | Show only functional secondary capabilities                                      |
| CircleDock/global action sheet        | Rewrite         | Centre action adds expense; remove generic five-action sheet; adapt wide layouts |

## Expenses

| Surface                 | Decision     | Required change                                                         |
| ----------------------- | ------------ | ----------------------------------------------------------------------- |
| `expense/new`           | Rewrite      | One canonical reducer-driven composer with progressive disclosure       |
| `expense/[id]`          | Keep/rewrite | Authoritative detail, effect/context copy, audited actions              |
| `expense/[id]/edit`     | Merge        | Reuse composer/domain contract; do not keep separate calculation logic  |
| Receipt pick/upload     | Keep/harden  | Permission, size/type, staging cleanup, retry, ownership, accessibility |
| Split editor components | Consolidate  | One focused sheet; equal default; exact preview; server parity          |

## People and groups

| Surface                         | Decision        | Required change                                                             |
| ------------------------------- | --------------- | --------------------------------------------------------------------------- |
| `friend/[id]`                   | Rewrite         | Person ledger spec, all shared groups/currencies, correct bilateral history |
| `friend/new`                    | Keep/simplify   | Search/invite paths with honest outcomes and preserved return flow          |
| `group/[id]`                    | Rewrite         | Balances/activity first; contextual expense/settlement                      |
| `group/new`                     | Keep/simplify   | Minimal identity/members; return to resumed expense when applicable         |
| `group/[id]/settings`           | Keep/harden     | Permissions, blocking balances, destructive confirmations                   |
| legacy `people`/`groups` routes | Redirect/remove | Point to Circles until no external link depends on them                     |

## Settlements

| Surface                | Decision          | Required change                                                                |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `settle/new`           | Merge             | Balance picker only when context/currency is unknown or multiple               |
| `settle/[id]`          | Rewrite           | Correct units, fresh balance, external-payment copy, one domain flow           |
| `group/[id]/settle`    | Redirect/adapter  | Preselect group/person/currency in canonical settlement                        |
| Dashboard settle sheet | Merge             | Pick an authoritative balance, then canonical flow                             |
| Bulk settle            | Keep only if safe | Separate operations/subtotals per currency; deliberate method; partial failure |

## Settings and secondary features

| Surface                      | Decision                | Evidence and requirement                                         |
| ---------------------------- | ----------------------- | ---------------------------------------------------------------- |
| Profile/edit/change password | Keep/harden             | Re-auth/error/accessibility contract                             |
| Appearance                   | Rewrite                 | Real theme and OS/app reduced-motion state                       |
| Notification settings        | Hide then implement     | Current switches are hard-coded/no-op                            |
| Security                     | Hide false sections     | Face ID is hard-coded, session is fictional, delete does nothing |
| Export                       | Hide then implement     | Selectors no-op; button only goes back                           |
| Recurring list/new/edit      | Feature audit           | Keep only real creation/scheduling paths with backend contract   |
| Recurring review             | Hide immediately        | Explicit mock; fixed money; fake post action                     |
| Analytics                    | Keep only if accurate   | Define query/currency semantics and repair lint/a11y/performance |
| Help                         | Rewrite                 | Functional search/articles/contact or honest external links      |
| Legal                        | Keep with content owner | Versioned, reviewed content and acceptance requirements          |
| Notifications inbox          | Keep if real            | Correct event kinds, pagination, deep links, read state          |

## Known non-functional or misleading controls

### Immediate containment

| File/surface          | Control                 | Current behavior          | Action                               |
| --------------------- | ----------------------- | ------------------------- | ------------------------------------ |
| Scheduled review      | Final amount            | Fixed/no change           | Hide route                           |
| Scheduled review      | Post expense            | Haptic + back only        | Hide route                           |
| Export                | Format/date selectors   | No-op                     | Hide route                           |
| Export                | Generate export         | Navigates back            | Hide route                           |
| Security              | Face ID                 | Hard-coded true/no-op     | Hide section                         |
| Security              | Active session          | Fictional device/location | Remove                               |
| Security              | Delete account          | No-op                     | Hide until real destructive workflow |
| Notification settings | All switches            | Hard-coded true/no-op     | Hide route                           |
| Appearance            | Reduce motion           | Hard-coded false/no-op    | Implement or hide row                |
| Help                  | Search/articles/contact | No-op handlers            | Implement destinations or remove     |

The containment standard is not a disabled unlabeled control. Either remove it, or show
clear “Not available” copy only when the information itself has value.

## Control audit checklist

Apply to every `Pressable`, button, switch, field, row action, swipe action, sheet option,
and navigation item:

### Behavior

- action performs exactly the label;
- one tap produces one result;
- disabled/busy states are visible and semantic;
- async failure remains on screen with recovery;
- destructive action requires appropriate confirmation;
- back/cancel preserves or explicitly discards draft;
- haptic occurs at the correct semantic moment;
- navigation destination exists and receives validated parameters.

### Financial

- currency and scope are named;
- sign/copy matches current-user perspective;
- no mixed-currency sum;
- input uses major units, domain/server uses minor units;
- confirmation repeats payer, participants, context, amount, and effect;
- mutation is idempotent and server-authorized.

### Accessibility

- role, label, hint, value, state, and error as applicable;
- target at least 44 pt iOS/48 dp Android;
- focus visible/logical and restored after modal;
- large text wraps without clipping;
- color is not the only signal;
- screen reader announcement is concise and complete.

### Platform/adaptivity

- safe area, keyboard, back/escape, gestures, and predictive back;
- disabled controls follow platform behavior;
- sheet/dialog semantics are appropriate;
- window resizing and tablet layouts remain usable;
- reduced motion and dark/light themes work.

## Route consolidation target

```text
/
  auth/*
  onboarding
  home
  circles
  activity
  more
  expense/new
  expense/:id
  expense/:id/edit
  person/:id
  person/new
  group/:id
  group/:id/settings
  group/new
  settlement/new
  settings/*
```

This is a conceptual target, not a requirement to rename every URL immediately. Keep
compatibility redirects for deep links, then remove them after telemetry and release
notes confirm they are no longer needed.

## Full manual walkthrough inventory

Phase 0 must execute every live route in:

- signed-out, newly signed-up, and established accounts;
- empty, one-person, one-group, large-history, multi-currency, blocked/restricted states;
- light/dark and small/large text;
- online, slow, offline, and reconnect;
- iOS and Android;
- phone and tablet.

Record for each route: entry, back behavior, loading, empty, error, success, every control,
keyboard, screen reader, screenshots, network calls, data mutation, and resulting cache.
Turn each confirmed defect into an issue linked to the audit ID and phase.
