# Splt App Rewrite Execution Tracker

> This file is the single shared source of truth for the full app rewrite. Keep it until every
> release gate, migration review, platform smoke test, and final audit is complete.

## Operating contract

### Ownership and status

- The main agent owns scope decisions, task assignment, serialized tracker updates, evidence review,
  and final acceptance. Implementing agents own only the files in their assigned scope.
- Every task has a stable ID: `SAFE-*`, `LEDGER-*`, `ARCH-*`, `UI-*`, `FLOW-*`, `PERF-*`, or
  `VERIFY-*`. IDs must never be reused or renamed.
- `[ ]` means incomplete, active, blocked, partially implemented, or insufficiently verified.
  `[x]` means the acceptance criteria are met and evidence is recorded below.
- Agents must read this tracker before work, edit only their assigned scope, never mark completion
  without verification, and return commands and evidence to the main agent.
- Agents must not concurrently update this tracker. The main agent delegates serialized tracker
  updates after reviewing returned evidence.
- A compile-only result never proves a task. Failed or unavailable verification leaves the task
  incomplete and must be recorded in `GAPS` or the handoff log.

### Protected paths and worktree safety

- The pre-existing user-owned deletions under `.opencode/`, `.superpowers/`, `design/`, and `docs/`
  are protected, out of scope, and must not be restored, expanded, or repurposed.
- Existing modified and untracked application work is protected until explicitly assigned. This
  includes expense, settlement, receipt, migration, tests, and this tracker.
- Do not use `git stash`, `reset`, `clean`, `checkout`, `add`, `commit`, or `push` during execution.
- Do not edit secrets, `.env*`, `.expo/`, `node_modules/`, generated reports, or caches.
- Before changing files, record status and diff scope. After changing files, verify that only the
  assigned paths changed and preserve unrelated user work.

## Objective

Deliver a simpler, safer, coherent expense-splitting app by reducing navigation and form steps,
making expense and settlement operations financially correct, moving authority into tested database
contracts, improving accessibility/motion/performance, and removing dead code only after replacement
flows are verified.

## Approved rewrite target tree

New work must converge exactly on this feature-first structure. Existing files may remain temporarily
while an assigned migration task proves parity; do not move files speculatively.

```text
src/
  app/                                      # thin Expo Router route adapters only
  features/
    activity/{api,model,ui,screens,index.ts}
    analytics/{api,model,ui,screens,index.ts}
    auth/{api,model,ui,screens,index.ts}
    balances/{api,model,ui,screens,index.ts}
    circles/{api,model,ui,screens,index.ts}
    currencies/{api,model,ui,screens,index.ts}
    dashboard/{api,model,ui,screens,index.ts}
    expenses/{api,model,ui,screens,index.ts}
    friends/{api,model,ui,screens,index.ts}
    groups/{api,model,ui,screens,index.ts}
    help/{api,model,ui,screens,index.ts}
    invitations/{api,model,ui,screens,index.ts}
    notifications/{api,model,ui,screens,index.ts}
    profile/{api,model,ui,screens,index.ts}
    recurring/{api,model,ui,screens,index.ts}
    settlements/{api,model,ui,screens,index.ts}
    users/{api,model,ui,screens,index.ts}
  shared/
    api/supabase/
    config/
    hooks/
    lib/
    money/
    navigation/
    query/
    state/
    ui/{feedback,forms,layout,motion,primitives}
  providers/
  styles/global.css
```

Every feature follows `src/features/<feature>/{api,model,ui,screens,index.ts}`. Shared infrastructure
follows `src/shared/{api/supabase,config,hooks,lib,money,navigation,query,state,ui/{feedback,forms,layout,motion,primitives}}`.
The only top-level application roots are `src/app`, `src/features`, `src/shared`, `src/providers`,
and `src/styles/global.css`.

The following are temporary legacy roots, not part of the approved final architecture: `components`,
`services`, `queries`, `context`, `store`, `types`, `utils`, and `validation`. The feature roots
`money`, `navigation`, `onboarding`, and `permissions` are also temporary legacy roots to remove only
after migration. They must not receive new final-architecture code and may be deleted only after
references, route behavior, tests, and replacement evidence are complete.

Architecture rules: route adapters contain no business logic; feature `api` owns feature server
calls; `model` owns domain types and transformations; `ui` owns feature components; `screens` own
screen composition; `index.ts` is the feature public boundary; shared Supabase access is only under
`src/shared/api/supabase`; financial amounts use integer minor units and explicit currency scale;
generated database types are refreshed only after an accepted schema.

## Dependency and delivery rules

1. `SAFE-*` baseline and protected-path work precede all edits.
2. `LEDGER-*` database contracts precede financial-flow completion and end-to-end claims.
3. `ARCH-*` boundaries may proceed after baseline safety and must preserve current behavior.
4. `FLOW-*` depends on the relevant `LEDGER-*` contract and `ARCH-*` boundary.
5. `UI-*` depends on stable flow contracts, but may document findings earlier.
6. `PERF-*` depends on stable screens and realistic fixtures.
7. `VERIFY-*` depends on its listed implementation IDs and is the only basis for release claims.
8. Each task record must include `Owner`, `Status`, `Depends on`, `Scope`, `Acceptance`, and
   `Evidence`. Only the main agent changes status or evidence in this file.

## Review baseline - 2026-07-31

### Current quality-gate evidence

| Gate | Current result | Evidence | Release status |
| --- | --- | --- | --- |
| TypeScript | Pass | `npm run typecheck` | Acceptable |
| ESLint errors | Pass | `npm run lint -- --quiet` | Acceptable |
| Prettier | Pass | `npm run format:check` | Acceptable |
| Jest | Pass | 44 suites, 574 tests; no console warnings | Acceptable |
| Database tests | **Unavailable** | `supabase test db` could not connect to Postgres | Blocking |
| Migration execution | **Not run** | Local Docker/Postgres unavailable | Blocking |
| Diff integrity | Pass at last focused verification | `git diff --check` | Re-run before release |

### Work reviewed so far

#### Shell navigation

- The center dock action now opens `/expense/new` directly.
- The previous five-action global sheet is no longer mounted by the shell.
- The obsolete `GlobalActionSheet`, its test, and its global-action navigation contract were
  removed.
- Group/person creation remains in Circles, settlement remains on balance-bearing group/friend
  surfaces, and recurring creation is now explicit in each group's Schedule view.

#### Add Expense

- The route file is now a one-line re-export of `NewExpenseFlow`.
- The default form hides split method, date, category, and receipt under "More options".
- Selecting a group or friend automatically establishes context without a second Continue step.
- Receipt picker/upload behavior moved to `useReceiptUpload`.
- Receipt presentation moved to `ExpenseReceiptControl`.
- The unused, incomplete `ExpenseFormSheets` extraction was deleted while the refactor is paused.
- `NewExpenseFlow.tsx` remains a 1,138-line orchestration/UI monolith.
- Context clearing still uses `setContext(undefined as any, [], "USD")`, which bypasses the type
  contract and resets to a hard-coded currency.
- The Add Expense refactor is intentionally paused and must not be considered complete.

#### Settlement flow

- The unsafe multi-balance "Settle all" path was removed.
- Each settlement now goes through the detailed payment flow and method selection.
- Full/Half presets convert minor units to major-unit input correctly.
- Valid decimal amounts no longer fail button enablement because `parseMinorInput` replaces
  `parseInt`.
- The no-op "Custom" preset was removed; the amount input itself is the custom path.
- Selecting a balance now pushes the payment screen so Back returns to the balance selector.
- The open balance is shown beside manual-entry guidance.
- Focused amount, reducer, selector, and navigation regression tests cover the changed behaviors.
- `SettlementScreen` deep-link currency, amount, and context parameters are now strict; the focused
  `SettlementFlow` suite passes all 10 tests.

#### Ledger migration

- `202607310001_ledger_hardening.sql` is drafted but has not been executed.
- It adds positive-expense enforcement for new writes.
- It centralizes split validation and server-side allocation.
- It replaces create/update/delete expense RPCs and create settlement RPC.
- It validates authentication, context, payer, participants, currency, split totals, direction,
  and current balance.
- It uses balance locks and narrows function execution permissions.
- It intentionally does not repair historical data.
- PostgreSQL syntax, function replacement compatibility, concurrency behavior, and pgTAP
  expectations remain unverified.
- Expense and settlement replay paths now compare actor and payload metadata and reject operation
  ID conflicts; database execution remains required before this contract is considered proven.
- The client money parser, split validation, and allocation paths are complete and covered by three
  focused suites with 81 tests passing, alongside TypeScript, Prettier, and diff checks.
- Settlement context, direction, and positive settlement selection are drafted; SQL create/delete
  and replay hardening is also drafted. SQL runtime verification remains blocked by unavailable
  local Docker/Postgres.

## Task register

### Safety and baseline

- [x] **SAFE-001** - Owner: main agent; Status: complete; Depends on: none; Scope: baseline
  snapshot and backup; Acceptance: external binary tracked diff, status snapshot, and relevant
  untracked application archive exist, exclude secrets/caches, and are non-empty; Evidence:
  `/var/folders/n5/0ywwltp54y12_s3629d4tpxr0000gn/T/opencode/splt-rewrite-baseline/tracked-diff.patch`
  (1,461,632 bytes), `git-status-short.txt` (7,659 bytes), and
  `relevant-untracked-application-work.tar.gz` (27,964 bytes). Archive contains only the listed
  `src/`, `supabase/`, and tracker paths; no `.env`, `.expo`, `node_modules`, reports, caches, or
  secrets.
- [x] **SAFE-002** - Owner: main agent; Status: complete; Depends on: SAFE-001; Scope:
  protected paths; Acceptance: pre-existing deletions under `.opencode/`, `.superpowers/`, `design/`,
  and `docs/` remain untouched and unrelated files are not included; Evidence: current `git diff
  --name-status` protected deletions under `.opencode/`, `.superpowers/`, `design/`, and `docs/`
  exactly match the SAFE-001 baseline snapshot at `/var/folders/n5/0ywwltp54y12_s3629d4tpxr0000gn/T/opencode/splt-rewrite-baseline/git-status-short.txt`; no new protected-path changes.
- [x] **SAFE-003** - Owner: prior review; Status: complete; Depends on: none; Scope: formatting
  stabilization; Acceptance: `npm run format:check` passes; Evidence: preserved completion log.

### Ledger and financial authority

- [ ] **LEDGER-001** - Owner: database agent; Status: incomplete; Depends on: SAFE-002; Scope:
  fresh migration reset; Acceptance: complete migration chain applies to a fresh database and
  `supabase test db` passes without ignored failures; Evidence: Supabase CLI 2.111.0 and Docker CLI
  28.5.2 are installed, but `docker info` cannot connect to the daemon, so status/start/reset/pgTAP
  were not run; Docker Desktop must be started.
- [ ] **LEDGER-002** - Owner: database agent; Status: incomplete; Depends on: LEDGER-001; Scope:
  authorization and membership; Acceptance: pgTAP covers authentication, group payer/participant
  membership, direct-expense friendship parties, receipt ownership, and unauthorized actors;
  Evidence: pending.
- [ ] **LEDGER-003** - Owner: database agent; Status: incomplete; Depends on: LEDGER-001; Scope:
  split allocation; Acceptance: equal/remainder, custom, percentage, shares, currency scale, and
  exact-total rules are tested; Evidence: client money parser, split validation, and allocation are
  complete with three focused suites and 81 tests passing; TypeScript, Prettier, and diff checks
  pass. SQL runtime verification is blocked by unavailable local Docker/Postgres.
- [ ] **LEDGER-004** - Owner: database agent; Status: incomplete; Depends on: LEDGER-001; Scope:
  mutation reversal; Acceptance: update/delete reverse old balances and clean receipt state;
  Evidence: pending.
- [ ] **LEDGER-005** - Owner: database agent; Status: incomplete; Depends on: LEDGER-001; Scope:
  settlement contract; Acceptance: membership, currency, direction, partial amount, overpayment,
  and locked current-balance checks pass; Evidence: context, direction, and positive settlement
  selection are drafted, with SQL create/delete and replay hardening drafted. Runtime database
  verification remains blocked by unavailable local Docker/Postgres.
- [ ] **LEDGER-006** - Owner: database agent; Status: incomplete; Depends on: LEDGER-002, LEDGER-003,
  LEDGER-005; Scope: idempotency and concurrency; Acceptance: identical actor/payload replay returns
  original result, conflicts return `operation_conflict`, and concurrent writes are deterministic;
  Evidence: pending pgTAP output.
- [ ] **LEDGER-007** - Owner: database agent; Status: incomplete; Depends on: LEDGER-001; Scope:
  historical audit and staging; Acceptance: zero-value/malformed rows are counted, staging output
  and rollback procedure are recorded, and function signatures match clients; Evidence: pending.
- [ ] **LEDGER-008** - Owner: main agent; Status: incomplete; Depends on: LEDGER-001..007; Scope:
  generated types; Acceptance: Supabase types are regenerated only after final schema acceptance;
  Evidence: pending.

### Architecture and boundaries

- [x] **ARCH-001** - Owner: architecture agent; Status: complete; Depends on: SAFE-002; Scope:
  canonical target tree and route adapters; Acceptance: route files are thin and feature ownership
  follows the target tree without unrelated moves; Evidence: 42 feature routes now consume public
  feature boundaries; auth callback and first-action are owned under auth; invite redemption is owned
  under invitations; every `src/app` file was audited with feature routes thin, redirects intentional,
  and layouts/provider files infrastructure-only; no route bypasses a feature public index;
  `screens-v2` physical normalization is explicitly deferred to ARCH-006 and shared relocation to
  ARCH-007, not blockers for ARCH-001; `npx tsc --noEmit`, quiet lint, full Jest 44 suites/574 tests,
  and `git diff --check` pass.
- [x] **ARCH-002** - Owner: prior review; Status: complete; Depends on: none; Scope: remove
  orphaned `ExpenseFormSheets`; Acceptance: no unreferenced extraction remains and typecheck/
  format pass; Evidence: preserved completion log.
- [ ] **ARCH-003** - Owner: expense agent; Status: incomplete; Depends on: ARCH-001; Scope:
  decompose `NewExpenseFlow`; Acceptance: context, participants, details, options, sheets,
  submission, and success navigation are focused units with behavior parity; Evidence: pending.
- [ ] **ARCH-004** - Owner: expense agent; Status: incomplete; Depends on: ARCH-003; Scope:
  typed context lifecycle; Acceptance: `clearContext()` preserves preferred currency and reducer/
  screen tests cover clear and reselect; Evidence: pending.
- [ ] **ARCH-005** - Owner: architecture agent; Status: incomplete; Depends on: ARCH-001; Scope:
  aliases, import boundaries, and cycle check; Acceptance: path aliases resolve to approved roots,
  boundary checks reject legacy-to-feature leaks and feature cycles, and a cycle report is clean;
  Evidence: pending.
- [ ] **ARCH-006** - Owner: architecture agent; Status: incomplete; Depends on: ARCH-001, ARCH-005;
  Scope: screens-v2 normalization; Acceptance: all `screens-v2` implementations are normalized into
  approved feature `screens` and `ui` boundaries without behavior loss; Evidence: pending.
- [ ] **ARCH-007** - Owner: platform agent; Status: incomplete; Depends on: ARCH-001, ARCH-005;
  Scope: shared infrastructure relocation; Acceptance: shared hooks, libraries, config, query,
  state, navigation, and UI primitives move to the exact `src/shared` tree with imports updated;
  Evidence: pending.
- [ ] **ARCH-008** - Owner: architecture agent; Status: incomplete; Depends on: ARCH-005, ARCH-007;
  Scope: types and mappers split; Acceptance: domain models, API DTOs, and mappers have explicit
  ownership in feature `model` or shared contracts with no catch-all legacy types; Evidence: pending.
- [ ] **ARCH-009** - Owner: data agent; Status: incomplete; Depends on: ARCH-007, LEDGER-008;
  Scope: query keys and invalidation scopes; Acceptance: feature query keys and mutation invalidation
  are centralized, scoped, and tested for balance, expense, settlement, and activity changes;
  Evidence: pending.
- [ ] **ARCH-010** - Owner: state agent; Status: incomplete; Depends on: ARCH-007; Scope: state
  persistence migration; Acceptance: persisted Zustand state migrates safely to approved shared state,
  retains compatible user preferences, and handles version/reset behavior; Evidence: pending.
- [ ] **ARCH-011** - Owner: ledger agent; Status: incomplete; Depends on: ARCH-008, LEDGER-008;
  Scope: money contract ownership; Acceptance: currency scale, minor-unit arithmetic, rounding, and
  formatting have one tested owner under `src/shared/money`; Evidence: pending.
- [ ] **ARCH-012** - Owner: security agent; Status: incomplete; Depends on: ARCH-007; Scope:
  permissions split; Acceptance: authorization policy, route guards, and UI capability checks are
  separated into approved feature/shared boundaries and do not rely on legacy `permissions`;
  Evidence: pending.
- [ ] **ARCH-013** - Owner: UI agent; Status: incomplete; Depends on: ARCH-007; Scope: design-system
  migration; Acceptance: tokens, typography, primitives, forms, layout, feedback, and motion use the
  approved shared UI tree and no legacy global component imports remain; Evidence: pending.
- [ ] **ARCH-014** - Owner: navigation agent; Status: incomplete; Depends on: ARCH-006, ARCH-012;
  Scope: route adapters; Acceptance: every `src/app` route is a thin adapter to one feature screen,
  with guards and params explicit and no business logic; Evidence: pending.
- [ ] **ARCH-015** - Owner: architecture agent; Status: incomplete; Depends on: ARCH-006..014;
  Scope: compatibility cleanup; Acceptance: temporary legacy roots, aliases, re-exports, dead
  services, and duplicate query/state paths are removed only after reference and test audits;
  Evidence: pending.

### User interface and accessibility

- [ ] **UI-001** - Owner: UI agent; Status: incomplete; Depends on: ARCH-001; Scope: whole-app
  visual consistency; Acceptance: every screen uses current product/design sources, consistent
  typography, spacing, touch targets, labels, errors, empty states, themes, and semantic colors;
  Evidence: screen inventory and review notes pending.
- [ ] **UI-002** - Owner: accessibility agent; Status: incomplete; Depends on: UI-001; Scope:
  accessibility and scaling; Acceptance: names, roles, states, hints, focus order, Dynamic Type,
  long text, keyboard avoidance, and safe areas pass on iOS and Android; Evidence: pending.
- [ ] **UI-003** - Owner: motion agent; Status: incomplete; Depends on: UI-001; Scope: motion;
  Acceptance: durations/easings are centralized, reduced motion is respected, and financial values
  do not use distracting layout animation; Evidence: pending.
- [ ] **UI-004** - Owner: UI agent; Status: incomplete; Depends on: ARCH-013; Scope: Tally Rail system;
  Acceptance: the dashboard Tally Rail has approved tokens, balance hierarchy, states, touch targets,
  and reusable primitives with light/dark and accessibility evidence; Evidence: pending.
- [ ] **UI-005** - Owner: accessibility agent; Status: incomplete; Depends on: ARCH-013, UI-004;
  Scope: reduced motion and accessibility; Acceptance: screen-reader semantics, focus order, labels,
  hints, Dynamic Type, contrast, keyboard avoidance, safe areas, and reduced-motion behavior are
  verified for every routed screen group; Evidence: pending.

### Routed flow coverage

Each task below covers the complete routed group: entry, loading, empty, error, success, Back/Cancel,
deep-link/param handling, and return navigation. All remain incomplete until evidence is returned.

- [x] **FLOW-001** - Owner: prior review; Status: complete; Depends on: none; Scope: shell action
  cleanup; Acceptance: supported create actions have deliberate entry points and tests; Evidence:
  preserved completion log.
- [x] **FLOW-002** - Owner: prior review; Status: complete; Depends on: none; Scope: settlement
  regression coverage; Acceptance: decimal, preset, Back, selector, and no-batch behavior tests
  pass; Evidence: preserved completion log.
- [ ] **FLOW-003** - Owner: settlement agent; Status: incomplete; Depends on: LEDGER-005; Scope:
  settlement hardening; Acceptance: balance-change errors, direction copy, group/direct/multicurrency
  selection, partial results, retry, duplicate submit, success navigation, and accessibility are
  verified; Evidence: pending.
- [ ] **FLOW-004** - Owner: navigation agent; Status: incomplete; Depends on: ARCH-014; Scope:
  route/action inventory; Acceptance: every create/edit/delete/settle path has one clear primary
  route, consistent Back/Cancel/Close/Done behavior, and no dead route; Evidence: pending.
- [ ] **FLOW-005** - Owner: expense agent; Status: incomplete; Depends on: ARCH-003, ARCH-004,
  LEDGER-003; Scope: Add Expense; Acceptance: default context/amount/details/payer/save flow has
  no redundant confirmation, advanced options preserve input, and failure/retry/offline states are
  covered; Evidence: pending.
- [ ] **FLOW-010** - Owner: auth agent; Status: incomplete; Depends on: ARCH-014; Scope: auth routed
  screens; Acceptance: welcome, login, register, forgot/reset password, verification, activation
  backfill, and unauthenticated redirects are covered; Evidence: pending.
- [ ] **FLOW-011** - Owner: dashboard agent; Status: incomplete; Depends on: ARCH-014, UI-004;
  Scope: dashboard routed screens; Acceptance: Tally Rail, activity summary, refresh, empty/error,
  and balance navigation are covered; Evidence: pending.
- [ ] **FLOW-012** - Owner: circles agent; Status: incomplete; Depends on: ARCH-014; Scope: circles
  routed screens; Acceptance: groups/people tabs, create actions, search, empty states, and detail
  returns are covered; Evidence: pending.
- [ ] **FLOW-013** - Owner: groups agent; Status: incomplete; Depends on: ARCH-014, LEDGER-002;
  Scope: groups routed screens; Acceptance: create, overview, expenses, schedule, settings, members,
  delete, and settlement entry paths are covered; Evidence: pending.
- [ ] **FLOW-014** - Owner: friends agent; Status: incomplete; Depends on: ARCH-014, LEDGER-002;
  Scope: friends routed screens; Acceptance: add, invite, accept/reject, detail, direct expense,
  and remove flows are covered; Evidence: pending.
- [ ] **FLOW-015** - Owner: activity agent; Status: incomplete; Depends on: ARCH-014, ARCH-009;
  Scope: activity routed screens; Acceptance: timeline, filtering, pagination, refresh, and detail
  navigation are covered; Evidence: pending.
- [ ] **FLOW-016** - Owner: expense agent; Status: incomplete; Depends on: FLOW-005, LEDGER-003;
  Scope: expenses routed screens; Acceptance: new, detail, edit, delete, receipts, all split
  methods, retry, and success return flows are covered; Evidence: pending.
- [ ] **FLOW-017** - Owner: settlement agent; Status: incomplete; Depends on: FLOW-003, LEDGER-005;
  Scope: settlements routed screens; Acceptance: selector, compose, review, success, partial/full,
  direct/group, and failure recovery flows are covered; Evidence: pending.
- [ ] **FLOW-018** - Owner: balances agent; Status: incomplete; Depends on: ARCH-014, LEDGER-005;
  Scope: balances routed screens; Acceptance: balance selection, direction, currency, and settle
  navigation are covered; Evidence: pending.
- [ ] **FLOW-019** - Owner: analytics agent; Status: incomplete; Depends on: ARCH-014, ARCH-009;
  Scope: analytics routed screens; Acceptance: filters, date ranges, loading/error/empty states,
  and correct aggregation are covered; Evidence: pending.
- [ ] **FLOW-020** - Owner: currencies agent; Status: incomplete; Depends on: ARCH-011;
  Scope: currencies routed screens; Acceptance: preference changes, supported scales, persistence,
  and financial meaning safeguards are covered; Evidence: pending.
- [ ] **FLOW-021** - Owner: help agent; Status: incomplete; Depends on: ARCH-014; Scope: help routed
  screens; Acceptance: help, legal, support, external links, and back behavior are covered;
  Evidence: pending.
- [ ] **FLOW-022** - Owner: invitations agent; Status: incomplete; Depends on: ARCH-014, LEDGER-002;
  Scope: invitations routed screens; Acceptance: invite, redemption, expired/invalid token,
  activation backfill, and auth redirects are covered; Evidence: pending.
- [ ] **FLOW-023** - Owner: notifications agent; Status: incomplete; Depends on: ARCH-014, ARCH-009;
  Scope: notifications routed screens; Acceptance: list, read/unread, settings, pagination, and
  deep links are covered; Evidence: pending.
- [ ] **FLOW-024** - Owner: profile agent; Status: incomplete; Depends on: ARCH-010, ARCH-014;
  Scope: profile routed screens; Acceptance: view/edit, password, appearance, security, delete,
  and persisted preference flows are covered; Evidence: pending.
- [ ] **FLOW-025** - Owner: recurring agent; Status: incomplete; Depends on: ARCH-014, LEDGER-003;
  Scope: recurring routed screens; Acceptance: schedule create/detail/edit/review, pause/delete,
  generation, and failure recovery are covered; Evidence: pending.
- [ ] **FLOW-026** - Owner: users agent; Status: incomplete; Depends on: ARCH-014, ARCH-009; Scope:
  users routed screens and lookup flows; Acceptance: search, pagination, profile handoff, privacy,
  and authorization states are covered; Evidence: pending.

### Performance

- [ ] **PERF-001** - Owner: performance agent; Status: incomplete; Depends on: UI-001, FLOW-003;
  Scope: core screen profiling; Acceptance: dashboard, lists, expense detail, and settlement flows
  remain responsive with realistic data and no actionable dropped-frame regressions; Evidence: pending
  profile output.
- [ ] **PERF-002** - Owner: performance agent; Status: incomplete; Depends on: UI-003, PERF-001;
  Scope: animation and list hygiene; Acceptance: FlashList/render boundaries, Reanimated work, and
  Lottie usage are reviewed with reduced-motion behavior; Evidence: pending.
- [ ] **PERF-003** - Owner: data agent; Status: incomplete; Depends on: ARCH-009; Scope: pagination
  and server indexes; Acceptance: every feed/search query has cursor pagination where needed and
  supporting database indexes with measured query plans; Evidence: pending.
- [ ] **PERF-004** - Owner: list agent; Status: incomplete; Depends on: ARCH-006, PERF-003; Scope:
  FlashList migration; Acceptance: long activity, expense, group, friend, notification, and user
  lists use measured FlashList boundaries without broken refresh or accessibility; Evidence: pending.
- [ ] **PERF-005** - Owner: media agent; Status: incomplete; Depends on: ARCH-007; Scope: image
  caching; Acceptance: avatars and receipts use bounded caching, placeholders, cancellation, and
  retry without unbounded memory growth; Evidence: pending.
- [ ] **PERF-006** - Owner: dashboard agent; Status: incomplete; Depends on: ARCH-009, UI-004;
  Scope: dashboard selectors; Acceptance: derived balance/activity selectors minimize rerenders,
  remain financially correct, and have selector performance evidence; Evidence: pending.
- [ ] **PERF-010** - Owner: performance agent; Status: incomplete; Depends on: FLOW-010; Scope: auth
  screen performance; Acceptance: auth and activation screens meet interaction and startup budgets;
  Evidence: pending.
- [ ] **PERF-011** - Owner: performance agent; Status: incomplete; Depends on: FLOW-011; Scope:
  dashboard performance; Acceptance: dashboard/Tally Rail stays responsive with realistic balances;
  Evidence: pending.
- [ ] **PERF-012** - Owner: performance agent; Status: incomplete; Depends on: FLOW-012; Scope:
  circles performance; Acceptance: tabs and searches remain responsive with realistic member data;
  Evidence: pending.
- [ ] **PERF-013** - Owner: performance agent; Status: incomplete; Depends on: FLOW-013; Scope:
  groups performance; Acceptance: group overview, expenses, and schedule remain responsive;
  Evidence: pending.
- [ ] **PERF-014** - Owner: performance agent; Status: incomplete; Depends on: FLOW-014; Scope:
  friends performance; Acceptance: friend search and lists remain responsive; Evidence: pending.
- [ ] **PERF-015** - Owner: performance agent; Status: incomplete; Depends on: FLOW-015; Scope:
  activity performance; Acceptance: paginated activity stays responsive; Evidence: pending.
- [ ] **PERF-016** - Owner: performance agent; Status: incomplete; Depends on: FLOW-016; Scope:
  expense performance; Acceptance: forms, receipt media, and detail lists remain responsive;
  Evidence: pending.
- [ ] **PERF-017** - Owner: performance agent; Status: incomplete; Depends on: FLOW-017; Scope:
  settlement performance; Acceptance: selector and review interactions remain responsive;
  Evidence: pending.
- [ ] **PERF-018** - Owner: performance agent; Status: incomplete; Depends on: FLOW-018; Scope:
  balances performance; Acceptance: balance selection and calculations remain responsive;
  Evidence: pending.
- [ ] **PERF-019** - Owner: performance agent; Status: incomplete; Depends on: FLOW-019; Scope:
  analytics performance; Acceptance: charts and aggregation remain responsive; Evidence: pending.
- [ ] **PERF-020** - Owner: performance agent; Status: incomplete; Depends on: FLOW-020; Scope:
  currencies performance; Acceptance: currency preference screens remain responsive; Evidence: pending.
- [ ] **PERF-021** - Owner: performance agent; Status: incomplete; Depends on: FLOW-021; Scope:
  help performance; Acceptance: help and legal screens remain responsive; Evidence: pending.
- [ ] **PERF-022** - Owner: performance agent; Status: incomplete; Depends on: FLOW-022; Scope:
  invitations performance; Acceptance: invite redemption remains responsive; Evidence: pending.
- [ ] **PERF-023** - Owner: performance agent; Status: incomplete; Depends on: FLOW-023; Scope:
  notifications performance; Acceptance: paginated notifications remain responsive; Evidence: pending.
- [ ] **PERF-024** - Owner: performance agent; Status: incomplete; Depends on: FLOW-024; Scope:
  profile performance; Acceptance: profile and settings remain responsive; Evidence: pending.
- [ ] **PERF-025** - Owner: performance agent; Status: incomplete; Depends on: FLOW-025; Scope:
  recurring performance; Acceptance: schedule screens remain responsive; Evidence: pending.
- [ ] **PERF-026** - Owner: performance agent; Status: incomplete; Depends on: FLOW-026; Scope:
  users performance; Acceptance: user search and lookup remain responsive; Evidence: pending.

### Verification and release

- [ ] **VERIFY-001** - Owner: test agent; Status: incomplete; Depends on: LEDGER-001..008;
  Scope: database scenarios; Acceptance: group/direct splits, receipts, settlements, concurrency,
  currencies, retries, and authorization have automated or recorded evidence; Evidence: pending.
- [ ] **VERIFY-002** - Owner: test agent; Status: incomplete; Depends on: FLOW-003, FLOW-005;
  Scope: client flow scenarios; Acceptance: create/edit/delete/settle, undo, retry, navigation,
  and resulting balances match independently calculated values; Evidence: pending.
- [ ] **VERIFY-003** - Owner: main agent; Status: incomplete; Depends on: all implementation IDs;
  Scope: release gate; Acceptance: `npm run typecheck`, `npm run lint`, `npm run format:check`,
  `npm run test -- --runInBand`, `supabase db reset`, `supabase test db`, and `git diff --check`
  pass in one final cycle; Evidence: pending.
- [ ] **VERIFY-004** - Owner: main agent; Status: incomplete; Depends on: VERIFY-001..003;
  Scope: platform smoke and final audit; Acceptance: iOS/Android auth, add, edit/delete, and
  settle smoke tests pass, no P0/P1 remains, and unrelated user work is preserved; Evidence: pending.

## Preserved completed evidence log

| Date | Completed task | Evidence |
| --- | --- | --- |
| 2026-07-31 | Baseline code review | Typecheck and quiet lint pass; 38 Jest suites/518 tests pass; format and database gates remain incomplete |
| 2026-07-31 | Phase 0 stabilization | Typecheck, quiet lint, format, and diff checks pass; 41 Jest suites/531 tests pass; unused expense extraction removed; settlement regressions covered |
| 2026-07-31 | React warning cleanup | Focused 43-test run and full 41-suite/531-test Jest run pass without console errors or warnings |
| 2026-07-31 | Global action cleanup | Removed the dead action sheet; restored group-scoped schedule creation; typecheck/lint/format/diff pass; 40 suites/528 tests pass cleanly |
| 2026-07-31 | Settlement overpayment | Replaced silent clamping with inline validation and reducer rejection; 31 focused tests and full 40-suite/529-test run pass cleanly |

## Agent handoff log

| Date | Agent/task | Scope and result | Verification/evidence returned | Main-agent action |
| --- | --- | --- | --- | --- |
| 2026-07-31 | Baseline initialization / SAFE-001 | External backup created before future edits | See backup path and command output in initialization report | Review, then serialize tracker updates |
| 2026-07-31 | Database environment probe / LEDGER-001 | Supabase CLI 2.111.0 and Docker CLI 28.5.2 are installed; `docker info` failed with `Cannot connect to the Docker daemon at unix:///Users/abuzaid/.docker/run/docker.sock. Is the docker daemon running?`; no files changed | `npx supabase --version` -> 2.111.0; `docker --version` -> Docker version 28.5.2; status/start/reset/pgTAP were not run because the daemon is unavailable | Keep LEDGER-001 incomplete; start Docker Desktop |
| 2026-07-31 | Client money contract / LEDGER-003 | Money parser, split validation, and allocation are complete; ledger task remains incomplete because SQL runtime evidence is unavailable | Focused Jest: 3 suites/81 tests pass; `npm run typecheck`, `npm run format:check`, and `git diff --check` pass | Do not mark LEDGER-003 or related flow tasks complete; obtain SQL runtime evidence |
| 2026-07-31 | SQL ledger hardening / LEDGER-005 | Context, direction, positive settlement selection, and SQL create/delete/replay hardening are drafted; Docker/Postgres blocks runtime verification; concurrency, recurring, and receipt object lifecycle work is deferred | SQL runtime not run because local Docker/Postgres is unavailable; focused `SettlementFlow` suite: 10 tests pass | Do not mark LEDGER-005 or related flow tasks complete; unblock Docker/Postgres and schedule deferred coverage |
| 2026-07-31 | Protected-path audit / SAFE-002 | Audit-only scope; protected deletions under `.opencode/`, `.superpowers/`, `design/`, and `docs/` match the SAFE-001 baseline; no new protected-path changes | `git diff --name-status` matches the SAFE-001 snapshot; `git diff --check` passes | SAFE-002 may be marked complete; final unrelated-work audit remains part of VERIFY-004 |
| 2026-07-31 | Recurring route boundary / ARCH-001 | `src/app/recurring/index.ts`, `src/app/recurring/new.tsx`, `src/app/recurring/[id].tsx`, `src/app/recurring/[id]/edit.tsx`, and `src/app/recurring/[id]/review.tsx`; all five adapters import named screens only from `@/features/recurring`; full canonical tree and remaining adapters are pending | `npm run typecheck` passes; `npm test -- --runInBand src/features/recurring/services/recurringApi.test.ts` passes (1 suite/3 tests) | Keep ARCH-001 incomplete; continue feature-by-feature route and ownership migration. |
| 2026-07-31 | Stable feature route boundaries / ARCH-001 | 22 adapters across activity, analytics, auth, currencies, dashboard, help, notifications, and profile | `npm run typecheck`; focused Jest: 5 suites/74 tests; route-limited `git diff --check` | Keep ARCH-001 incomplete; excluded modified and composition routes remain pending. |
| 2026-07-31 | Modified-feature route boundaries / ARCH-001 | 12 group/friend/circles/expense/settlement adapters | `npm run typecheck`; focused Jest: 3 suites/76 tests; route-limited `git diff --check` | Keep ARCH-001 incomplete; no feature implementation was changed. |
| 2026-07-31 | Auth callback extraction / ARCH-001 | `src/app/auth/callback.tsx`, `src/features/auth/index.ts`, new `src/features/auth/screens/AuthCallbackScreen.tsx` and `src/features/auth/screens/AuthCallbackScreen.test.tsx` | `npx tsc --noEmit`, quiet lint, 3 suites/63 tests, `git diff --check` pass; test typecheck blocked by 27 pre-existing unrelated errors | Keep ARCH-001 incomplete; callback extraction accepted, external test-type errors remain a baseline gap. |
| 2026-07-31 | First-action ownership / ARCH-001 | Moved `src/features/onboarding/screens-v2/FirstActionScreen.tsx` to `src/features/auth/screens/FirstActionScreen.tsx` and deleted the old screen; `src/app/first-action.tsx` remains the route adapter and `src/features/auth/index.ts` exports the screen; new `src/features/auth/screens/FirstActionScreen.test.tsx` plus `src/features/auth/lifecycle.test.ts` cover exact activation destinations/loading/error/retry behavior | `npm run typecheck`; `npm run lint -- --quiet`; focused Jest: 2 suites/52 tests; scoped diff/reference audit pass; test typecheck reports only 27 pre-existing unrelated diagnostics | Accept ownership move; keep ARCH-001 incomplete pending invitations and broader feature ownership. |
| 2026-07-31 | ARCH-001 route-boundary regression | 41 public-boundary route adapters plus auth callback and first-action ownership tests | `npx tsc --noEmit` pass, `npm run lint -- --quiet` pass, `npm test -- --runInBand` pass (44 suites/574 tests, no warnings), and `git diff --check` pass | Accept current slices; keep ARCH-001 incomplete pending invitations and broader feature ownership. |
| 2026-07-31 | Invitation ownership / ARCH-001 | Moved invite redemption ownership from friends to invitations; updated route, public barrel, and test imports | `npx tsc --noEmit` pass; `npm run lint -- --quiet` pass; focused Jest: 3 suites/40 tests; `git diff --check` pass | Accept invitation ownership move; continue the final route/ownership audit. |
| 2026-07-31 | Final route/ownership audit / ARCH-001 | Full route inventory: 42 feature routes consume public feature boundaries; auth callback and first-action are owned under auth; invite redemption is owned under invitations; feature routes are thin, redirects intentional, layouts/provider files infrastructure-only, and no route bypasses a feature public index | `npx tsc --noEmit` pass; `npm run lint -- --quiet` pass; full Jest: 44 suites/574 tests; `git diff --check` pass | Mark ARCH-001 complete; defer `screens-v2` physical normalization to ARCH-006 and shared physical migration to ARCH-007. |

Handoff entries must include exact commands and real output, changed paths, known gaps, and whether
the main agent may mark the task complete. Do not infer evidence from a task description.

## Temporary-file deletion gate

Delete this tracker only after all of the following are true:

- [ ] Every phase/task exit criterion is satisfied.
- [ ] Every P0 and P1 finding is resolved.
- [ ] The complete release gate passes in one final review cycle.
- [ ] Local and staging migration evidence has been reviewed.
- [ ] iOS and Android core-flow smoke tests pass.
- [ ] Final worktree review confirms unrelated user-owned changes were preserved.
- [ ] The user has received the final implementation and review summary.

Deletion is the final tracker action. It must not happen because implementation paused, individual
tests passed, or the plan became inconvenient to maintain.
