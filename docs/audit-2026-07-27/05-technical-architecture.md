# Technical Architecture

## Strategy: controlled vertical-slice rewrite

Retain routes, canonical data, tokens, and stable service contracts while replacing the
inside of each flow. Do not maintain “v2” indefinitely. Each migrated slice must remove
or redirect its predecessor after parity.

```text
Route
  -> screen state/interaction
    -> feature use case
      -> typed repository/service
        -> authoritative RPC/read model
```

UI components do not derive ledger balances. Services do not render errors. Screens do
not construct SQL payload semantics ad hoc.

## Target feature shape

```text
src/features/expenses/
  domain/
    money.ts
    expense.ts
    splitPolicy.ts
    errors.ts
  application/
    createExpense.ts
    updateExpense.ts
    expenseComposerReducer.ts
  data/
    expenseRepository.ts
    expenseMapper.ts
    expenseQueries.ts
  ui/
    ExpenseComposerScreen.tsx
    ExpenseAmountStep.tsx
    SplitOptionsSheet.tsx
    ExpenseDetailScreen.tsx
```

Use the same pattern only where it reduces coupling. Small features do not need empty
layers or barrel files.

## Domain boundaries

### Money

Owns supported currency metadata, parsing, formatting inputs, minor-unit arithmetic,
allocation, and per-currency grouping. It imports no UI or Supabase code.

### Ledger

Owns sign semantics and typed read models. The database is authoritative; the client
contains test fixtures and presentation transformations, not an independent ledger.

### Expenses

Owns composer state, validation feedback, mutation orchestration, receipt lifecycle, and
expense detail.

### Settlements

Owns selection from an open balance, compose/review/confirm state, stale balance handling,
and result.

### Relationships/groups

Own membership/permissions and context presentation. Person ledger consumes ledger read
models; it does not scan all expenses.

## Read and write models

Use purpose-built RPC/view contracts:

- `fetch_open_balances_v1`
- `fetch_person_ledger_v1`
- `fetch_group_ledger_v1`
- `create_expense_v3`
- `update_expense_v3`
- `record_settlement_v3`

Version when semantics change. Generate Supabase TypeScript types after migrations and
fail CI on drift. Mappers validate unknown responses at the boundary.

Write models carry integers and IDs only. Read models return display-independent facts,
including context and signed effect. The UI supplies localized copy.

## Query architecture

Create one query-key factory with keys for:

- current user/session;
- open balances;
- person ledger pages;
- group ledger pages;
- expense detail;
- relationship/group metadata;
- notifications/settings.

Mutations declare their affected keys centrally. Use targeted invalidation; do not refetch
every user expense after each write. Cursor pagination is mandatory for ledgers/activity.
Stale data may render, but settlement confirmation performs a fresh server check.

## Composer architecture

Replace the 1,300-line expense screen with:

- a reducer/state machine containing pure transitions;
- selectors for validity and preview;
- small visual sections;
- focused sheets for context, payer, and advanced split;
- one mutation coordinator;
- route adapter that supplies optional context.

The reducer has states such as `selectingContext`, `editing`, `submitting`, `succeeded`,
and `failed`. Navigation cannot accidentally submit. Draft restoration has a versioned
schema and never stores receipt blobs or sensitive data unintentionally.

Use the existing settlement flow reducer as a starting pattern, after fixing money-unit
bugs and separating presentation.

## Component-system decision

### Canonical system

Preserve Coral Ledger and consolidate around:

- semantic colors from one token source;
- typography roles;
- spacing/radius/touch/motion tokens;
- `Screen`, `TopBar`, `Button`, `IconButton`, `Field`, `Select`, `Sheet`, `MoneyRow`,
  `EmptyState`, `Snackbar`, and list primitives.

Every primitive owns accessibility defaults, disabled/busy state, focus behavior,
dynamic-type layout, test IDs only where semantic queries are insufficient, and platform
touch targets.

### Migration rule

- audit imports to map `components/ui` equivalents to Coral primitives;
- migrate one primitive at a time with visual/accessibility tests;
- deprecate the old export, then remove it after reachability is zero;
- move literals into semantic tokens only when they represent a shared decision;
- update `ui-registry.md` with the canonical anatomy and variants.

### HeroUI Native

Do not add it automatically because project prose mentions it. The current app does not
depend on it, and adding it now would create a third system. Create an ADR only if a short
spike proves that its accessible behavior, maintenance, and performance justify adoption
without changing Coral tokens. Otherwise keep custom, well-tested native primitives.

## Token governance

Choose `design-tokens.json` as the human-readable canonical source. Generate or verify:

- `src/components/coral/theme.ts`;
- Uniwind/global CSS variables where needed;
- documentation examples.

Archive the conflicting Warm Ledger document or clearly mark it historical. Add a CI
token drift test. Hard-coded colors are allowed only for external brand marks or documented
platform-specific cases.

## Navigation

- retain Expo Router and compatibility redirects;
- use typed route helpers for expense, group, person, and settlement routes;
- centre action directly opens expense composer;
- preserve native stack gestures and Android back/predictive-back;
- eliminate duplicate settle selector detours when context is known;
- test deep links, auth/onboarding guards, resume-after-create, and not-found routes;
- define a tablet navigation adaptation before adding tablet-only layouts.

## Security and privacy

- database authorization remains mandatory even when UI hides actions;
- do not store raw email/password for biometric convenience; use OS-protected session
  credentials/tokens and threat-model the flow;
- secrets stay out of logs, analytics, AsyncStorage, screenshots, and error copy;
- receipt URLs are short-lived and ownership checked;
- delete/export flows require real backend jobs, authentication/re-auth policy, status,
  failure, cancellation, and audit;
- legal acceptance/content versions are owned and recorded where required.

## Performance approach

Measure release builds before optimization:

- cold/warm launch;
- time to interactive;
- JS/UI frame rate during dock, sheets, expense composer, and long lists;
- React render commits;
- memory after scrolling activity/person ledger;
- query count/payload size;
- bundle and native binary size.

Then fix observed bottlenecks:

- paginate and virtualize unbounded history;
- use `FlashList`/`FlatList` with stable keys and measured item estimates;
- avoid inline derived full-dataset scans on every render;
- prefer transform/opacity animation;
- load heavy pickers/charts only when opened;
- remove manual memoization that conflicts with the React Compiler;
- do not add `memo`/`useMemo` mechanically.

## Error and observability architecture

Define stable domain error codes:

```text
AUTH_REQUIRED
CONTEXT_FORBIDDEN
PARTICIPANT_INVALID
AMOUNT_INVALID
SPLIT_TOTAL_MISMATCH
BALANCE_STALE
BALANCE_DIRECTION_INVALID
IDEMPOTENCY_CONFLICT
OFFLINE
UNKNOWN
```

Map codes to user copy in one place. Capture sanitized error code, app version, route, and
operation ID. Add crash reporting and mutation telemetry only after privacy review.
Financial diagnostics never include raw notes, emails, receipt data, or tokens.

## Repository hygiene

- separate TypeScript configs for app, Jest, Supabase functions, and Playwright;
- ignore `playwright-report`, `test-results`, coverage, Expo output, and generated traces;
- lint only owned source/config scopes;
- make format enforcement deterministic;
- remove `.orig`/`.rej` artifacts after confirming they are not needed;
- rename package metadata from the template name;
- reconcile Expo/RN versions in `AGENTS.md` and build documentation;
- document each live script and delete stale commands;
- use an import/reachability check before deleting legacy components.

## ADRs required

1. Currency registry and safe money transport.
2. Expense authorization and split authority.
3. Ledger read models and sign semantics.
4. Coral component consolidation vs HeroUI Native.
5. Settlement reversal/audit policy.
6. Offline financial mutation policy.
7. Recurring expense generation/review model.
8. Account export/deletion and retention.
9. Tablet navigation adaptation.

Each ADR records context, decision, alternatives, consequences, migration, and rollback.
