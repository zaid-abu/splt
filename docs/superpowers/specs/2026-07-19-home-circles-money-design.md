# Phase 2 Home, Circles, And Money Design

**Date:** 2026-07-19
**Status:** Approved in conversation; awaiting written-spec review
**Product:** Splt
**Platforms:** iOS and Android

## Summary

This phase completes the approved Circle Dock Home and Circles experience and, by explicit scope
decision, absorbs the Phase 3 money-task redesign. It delivers full prototype parity for Home,
Groups, People, expense entry/detail/editing, and settlement while preserving the Phase 1 account
lifecycle and Circle Dock shell.

The implementation uses one exhaustive, contract-first plan. Database and domain invariants are
established before screens consume them. Circles and relationship lifecycles cut over before money
flows, and Home is implemented last so every Home row reaches a complete destination.

Recurring data is real on Home and group Schedule surfaces, but recurring creation, detail, review,
posting, and reminder redesign remains Phase 4. Existing recurring routes remain the destinations in
this phase.

## Goals

- Make Home answer overall position, needed attention, and what happens next.
- Make Groups and People one coherent Circles model with detail-first row behavior.
- Complete group creation, detail subviews, settings, requests, invitations, and contextual actions.
- Complete person addition, invitations, detail, reminders, removal, and blocking.
- Replace current expense and settlement screens with consequence-aware, permission-aware flows.
- Centralize financial calculations and copy so screens do not derive money independently.
- Handle loading, refresh, empty, filtered-empty, offline, error, success, permission, and not-found
  states explicitly.
- Match the approved HTML prototype at supported widths, themes, platforms, and accessibility modes.

## Non-Goals

- Do not redesign the Circle Dock, global Add sheet, account lifecycle, authentication, or onboarding.
- Do not redesign recurring creation, schedule detail, occurrence review, automatic posting, or global
  Upcoming navigation. Phase 2 only displays real recurring data and routes to existing flows.
- Do not implement payment processing. Settlements record cash or external transfers only.
- Do not implement persisted expense drafts. No Save Draft control appears.
- Do not redesign Insights, currencies, profile, security, export, appearance, or help.
- Do not delete disconnected legacy screen generations. Physical cleanup remains Phase 6 after parity.
- Do not perform unrelated lint, component, or architecture cleanup.

## Binding References

- Product design: `docs/superpowers/specs/2026-07-18-splt-circle-dock-end-to-end-ux-design.md`
- Prototype contract: `design/circle-dock-redesign/README.md`
- Home: `design/circle-dock-redesign/screens/home.html`
- Circles: `design/circle-dock-redesign/screens/circles-groups.html` and
  `design/circle-dock-redesign/screens/circles-people.html`
- Groups: `design/circle-dock-redesign/flows/group-flow.html`
- People: `design/circle-dock-redesign/flows/people-flow.html`
- Money: `design/circle-dock-redesign/flows/expense-flow.html` and
  `design/circle-dock-redesign/flows/settlement-flow.html`

## Architectural Approach

The exhaustive plan is organized into five ordered layers.

### 1. Contract Foundation

Additive Supabase migrations, RLS policies, generated database types, service interfaces, route
parameters, and domain types land first. Existing persisted values remain valid.

### 2. Pure Domain Logic

Pure modules own split calculations, rounding, balance direction, per-group bilateral balances,
settlement consequences, permission decisions, financial copy, and context parsing. React components
do not duplicate these rules.

### 3. Feature View Models

React Query hooks compose complete, named snapshots for Home, Circles, group detail, person detail,
expense flows, and settlements. A view model reports when all amount sources have hydrated and exposes
one refresh/retry operation for the same snapshot.

### 4. Screen Cutovers

Cut over Circles and relationship screens first, money flows second, and Home last. Production route
wrappers switch only after a replacement has real data, complete states, accessibility coverage, and
focused tests.

### 5. Integration Hardening

Verify contextual preselection, cold deep links, permissions, cache invalidation, offline recovery,
safe areas, keyboards, reduced motion, themes, large text, and compact widths across complete flows.

## Navigation Ownership

The Phase 1 shell remains the navigation owner.

| Route                                           | Presentation        | Purpose                                                     |
| ----------------------------------------------- | ------------------- | ----------------------------------------------------------- |
| `/home`                                         | Stable Home tab     | Money Map and next useful action                            |
| `/circles?segment=groups\|people`               | Stable Circles tab  | Unified group/person lists                                  |
| `/group/new`                                    | Root focused flow   | Group creation                                              |
| `/group/[id]?view=overview\|expenses\|schedule` | Root detail flow    | Deep-linkable group subviews                                |
| `/group/[id]/settings`                          | Root focused flow   | Hydrated group settings                                     |
| `/friend/new`                                   | Root focused flow   | Search, request, and private invite                         |
| `/friend/[id]`                                  | Root detail flow    | Bilateral detail; `id` is the counterparty user ID          |
| `/invite/[token]`                               | Root lifecycle flow | Resolve or redeem a private friend invite                   |
| `/expense/new`                                  | Root focused flow   | Context selection and expense composer                      |
| `/expense/[id]`                                 | Root detail flow    | Expense consequence detail                                  |
| `/expense/[id]/edit`                            | Root focused flow   | Permission-aware expense editing                            |
| `/settle/new`                                   | Root focused flow   | Open-balance selector                                       |
| `/settle/[id]`                                  | Root focused flow   | Compose/review/success; `id` is the counterparty user ID    |
| `/notifications`                                | More stack          | Friend-request, group-invite, reminder, and expense actions |
| `/recurring/new?groupId=[id]`                   | Existing root flow  | Contextual schedule creation destination                    |
| `/recurring/[id]`                               | Existing root flow  | Existing schedule detail and occurrence-review destination  |

Group segment changes replace the `view` query parameter instead of pushing duplicate group detail
screens. Unknown `segment` and `view` values fall back to Groups and Overview. Contextual actions use
typed `groupId` and `friendId` parameters. `returnTo` is not an arbitrary URL; it is an internal enum of
`home`, `circles-groups`, `circles-people`, `group`, and `friend` resolved by a pure route helper.
Global Add omits context and therefore begins with selection. Back falls back to the affected circle
when a cold deep link has no navigation history. The settlement success state belongs to the focused
compose route and is not treated as persisted settlement detail.

## Data Model

All schema work is additive and includes matching RLS, mappers, generated types, and service methods.

### Groups And Membership

- Add nullable `groups.kind` text. The UI offers curated labels, but the value is descriptive only and
  never creates a separate app mode.
- Add nullable `groups.archived_at`. Delete Group is a confirmed archive operation: active queries hide
  the group, historical expense/settlement links retain read-only identity, and active schedules pause.
- Add `group_members.new_expense_alerts boolean not null default true`. Alert preference is per member,
  not global to the group.
- Add `group_invitations` with group, inviter, invitee, status (`pending`, `accepted`, `declined`,
  `cancelled`, `expired`), a 14-day expiration, and timestamps. Final group creation adds only the
  creator as a member and creates pending invitations for selected people. Accepting atomically creates
  membership.
- Group creation uses a transaction that creates the group, creator membership, and all pending
  invitations only after final confirmation. A unique client operation ID makes timeout retries return
  the same group. Settings-time member addition uses the same invitation lifecycle. Invitees can accept
  or decline from Notifications; creators can cancel pending invites.
- Group archival atomically cancels pending invitations. Invitation acceptance locks and rechecks the
  group and rejects archived groups.
- Group settings save identity and member preference changes without reinitializing editable state
  during background refetches.

### Friendship Blocking And Invitations

- Canonicalize one friendship row per unordered user pair. Extend status to `pending`, `accepted`,
  `declined`, `removed`, and `blocked`; retain removed rows for historical context.
- Add `requested_by` and nullable `blocked_by`, each constrained to one of the two relationship users,
  so request, block, and unblock ownership are deterministic.
- Add `request_expires_at` and nullable `status_before_block`. Pending requests expire after 30 days.
  Blocking is available only for a known pending, accepted, or removed relationship; unblock restores
  that prior status, except an expired pending request restores to `removed`.
- Add `friend_invites` with creator, hashed opaque token, expiration, revocation, redemption user, and
  timestamps. Tokens contain at least 256 bits of entropy, expire after seven days, and are stored only
  as SHA-256 hashes. Raw tokens exist only in generated links and are not logged or persisted elsewhere.
- Invite acceptance is performed through a fixed-`search_path`, least-privilege security-definer RPC.
  It atomically consumes the token and creates or transitions the canonical friendship to `accepted`.
  Replay, self, revoked, expired, and blocked cases do not mutate data.
- Outgoing request, incoming request, reciprocal request, decline, remove, block, and unblock all use
  the same canonical transition contract. A reciprocal request accepts the existing pending row.
- Removing a friendship transitions it to `removed` and preserves historical expenses, settlements,
  comments, and shared-group membership. Removal is blocked while any direct per-currency balance is
  non-zero.
- Blocking prevents new direct requests, reminders, and expenses. Existing direct balances and history
  remain visible to both participants and may still be settled without reopening the relationship;
  settlement of pre-existing debt is the explicit exception to blocked new-action rules.

### Notifications And Reminders

- Add a general `notifications` table with recipient, kind, actor, entity references, payload,
  `created_at`, and nullable `read_at`. This phase uses `friend_request`, `group_invite`,
  `balance_reminder`, and `expense_added`; Phase 4 may add schedule kinds later.
- Creating a group expense inserts `expense_added` notifications for other active members whose
  `new_expense_alerts` preference is enabled. Each opens expense detail.
- A balance reminder is a notification created by an RPC from a server-derived open-balance snapshot.
  It requires a non-zero balance, permits at most one reminder per sender, relationship context, and
  currency in 24 hours, accepts an optional message of at most 280 characters, and uses a client
  operation ID for retry safety. When a relationship has multiple open contexts or currencies, Remind
  requires explicit context and currency selection; only a single eligible balance is preselected. The
  RPC receives `groupId` or `friendshipId` plus currency and re-derives the snapshot server-side.
- Exact-email account search permits at most ten attempts per authenticated user in ten minutes and
  uses normalized exact matching, minimal public fields, and a generic unavailable response for
  unknown, blocked, or non-discoverable users. Actor identity always comes from `auth.uid()`.

### Expenses And Splits

- Add nullable `expenses.friendship_id`. Every new expense has exactly one context: `group_id` or
  `friendship_id`. Direct expense participants must be the two users in the canonical relationship.
  Existing contextless direct records are backfilled from their participant pair where possible and
  remain readable through participant-based historical RLS if they cannot be mapped safely.
- Preserve persisted `custom` as the database representation of exact-amount splits; UI copy uses
  `Amounts`.
- Extend expense split methods with `shares`; add nullable positive `expense_splits.shares` and a stable
  integer `expense_splits.position` used for deterministic remainder allocation.
- Map `created_by`, `receipt_url`, comments, and split metadata into strict application types.
- Persist only a private receipt object key. Accept JPEG, PNG, HEIC, or PDF up to 10 MB. Before expense
  creation, upload to `staging/{auth.uid()}/{clientOperationId}/receipt`; only that user may access the
  staging prefix. The create RPC validates the prefix and attaches the object key to the new expense.
  Unreferenced staging objects expire after 24 hours. Signed URL creation is authorized against expense
  visibility, and replaced/deleted objects are cleaned. Existing receipt paths remain readable during
  migration.
- Expense + splits are written transactionally. Updating recalculates all splits in the same
  transaction. New expenses carry a unique client operation ID so timeout retries return the existing
  result. Deletion respects permission checks in the database.

### Settlements

- Add a non-null settlement method constrained to `cash`, `bank_transfer`, or `other`; existing rows
  backfill to `other` before the constraint is enforced.
- Add nullable `friendship_id`, preserve optional group attribution and notes, and require one direct or
  group context for every new settlement.
- Add a unique client operation ID. Settlement RPCs acquire a transaction-scoped advisory lock for the
  exact balance key, recompute the balance, validate the amount, and insert before releasing the lock.
- Settlement insertion validates parties, membership or direct relationship visibility, direction,
  currency, current open balance, and amount in one transaction.
- A global person settlement with balances in multiple groups requires group selection. A contextual
  group settlement arrives preselected.

### Balance Concurrency

Every balance-affecting mutation uses the same advisory-lock contract. Expense create/update/delete,
settlement insertion, member removal, friendship removal, and group archival derive every affected
counterparty/context/currency key, sort keys lexically, acquire all locks in that order, recompute the
relevant balances, validate, and commit. Stable ordering prevents deadlocks; shared locking prevents a
settlement from racing an expense or membership mutation against a stale maximum.

## Financial Invariants

- All calculations use integer minor units. Percentages support at most four decimal places; shares
  support at most six. No floating-point amount is persisted or compared for equality.
- Equal splits distribute remainder units by ascending persisted split `position`, then user ID as a
  tie-breaker. Percentage and weighted results use the same remainder order after floor allocation.
- Exact amounts must sum to the expense total.
- Percentages must sum to 100 and produce a rounded total equal to the expense total.
- Weighted shares must be positive; amounts derive from each included participant's share divided by
  total shares.
- Excluded participants receive no amount, percentage, or share weight.
- Payer and included participants must be valid for the selected group or direct relationship.
- Settlement amount is greater than zero and no greater than the selected current open balance.
- An open balance key is counterparty pair, group-or-direct context, and currency. Balances in different
  currencies are never arithmetically combined.
- Settlement direction follows the debt and cannot be reversed in the composer.
- Display helpers normalize signed zero and never emit `-0.00`.
- Color never communicates direction without a sign or plain-language explanation.

## Permission Contract

- Any group member may create an expense in that group.
- An expense creator may edit or delete their expense.
- A group creator may delete another member's group expense after explicit confirmation, but may not
  silently edit another person's expense attribution.
- Receipt and comments follow expense visibility.
- Only the group creator may change group identity, remove another member, or delete the group.
- A member may change their own alert preference and leave a group.
- Member removal and leaving are blocked while any bilateral balance for that member in any currency is
  non-zero. A net-zero total does not bypass non-zero pairwise debts.
- The group creator cannot leave because this phase does not add ownership transfer. They may archive
  the group after balances are cleared.
- Group deletion requires creator confirmation and no non-zero bilateral balance in any currency. It
  archives the group, pauses active schedules, hides it from active lists, and preserves expenses,
  settlements, comments, receipts, and activity for authorized historical access.
- Only the user who initiated a block may unblock the relationship.
- Current friendship or membership governs new actions. Immutable expense splits and settlement parties
  grant participants read access to their historical direct records after removal, blocking, leaving,
  or group archival. Expense `paid_by`, `created_by`, and every split participant retain historical read
  access even when the payer or creator has no assigned split.
- RLS is authoritative; UI permission helpers only decide which controls and explanations to show.

## Feature Design

### Circles

`/circles` keeps Groups and People as URL-backed segments. Search applies only to the active segment.

Groups display Needs Attention and All Groups. People display actionable pending requests followed by
balance-based relationship sections. Accept and Decline use the same mutations from Circles and
Notifications. Accepted rows always open detail; no row press settles, reminds, or creates an expense.

Needs Attention contains groups with any current-user non-zero balance, ordered by preferred currency
first, then currency code, absolute amount descending, and group ID. All Groups contains the remaining
settled groups ordered by most recent activity, then group ID. People sections are Mixed Balances, Owes
You, You Owe, and Settled. A relationship is Mixed when open currency balances have both directions;
otherwise its non-zero direction determines the section. A row with multiple currencies shows separate
signed amounts and uses preferred currency, currency code, absolute amount, and user ID ordering rather
than a converted scalar.

The screen supports initial loading, pull-to-refresh, cached offline content, first-use empty,
filtered-empty, recoverable error, and request-mutation feedback. First-use actions are Create Group
and Add Person.

### Group Creation

The form collects name, optional kind, icon, currency, and selected members. Member search changes only
local selection. No friendship request, group invite, or membership mutation occurs before the final
Create action.

Submission uses one transaction and disables duplicate submission. Failure preserves every field and
selection. Success replaces the form with the new group Overview.

### Group Detail

`view=overview`, `view=expenses`, and `view=schedule` are real subviews of one hydrated group snapshot.

Overview shows group identity, current-user net position, pairwise explanations, people, next schedules,
and Add Expense, Settle, and Schedule actions. Person rows open person detail. Contextual actions pass
the current group and skip redundant selection.

Group positions remain separated by currency. A one-currency group uses one signed hero amount; a group
with historical obligations in multiple currencies shows one signed amount per currency.

Expenses supports search and date grouping. Each row states the user's actual share, amount lent, or
amount borrowed and opens expense detail. Add Expense remains available with group context.

Schedule displays real Needs Review, Active, and Paused recurring records. Rows route to existing
recurring review/detail flows, and Schedule Expense routes to the existing creation flow with group
context. Phase 4 owns redesigning those destination flows.

### Group Settings

Editable state initializes only after the group and current membership hydrate. Later background
refetches do not overwrite dirty local edits. The screen supports name, kind, icon, default currency,
members, the current user's new-expense alert preference, leave, and creator-only delete.

Changing default currency affects only future expenses and schedules. It never converts or relabels
existing obligations.

Permission restrictions and open-balance blockers are stated before confirmation. Successful leave or
delete returns to Groups; save returns to the same group without creating duplicate detail routes.

### Person Addition And Requests

The Add Person flow searches existing users by email, sends an explicit friend request, and can share a
private expiring invite link. Existing, pending, accepted, self, and blocked results each have distinct
copy and controls.

Blocked status is shown only when an already-known relationship is loaded for the current user. Email
search never reveals whether an unknown unavailable address belongs to a user who blocked them.

Cold invite links enter the existing auth/account lifecycle when signed out, then resume redemption.
Signed-in users review the inviter before accepting. Expired, revoked, already redeemed, self, and
blocked links show explicit terminal states.

### Person Detail

Person detail shows identity, bilateral aggregate balance, group-specific balances, and shared
activity. Shared-group rows calculate only that group's bilateral position and never repeat the global
total.

The bilateral hero shows one signed amount per currency. If exactly one currency is open it uses the
single prototype amount treatment; otherwise it uses a compact currency breakdown and never applies a
live exchange rate to historical obligations.

Remind opens a preview and records a real in-app reminder. Add Expense and Settle pass person context.
If settlement spans multiple groups, the flow requires group selection before amount entry. Remove and
Block explain effects on direct actions, shared groups, and retained history before confirmation.

### Expense Context And Composer

Global `/expense/new` begins with a group or person selector. Contextual entry skips selection. The
composer owns one typed reducer containing context, amount, description, payer, included participants,
split method/configuration, date, category, notes, receipt, and submission state.

Payer, split, date, category, context, and receipt use focused task sheets or editors backed by the same
reducer. Recoverable failures never erase composer state. Save Draft is absent.

Group expenses default to the group's current default currency. Direct person expenses default to the
current user's home currency. Currency remains editable before submission; changing it after assigning
a split requires confirmation and recalculates the split from source values without converting the
entered total.

The split editor supports Equal, Amounts, Percent, and Shares as separate calculations. It shows
included state, source values, calculated amount, assigned total, and validation before Apply.

Before submission, consequence copy states who will owe whom. Success shows Total, Paid by, Your share,
You lent or You borrowed, View Expense, Return to Circle, and an eight-second Undo action when deletion
remains permitted and the success screen is active. If deletion fails, the created expense remains and
retryable feedback is shown.

### Expense Detail And Edit

Expense detail shows total, payer, category, date, circle, split method, receipt, comments, and the
current user's actual share separately from money lent or borrowed. Every split row shows that person's
actual share and direction. Custom splits never use an average `per person` label.

Visible participants may add comments. Comment authors may delete their own comments; the group creator
may moderate comments on group expenses. Comment failures preserve entered text. A Settle Balance action
passes the expense's counterparty and context to the settlement flow when an open balance exists.

Edit reuses the composer contract with hydrated values. Permission checks finish before edit/delete
controls appear. Updating warns when participant consequences change. Delete requires confirmation and
returns to the affected relationship or group.

### Settlement

`/settle/new` lists only real non-zero balances. `/settle/[id]` waits for parties, groups, and balances
before initializing. The flow contains Compose, Review, and Success states without exposing partially
initialized values.

Global Settle starts with a relationship/context balance selector. Group Overview Settle is scoped to
that group, selects a counterparty when more than one pairwise balance is open, then selects currency
when that pair has more than one. Person Detail preselects the counterparty and selects among direct or
group contexts and currencies when needed. Expense Detail does not guess one counterparty for a
multi-party expense; it opens the selector scoped to the expense context and eligible non-zero
counterparties. A fully determined entry routes to `/settle/[counterpartyUserId]` with typed `groupId`
or `friendshipId` and `currency` parameters.

Compose states direction in words, defaults to the selected open balance, provides Full/Half/Custom,
records external method and note, and shows group attribution. Review states that Splt does not move
money and shows from, to, group, method, amount, and resulting balance. Success provides a receipt and
returns to the affected person or group.

### Home

Home is implemented after every destination above. It shows greeting, overall balance hero,
detail-first attention rows, a compact group/person ledger, and either the next actionable real
schedule item or recent movement.

Home never combines currencies. With one open currency the hero displays its signed net amount. With
multiple currencies it displays a compact list ordered with the preferred currency first and states
the number of additional open currencies.

Attention contains at most four non-zero relationship or group contexts ordered by due review first,
preferred currency, absolute amount descending, most recent activity, and stable ID. The next schedule
is the earliest pending occurrence, then earliest active `nextRunDate`, with date and ID tie-breakers.
When no schedule qualifies, Recent Movement shows the four newest expenses or settlements ordered by
event time and ID; expenses open expense detail, and settlements open their affected person or group.

Person and group rows always open detail. A schedule row opens its existing review/detail destination;
an expense row opens expense detail. An account with no circles shows Create Group, Add Person, and Add
Expense rather than zero-value sections. Add Expense opens an empty context selector with Create Group
and Add Person handoffs. Those creation flows receive a typed `resume=expense` intent and return to the
composer with the new context selected. Home refreshes every amount source as one snapshot.

### Notifications Touchpoint

Notifications gains explicit Accept and Decline for friend requests and displays balance reminders.
It also exposes group-invite Accept/Decline and new-expense rows. This phase does not implement the
broader Phase 4 notification model, read controls, pagination, schedule posting failures, or Mark All
Read, although the schema reserves nullable `read_at` for the later phase.

### Recurring Read Adapter

Phase 2 reads existing recurring records through a minimal adapter. Pending occurrences are Needs
Review, active recurring records are Active, and paused records are Paused. Items sort by scheduled date
or `nextRunDate`, then recurring ID, in the device's local calendar timezone. Needs Review and schedule
rows open `/recurring/[id]`; Schedule Expense opens `/recurring/new?groupId=[id]`. Phase 2 does not
otherwise mutate recurring records.

## Query And State Contract

Every major view model exposes:

- Hydrated identity and permission state.
- Complete data or cached complete data.
- Initial loading distinct from background refresh.
- Recoverable error and one retry for the same snapshot.
- Offline/stale status when cached content is shown.
- First-use empty and filtered-empty separately.
- Mutation pending/error/success without discarding local form state.
- Not-found only after identity and permissions have loaded.

Financial mutations are not optimistic. Query invalidation covers every affected Home, Circles, group,
person, expense, settlement, activity, notification, and recurring key after server success.

Restricted is shown only when the authenticated user has verifiable participation or historical
visibility but no longer has mutation permission. For arbitrary inaccessible identifiers, RLS and the
client make unauthorized and nonexistent records indistinguishable.

## Error Handling

- Transactional failures complete fully or not at all.
- Every create mutation uses a client operation ID with a database uniqueness constraint; duplicate
  taps and timeout retries return the original result.
- Form and editor state survives recoverable network, validation, receipt-upload, and server errors.
- Receipt upload failure is explicit; the user may retry or remove the receipt before completing.
  Replaced, abandoned, failed, and deleted receipt objects are removed by the mutation or cleanup job.
- Permission loss produces a restricted state, not a misleading missing record.
- A deleted or inaccessible deep-linked entity shows not-found only after hydration.
- Invalid invite links distinguish expired, revoked, redeemed, self, blocked, and unknown states.
- Settlement balance changes between compose and submit return to review with the refreshed maximum.
- Expense changes that invalidate a stale split require recalculation before resubmission.

## Accessibility And Responsive Behavior

- Interactive targets are at least 44pt on iOS and 48dp on Android.
- Segments, selected rows, included participants, split methods, request actions, and permission states
  expose roles, labels, values, and selected/disabled state.
- Money rows compose accessible names from identity, direction, amount, and consequence.
- Dynamic errors are announced and focus moves to the first invalid field or review heading.
- Keyboard focus order follows visual order; fields and bottom actions remain visible at supported
  widths.
- Reduced motion stops spatial sheet transitions and uses near-instant state changes or crossfades.
- Dark mode uses Coral Ledger semantic tokens; financial color always has textual meaning.
- Layouts have no horizontal overflow at `360x800`, `390x844`, and `430x932`.

## Testing Strategy

### Pure Unit Tests

- Split methods, minor-unit rounding, remainders, inclusion, and invalid totals.
- Pairwise, group, and aggregate balances from expenses and settlements.
- Financial direction and copy, including settled and signed-zero cases.
- Settlement selection, maximums, consequences, and stale-balance handling.
- Permission decisions and route/context parsing.

### Database And RLS Verification

- Group creator, member, removed member, and non-member access.
- Transactional group creation, idempotent retry, delayed invitations, accept, decline, cancel, expire,
  and settings-time member invitation.
- Invite creation, expiration, revocation, redemption, replay, self, and blocked cases.
- Reminder visibility, non-zero balance requirement, and rate limit.
- Exact-email anti-enumeration, normalization, actor derivation, and rate limiting.
- Direct and group expense creation, context integrity, split integrity, idempotent retry, edit/delete
  permissions, private receipt visibility/cleanup, comments, and post-removal historical access.
- Settlement direction, currency-qualified context, group attribution, concurrent maximum enforcement,
  and duplicate submission protection.
- Group archival, schedule pause, historical retention, creator leave prevention, and per-currency
  bilateral balance blockers.

### Service And Hook Tests

- Complete query hydration and retry coverage for every amount source.
- Per-group bilateral balance derivation.
- Settings hydration without overwriting dirty edits.
- Correct cache invalidation after relationship and financial mutations.
- Preserved local state through recoverable failures.

### React Native Interaction Tests

- Circles segments, search, requests, states, and detail-only rows.
- Group creation timing, subviews, contextual actions, settings, leave, and delete.
- Person invites, group-specific balances, reminders, removal, and blocking.
- Expense context selection, preselection, all split methods, consequence copy, success, edit, delete,
  receipt, and comments.
- Settlement selection, compose shortcuts, review, stale balance, success, and return destinations.
- Home first-use, attention, schedule/recent fallback, refresh, and row destinations.
- Screen-reader roles, selected/disabled state, labels, and focus behavior.

### Integration And Manual Verification

- Run focused tests during each contract and screen cutover.
- Run the full Jest suite, typecheck, focused lint, full lint diagnostics, and format check.
- Verify cold deep links and back fallbacks for every new or changed route.
- Walk through group, people, expense, and settlement prototype flows on iOS and Android.
- Check light/dark themes, reduced motion, large text, keyboard behavior, offline recovery, and
  `360x800`, `390x844`, and `430x932` layouts.

## Implementation Ordering

The single exhaustive implementation plan must preserve this dependency order:

1. Schema, RLS, generated types, and route contracts.
2. Pure financial, permission, invitation, and copy contracts with tests.
3. Service APIs and complete view-model hooks.
4. Circles lists, requests, and state handling.
5. Group creation, detail subviews, settings, and contextual actions.
6. Person addition, invite redemption, detail, reminders, removal, and blocking.
7. Expense context, composer, split editor, mutation, success, detail, and edit.
8. Settlement selector, compose, review, mutation, and success.
9. Home integration and first-use behavior.
10. Notifications touchpoint, cross-feature invalidation, accessibility, and full verification.

No production wrapper switches early, and no legacy implementation is deleted in this phase.

## Success Criteria

- Home explains overall position, attention, and the next useful event without misleading zeroes.
- Groups and People are discoverable through Circles and every list row opens detail.
- Group and person screens show correct scoped balances and every visible action works.
- Invitations occur only after confirmation and private invite links redeem safely.
- Requests, reminders, removal, and blocking have real persistence and explicit consequences.
- Expense Equal, Amounts, Percent, and Shares calculations are distinct, exact, and inspectable.
- Expense detail states actual share, lent/borrowed meaning, permissions, receipt, and comments.
- Settlement direction, maximum, attribution, external method, review, and result are explicit.
- Contextual Add and Settle skip redundant selection and return to the affected circle.
- All major screens handle loading, refresh, first-use, filtered-empty, cached-offline, error, success,
  permission, and not-found states where applicable.
- Automated and manual verification passes without regressing the Phase 1 lifecycle or Circle Dock.
