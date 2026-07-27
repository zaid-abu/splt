# P1-02 Expense Authorization Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add failing pgTAP authorization cases that prove the current expense mutation contract does not safely reject unauthorized contexts, payers, participants, and invalid context states.

**Architecture:** Keep the tests at the database layer in a dedicated transaction-scoped pgTAP file. The fixture uses deterministic auth users, group membership, and friendship states, then invokes the existing `public.create_expense_v2` contract so failures identify missing server checks rather than an absent future function. P1-05 will port the same cases to the versioned canonical RPC after the authorization implementation exists.

**Tech Stack:** Supabase CLI, PostgreSQL 17, pgTAP, PL/pgSQL `SECURITY DEFINER` RPCs, deterministic UUID fixtures.

## Global Constraints

- PostgreSQL remains authoritative for money and stores ledger values as integer minor units.
- RPC inputs carrying PostgreSQL `bigint` values use canonical base-10 decimal strings.
- The product bound is `9_000_000_000_000_000` minor units per money value.
- Public expense RPCs derive the actor exclusively from `auth.uid()`.
- Each request must provide exactly one context: an active group membership or an accepted friendship containing the actor.
- The transaction must prove the payer and every split participant belong to the selected context before any durable insert.
- All `SECURITY DEFINER` functions use a fixed `search_path`, explicit grants, and revocation of direct helper access.
- No production migration, historical correction, destructive cleanup, or release is authorized by this plan.
- P1-02 must remain a failing-test task; do not modify the RPC to make these tests pass.

---

### Task 1: Create deterministic authorization fixtures

**Files:**

- Create: `supabase/tests/p1_expense_authorization.test.sql`

**Interfaces:**

- Consumes: Existing schema and `public.create_expense_v2(uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb)`.
- Produces: A transaction-scoped pgTAP fixture with Alice as actor, Bob as an active group member, Carol as an outsider, Dave as a removed member, Erin as a pending friend, and Frank as a rejected friend.

- [ ] **Step 1: Add the transaction and exact assertion plan**

Create the file with this opening. The final assertion count is 12.

```sql
begin;
select plan(12);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'alice-p1-02@test.com'),
  ('20000000-0000-0000-0000-000000000002', 'bob-p1-02@test.com'),
  ('30000000-0000-0000-0000-000000000003', 'carol-p1-02@test.com'),
  ('40000000-0000-0000-0000-000000000004', 'dave-p1-02@test.com'),
  ('50000000-0000-0000-0000-000000000005', 'erin-p1-02@test.com'),
  ('60000000-0000-0000-0000-000000000006', 'frank-p1-02@test.com');

insert into public.users (id, name, email, initials)
values
  ('10000000-0000-0000-0000-000000000001', 'Alice', 'alice-p1-02@test.com', 'A'),
  ('20000000-0000-0000-0000-000000000002', 'Bob', 'bob-p1-02@test.com', 'B'),
  ('30000000-0000-0000-0000-000000000003', 'Carol', 'carol-p1-02@test.com', 'C'),
  ('40000000-0000-0000-0000-000000000004', 'Dave', 'dave-p1-02@test.com', 'D'),
  ('50000000-0000-0000-0000-000000000005', 'Erin', 'erin-p1-02@test.com', 'E'),
  ('60000000-0000-0000-0000-000000000006', 'Frank', 'frank-p1-02@test.com', 'F');

insert into public.groups (id, name, icon, currency, created_by)
values ('70000000-0000-0000-0000-000000000007', 'P1-02 Group', 'users', 'USD',
        '10000000-0000-0000-0000-000000000001');

insert into public.group_members (group_id, user_id)
values
  ('70000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004');

delete from public.group_members
where group_id = '70000000-0000-0000-0000-000000000007'
  and user_id = '40000000-0000-0000-0000-000000000004';

insert into public.friendships (id, user_id, friend_id, status, requested_by)
values
  ('80000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000001',
   '50000000-0000-0000-0000-000000000005', 'pending',
   '10000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000009',
   '10000000-0000-0000-0000-000000000001',
   '60000000-0000-0000-0000-000000000006', 'declined',
   '10000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
```

- [ ] **Step 2: Verify the fixture parses against the current database**

Run:

```bash
npx supabase start
npm run test:db
```

Expected: the test file is discovered and executes assertions; authorization assertions may fail, but fixture SQL must not fail before the assertions run.

- [ ] **Step 3: Commit the fixture skeleton**

Run:

```bash

```

### Task 2: Add the failing authorization cases

**Files:**

- Modify: `supabase/tests/p1_expense_authorization.test.sql`

**Interfaces:**

- Consumes: Task 1 fixture IDs and the current `create_expense_v2` signature.
- Produces: 12 named pgTAP assertions covering authentication, context authority, payer authority, split participant authority, invalid context combinations, and private-helper grants.

- [ ] **Step 1: Add the anonymous actor rejection**

Append this assertion after the fixture setup. `reset` removes the JWT claim for the transaction-local setting.

```sql
reset request.jwt.claim.sub;

select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000007', null,
    'Anonymous', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'not_authenticated',
  'anonymous actor is rejected'
);

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
```

- [ ] **Step 2: Add outsider and removed-member context cases**

Append these two assertions. Both use the valid group ID but an actor without active membership.

```sql
select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000007', null,
    'Outsider', 1000, 'USD', 'food',
    '30000000-0000-0000-0000-000000000003',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'context_not_authorized',
  'outsider actor cannot create in a group'
);

select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000003',
    '70000000-0000-0000-0000-000000000007', null,
    'Removed member', 1000, 'USD', 'food',
    '40000000-0000-0000-0000-000000000004',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'context_not_authorized',
  'removed member cannot create in a group'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
```

- [ ] **Step 3: Add pending and rejected friendship cases**

Append these cases. The expected code distinguishes a friendship that exists from one that is an accepted expense context.

```sql
select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000004',
    null, '80000000-0000-0000-0000-000000000008',
    'Pending friend', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'friendship_not_accepted',
  'pending friendship is not an expense context'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000005',
    null, '90000000-0000-0000-0000-000000000009',
    'Rejected friend', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'friendship_not_accepted',
  'rejected friendship is not an expense context'
);
```

- [ ] **Step 4: Add foreign payer and injected participant cases**

Append these cases while Alice is the active actor. The custom split payloads make the unauthorized IDs explicit.

```sql
select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000006',
    '70000000-0000-0000-0000-000000000007', null,
    'Foreign payer', 2000, 'USD', 'food',
    '30000000-0000-0000-0000-000000000003',
    'custom', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0},{"userId":"20000000-0000-0000-0000-000000000002","amountMinor":1000,"position":1}]'::jsonb
  )$$,
  'P0001', 'payer_not_in_context',
  'payer must belong to the selected group'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000007',
    '70000000-0000-0000-0000-000000000007', null,
    'Injected participant', 2000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0},{"userId":"30000000-0000-0000-0000-000000000003","amountMinor":1000,"position":1}]'::jsonb
  )$$,
  'P0001', 'participant_not_in_context',
  'every split participant must belong to the selected group'
);
```

- [ ] **Step 5: Add duplicate participant and position cases**

Append these cases. They use valid group members, so a pass would prove the database accepts ambiguous allocation identities.

```sql
select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000008',
    '70000000-0000-0000-0000-000000000007', null,
    'Duplicate participant', 2000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0},{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":1}]'::jsonb
  )$$,
  'P0001', 'duplicate_participant',
  'split participants must be unique'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000009',
    '70000000-0000-0000-0000-000000000007', null,
    'Duplicate position', 2000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0},{"userId":"20000000-0000-0000-0000-000000000002","amountMinor":1000,"position":0}]'::jsonb
  )$$,
  'P0001', 'duplicate_position',
  'split positions must be unique'
);
```

- [ ] **Step 6: Add invalid context and helper privilege cases**

Append these cases. The context checks must run before any insert, and the private helper must not be executable by the API role.

```sql
select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000010',
    '70000000-0000-0000-0000-000000000007',
    '80000000-0000-0000-0000-000000000008',
    'Both contexts', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'exactly_one_context_required',
  'both group and friendship contexts are rejected'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a0000000-0000-0000-0000-000000000011',
    null, null,
    'No context', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'exactly_one_context_required',
  'neither group nor friendship context is rejected'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_expense_internal_v2(uuid,uuid,uuid,uuid,text,bigint,text,text,uuid,text,timestamptz,text,text,jsonb)',
    'EXECUTE'
  ),
  'authenticated role cannot execute the private expense helper'
);

select * from finish();
rollback;
```

- [ ] **Step 7: Verify the assertions are red for the intended pre-implementation gaps**

Run:

```bash
npm run test:db
```

Expected: the test file runs to completion but reports failures for missing authorization, payer/participant, duplicate identity, or stable error-code checks. A fixture or SQL syntax failure is not an acceptable red result; fix that test defect before proceeding.

- [ ] **Step 8: Commit the failing test contract**

Run:

```bash

```

### Task 3: Record P1-02 evidence and hand off to implementation

**Files:**

- Modify: `docs/audit-2026-07-27/09-execution-tracker.md`

**Interfaces:**

- Consumes: The red test command and its exact failure output from Task 2.
- Produces: P1-02 evidence showing the authorization test contract exists and fails for the intended missing checks; P1-05 becomes the next implementation task.

- [ ] **Step 1: Record the exact test result**

Append a P1-02 evidence row containing the test file, assertion count, command, and failure categories. Do not call the task `DONE` if the test file fails to parse or if the failures are unrelated to the intended authorization gaps.

- [ ] **Step 2: Advance the tracker**

Set `P1-02` to `DONE`, set `active_task: NONE`, and set `next_task: P1-03` only if the P1-02 acceptance criteria and verification output are both satisfied. Otherwise keep `P1-02` `IN_PROGRESS` or `BLOCKED` with the exact failure recorded.

- [ ] **Step 3: Run documentation verification**

Run:

```bash
npm run format:check
```

Expected: formatting and whitespace checks pass; only intended P1-02 files are changed.

- [ ] **Step 4: Commit the tracker evidence**

Run:

```bash

```

## Execution Notes

- Do not start P1-03 invariant tests in the same change. It has a separate dependency and test matrix.
- Do not edit `supabase/migrations/*.sql` in this plan. P1-02 is intentionally the failing-test baseline.
- If Docker is unavailable, keep the test file and record the exact environment blocker; do not claim the red/green pgTAP result from static inspection.
- Independent SQL/security review remains mandatory before a production migration, even though this plan bypasses the P0 exit at the user's direction.
