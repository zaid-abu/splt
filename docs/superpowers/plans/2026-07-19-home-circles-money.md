# Phase 2 Home, Circles, And Money Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete, real-data Home, Circles, group, person, expense, and settlement flows while preserving the shipped Circle Dock and account lifecycle.

**Architecture:** Additive Supabase migrations establish integer-minor-unit sources, canonical relationship/context records, shared balance locks, transactional RPCs, storage authorization, and historical RLS before the app consumes them. Generated database types and pure TypeScript money, balance, copy, permission, and route contracts feed typed services and complete React Query snapshots; active `screens-v2` wrappers cut over in Circles, group, person, expense, settlement, then Home order. Existing recurring routes remain mutation owners, while a read-only adapter supplies Home and group Schedule data.

**Tech Stack:** Expo SDK 57, Expo Router 57, React Native 0.86, React 19, TypeScript 6 strict mode, Supabase JS 2, PostgreSQL/Supabase RLS and Storage, TanStack React Query 5, Jest 29 with `jest-expo`, React Native Testing Library 14, Coral Ledger components, Expo Image Picker, Expo Document Picker, `npx supabase` CLI.

## Global Constraints

- Treat `docs/superpowers/specs/2026-07-19-home-circles-money-design.md` as binding; prototype references listed there define presentation and copy.
- Preserve the current Circle Dock, global Add sheet, root/shell navigation ownership, authentication, setup, onboarding, account deletion, and password lifecycle.
- Preserve existing user changes. Read each target immediately before editing and merge around concurrent work.
- Use the versions already in `package.json`: Expo 57, React Native 0.86, React 19, TypeScript 6, Supabase JS 2, TanStack Query 5, and Jest 29.
- Do not add an npm dependency for the Supabase CLI. Use `npx supabase@latest`; Docker Desktop is required for local database verification.
- The only planned runtime dependency addition is SDK-compatible `expo-document-picker`, required to satisfy private PDF receipt selection. Install it with `npx expo install expo-document-picker`; add nothing else without a separately demonstrated requirement.
- The repository currently has no `supabase/config.toml` and no SQL test harness. Task 1 creates both with `npx supabase@latest init`; do not run `init` again after the file exists.
- Keep all schema changes additive. Retain legacy `numeric(12,2)` amount columns and populate additive `*_minor bigint` columns; new balance-affecting writes go through authoritative RPCs that write both representations.
- Use currency minor scale `0` for `JPY` and `KRW`, and `2` for every other currently supported app currency. Reject unsafe integers and unsupported currency codes at app boundaries.
- Retain existing contextless direct records that cannot be mapped safely. They remain historically readable but are not editable through Phase 2 RPCs.
- Supersede friendship `metadata.pending_groups` with `group_invitations`; stop reading or writing the metadata mechanism after service cutover, but retain the column during this phase.
- Add `expenses.friendship_id`; every new expense has exactly one of `group_id` or `friendship_id`.
- Preserve database split value `custom`; UI copy is `Amounts`. Add database/UI `shares` as a distinct method.
- Store new receipt object keys in a private bucket. Keep legacy `receipt_url` readable; never create a new public receipt URL.
- Every balance mutation derives all affected context/counterparty/currency lock keys, sorts them lexically, and acquires transaction-scoped advisory locks in that order.
- Financial calculations use integer minor units. Percentage source precision is at most four decimal places; share precision is at most six decimal places.
- Financial mutations are never optimistic. Invalidate every affected Home, Circles, group, person, expense, settlement, activity, notification, and recurring key only after server success.
- A view-model snapshot does not expose money until all amount sources have hydrated or cached complete data is available. It exposes one refresh/retry operation for that same source set.
- Unknown route `segment` and `view` values fall back to Groups and Overview. `returnTo` is an internal enum, never an arbitrary URL.
- Active route wrappers continue importing `screens-v2` replacements. Do not switch a wrapper before its replacement has real data, state coverage, accessibility assertions, and focused tests.
- Do not redesign recurring creation/detail/review/posting. Read recurring data and route to existing `/recurring/new` and `/recurring/[id]` flows.
- Do not delete legacy screen generations or any disconnected implementation in this phase.
- Do not add snapshots.
- Execution must not create commits unless the user explicitly requests commits after implementation.
- Interactive targets are at least 44pt on iOS and 48dp on Android; color is never the only financial signal.
- Verify light/dark themes, reduced motion, large text, safe areas, keyboards, offline recovery, and widths `360x800`, `390x844`, and `430x932` on iOS and Android.

---

## File Map

### Create

- `supabase/config.toml`: Local Supabase project configuration generated once by the CLI.
- `supabase/migrations/202607190001_phase2_domain_schema.sql`: Currency scale plus additive columns, tables, constraints, indexes, backfills, and canonical relationship/context data.
- `supabase/migrations/202607190002_phase2_balance_contract.sql`: Authoritative balance projection, stable balance keys, advisory-lock helpers, and visibility helpers.
- `supabase/migrations/202607190003_phase2_mutation_rpcs_rls.sql`: Group, friendship, invite, reminder, expense, settlement, comment, search, archival, and removal RPCs plus grants and RLS.
- `supabase/migrations/202607190004_phase2_receipt_storage.sql`: Private receipt bucket, staging/attached-object policies, signed-read authorization support, and cleanup function/schedule.
- `supabase/functions/cleanup-receipts/index.ts`: Service-role Storage API cleanup for expired staging and detached receipt objects.
- `supabase/tests/phase2_schema.test.sql`: pgTAP schema, constraints, backfill, and legacy-retention assertions.
- `supabase/tests/phase2_balances.test.sql`: pgTAP minor-unit balance, currency separation, and shared-lock assertions.
- `supabase/tests/phase2_relationships.test.sql`: pgTAP group invitation, friendship transition, private invite, search, reminder, removal, blocking, and archival assertions.
- `supabase/tests/phase2_financial_mutations.test.sql`: pgTAP expense/settlement idempotency, split, direction, stale maximum, receipt, and concurrency assertions.
- `supabase/tests/phase2_rls.test.sql`: pgTAP current/historical participant, creator/member/non-member, comment, notification, and receipt visibility assertions.
- `src/features/money/types.ts`: Integer money, context, split, balance, settlement, and mutation payload contracts.
- `src/features/money/splits.ts`: Pure Equal/Amounts/Percent/Shares allocation and validation.
- `src/features/money/splits.test.ts`: Pure allocation precision/remainder tests.
- `src/features/money/balances.ts`: Pure pairwise/context/currency balance aggregation and ordering.
- `src/features/money/balances.test.ts`: Pure balance and selection tests.
- `src/features/money/copy.ts`: Signed display normalization and consequence copy.
- `src/features/money/copy.test.ts`: Copy, settled, and signed-zero tests.
- `src/features/permissions/contracts.ts`: Pure group, relationship, expense, comment, and settlement control decisions.
- `src/features/permissions/contracts.test.ts`: Permission matrix tests.
- `src/features/navigation/phase2Routes.ts`: Typed route parsing, contextual hrefs, resume intent, and cold-back fallback.
- `src/features/navigation/phase2Routes.test.ts`: Route contract tests.
- `src/queries/invalidation.ts`: One post-success invalidation contract.
- `src/queries/invalidation.test.ts`: Exact affected-key tests.
- `src/features/balances/services/api.ts`: Open-balance read service.
- `src/features/balances/services/api.test.ts`: Open-balance service mapping tests.
- `src/features/balances/queries/useBalances.ts`: Open-balance query.
- `src/features/invitations/services/api.ts`: Group and private friend invitation service.
- `src/features/invitations/services/api.test.ts`: Private/group invite RPC payload tests.
- `src/features/invitations/services/pendingInvite.ts`: SecureStore-backed signed-out invite resume token with consume-once semantics.
- `src/features/invitations/services/pendingInvite.test.ts`: Invite resume persistence and token-clearing tests.
- `src/features/notifications/services/api.ts`: Typed notification and reminder service.
- `src/features/notifications/services/api.test.ts`: Notification/reminder RPC payload tests.
- `src/features/recurring/services/readAdapter.ts`: Read-only schedule section adapter.
- `src/features/recurring/services/readAdapter.test.ts`: Local-calendar classification and sorting tests.
- `src/features/circles/hooks/useCirclesSnapshot.ts`: Complete Groups/People snapshot.
- `src/features/circles/hooks/useCirclesSnapshot.test.tsx`: Hydration, stale, refresh, section, and filtering tests.
- `src/features/groups/hooks/useGroupSnapshot.ts`: Identity, permission, balance, expense, schedule, invite, and activity snapshot.
- `src/features/groups/hooks/useGroupSnapshot.test.tsx`: Complete group snapshot tests.
- `src/features/friends/hooks/usePersonSnapshot.ts`: Bilateral, per-group, history, relationship, and action snapshot.
- `src/features/friends/hooks/usePersonSnapshot.test.tsx`: Complete person snapshot tests.
- `src/features/expenses/hooks/useExpenseComposer.ts`: Typed reducer, hydration, validation, submission, and recoverable-state ownership.
- `src/features/expenses/hooks/useExpenseComposer.test.ts`: Reducer and hydration tests.
- `src/features/expenses/hooks/useExpenseSnapshot.ts`: Detail, permissions, receipt, comments, and settlement candidates.
- `src/features/expenses/hooks/useExpenseSnapshot.test.tsx`: Expense snapshot tests.
- `src/features/expenses/components/ExpenseSplitEditor.tsx`: Four-method focused split editor.
- `src/features/expenses/components/ExpenseCreateSuccess.tsx`: Consequence receipt and eight-second undo state.
- `src/features/expenses/screens-v2/EditExpenseScreen.tsx`: Hydrated permission-aware composer reuse.
- `src/features/expenses/screens-v2/ExpenseFlow.test.tsx`: Context, composer, split, receipt, success, detail, edit, delete, and comment interactions.
- `src/features/settlements/hooks/useSettlementFlow.ts`: Selector/compose/review/success state machine.
- `src/features/settlements/hooks/useSettlementFlow.test.ts`: Initialization, maximum, direction, and stale-balance tests.
- `src/features/settlements/screens-v2/SettlementFlow.test.tsx`: End-to-end settlement screen interactions.
- `src/features/dashboard/hooks/useHomeSnapshot.ts`: Complete Home amount/event/schedule snapshot.
- `src/features/dashboard/hooks/useHomeSnapshot.test.tsx`: Home ordering, fallback, hydration, and refresh tests.
- `src/features/circles/screens/CirclesScreen.test.tsx`: Segment, request, state, and detail-only row tests.
- `src/features/groups/services/api.test.ts`: Exact group RPC payload tests.
- `src/features/friends/services/api.test.ts`: Exact relationship/search RPC payload tests.
- `src/features/expenses/services/api.test.ts`: Expense RPC and private receipt storage tests.
- `src/features/expenses/services/comments.test.ts`: Typed comment persistence/failure tests.
- `src/features/settlements/services/api.test.ts`: Settlement payload and stale-balance error tests.
- `src/features/groups/screens-v2/GroupFlow.test.tsx`: Create/detail/settings interaction tests.
- `src/features/friends/screens-v2/InviteRedemptionScreen.tsx`: Signed-in review and terminal invite states.
- `src/features/friends/screens-v2/PeopleFlow.test.tsx`: Add/invite/detail/reminder/removal/block interactions.
- `src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx`: Home empty, attention, ledger, event, and route tests.
- `src/features/notifications/screens-v2/NotificationsScreen.test.tsx`: Request, invite, reminder, and expense action tests.
- `src/app/expense/[id]/edit.tsx`: Canonical edit wrapper.
- `src/app/invite/[token].tsx`: Canonical private invite lifecycle wrapper.

### Modify

- `package.json`: Add only SDK-compatible `expo-document-picker` for PDF receipts.
- `package-lock.json`: Record the exact resolved Expo Document Picker dependency graph.
- `src/services/supabase/database.types.ts`: Regenerate from the reset local schema; no hand-authored `any` escapes.
- `src/services/api/mappers.ts`: Strict minor-unit/context/invite/notification/comment/receipt mapping.
- `src/services/api/mappers.test.ts`: Mapper coverage for every new persisted field and legacy receipt fallback.
- `src/types/index.ts`: Re-export focused domain types and remove stale duplicate financial unions.
- `src/types/navigation.ts`: Exact Phase 2 route parameter contracts.
- `src/queries/keys.ts`: Complete snapshot/entity key factory.
- `src/features/groups/services/api.ts`: Replace multi-call/direct table mutations with typed RPC-backed methods.
- `src/features/groups/queries/useGroups.ts`: Typed mutations and centralized invalidation.
- `src/features/friends/services/api.ts`: Canonical transition/search/block/removal service; remove metadata invitation behavior.
- `src/features/friends/queries/useFriends.ts`: Relationship mutations and centralized invalidation.
- `src/features/notifications/queries/useNotifications.ts`: General notification query and typed actions.
- `src/features/expenses/services/api.ts`: RPC writes, complete strict selects, direct context, and idempotency.
- `src/features/expenses/services/comments.ts`: Generated types, moderation visibility, and text preservation.
- `src/features/expenses/queries/useExpenses.ts`: Typed RPC mutation hooks and centralized invalidation.
- `src/features/expenses/queries/useComments.ts`: Typed comment mutation inputs and invalidation.
- `src/features/settlements/services/api.ts`: Open-balance-qualified settlement RPC.
- `src/features/settlements/queries/useSettlements.ts`: Typed mutation and centralized invalidation.
- `src/features/recurring/services/recurringApi.ts`: Read complete minor values without redesigning mutation flows.
- `src/features/recurring/queries/useRecurringExpenses.ts`: Canonical keys; retain existing mutation ownership.
- `src/features/circles/screens/CirclesScreen.tsx`: Full Groups/People sections and complete states.
- `src/features/groups/screens-v2/NewGroupScreen.tsx`: Final-confirmation-only transactional creation.
- `src/features/groups/screens-v2/GroupDetailScreen.tsx`: URL-backed Overview/Expenses/Schedule snapshot.
- `src/features/groups/screens-v2/GroupSettingsScreen.tsx`: Hydration-safe settings, invitations, leave, and archive.
- `src/features/groups/hooks/useGroupSettings.ts`: One-time hydrated settings draft and dirty-state ownership.
- `src/features/groups/components/UserSearchBottomSheet.tsx`: Selection-only member search with no pre-submit friendship mutation.
- `src/features/friends/screens-v2/NewFriendScreen.tsx`: Exact-email request and private-link flow.
- `src/features/friends/screens-v2/FriendDetailScreen.tsx`: Scoped balances, history, reminder, remove, block, and settlement actions.
- `src/features/expenses/screens-v2/NewExpenseScreen.tsx`: Context selector and typed composer; remove fake Save Draft and inert scanner.
- `src/features/expenses/screens-v2/ExpenseDetailScreen.tsx`: Consequence detail, receipt, comments, permissions, and settle action.
- `src/features/expenses/components/ExpenseComments.tsx`: Typed add/delete/moderation controls and preserved failed text.
- `src/features/settlements/screens-v2/NewSettlementScreen.tsx`: Real non-zero balance selector.
- `src/features/settlements/screens-v2/SettlementScreen.tsx`: Compose/review/success flow with immutable direction.
- `src/features/dashboard/screens-v2/MoneyMapScreen.tsx`: Final Home experience.
- `src/features/notifications/screens-v2/NotificationsScreen.tsx`: Request/invite/reminder/expense actions.
- `src/components/coral/MoneyRow.tsx`: Accessible composed money-row labels where missing.
- `src/app/_layout.tsx`: Register `/expense/[id]/edit` and `/invite/[token]` as focused root routes.
- `src/features/auth/components/AuthLifecycleGuard.tsx`: Preserve signed-out private invite intent through authentication.
- `src/features/auth/lifecycle.ts`: Classify invite redemption as resumable lifecycle work.
- `src/features/auth/lifecycle.test.ts`: Invite lifecycle route and resume tests.
- `src/context/AppContext.tsx`: Add typed invite resume destination without weakening existing account guards.

### Retain

- `src/app/(shell)/_layout.tsx`, `src/components/coral/CircleDock.tsx`, and `src/components/coral/GlobalActionSheet.tsx`: Current shell and Add ownership.
- `src/app/(shell)/(home-tab)/home.tsx` and `src/app/(shell)/(circles-tab)/circles.tsx`: Active wrappers continue targeting current v2 feature screens.
- `src/app/group/new.tsx`, `src/app/group/[id].tsx`, `src/app/group/[id]/settings.tsx`, `src/app/friend/new.tsx`, `src/app/friend/[id].tsx`, `src/app/expense/new.tsx`, `src/app/expense/[id].tsx`, `src/app/settle/new.tsx`, and `src/app/settle/[id].tsx`: Existing public route ownership.
- `src/app/recurring/new.tsx`, `src/app/recurring/[id].tsx`, `src/app/recurring/[id]/edit.tsx`, and all existing recurring screens/hooks: Existing Phase 4 destination behavior.
- `src/features/groups/screens/*`, `src/features/friends/screens/*`, `src/features/expenses/screens/*`, `src/features/settlements/screens/*`, `src/features/dashboard/screens/*`, and `src/features/notifications/screens/*`: Disconnected legacy generations.
- Existing `amount`, `balance`, `total_expenses`, and `receipt_url` columns: Compatibility reads during this phase.
- Existing `friendships.metadata`: Retained but unused after cutover.

### No Delete

- Delete no source, route, migration, test, asset, or legacy screen file in Phase 2.

---

### Task 1: Add the Local Supabase Harness and Additive Domain Schema

**Files:**

- Create: `supabase/config.toml`
- Create: `supabase/migrations/202607190001_phase2_domain_schema.sql`
- Create: `supabase/tests/phase2_schema.test.sql`

**Interfaces:**

- Consumes: existing schema through `202607180002_account_lifecycle.sql`; current `numeric(12,2)` amounts; canonical unordered friendship index.
- Produces: `currency_minor_scale(text): smallint`; additive `amount_minor` columns; `groups.kind`, `groups.archived_at`; `group_members.new_expense_alerts`; canonical friendship ownership/status fields; `group_invitations`, `friend_invites`, `notifications`, and `user_search_attempts`; expense/settlement context and operation fields; split shares/position; settlement method.

- [ ] **Step 1: Initialize local Supabase configuration without adding a package dependency**

Run:

```bash
npx supabase@latest init
```

Expected: `supabase/config.toml` is created and the command reports that Supabase initialization finished. If Docker is unavailable, initialization still succeeds; `start` in Step 4 is the Docker gate.

- [ ] **Step 2: Write the schema test first**

Create `supabase/tests/phase2_schema.test.sql` with pgTAP assertions that include:

```sql
begin;
select plan(19);
select has_column('public', 'expenses', 'amount_minor');
select has_column('public', 'expenses', 'friendship_id');
select has_column('public', 'expenses', 'created_by');
select has_column('public', 'expense_splits', 'shares');
select has_column('public', 'expense_splits', 'position');
select has_column('public', 'settlements', 'method');
select has_table('public', 'group_invitations');
select has_table('public', 'friend_invites');
select has_table('public', 'notifications');
select has_table('public', 'receipt_uploads');
select col_is_pk('public', 'group_invitations', 'id');
select col_not_null('public', 'group_members', 'new_expense_alerts');
select col_default_is('public', 'group_members', 'new_expense_alerts', 'true');
select function_returns('public', 'currency_minor_scale', array['text'], 'smallint');
select is(public.currency_minor_scale('JPY'), 0::smallint);
select is(public.currency_minor_scale('USD'), 2::smallint);
select throws_ok($$select public.currency_minor_scale('ZZZ')$$, '22023');
select ok(to_regclass('public.friendships') is not null, 'legacy friendships retained');
select has_column('public', 'friendships', 'metadata', 'legacy metadata retained but superseded');
select * from finish();
rollback;
```

- [ ] **Step 3: Run the schema test and verify RED**

Run:

```bash
npx supabase@latest start
npx supabase@latest db reset
npx supabase@latest test db supabase/tests/phase2_schema.test.sql
```

Expected: local services start; reset applies existing migrations; pgTAP FAIL reports missing `amount_minor`, tables, and `currency_minor_scale`.

- [ ] **Step 4: Implement the additive schema and deterministic backfill**

The migration must declare these exact public contracts:

```sql
create or replace function public.currency_minor_scale(p_currency text)
returns smallint language plpgsql immutable set search_path = public;

alter table public.expenses
  add column amount_minor bigint,
  add column friendship_id uuid references public.friendships(id),
  add column created_by uuid references public.users(id),
  add column client_operation_id uuid,
  add column receipt_key text;
alter table public.expense_splits
  add column amount_minor bigint,
  add column shares numeric(18,6),
  add column position integer;
alter table public.settlements
  add column amount_minor bigint,
  add column friendship_id uuid references public.friendships(id),
  add column method text,
  add column client_operation_id uuid;
alter table public.recurring_expenses add column amount_minor bigint;
alter table public.activities add column amount_minor bigint;

alter table public.groups
  add column kind text,
  add column archived_at timestamptz,
  add column client_operation_id uuid;
alter table public.group_members
  add column new_expense_alerts boolean not null default true;
alter table public.friendships
  add column requested_by uuid references public.users(id),
  add column blocked_by uuid references public.users(id),
  add column request_expires_at timestamptz,
  add column status_before_block text;
```

Backfill with currency-aware integer conversion, then enforce required new-write invariants:

```sql
update public.expenses
set amount_minor = round(amount * power(10::numeric, public.currency_minor_scale(currency)))::bigint,
    created_by = paid_by
where amount_minor is null or created_by is null;

with ranked as (
  select s.id,
         (row_number() over (partition by s.expense_id order by s.created_at, s.user_id) - 1)::integer as position
  from public.expense_splits s
)
update public.expense_splits s
set amount_minor = round(s.amount * power(10::numeric, public.currency_minor_scale(e.currency)))::bigint,
    position = ranked.position
from ranked, public.expenses e
where ranked.id = s.id and e.id = s.expense_id;

update public.settlements
set amount_minor = round(amount * power(10::numeric, public.currency_minor_scale(currency)))::bigint,
    method = 'other'
where amount_minor is null or method is null;

update public.recurring_expenses
set amount_minor = case when amount is null then null
  else round(amount * power(10::numeric, public.currency_minor_scale(currency_code)))::bigint end;

update public.activities
set amount_minor = case when amount is null or currency is null then null
  else round(amount * power(10::numeric, public.currency_minor_scale(currency)))::bigint end;

update public.friendships
set requested_by = coalesce(requested_by, user_id),
    blocked_by = case when status = 'blocked' then coalesce(blocked_by, user_id) else blocked_by end,
    status_before_block = case when status = 'blocked' then coalesce(status_before_block, 'accepted') else status_before_block end,
    request_expires_at = case when status = 'pending' then coalesce(request_expires_at, created_at + interval '30 days') else request_expires_at end;
```

Backfill `friendship_id` only for group-null expenses whose payer/split participants resolve to exactly two distinct users and one canonical friendship. Backfill group-null settlements from their exact unordered party pair. Create the new tables with these exact columns:

```sql
create table public.group_invitations (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id),
  inviter_id uuid not null references public.users(id), invitee_id uuid not null references public.users(id),
  status text not null default 'pending', expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.friend_invites (
  id uuid primary key default gen_random_uuid(), created_by uuid not null references public.users(id),
  token_hash bytea not null unique, client_operation_id uuid not null unique,
  expires_at timestamptz not null default now() + interval '7 days', revoked_at timestamptz,
  redeemed_by uuid references public.users(id), redeemed_at timestamptz, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.users(id),
  kind text not null, actor_id uuid references public.users(id), group_id uuid references public.groups(id),
  friendship_id uuid references public.friendships(id), expense_id uuid references public.expenses(id),
  payload jsonb not null default '{}'::jsonb, client_operation_id uuid,
  created_at timestamptz not null default now(), read_at timestamptz
);
create table public.user_search_attempts (
  id bigint generated always as identity primary key, user_id uuid not null references public.users(id),
  attempted_at timestamptz not null default now()
);
create table public.receipt_uploads (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.users(id),
  client_operation_id uuid not null, object_key text not null unique,
  status text not null default 'staged', attached_expense_id uuid references public.expenses(id),
  mime_type text not null, size_bytes bigint not null,
  created_at timestamptz not null default now(), cleaned_at timestamptz,
  unique(owner_id, client_operation_id)
);
```

Add checks for XOR context on rows with non-null `client_operation_id`, positive minor values, unique operation IDs, unique split positions, valid statuses/methods, inviter/invitee inequality, relationship ownership fields belonging to the unordered pair, and seven/14/30-day expiration defaults.

Before adding expanded checks, explicitly drop the old generated constraints `friendships_status_check` and `expenses_split_method_check`; normalize any persisted `rejected` friendship value to `declined`; then add the five-status friendship and four-method expense checks. Backfill all nullable required fields before applying `not null`. Do not rewrite or drop a legacy amount, receipt, metadata, expense, split, settlement, or activity row.

Use these exact table status contracts:

```sql
group_invitations.status in ('pending','accepted','declined','cancelled','expired')
friendships.status in ('pending','accepted','declined','removed','blocked')
notifications.kind in ('friend_request','group_invite','balance_reminder','expense_added')
settlements.method in ('cash','bank_transfer','other')
expenses.split_method in ('equal','custom','percentage','shares')
```

- [ ] **Step 5: Reset and verify GREEN**

Run:

```bash
npx supabase@latest db reset
npx supabase@latest test db supabase/tests/phase2_schema.test.sql
```

Expected: all 19 pgTAP assertions PASS; reset reports all migrations applied; legacy numeric and metadata columns still exist.

---

### Task 2: Establish Shared Balance, Visibility, and Advisory-Lock Contracts

**Files:**

- Create: `supabase/migrations/202607190002_phase2_balance_contract.sql`
- Create: `supabase/tests/phase2_balances.test.sql`

**Interfaces:**

- Consumes: Task 1 `*_minor`, canonical context columns, split positions, and friendship IDs.
- Produces: `balance_key`, `acquire_balance_locks`, `get_open_balances`, `context_has_nonzero_balances`, `can_view_expense`, and `can_view_group_history` with exact signatures below. Positive balance means the counterparty owes the authenticated user; negative means the authenticated user owes the counterparty.

- [ ] **Step 1: Write RED balance and lock tests**

Use fixed UUID fixtures for users A/B and group G. Seed a USD 30.00 expense paid by A with A's share
10.00 and B's share 20.00, a EUR 10.00 expense paid by B with each share 5.00, and a USD 5.00
settlement from B to A. Authenticate as A and assert exactly USD +15.00 and EUR -5.00 group rows:

```sql
begin;
select plan(10);
select function_returns('public', 'balance_key', array['text','uuid','uuid','uuid','text'], 'text');
select function_returns('public', 'acquire_balance_locks', array['text[]'], 'void');
select function_returns('public', 'get_open_balances', array[]::text[], 'record');
select is(
  public.balance_key('group', '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'USD'),
  public.balance_key('group', '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'USD')
);
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select is((select signed_amount_minor from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001' and currency = 'USD'), 1500::bigint);
select is((select signed_amount_minor from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001' and currency = 'EUR'), -500::bigint);
select is((select count(*) from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001'), 2::bigint);
select * from finish();
rollback;
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npx supabase@latest db reset
npx supabase@latest test db supabase/tests/phase2_balances.test.sql
```

Expected: FAIL because `balance_key`, `acquire_balance_locks`, and `get_open_balances` do not exist.

- [ ] **Step 3: Implement the authoritative balance projection and lock ordering**

Create these exact signatures:

```sql
public.balance_key(p_context_type text, p_context_id uuid, p_user_a uuid, p_user_b uuid, p_currency text) returns text
public.acquire_balance_locks(p_keys text[]) returns void
public.get_open_balances() returns table (
  counterparty_id uuid,
  context_type text,
  context_id uuid,
  currency text,
  signed_amount_minor bigint,
  last_activity_at timestamptz
)
public.context_has_nonzero_balances(p_context_type text, p_context_id uuid, p_user_id uuid default null) returns boolean
public.can_view_expense(p_expense_id uuid, p_user_id uuid) returns boolean
public.can_view_group_history(p_group_id uuid, p_user_id uuid) returns boolean
```

`balance_key` must order the two user IDs and return `context_type || ':' || context_id || ':' || low_user || ':' || high_user || ':' || upper(currency)`. `acquire_balance_locks` must execute `pg_advisory_xact_lock(hashtextextended(key, 0))` over `select distinct unnest(p_keys) order by 1`. `get_open_balances()` must derive obligations from immutable expense payer/splits and settlements, group by exact context/counterparty/currency, omit zero rows, and never read `group_members.balance` or `groups.total_expenses`.

- [ ] **Step 4: Verify balances and stable locking GREEN**

Run:

```bash
npx supabase@latest db reset
npx supabase@latest test db supabase/tests/phase2_balances.test.sql
```

Expected: all pgTAP assertions PASS, including equal keys for reversed user order and separate rows for USD/EUR and group/direct contexts.

---

### Task 3: Make Transactional RPCs, RLS, and Private Receipts Authoritative

**Files:**

- Create: `supabase/migrations/202607190003_phase2_mutation_rpcs_rls.sql`
- Create: `supabase/migrations/202607190004_phase2_receipt_storage.sql`
- Create: `supabase/functions/cleanup-receipts/index.ts`
- Create: `supabase/tests/phase2_relationships.test.sql`
- Create: `supabase/tests/phase2_financial_mutations.test.sql`
- Create: `supabase/tests/phase2_rls.test.sql`

**Interfaces:**

- Consumes: Task 1 schema and Task 2 balance/lock/visibility helpers.
- Produces: least-privilege, fixed-`search_path` RPCs below; private `expense-receipts` storage; authoritative RLS and table privilege boundaries.

- [ ] **Step 1: Write RED lifecycle and RLS tests**

Tests must call the exact RPC names and cover actor derivation from `auth.uid()`:

```sql
select function_returns('public', 'create_group_v2',
  array['uuid','text','text','text','text','uuid[]'], 'uuid');
select function_returns('public', 'transition_friendship', array['uuid','text'], 'uuid');
select function_returns('public', 'create_friend_invite', array['uuid'], 'record');
select function_returns('public', 'redeem_friend_invite', array['text'], 'uuid');
select function_returns('public', 'create_expense_v2',
  array['uuid','uuid','uuid','text','bigint','text','text','uuid','text','timestamptz','text','text','jsonb'], 'uuid');
select function_returns('public', 'create_settlement_v2',
  array['uuid','uuid','uuid','uuid','bigint','text','text','text'], 'uuid');
```

`phase2_relationships.test.sql` must prove idempotent group creation, creator-only initial membership, delayed invite acceptance, decline/cancel/expiry, reciprocal friend acceptance, remove/block/unblock ownership, invite replay/self/revoked/expired/blocked rejection, exact-email anti-enumeration/rate limit, reminder non-zero/rate-limit/idempotency, member/friend removal blockers, and archive schedule pause/invite cancellation.

`phase2_financial_mutations.test.sql` must prove Equal/Amounts/Percent/Shares integrity, context XOR, participant validity, duplicate operation replay, stale settlement maximum rejection, direction enforcement, creator/group-owner delete rules, recurring `amount` -> expense `custom` mapping, recurring weighted-share posting, and two concurrent settlement attempts cannot exceed one balance. For the local-only concurrency assertion, create `dblink`, commit fixed UUID fixtures, then issue two asynchronous transactions against `host=127.0.0.1 port=54322 dbname=postgres user=postgres password=postgres`. Transaction A calls `create_settlement_v2` for the full balance and sleeps one second before commit; transaction B calls the same RPC with a different operation ID. Assert one result is the settlement UUID, the other reports `BALANCE_CHANGED:0`, exactly one settlement exists, then disconnect and delete the fixed fixtures. The representative session body is:

```sql
select dblink_send_query('a', $sql$
  begin;
  select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
  select public.create_settlement_v2(
    '50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',null,1000,'USD','cash',null
  );
  select pg_sleep(1);
  commit;
$sql$);
select dblink_send_query('b', $sql$
  begin;
  select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
  select public.create_settlement_v2(
    '50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',null,1000,'USD','cash',null
  );
  commit;
$sql$);
```

`phase2_rls.test.sql` must switch `request.jwt.claim.sub` among creator, active member, removed member, split-only participant, comment author, unrelated user, and blocked counterparty; assert historical reads and indistinguishable zero-row access for arbitrary inaccessible IDs.

- [ ] **Step 2: Run all new SQL tests and verify RED**

Run:

```bash
npx supabase@latest db reset
npx supabase@latest test db supabase/tests/phase2_relationships.test.sql
npx supabase@latest test db supabase/tests/phase2_financial_mutations.test.sql
npx supabase@latest test db supabase/tests/phase2_rls.test.sql
```

Expected: each file FAILS on missing RPCs/policies; no existing migration fails during reset.

- [ ] **Step 3: Implement exact lifecycle RPC contracts**

All security-definer functions must include `set search_path = public, pg_temp`, derive actor identity from `auth.uid()`, validate non-null actor, and revoke execution from `public` before granting to `authenticated`.

```sql
create_group_v2(p_client_operation_id uuid, p_name text, p_kind text, p_icon text, p_currency text, p_invitee_ids uuid[]) returns uuid
invite_group_members_v2(p_group_id uuid, p_invitee_ids uuid[]) returns uuid[]
respond_group_invitation(p_invitation_id uuid, p_decision text) returns uuid
cancel_group_invitation(p_invitation_id uuid) returns void
update_group_settings_v2(p_group_id uuid, p_name text, p_kind text, p_icon text, p_currency text, p_new_expense_alerts boolean) returns void
remove_group_member_v2(p_group_id uuid, p_user_id uuid) returns void
leave_group_v2(p_group_id uuid) returns void
archive_group_v2(p_group_id uuid) returns void
transition_friendship(p_counterparty_id uuid, p_action text) returns uuid
create_friend_invite(p_client_operation_id uuid) returns table(invite_id uuid, raw_token text, expires_at timestamptz)
revoke_friend_invite(p_invite_id uuid) returns void
resolve_friend_invite(p_token text) returns table(state text, inviter_id uuid, expires_at timestamptz)
redeem_friend_invite(p_token text) returns uuid
search_user_by_exact_email(p_email text) returns table(state text, user_id uuid, name text, initials text, avatar text)
send_balance_reminder(p_client_operation_id uuid, p_group_id uuid, p_friendship_id uuid, p_currency text, p_message text) returns uuid
register_receipt_upload(p_client_operation_id uuid, p_object_key text, p_mime_type text, p_size_bytes bigint) returns uuid
```

Generate friend invite tokens with `encode(gen_random_bytes(32), 'hex')`; store only `digest(raw_token, 'sha256')`. `transition_friendship` accepts only `request`, `accept`, `decline`, `remove`, `block`, and `unblock`. Group archive and relationship/member removal must lock all affected Task 2 keys before rechecking balances.

- [ ] **Step 4: Implement exact financial RPC contracts**

```sql
create_expense_v2(
  p_client_operation_id uuid, p_group_id uuid, p_friendship_id uuid, p_title text,
  p_amount_minor bigint, p_currency text, p_category text, p_paid_by uuid,
  p_split_method text, p_date timestamptz, p_notes text, p_receipt_key text, p_splits jsonb
) returns uuid

create_expense_internal_v2(
  p_actor_id uuid, p_client_operation_id uuid, p_group_id uuid, p_friendship_id uuid,
  p_title text, p_amount_minor bigint, p_currency text, p_category text, p_paid_by uuid,
  p_split_method text, p_date timestamptz, p_notes text, p_receipt_key text, p_splits jsonb
) returns uuid

update_expense_v2(
  p_expense_id uuid, p_title text, p_amount_minor bigint, p_currency text,
  p_category text, p_paid_by uuid, p_split_method text, p_date timestamptz,
  p_notes text, p_receipt_key text, p_splits jsonb
) returns uuid

delete_expense_v2(p_expense_id uuid) returns void

create_settlement_v2(
  p_client_operation_id uuid, p_counterparty_id uuid, p_group_id uuid,
  p_friendship_id uuid, p_amount_minor bigint, p_currency text,
  p_method text, p_note text
) returns uuid
```

`p_splits` is an array of `{ "userId": "uuid", "amountMinor": 123, "percentageUnits": 250000, "shareUnits": 1000000, "position": 0 }`. RPCs validate exact totals and precision, write minor and legacy numeric values in one transaction, create activity and enabled `expense_added` notifications, attach only `staging/{auth.uid()}/{clientOperationId}/receipt`, and return an existing row for duplicate operation IDs. Expense update/delete and settlement insertion acquire all sorted affected keys before recomputation. A stale settlement raises SQLSTATE `P0001` with message `BALANCE_CHANGED:<currentMinor>`.

`create_expense_v2` derives `auth.uid()` and delegates to `create_expense_internal_v2`; revoke the internal helper from `public`, `anon`, and `authenticated`. Replace `generate_due_recurring_expenses` so server-side recurring posting delegates to the same internal helper with the schedule creator as actor, acquires the same locks, writes both minor/legacy values, maps recurring `amount` to persisted expense `custom`, preserves `shares`, and assigns deterministic split positions. This is compatibility hardening for existing recurring mutation ownership, not a recurring-flow redesign.

`create_expense_v2` accepts a receipt key only when it matches an authenticated actor's `receipt_uploads` row and atomically changes that row to `attached` with the new expense ID. When update replaces a non-null `receipt_key` or delete removes an expense with one, change the matching upload row to `cleanup_pending` in the same transaction.

- [ ] **Step 5: Replace permissive direct writes with RLS and grants**

Revoke authenticated direct balance writes after RPC creation:

```sql
revoke insert, update, delete on public.expenses, public.expense_splits, public.settlements from authenticated;
revoke insert, update, delete on public.friendships, public.group_invitations from authenticated;
```

Keep comment inserts/deletes under RLS. Add historical select policies through `can_view_expense`/immutable settlement parties, creator-only group identity mutations, self-only alert preference, recipient-only notification reads, and sender/recipient reminder visibility. Group identities remain readable to historical expense/settlement participants after archive/removal.

- [ ] **Step 6: Implement private receipt storage and cleanup**

Create bucket `expense-receipts` with `public = false`, `file_size_limit = 10485760`, and MIME types `image/jpeg`, `image/png`, `image/heic`, `application/pdf`. Storage policies allow the authenticated user to manage only `staging/{auth.uid()}/...`; attached reads require an expense with `receipt_key = storage.objects.name` and `can_view_expense`.

Implement `supabase/functions/cleanup-receipts/index.ts` with a service-role client. It selects `staged` rows older than 24 hours and every `cleanup_pending` row, calls `storage.from("expense-receipts").remove(objectKeys)`, then marks only successfully removed rows `cleaned` with `cleaned_at`. Deploy/schedule it only after explicit remote authorization; locally invoke it with `npx supabase@latest functions serve cleanup-receipts --env-file supabase/.env.local` and `curl -i -X POST http://127.0.0.1:54321/functions/v1/cleanup-receipts -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"`. Never delete `storage.objects` rows directly. Existing `receipt_url` values are not copied or deleted.

- [ ] **Step 7: Verify all database contracts GREEN**

Run:

```bash
npx supabase@latest db reset
npx supabase@latest test db
```

Expected: all five Phase 2 pgTAP files PASS; duplicate operations return one entity; blocked/new-action cases do not mutate; concurrent settlement total never exceeds the locked balance; unrelated users cannot read private receipt objects.

---

### Task 4: Regenerate Database Types and Lock Strict Domain Mappers

**Files:**

- Modify: `src/services/supabase/database.types.ts`
- Modify: `src/services/api/mappers.ts`
- Modify: `src/services/api/mappers.test.ts`
- Modify: `src/types/index.ts`
- Create: `src/features/money/types.ts`

**Interfaces:**

- Consumes: reset local database from Tasks 1-3.
- Produces: generated `Database`; `MoneyContext`, `MoneySplitMethod`, `ExpenseMutationInput`, `SettlementMutationInput`, `OpenBalance`, strict `mapExpense`, `mapSettlement`, `mapFriendship`, `mapNotification`, and `mapExpenseComment`.

- [ ] **Step 1: Define mapper expectations and domain signatures**

Add tests asserting exact minor/context values and no `any` casting. Define:

```ts
export type MoneySplitMethod = "equal" | "custom" | "percentage" | "shares";
export type MoneyContext =
  | { type: "group"; groupId: string; friendshipId?: never }
  | { type: "direct"; friendshipId: string; groupId?: never };
export interface OpenBalance {
  counterpartyId: string;
  context: MoneyContext;
  currency: string;
  signedAmountMinor: number;
  lastActivityAt: Date;
}
export interface ExpenseMutationInput {
  clientOperationId: string;
  context: MoneyContext;
  title: string;
  amountMinor: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string;
  splitMethod: MoneySplitMethod;
  date: Date;
  notes?: string;
  receiptKey?: string;
  splits: ExpenseSplitInput[];
}
export interface SettlementMutationInput {
  clientOperationId: string;
  counterpartyId: string;
  context: MoneyContext;
  amountMinor: number;
  currency: string;
  method: "cash" | "bank_transfer" | "other";
  note?: string;
}
```

- [ ] **Step 2: Run mapper tests and verify RED**

Run:

```bash
npm test -- --runInBand src/services/api/mappers.test.ts
```

Expected: FAIL because generated rows/types and mapped `amountMinor`, `friendshipId`, `createdBy`, `shares`, `position`, `method`, and `receiptKey` are absent.

- [ ] **Step 3: Regenerate types from the local schema**

Run:

```bash
npx supabase@latest gen types typescript --local > src/services/supabase/database.types.ts
```

Expected: command exits 0; generated `Database["public"]["Functions"]` includes all Task 3 RPCs and all new tables/columns. Do not manually restore stale interfaces.

- [ ] **Step 4: Implement strict mappers and legacy receipt fallback**

Mapper rules are exact:

```ts
amountMinor: Number(row.amount_minor),
friendshipId: row.friendship_id ?? undefined,
createdBy: row.created_by,
receiptKey: row.receipt_key ?? undefined,
legacyReceiptUrl: row.receipt_key ? undefined : (row.receipt_url ?? undefined),
shares: row.shares === null ? undefined : Number(row.shares),
position: row.position,
method: row.method,
```

Use generated table aliases for comments, invitations, and notifications. Remove `(row as any)` and `(supabase as any)` from touched mappers/services.

- [ ] **Step 5: Verify generated types and mappers GREEN**

Run:

```bash
npx prettier --write src/services/supabase/database.types.ts src/services/api/mappers.ts src/services/api/mappers.test.ts src/types/index.ts src/features/money/types.ts
npm test -- --runInBand src/services/api/mappers.test.ts
npm run typecheck
```

Expected: mapper suite PASS and typecheck exits 0 at this task boundary.

---

### Task 5: Implement Pure Minor-Unit Split Contracts With TDD

**Files:**

- Create: `src/features/money/splits.ts`
- Create: `src/features/money/splits.test.ts`

**Interfaces:**

- Consumes: `MoneySplitMethod` and split payload types from Task 4.
- Produces: `parseMinorInput`, `calculateSplits`, `validateSplitSources`, and `minorToMajor`.

- [ ] **Step 1: Write exhaustive failing allocation tests**

Representative exact assertions:

```ts
expect(calculateSplits(100, "equal", participants("a", "b", "c"))).toEqual([
  split("a", 34, 0),
  split("b", 33, 1),
  split("c", 33, 2),
]);
expect(
  calculateSplits(101, "percentage", [
    source("a", 0, { percentageUnits: 333333 }),
    source("b", 1, { percentageUnits: 333333 }),
    source("c", 2, { percentageUnits: 333334 }),
  ]).map((item) => item.amountMinor)
).toEqual([34, 34, 33]);
expect(
  calculateSplits(5, "shares", [
    source("a", 0, { shareUnits: 1000000 }),
    source("b", 1, { shareUnits: 2000000 }),
  ]).map((item) => item.amountMinor)
).toEqual([2, 3]);
expect(() => parseMinorInput("1.001", "USD")).toThrow("At most 2 decimal places");
expect(() => validateSplitSources(100, "custom", [source("a", 0, { amountMinor: 99 })])).toThrow(
  "Amounts must total 100"
);
```

Also cover excluded participants, duplicate positions, user-ID remainder tie-break, zero/negative shares, percentage total other than `1_000_000`, six-decimal share parsing, zero total, JPY/KRW scale, and `Number.isSafeInteger` rejection.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npm test -- --runInBand src/features/money/splits.test.ts
```

Expected: FAIL with `Cannot find module './splits'`.

- [ ] **Step 3: Implement exact pure signatures**

```ts
export function parseMinorInput(value: string, currency: string): number;
export function minorToMajor(amountMinor: number, currency: string): number;
export function validateSplitSources(
  totalMinor: number,
  method: MoneySplitMethod,
  participants: readonly SplitSource[]
): void;
export function calculateSplits(
  totalMinor: number,
  method: MoneySplitMethod,
  participants: readonly SplitSource[]
): ExpenseSplitInput[];
```

Allocate floors first, then distribute remaining units by persisted `position`, then `userId`. Do not use floating-point major amounts in allocation.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx prettier --write src/features/money/splits.ts src/features/money/splits.test.ts
npm test -- --runInBand src/features/money/splits.test.ts
```

Expected: all allocation/validation tests PASS.

---

### Task 6: Implement Pure Balance, Copy, Permission, and Route Contracts

**Files:**

- Create: `src/features/money/balances.ts`
- Create: `src/features/money/balances.test.ts`
- Create: `src/features/money/copy.ts`
- Create: `src/features/money/copy.test.ts`
- Create: `src/features/permissions/contracts.ts`
- Create: `src/features/permissions/contracts.test.ts`
- Create: `src/features/navigation/phase2Routes.ts`
- Create: `src/features/navigation/phase2Routes.test.ts`
- Modify: `src/types/navigation.ts`

**Interfaces:**

- Consumes: Task 4 money types and Phase 1 shell hrefs.
- Produces: deterministic financial aggregation/ordering, consequence copy, UI permission decisions, route parsing/hrefs, and cold-back fallbacks.

- [ ] **Step 1: Write failing pure contract tests**

Include these representative assertions:

```ts
expect(normalizeSignedMinor(-0)).toBe(0);
expect(describeBalance({ signedAmountMinor: -1250, currency: "USD", name: "Mina" })).toBe(
  "You owe Mina $12.50"
);
expect(classifyPersonBalances([usd(500), eur(-200)])).toBe("mixed");
expect(parseGroupView("unknown")).toBe("overview");
expect(parseCircleSegment("unknown")).toBe("groups");
expect(parseReturnTarget("https://example.com")).toBe("home");
expect(expenseContextFromParams({ groupId: "g", friendId: "u" })).toEqual({ state: "invalid" });
expect(
  getExpensePermissions({ currentUserId: "owner", createdBy: "creator", groupCreatedBy: "owner" })
).toEqual({ canEdit: false, canDelete: true, deleteNeedsOwnerConfirmation: true });
```

Test per-group bilateral isolation, currencies never combining, preferred-currency ordering, attention ordering, settlement selector ambiguity, creator leave prohibition, pairwise member-removal blockers, blocked settlement exception, comment moderation, and every `returnTo` enum.

- [ ] **Step 2: Run all pure tests and verify RED**

Run:

```bash
npm test -- --runInBand src/features/money/balances.test.ts src/features/money/copy.test.ts src/features/permissions/contracts.test.ts src/features/navigation/phase2Routes.test.ts
```

Expected: FAIL with missing modules.

- [ ] **Step 3: Implement exact exported contracts**

```ts
export function aggregateOpenBalances(
  events: readonly BalanceEvent[],
  currentUserId: string
): OpenBalance[];
export function classifyPersonBalances(
  rows: readonly OpenBalance[]
): "mixed" | "owes-you" | "you-owe" | "settled";
export function orderBalances(
  rows: readonly OpenBalance[],
  preferredCurrency: string
): OpenBalance[];
export function selectSettlementTarget(
  rows: readonly OpenBalance[],
  scope: SettlementScope
): SettlementSelection;
export function normalizeSignedMinor(value: number): number;
export function describeBalance(input: BalanceCopyInput): string;
export function describeExpenseConsequence(input: ExpenseConsequenceInput): string;
export function describeSettlementResult(input: SettlementConsequenceInput): string;
export function getExpensePermissions(input: ExpensePermissionInput): ExpensePermissions;
export function getGroupPermissions(input: GroupPermissionInput): GroupPermissions;
export function getRelationshipPermissions(
  input: RelationshipPermissionInput
): RelationshipPermissions;
export type CircleReturnTarget = "home" | "circles-groups" | "circles-people" | "group" | "friend";
export type GroupView = "overview" | "expenses" | "schedule";
export function parseGroupView(value: string | string[] | undefined): GroupView;
export function parseReturnTarget(value: string | string[] | undefined): CircleReturnTarget;
export function expenseContextFromParams(params: ExpenseNewRouteParams): ParsedExpenseContext;
export function expenseHref(
  context?: MoneyContext,
  returnTo?: CircleReturnTarget,
  resume?: "expense"
): Href;
export function settlementHref(input?: SettlementRouteInput): Href;
export function coldBackHref(target: CircleReturnTarget, context?: MoneyContext): Href;
```

`SettleRouteParams` must contain `id`, optional XOR `groupId`/`friendshipId`, `currency`, optional `expenseId`, and `returnTo`. `ExpenseNewRouteParams` contains optional `groupId`, `friendId`, `returnTo`, and `resume`; edit uses its own `id` route and never `expenseId` on `/expense/new`.

- [ ] **Step 4: Verify pure contracts GREEN**

Run:

```bash
npx prettier --write src/features/money/balances.ts src/features/money/balances.test.ts src/features/money/copy.ts src/features/money/copy.test.ts src/features/permissions/contracts.ts src/features/permissions/contracts.test.ts src/features/navigation/phase2Routes.ts src/features/navigation/phase2Routes.test.ts src/types/navigation.ts
npm test -- --runInBand src/features/money/balances.test.ts src/features/money/copy.test.ts src/features/permissions/contracts.test.ts src/features/navigation/phase2Routes.test.ts
```

Expected: all suites PASS with no snapshot files.

---

### Task 7: Centralize Query Keys and Post-Success Invalidation

**Files:**

- Modify: `src/queries/keys.ts`
- Create: `src/queries/invalidation.ts`
- Create: `src/queries/invalidation.test.ts`

**Interfaces:**

- Consumes: Task 4 entity/context IDs.
- Produces: exact keys and `invalidateAfterMutation(queryClient, impact)` used by every mutation hook.

- [ ] **Step 1: Write failing exact-key tests**

```ts
expect(queryKeys.home("u1")).toEqual(["home", "u1"]);
expect(queryKeys.groupSnapshot("g1")).toEqual(["groups", "detail", "g1", "snapshot"]);
expect(queryKeys.personSnapshot("u2")).toEqual(["people", "detail", "u2", "snapshot"]);
expect(queryKeys.openBalances("u1")).toEqual(["balances", "open", "u1"]);
await invalidateAfterMutation(client, {
  currentUserId: "u1",
  groupIds: ["g1"],
  personIds: ["u2"],
  expenseIds: ["e1"],
  settlementIds: [],
  recurringIds: ["r1"],
  notifications: true,
});
expect(invalidated).toEqual(
  expect.arrayContaining([
    queryKeys.home("u1"),
    queryKeys.circles("u1"),
    queryKeys.groupSnapshot("g1"),
    queryKeys.personSnapshot("u2"),
    queryKeys.expenseDetails("e1"),
  ])
);
```

- [ ] **Step 2: Run and verify RED**

Run `npm test -- --runInBand src/queries/invalidation.test.ts`.

Expected: FAIL because new key functions and invalidation helper are absent.

- [ ] **Step 3: Implement exact key and impact contracts**

```ts
export interface MutationImpact {
  currentUserId: string;
  groupIds: string[];
  personIds: string[];
  expenseIds: string[];
  settlementIds: string[];
  recurringIds: string[];
  notifications: boolean;
}
export async function invalidateAfterMutation(
  queryClient: QueryClient,
  impact: MutationImpact
): Promise<void>;
```

Always invalidate Home, Circles, open balances, expenses, settlements, and activities for `currentUserId`; add exact detail/group/person/recurring/notification keys from impact. Deduplicate serialized keys. Never update financial cache optimistically.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx prettier --write src/queries/keys.ts src/queries/invalidation.ts src/queries/invalidation.test.ts
npm test -- --runInBand src/queries/invalidation.test.ts
```

Expected: suite PASS and each expected key is invalidated once.

---

### Task 8: Cut Group, Friend, Invite, Notification, and Balance Services to New Contracts

**Files:**

- Modify: `src/features/groups/services/api.ts`
- Create: `src/features/groups/services/api.test.ts`
- Modify: `src/features/groups/queries/useGroups.ts`
- Modify: `src/features/friends/services/api.ts`
- Create: `src/features/friends/services/api.test.ts`
- Modify: `src/features/friends/queries/useFriends.ts`
- Create: `src/features/invitations/services/api.ts`
- Create: `src/features/invitations/services/api.test.ts`
- Create: `src/features/notifications/services/api.ts`
- Create: `src/features/notifications/services/api.test.ts`
- Modify: `src/features/notifications/queries/useNotifications.ts`
- Create: `src/features/balances/services/api.ts`
- Create: `src/features/balances/services/api.test.ts`
- Create: `src/features/balances/queries/useBalances.ts`

**Interfaces:**

- Consumes: generated RPC types, strict mappers, Task 7 keys/invalidation.
- Produces: typed service methods for every group/relationship/invite/reminder/search/notification/balance action.

- [ ] **Step 1: Add failing service tests beside existing service modules**

Mock `supabase.rpc` and assert exact calls, including:

```ts
expect(rpc).toHaveBeenCalledWith("create_group_v2", {
  p_client_operation_id: operationId,
  p_name: "Lake house",
  p_kind: "Trip",
  p_icon: "Home",
  p_currency: "USD",
  p_invitee_ids: ["u2"],
});
expect(rpc).toHaveBeenCalledWith("transition_friendship", {
  p_counterparty_id: "u2",
  p_action: "block",
});
```

Expected methods:

```ts
groupsApi.createGroup(input: CreateGroupInput): Promise<Group>
groupsApi.inviteMembers(groupId: string, inviteeIds: string[]): Promise<string[]>
groupsApi.respondToInvitation(id: string, decision: "accept" | "decline"): Promise<string>
groupsApi.cancelInvitation(id: string): Promise<void>
groupsApi.updateSettings(input: UpdateGroupSettingsInput): Promise<void>
groupsApi.removeMember(groupId: string, userId: string): Promise<void>
groupsApi.leaveGroup(groupId: string): Promise<void>
groupsApi.archiveGroup(groupId: string): Promise<void>
FriendsService.searchExactEmail(email: string): Promise<UserSearchResult>
FriendsService.transition(counterpartyId: string, action: FriendshipAction): Promise<string>
invitationsApi.createFriendInvite(operationId: string): Promise<PrivateInviteLink>
invitationsApi.revokeFriendInvite(inviteId: string): Promise<void>
invitationsApi.resolveFriendInvite(token: string): Promise<InviteResolution>
invitationsApi.redeemFriendInvite(token: string): Promise<string>
notificationsApi.sendReminder(input: ReminderInput): Promise<string>
balancesApi.fetchOpenBalances(): Promise<OpenBalance[]>
```

- [ ] **Step 2: Run focused service tests and verify RED**

Run:

```bash
npm test -- --runInBand src/features/groups src/features/friends src/features/notifications src/features/balances src/features/invitations
```

Expected: focused suites FAIL on absent methods/modules and old direct table writes.

- [ ] **Step 3: Implement RPC-backed services and remove metadata invitation behavior**

`FriendsService.addFriend(userId, friendId, groupId)` must be removed from active callers. No service reads/writes `metadata.pending_groups`. All mutation hooks receive typed inputs, preserve mutation errors, call `invalidateAfterMutation` only on success, and expose pending/error/success state.

- [ ] **Step 4: Verify service GREEN and no active metadata use**

Run:

```bash
npm test -- --runInBand src/features/groups src/features/friends src/features/notifications src/features/balances src/features/invitations
npx eslint src/features/groups/services/api.ts src/features/groups/queries/useGroups.ts src/features/friends/services/api.ts src/features/friends/queries/useFriends.ts src/features/invitations/services/api.ts src/features/notifications/services/api.ts src/features/notifications/queries/useNotifications.ts src/features/balances/services/api.ts src/features/balances/queries/useBalances.ts
```

Expected: focused tests PASS, ESLint exits 0, and a repository search for `pending_groups` reports only historical SQL migration and retained documentation references.

---

### Task 9: Cut Expense, Receipt, Comment, and Settlement Services to RPCs

**Files:**

- Modify: `src/features/expenses/services/api.ts`
- Create: `src/features/expenses/services/api.test.ts`
- Modify: `src/features/expenses/services/comments.ts`
- Create: `src/features/expenses/services/comments.test.ts`
- Modify: `src/features/expenses/queries/useExpenses.ts`
- Modify: `src/features/expenses/queries/useComments.ts`
- Modify: `src/features/settlements/services/api.ts`
- Create: `src/features/settlements/services/api.test.ts`
- Modify: `src/features/settlements/queries/useSettlements.ts`

**Interfaces:**

- Consumes: Task 3 RPCs/storage, Task 4 payloads/mappers, Task 7 invalidation.
- Produces: transactional expense/settlement methods, staging upload/removal/signed-read methods, and typed comment methods.

- [ ] **Step 1: Write failing service tests for exact RPC/storage payloads**

```ts
expensesApi.createExpense(input: ExpenseMutationInput): Promise<Expense>
expensesApi.updateExpense(expenseId: string, input: Omit<ExpenseMutationInput, "clientOperationId" | "context">): Promise<Expense>
expensesApi.deleteExpense(expenseId: string): Promise<void>
expensesApi.uploadStagedReceipt(input: { operationId: string; uri: string; mimeType: ReceiptMimeType }): Promise<string>
expensesApi.removeStagedReceipt(key: string): Promise<void>
expensesApi.createReceiptSignedUrl(expenseId: string, key: string): Promise<string>
expensesApi.registerReceiptUpload(input: { operationId: string; objectKey: string; mimeType: ReceiptMimeType; sizeBytes: number }): Promise<string>
settlementsApi.createSettlement(input: SettlementMutationInput): Promise<Settlement>
CommentsService.addComment(expenseId: string, text: string): Promise<ExpenseComment>
CommentsService.deleteComment(commentId: string): Promise<void>
```

Mock `supabase.auth.getUser()` and assert the upload path is exactly `staging/${authenticatedUserId}/${operationId}/receipt`; the service never accepts an actor/user ID from its caller. Also assert MIME/10 MB client validation, `createSignedUrl(key, 300)`, `custom` persistence for UI Amounts, and `BALANCE_CHANGED:<minor>` mapping to `{ code: "balance-changed", currentMinor }`.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npm test -- --runInBand src/features/expenses src/features/settlements
```

Expected: FAIL because current services use direct multi-call table writes, public receipt URLs, and untyped comments.

- [ ] **Step 3: Implement typed services and post-success invalidation**

Map all split source fields into RPC JSON. Fetch the complete entity after an RPC returns its ID. Do not log raw invite tokens or receipt signed URLs. Register the deterministic staging key before upload. A failed upload leaves composer state untouched and removes its registered staging object/row when possible; otherwise the Edge Function expires it after 24 hours. Update/delete only mark detached keys `cleanup_pending`; the Edge Function performs physical Storage deletion.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx prettier --write src/features/expenses/services/api.ts src/features/expenses/services/comments.ts src/features/expenses/queries/useExpenses.ts src/features/expenses/queries/useComments.ts src/features/settlements/services/api.ts src/features/settlements/queries/useSettlements.ts
npm test -- --runInBand src/features/expenses src/features/settlements
npx eslint src/features/expenses/services/api.ts src/features/expenses/services/comments.ts src/features/expenses/queries/useExpenses.ts src/features/expenses/queries/useComments.ts src/features/settlements/services/api.ts src/features/settlements/queries/useSettlements.ts
```

Expected: focused suites PASS and ESLint exits 0.

---

### Task 10: Add the Read-Only Recurring Schedule Adapter

**Files:**

- Create: `src/features/recurring/services/readAdapter.ts`
- Create: `src/features/recurring/services/readAdapter.test.ts`
- Modify: `src/features/recurring/services/recurringApi.ts`
- Modify: `src/features/recurring/queries/useRecurringExpenses.ts`

**Interfaces:**

- Consumes: existing recurring schedules/occurrences and routes; Task 7 keys.
- Produces: `buildScheduleSections` and `nextHomeScheduleItem`; no new recurring mutation.

- [ ] **Step 1: Write failing local-calendar classification tests**

```ts
export interface ScheduleReadItem {
  id: string;
  recurringId: string;
  groupId: string;
  state: "needs-review" | "active" | "paused";
  scheduledDate: string;
  href: Href;
}
export function buildScheduleSections(
  input: RecurringReadInput,
  timeZone: string
): ScheduleSections;
export function nextHomeScheduleItem(
  input: RecurringReadInput,
  timeZone: string
): ScheduleReadItem | null;
```

Assert pending occurrences precede active `nextRunDate`; paused rows remain in Paused; date then recurring ID breaks ties; every row href is `/recurring/[id]`.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/recurring/services/readAdapter.test.ts`.

Expected: FAIL with missing adapter.

- [ ] **Step 3: Implement the adapter and complete reads**

Fetch occurrences needed for pending review without changing existing creation/detail/review methods. Map `amount_minor` when present and legacy amount only as a compatibility fallback. Schedule Expense href remains `{ pathname: "/recurring/new", params: { groupId } }`.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx prettier --write src/features/recurring/services/readAdapter.ts src/features/recurring/services/readAdapter.test.ts src/features/recurring/services/recurringApi.ts src/features/recurring/queries/useRecurringExpenses.ts
npm test -- --runInBand src/features/recurring/services/readAdapter.test.ts
```

Expected: adapter suite PASS; existing recurring routes and mutations remain intact.

---

### Task 11: Compose Complete Feature Snapshots

**Files:**

- Create: `src/features/circles/hooks/useCirclesSnapshot.ts`
- Create: `src/features/circles/hooks/useCirclesSnapshot.test.tsx`
- Create: `src/features/groups/hooks/useGroupSnapshot.ts`
- Create: `src/features/groups/hooks/useGroupSnapshot.test.tsx`
- Create: `src/features/friends/hooks/usePersonSnapshot.ts`
- Create: `src/features/friends/hooks/usePersonSnapshot.test.tsx`
- Create: `src/features/expenses/hooks/useExpenseSnapshot.ts`
- Create: `src/features/expenses/hooks/useExpenseSnapshot.test.tsx`
- Create: `src/features/dashboard/hooks/useHomeSnapshot.ts`
- Create: `src/features/dashboard/hooks/useHomeSnapshot.test.tsx`

**Interfaces:**

- Consumes: Tasks 7-10 queries/services and Tasks 5-6 pure contracts.
- Produces: complete named snapshots with common hydration state.

- [ ] **Step 1: Write failing snapshot tests**

Every hook must expose:

```ts
export interface SnapshotState<T> {
  data: T | undefined;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isStaleOffline: boolean;
  isError: boolean;
  error: Error | null;
  isNotFound: boolean;
  isRestricted: boolean;
  refresh(): Promise<void>;
}
```

Tests defer one amount query while identity resolves and assert `data` remains undefined; provide cached complete data plus network error and assert data remains visible with `isStaleOffline`; assert `refresh()` invokes every source exactly once; assert not-found only after identity/permission hydration.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- --runInBand src/features/circles/hooks src/features/groups/hooks/useGroupSnapshot.test.tsx src/features/friends/hooks/usePersonSnapshot.test.tsx src/features/expenses/hooks/useExpenseSnapshot.test.tsx src/features/dashboard/hooks/useHomeSnapshot.test.tsx
```

Expected: FAIL with missing snapshot hooks.

- [ ] **Step 3: Implement exact snapshot payloads**

```ts
useCirclesSnapshot(userId: string, search: string): SnapshotState<CirclesData>
useGroupSnapshot(groupId: string, view: GroupView): SnapshotState<GroupSnapshotData>
usePersonSnapshot(counterpartyId: string): SnapshotState<PersonSnapshotData>
useExpenseSnapshot(expenseId: string): SnapshotState<ExpenseSnapshotData>
useHomeSnapshot(userId: string): SnapshotState<HomeSnapshotData>
```

`CirclesData` includes pending requests and ordered group/person sections. `GroupSnapshotData` includes identity, permissions, balances by currency, pairwise rows, members, expenses, schedule sections, invitations, and activity. `PersonSnapshotData` includes bilateral currencies, group-specific rows, direct/group contexts, shared activity, and action permissions. `HomeSnapshotData` includes hero currencies, four attention rows, compact ledger, next schedule or four recent movements, notifications, and first-use state.

- [ ] **Step 4: Verify snapshot GREEN**

Run:

```bash
npm test -- --runInBand src/features/circles/hooks src/features/groups/hooks/useGroupSnapshot.test.tsx src/features/friends/hooks/usePersonSnapshot.test.tsx src/features/expenses/hooks/useExpenseSnapshot.test.tsx src/features/dashboard/hooks/useHomeSnapshot.test.tsx
```

Expected: all snapshot suites PASS; no hook exposes partially hydrated financial data.

---

### Task 12: Cut Over Circles Groups and People

**Files:**

- Modify: `src/features/circles/screens/CirclesScreen.tsx`
- Create: `src/features/circles/screens/CirclesScreen.test.tsx`
- Modify: `src/components/coral/MoneyRow.tsx`

**Interfaces:**

- Consumes: `useCirclesSnapshot`, route contracts, relationship mutations.
- Produces: active `/circles?segment=groups|people` with complete states and detail-only rows.

- [ ] **Step 1: Write failing interactions**

Test URL-backed segment replacement, segment-local search, Needs Attention/All Groups order, Mixed/Owes You/You Owe/Settled order, separate currency amounts, inline Accept/Decline, initial/cached-offline/error/first-use/filtered-empty states, and row navigation. Exact row assertions:

```tsx
fireEvent.press(screen.getByRole("button", { name: /Lake house.*You owe.*USD 12.50/i }));
expect(router.push).toHaveBeenCalledWith({ pathname: "/group/[id]", params: { id: "g1" } });
fireEvent.press(screen.getByRole("button", { name: /Mina.*owes you.*EUR 4.00/i }));
expect(router.push).toHaveBeenCalledWith({ pathname: "/friend/[id]", params: { id: "u2" } });
```

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/circles/screens/CirclesScreen.test.tsx`.

Expected: FAIL because current screen lacks complete sections/request/state behavior.

- [ ] **Step 3: Implement the screen cutover**

Use `router.setParams({ segment })`, preserve independent search strings, render signed text with each currency, expose selected/disabled accessibility state, and keep Create Group/Add Person first-use actions. No row press settles, reminds, shares, or creates an expense.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx prettier --write src/features/circles/screens/CirclesScreen.tsx src/features/circles/screens/CirclesScreen.test.tsx src/components/coral/MoneyRow.tsx
npm test -- --runInBand src/features/circles/screens/CirclesScreen.test.tsx
npx eslint src/features/circles/screens/CirclesScreen.tsx src/features/circles/screens/CirclesScreen.test.tsx src/components/coral/MoneyRow.tsx
```

Expected: interaction suite PASS and ESLint exits 0.

---

### Task 13: Make Group Creation Atomic and Confirmation-Only

**Files:**

- Modify: `src/features/groups/screens-v2/NewGroupScreen.tsx`
- Modify: `src/features/groups/components/UserSearchBottomSheet.tsx`
- Create: `src/features/groups/screens-v2/GroupFlow.test.tsx`

**Interfaces:**

- Consumes: `groupsApi.createGroup(CreateGroupInput)`, typed `resume=expense`, exact selected users.
- Produces: name/kind/icon/currency/member form with no pre-submit side effects and idempotent final creation.

- [ ] **Step 1: Write RED group-create tests**

Select two users, remove one, change search, and assert no request/invitation/membership RPC. Press Create twice and assert one `create_group_v2` call with one stable operation UUID and selected invitee IDs. Reject once and assert every field/selection remains. Resolve and assert `router.replace({ pathname: "/group/[id]", params: { id } })`; for `resume=expense`, assert replacement to `/expense/new` with the new `groupId`.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/groups/screens-v2/GroupFlow.test.tsx -t "creates"`.

Expected: FAIL because current implementation creates members/friend requests in separate calls and lacks kind/resume.

- [ ] **Step 3: Implement the atomic form**

Use one operation ID created when the screen mounts and regenerated only after definitive success. Disable submit while pending. Remove `FriendsService.addFriend` and every mutation call from `UserSearchBottomSheet`; selection callbacks only update the parent draft. Exact payload:

```ts
interface CreateGroupInput {
  clientOperationId: string;
  name: string;
  kind?: string;
  icon: string;
  currency: string;
  inviteeIds: string[];
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/groups/screens-v2/GroupFlow.test.tsx -t "creates"
npx eslint src/features/groups/screens-v2/NewGroupScreen.tsx src/features/groups/components/UserSearchBottomSheet.tsx src/features/groups/screens-v2/GroupFlow.test.tsx
```

Expected: create tests PASS and lint exits 0.

---

### Task 14: Cut Over Group Overview, Expenses, and Schedule

**Files:**

- Modify: `src/features/groups/screens-v2/GroupDetailScreen.tsx`
- Modify: `src/features/groups/screens-v2/GroupFlow.test.tsx`

**Interfaces:**

- Consumes: `useGroupSnapshot(id, view)`, `parseGroupView`, contextual expense/settlement/recurring hrefs.
- Produces: one hydrated group route with replace-in-place Overview/Expenses/Schedule subviews.

- [ ] **Step 1: Write RED detail tests**

Assert unknown view renders Overview; selecting Expenses calls `router.setParams({ view: "expenses" })`; group multi-currency hero does not combine; pairwise person row opens `/friend/[id]`; expense search/date grouping shows actual share/lent/borrowed copy; Schedule sections use real recurring rows; contextual Add Expense/Settle/Schedule include group ID; loading/retry/offline/restricted/not-found states appear only at correct hydration phases.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/groups/screens-v2/GroupFlow.test.tsx -t "detail"`.

Expected: FAIL because current detail does not expose all three real snapshot-backed subviews.

- [ ] **Step 3: Implement all subviews without duplicate route pushes**

Use `router.setParams` for `view`; do not push `/group/[id]` again. Overview action hrefs must include group context. Expenses search is local to Expenses. Schedule rows navigate only to existing recurring destinations.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/groups/screens-v2/GroupFlow.test.tsx -t "detail"
npx eslint src/features/groups/screens-v2/GroupDetailScreen.tsx src/features/groups/screens-v2/GroupFlow.test.tsx
```

Expected: detail tests PASS; no duplicate group route is pushed.

---

### Task 15: Make Group Settings Hydration-Safe and Permission-Aware

**Files:**

- Modify: `src/features/groups/screens-v2/GroupSettingsScreen.tsx`
- Modify: `src/features/groups/hooks/useGroupSettings.ts`
- Modify: `src/features/groups/screens-v2/GroupFlow.test.tsx`

**Interfaces:**

- Consumes: group snapshot, update/invite/cancel/remove/leave/archive mutations, group permission contract.
- Produces: dirty-safe identity/preference/member settings and explicit balance blockers.

- [ ] **Step 1: Write RED settings tests**

Assert fields initialize only after group+membership hydrate; editing name then background refetch does not overwrite it; default-currency copy says future items only; member addition creates invitations; creator controls identity/remove/archive; member controls own alert/leave; creator cannot leave; non-zero pairwise currency blocks leave/remove/archive before confirmation; successful save stays on same group; successful leave/archive replaces with Groups.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/groups/screens-v2/GroupFlow.test.tsx -t "settings"`.

Expected: FAIL on dirty hydration, invitation lifecycle, preference, and blocker behavior.

- [ ] **Step 3: Implement one-time hydration and mutations**

Use an `initializedForGroupId` ref and never reset dirty fields during background refetch. Save identity and current-user alert preference in one `update_group_settings_v2` call. Show each blocking currency/pair before confirmation. Archive copy states schedules pause, history remains, and invitations cancel.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/groups/screens-v2/GroupFlow.test.tsx -t "settings"
npx eslint src/features/groups/screens-v2/GroupSettingsScreen.tsx src/features/groups/hooks/useGroupSettings.ts src/features/groups/screens-v2/GroupFlow.test.tsx
```

Expected: settings tests PASS and dirty edits survive a mocked refetch.

---

### Task 16: Implement Person Search, Requests, and Private Invite Redemption

**Files:**

- Modify: `src/features/friends/screens-v2/NewFriendScreen.tsx`
- Create: `src/features/friends/screens-v2/InviteRedemptionScreen.tsx`
- Create: `src/features/friends/screens-v2/PeopleFlow.test.tsx`
- Create: `src/features/invitations/services/pendingInvite.ts`
- Create: `src/features/invitations/services/pendingInvite.test.ts`
- Create: `src/app/invite/[token].tsx`
- Modify: `src/app/_layout.tsx`
- Modify: `src/features/auth/components/AuthLifecycleGuard.tsx`
- Modify: `src/features/auth/lifecycle.ts`
- Modify: `src/features/auth/lifecycle.test.ts`
- Modify: `src/context/AppContext.tsx`

**Interfaces:**

- Consumes: exact-email search, friendship transition, private invite resolve/redeem, auth lifecycle, route resume contract.
- Produces: anti-enumerating Add Person and canonical `/invite/[token]` lifecycle.

- [ ] **Step 1: Write RED add/invite tests**

Assert normalized exact email, generic unavailable response, distinct self/pending/accepted/known-blocked controls, explicit Send Request, 10-attempt limit copy, generated private link with no token logging, signed-out redirect through auth with retained token, signed-in inviter review, and terminal `expired`, `revoked`, `redeemed`, `self`, `blocked`, `unknown` states.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/friends/screens-v2/PeopleFlow.test.tsx -t "add|invite"`.

Expected: FAIL because `/invite/[token]` and private invite lifecycle are absent.

- [ ] **Step 3: Implement screens and focused routes**

Wrapper content:

```tsx
import InviteRedemptionScreen from "@/features/friends/screens-v2/InviteRedemptionScreen";
export default InviteRedemptionScreen;
```

Register `<Stack.Screen name="invite/[token]" />`. Never show blocked as an explanation for an unknown searched email. Use Expo Linking/share APIs already available; add no package.

`pendingInvite.ts` must expose `savePendingInviteToken(token: string): Promise<void>`, `consumePendingInviteToken(): Promise<string | null>`, and `clearPendingInviteToken(): Promise<void>` using Expo SecureStore key `splt.pendingFriendInvite`. A signed-out invite route saves the raw token before redirecting to Welcome. The authenticated lifecycle consumes it once after account setup reaches `complete` and replaces to `/invite/[token]`; terminal redemption clears it. Never include the token in logs, analytics, AsyncStorage, or arbitrary redirect URLs.

- [ ] **Step 4: Verify GREEN and typed routes**

Run:

```bash
CI=1 npx expo export --platform ios --output-dir /var/folders/n5/0ywwltp54y12_s3629d4tpxr0000gn/T/opencode/splt-invite-route-check
npm test -- --runInBand src/features/friends/screens-v2/PeopleFlow.test.tsx src/features/invitations/services/pendingInvite.test.ts src/features/auth/lifecycle.test.ts -t "add|invite|pending invite"
npm run typecheck
```

Expected: Expo export exits 0 and refreshes typed route declarations without changing dependencies; tests PASS; typecheck recognizes `/invite/[token]`.

---

### Task 17: Cut Over Person Detail, Reminders, Removal, and Blocking

**Files:**

- Modify: `src/features/friends/screens-v2/FriendDetailScreen.tsx`
- Modify: `src/features/friends/screens-v2/PeopleFlow.test.tsx`

**Interfaces:**

- Consumes: `usePersonSnapshot`, reminder and relationship transition mutations, contextual route helpers.
- Produces: bilateral multi-currency detail with group-specific balances and consequence-aware actions.

- [ ] **Step 1: Write RED person-detail tests**

Assert one hero amount for one currency, compact breakdown for multiple, group rows use only that group's bilateral balance, shared activity routes correctly, Add Expense and Settle carry context, ambiguous remind opens context/currency selector, single eligible reminder preselects, optional message enforces 280 chars, remove is blocked by any direct non-zero currency, block explains retained group/history, only blocker sees Unblock, and blocked pre-existing debt can still settle.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/friends/screens-v2/PeopleFlow.test.tsx -t "detail|remind|remove|block"`.

Expected: FAIL on scoped balances and real action lifecycle.

- [ ] **Step 3: Implement detail and confirmation flows**

All group rows navigate to group detail. Reminder preview must state sender, recipient, context, currency, signed amount, and optional message before RPC. Remove/block confirmations preserve shared-group membership and history copy. Do not hide balances when blocked.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/friends/screens-v2/PeopleFlow.test.tsx -t "detail|remind|remove|block"
npx eslint src/features/friends/screens-v2/FriendDetailScreen.tsx src/features/friends/screens-v2/PeopleFlow.test.tsx
```

Expected: tests PASS and every action uses a typed context.

---

### Task 18: Build the Typed Expense Composer and Four-Method Split Editor

**Files:**

- Create: `src/features/expenses/hooks/useExpenseComposer.ts`
- Create: `src/features/expenses/hooks/useExpenseComposer.test.ts`
- Create: `src/features/expenses/components/ExpenseSplitEditor.tsx`
- Modify: `src/features/expenses/screens-v2/NewExpenseScreen.tsx`
- Create: `src/features/expenses/screens-v2/ExpenseFlow.test.tsx`

**Interfaces:**

- Consumes: Tasks 5-6 split/context contracts and complete group/friend reads.
- Produces: one reducer owning context, amount, description, payer, inclusion, split source, date, category, notes, receipt, and submission state.

- [ ] **Step 1: Write RED reducer and screen tests**

Define exact state/actions:

```ts
export interface ExpenseComposerState {
  context?: MoneyContext;
  amountInput: string;
  currency: string;
  description: string;
  paidBy: string;
  participants: ComposerParticipant[];
  splitMethod: MoneySplitMethod;
  splitSources: Record<string, SplitSourceValue>;
  date: Date;
  category: ExpenseCategory;
  notes: string;
  receipt?: ReceiptDraft;
  status: "editing" | "submitting" | "success";
  error?: ComposerError;
}
export function expenseComposerReducer(
  state: ExpenseComposerState,
  action: ExpenseComposerAction
): ExpenseComposerState;
```

Assert global selector, contextual preselection, `resume=expense`, group/default and direct/home currencies, blocked direct exclusion, confirmation before currency reset, payer/member validation, Equal/Amounts/Percent/Shares source and calculated values, exclusion clearing source values, assigned total, consequence copy, recoverable error state, and absence of Save Draft.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- --runInBand src/features/expenses/hooks/useExpenseComposer.test.ts src/features/expenses/screens-v2/ExpenseFlow.test.tsx -t "composer|split"
```

Expected: FAIL because current screen conflates Shares with percentage, stores floating values, and exposes fake Save Draft.

- [ ] **Step 3: Implement reducer and focused editors**

Initialize once after context participants hydrate. Every task sheet dispatches to the same reducer. Currency changes retain entered total text, clear/recalculate source values only after confirmation, and never convert. The Apply button remains disabled until `calculateSplits` succeeds.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/expenses/hooks/useExpenseComposer.test.ts src/features/expenses/screens-v2/ExpenseFlow.test.tsx -t "composer|split"
npx eslint src/features/expenses/hooks/useExpenseComposer.ts src/features/expenses/hooks/useExpenseComposer.test.ts src/features/expenses/components/ExpenseSplitEditor.tsx src/features/expenses/screens-v2/NewExpenseScreen.tsx src/features/expenses/screens-v2/ExpenseFlow.test.tsx
```

Expected: reducer and composer/split tests PASS; no `toFixed` value participates in allocation.

---

### Task 19: Implement Receipt Upload, Expense Creation, Success, and Undo

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/features/expenses/screens-v2/NewExpenseScreen.tsx`
- Create: `src/features/expenses/components/ExpenseCreateSuccess.tsx`
- Modify: `src/features/expenses/screens-v2/ExpenseFlow.test.tsx`

**Interfaces:**

- Consumes: composer payload, receipt service, `createExpense`, `deleteExpense`, return route helper.
- Produces: real receipt selection/upload, idempotent create, consequence success receipt, and active eight-second undo.

- [ ] **Step 1: Write RED creation tests**

Mock JPEG/PNG/HEIC/PDF choices and reject unsupported MIME or >10 MB before upload. Assert staging upload precedes create; upload/create failures retain all reducer state; duplicate presses make one mutation; success shows Total, Paid by, Your share, You lent/borrowed, View Expense, Return to Circle, and Undo; fake timers hide Undo at 8000 ms; successful Undo deletes and returns; failed Undo keeps expense and retry feedback.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/expenses/screens-v2/ExpenseFlow.test.tsx -t "receipt|create|success|undo"`.

Expected: FAIL because receipt is inert and no success/undo state exists.

- [ ] **Step 3: Install the one justified PDF picker dependency**

Run:

```bash
npx expo install expo-document-picker
```

Expected: Expo installs an SDK 57-compatible `expo-document-picker`, modifies only `package.json` and `package-lock.json`, and reports no incompatible Expo package version.

- [ ] **Step 4: Implement real selection and success state**

Use existing `expo-image-picker` for JPEG/PNG/HEIC and `expo-document-picker` with `type: "application/pdf"`, `copyToCacheDirectory: true` for PDF. Validate MIME/size in the shared receipt service. Keep one operation ID across timeout retry. Undo is offered only while current permissions still permit delete and this success component remains mounted.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/expenses/screens-v2/ExpenseFlow.test.tsx -t "receipt|create|success|undo"
npx eslint src/features/expenses/screens-v2/NewExpenseScreen.tsx src/features/expenses/components/ExpenseCreateSuccess.tsx src/features/expenses/screens-v2/ExpenseFlow.test.tsx
```

Expected: tests PASS, uploaded keys are private staging keys, and no new `receipt_url` write occurs.

---

### Task 20: Cut Over Expense Detail, Edit, Delete, Receipt, and Comments

**Files:**

- Modify: `src/features/expenses/screens-v2/ExpenseDetailScreen.tsx`
- Modify: `src/features/expenses/components/ExpenseComments.tsx`
- Create: `src/features/expenses/screens-v2/EditExpenseScreen.tsx`
- Modify: `src/features/expenses/screens-v2/ExpenseFlow.test.tsx`
- Create: `src/app/expense/[id]/edit.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**

- Consumes: `useExpenseSnapshot`, composer hydration, permissions, signed receipt URL, comments, settlement candidates.
- Produces: canonical consequence detail and `/expense/[id]/edit`.

- [ ] **Step 1: Write RED detail/edit tests**

Assert total/payer/category/date/circle/method/receipt/comments; Your share separate from lent/borrowed; every split row actual share/direction; no average custom label; participant comments; author delete; group creator moderation; failed comment preserves text; permissions finish before controls; creator edit; group-owner delete-only with explicit warning; consequence-change review before update; delete return destination; settle opens scoped selector for multiparty context rather than guessing.

- [ ] **Step 2: Run RED**

Run `npm test -- --runInBand src/features/expenses/screens-v2/ExpenseFlow.test.tsx -t "detail|edit|delete|comment"`.

Expected: FAIL because edit route is missing and detail lacks complete consequence/permission behavior.

- [ ] **Step 3: Implement detail/edit and route registration**

Wrapper:

```tsx
import EditExpenseScreen from "@/features/expenses/screens-v2/EditExpenseScreen";
export default EditExpenseScreen;
```

Register `<Stack.Screen name="expense/[id]/edit" />`. Edit hydrates the same reducer only after permission+entity completion, preserves persisted split positions, and displays a before/after consequence review when participants, payer, total, currency, or split change.

- [ ] **Step 4: Verify GREEN and typed route generation**

Run:

```bash
CI=1 npx expo export --platform ios --output-dir /var/folders/n5/0ywwltp54y12_s3629d4tpxr0000gn/T/opencode/splt-expense-route-check
npm test -- --runInBand src/features/expenses/screens-v2/ExpenseFlow.test.tsx
npm run typecheck
npx eslint src/features/expenses/screens-v2/ExpenseDetailScreen.tsx src/features/expenses/screens-v2/EditExpenseScreen.tsx src/features/expenses/components/ExpenseComments.tsx "src/app/expense/[id]/edit.tsx"
```

Expected: full ExpenseFlow suite PASS, typecheck recognizes edit route, and lint exits 0.

---

### Task 21: Cut Over Settlement Selection, Compose, Review, and Success

**Files:**

- Create: `src/features/settlements/hooks/useSettlementFlow.ts`
- Create: `src/features/settlements/hooks/useSettlementFlow.test.ts`
- Modify: `src/features/settlements/screens-v2/NewSettlementScreen.tsx`
- Modify: `src/features/settlements/screens-v2/SettlementScreen.tsx`
- Create: `src/features/settlements/screens-v2/SettlementFlow.test.tsx`

**Interfaces:**

- Consumes: open balances, settlement route/selection contract, settlement RPC, invalidation.
- Produces: fully hydrated selector plus `compose | review | success` state machine.

- [ ] **Step 1: Write RED state and interaction tests**

```ts
export type SettlementFlowState =
  | { step: "loading" }
  | {
      step: "compose";
      selection: DeterminedSettlement;
      amountInput: string;
      method: SettlementMethod;
      note: string;
    }
  | {
      step: "review";
      selection: DeterminedSettlement;
      amountMinor: number;
      method: SettlementMethod;
      note: string;
      resultingMinor: number;
    }
  | { step: "success"; settlement: Settlement; resultingMinor: number };
```

Assert global non-zero selector, group counterparty then currency selection, person direct/group context selection, expense-scoped eligible counterparties, no partial initialization, immutable direction, Full/Half/Custom, exact maximum, external methods `cash|bank_transfer|other`, review disclaimer/details/result, stale `BALANCE_CHANGED` returning to review with refreshed maximum, idempotent submit, success receipt, and return to affected person/group.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- --runInBand src/features/settlements/hooks/useSettlementFlow.test.ts src/features/settlements/screens-v2/SettlementFlow.test.tsx
```

Expected: FAIL because current flow permits direction reversal, exposes unsupported methods, and lacks review/success.

- [ ] **Step 3: Implement selector and state machine**

Map method labels exactly: Cash -> `cash`, Bank transfer -> `bank_transfer`, Other external payment -> `other`. Remove Payment link. Review says `Splt records this payment but does not move money.` Initialize only when party, context, currency, and current balance are complete.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- --runInBand src/features/settlements/hooks/useSettlementFlow.test.ts src/features/settlements/screens-v2/SettlementFlow.test.tsx
npx eslint src/features/settlements/hooks/useSettlementFlow.ts src/features/settlements/hooks/useSettlementFlow.test.ts src/features/settlements/screens-v2/NewSettlementScreen.tsx src/features/settlements/screens-v2/SettlementScreen.tsx src/features/settlements/screens-v2/SettlementFlow.test.tsx
```

Expected: hook and screen suites PASS; no settlement can exceed or reverse its selected debt.

---

### Task 22: Finish Home, Notifications, Integration Hardening, and Handoff Verification

**Files:**

- Modify: `src/features/dashboard/screens-v2/MoneyMapScreen.tsx`
- Create: `src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx`
- Modify: `src/features/notifications/screens-v2/NotificationsScreen.tsx`
- Create: `src/features/notifications/screens-v2/NotificationsScreen.test.tsx`

**Interfaces:**

- Consumes: complete Home snapshot and every completed route/mutation.
- Produces: final Home destinations, notification touchpoint, accessibility/offline/deep-link hardening, and release evidence.

- [ ] **Step 1: Write RED Home and notification tests**

Home tests assert greeting; one-currency hero; multi-currency preferred-first breakdown and additional count; at most four attention rows ordered due-review/preferred/absolute/recent/stable ID; detail-only group/person rows; compact ledger; earliest pending then active schedule; recent four expense/settlement fallback; first-use Create Group/Add Person/Add Expense; `resume=expense`; one refresh invokes every amount source; cached-offline content; error retry.

Notification tests assert Accept/Decline use the same friend/group mutations as Circles, reminders show context/currency/message and open person detail, expense-added opens expense detail, and this phase has no Mark All Read/pagination controls.

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- --runInBand src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx src/features/notifications/screens-v2/NotificationsScreen.test.tsx
```

Expected: FAIL because current Home combines preferred-currency values and attention rows trigger settlement; notifications lack all Phase 2 kinds/actions.

- [ ] **Step 3: Implement Home and notifications last**

Home rows route only to detail. A schedule row routes to `/recurring/[id]`; expense movement routes to `/expense/[id]`; settlement movement routes to its group/person. If no circles exist, omit zero sections and show the three first-use actions. Add Expense with no context opens selector; creation handoffs return with a selected context.

- [ ] **Step 4: Verify focused GREEN**

Run:

```bash
npx prettier --write src/features/dashboard/screens-v2/MoneyMapScreen.tsx src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx src/features/notifications/screens-v2/NotificationsScreen.tsx src/features/notifications/screens-v2/NotificationsScreen.test.tsx
npm test -- --runInBand src/features/dashboard/screens-v2/MoneyMapScreen.test.tsx src/features/notifications/screens-v2/NotificationsScreen.test.tsx
```

Expected: both suites PASS.

- [ ] **Step 5: Run exhaustive automated verification**

Run in this order:

```bash
npx supabase@latest db reset
npx supabase@latest test db
npm test -- --runInBand
npm run typecheck
npx eslint src --ext .ts,.tsx
npm run lint
npx prettier --check .
git diff --check
```

Expected: database reset and all pgTAP tests PASS; Jest exits 0 with no snapshots added; TypeScript exits 0; focused/full lint report no Phase 2 errors; format and whitespace checks exit 0. If full lint reports a pre-existing unrelated diagnostic, record its exact path/rule/output and do not edit unrelated files.

- [ ] **Step 6: Verify all cold routes and back fallbacks manually**

Open each route cold while authenticated and with empty navigation history:

```text
/home
/circles?segment=groups
/circles?segment=people
/group/new
/group/10000000-0000-0000-0000-000000000001?view=overview
/group/10000000-0000-0000-0000-000000000001?view=expenses
/group/10000000-0000-0000-0000-000000000001?view=schedule
/group/10000000-0000-0000-0000-000000000001/settings
/friend/new
/friend/30000000-0000-0000-0000-000000000001
/invite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
/expense/new
/expense/40000000-0000-0000-0000-000000000001
/expense/40000000-0000-0000-0000-000000000001/edit
/settle/new
/settle/30000000-0000-0000-0000-000000000001?groupId=10000000-0000-0000-0000-000000000001&currency=USD
/settle/30000000-0000-0000-0000-000000000001?friendshipId=60000000-0000-0000-0000-000000000001&currency=USD
/notifications
/recurring/new?groupId=10000000-0000-0000-0000-000000000001
/recurring/70000000-0000-0000-0000-000000000001
```

Expected: no partially initialized values; unknown group view falls back to Overview; arbitrary inaccessible IDs are indistinguishable from missing; known historical participants can see restricted history; Back falls to Home, Groups, People, group, or friend according to the typed contract.

- [ ] **Step 7: Walk complete iOS and Android flows**

Run:

```bash
npx expo run:ios
npx expo run:android
```

On both platforms verify: create group with delayed invitations; accept/decline/cancel; add/search/invite/redeem person; reciprocal request; reminder; remove/block/unblock; create group/direct expenses with all four splits and each receipt MIME available on device; create retry; detail/comment/edit/delete/undo; global/group/person/expense settlement entry; stale balance refresh; group archive/leave blockers; notification actions; Home schedule/recent fallback.

Expected: every mutation persists after relaunch, recoverable failures preserve local form text/selections, and no direct financial write bypasses an RPC.

- [ ] **Step 8: Complete accessibility, responsive, theme, motion, keyboard, and offline checks**

At `360x800`, `390x844`, and `430x932`, verify light/dark, system font enlargement up to the app cap, VoiceOver/TalkBack, reduced motion, keyboard-open bottom actions, pull-to-refresh, airplane-mode cached content, reconnect retry, iOS 44pt targets, and Android 48dp targets.

Expected: no horizontal overflow; every segment/selection/request/split/permission exposes role/value/selected/disabled state; money labels include identity/direction/currency/amount; errors announce and focus the first invalid field/review heading; reduced motion removes spatial transitions; financial direction remains understandable without color.

- [ ] **Step 9: Record execution handoff evidence without committing**

Handoff must list:

```text
Database reset result and Supabase CLI version
pgTAP file/assertion counts
Jest suite/test counts
Typecheck, focused lint, full lint, format, and git diff --check results
iOS and Android devices/simulators and OS versions
Routes cold-opened
Flows completed
Widths/themes/accessibility/offline modes checked
Any pre-existing unrelated diagnostics with exact command output
Confirmation that no legacy screen was deleted
Confirmation that no commit was created
```

Expected: another engineer can reproduce every reported result from the commands above, and `git status --short` contains only intentional Phase 2 implementation files plus pre-existing user changes.

---

## Execution Handoff Notes

- Execute tasks strictly in order. Tasks 1-3 define database truth; Tasks 4-7 define compile-time and pure contracts; Tasks 8-11 provide data; Tasks 12-22 cut over active UI.
- Before Task 1, start Docker Desktop. Use `npx supabase@latest --version` in the handoff. Do not add `supabase` to `package.json`.
- Never run `npx supabase init` if `supabase/config.toml` already exists at execution time; inspect and retain concurrent user changes instead.
- Regenerate `database.types.ts` only after a clean local `db reset`; never patch generated omissions with `any`.
- Apply migrations to a linked remote project only after local pgTAP, Jest, typecheck, and lint pass and the user explicitly authorizes remote database changes.
- Preserve legacy numeric amounts and `receipt_url` throughout this phase. New RPCs are authoritative; physical compatibility cleanup belongs to a later migration after deployed clients have cut over.
- Do not delete `screens/` generations, friendship metadata, old amount columns, old receipt paths, or recurring routes.
- Do not create a commit unless the user explicitly requests one after reviewing implementation and verification evidence.
