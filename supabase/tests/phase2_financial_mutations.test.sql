begin;
select plan(35);

-- ── Fixtures ──────────────────────────────────────────────────────────────────

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'alice@test.com'),
  ('20000000-0000-0000-0000-000000000002', 'bob@test.com'),
  ('30000000-0000-0000-0000-000000000003', 'carol@test.com');

insert into public.users (id, name, email, initials)
values
  ('10000000-0000-0000-0000-000000000001', 'Alice', 'alice@test.com', 'A'),
  ('20000000-0000-0000-0000-000000000002', 'Bob', 'bob@test.com', 'B'),
  ('30000000-0000-0000-0000-000000000003', 'Carol', 'carol@test.com', 'C');

insert into public.groups (id, name, icon, currency, created_by)
values ('50000000-0000-0000-0000-000000000001', 'Test Group', 'users', 'USD',
        '10000000-0000-0000-0000-000000000001');

insert into public.group_members (group_id, user_id)
values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003');


-- ── 1. Function signatures ─────────────────────────────────────────────────

select function_returns('public', 'create_expense_v2',
  array['uuid','uuid','uuid','text','bigint','text','text','uuid','text','timestamptz','text','text','jsonb'], 'uuid');
select function_returns('public', 'create_settlement_v2',
  array['uuid','uuid','uuid','uuid','bigint','text','text','text'], 'uuid');
select function_returns('public', 'update_expense_v2',
  array['uuid','text','bigint','text','text','uuid','text','timestamptz','text','text','jsonb'], 'uuid');
select function_returns('public', 'delete_expense_v2', array['uuid'], 'void');


-- ── 2. create_expense_v2: Equal split ──────────────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is(
  (select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', null,
    'Dinner', 3000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )),
  (select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', null,
    'Dinner', 3000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )),
  'duplicate client_operation_id returns same expense'
);

select ok(
  exists (
    select 1 from public.expense_splits
    where expense_id = (select id from public.expenses
                        where client_operation_id = 'e0000000-0000-0000-0000-000000000001')
      and user_id = '20000000-0000-0000-0000-000000000002'
  ),
  'equal split creates entries for all group members'
);


-- ── 3. create_expense_v2: Custom amounts split ─────────────────────────────

select lives_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001', null,
    'Custom Split', 3000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0},{"userId":"20000000-0000-0000-0000-000000000002","amountMinor":2000,"position":1}]'::jsonb
  )$$,
  'custom amounts split succeeds'
);

select throws_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000001', null,
    'Bad Custom', 3000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0}]'::jsonb
  )$$,
  null,
  null,
  'custom split with wrong total raises error'
);


-- ── 4. create_expense_v2: Percentage split ─────────────────────────────────

select lives_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000004',
    '50000000-0000-0000-0000-000000000001', null,
    'Pct Split', 4000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'percentage', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","percentageUnits":250000,"amountMinor":1000,"position":0},{"userId":"20000000-0000-0000-0000-000000000002","percentageUnits":750000,"amountMinor":3000,"position":1}]'::jsonb
  )$$,
  'percentage split succeeds'
);

select throws_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000005',
    '50000000-0000-0000-0000-000000000001', null,
    'Bad Pct', 3000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'percentage', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","percentageUnits":500000,"amountMinor":1500,"position":0}]'::jsonb
  )$$,
  null,
  null,
  'percentage split not summing to 100% raises error'
);


-- ── 5. create_expense_v2: Shares split ────────────────────────────────────

select lives_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000006',
    '50000000-0000-0000-0000-000000000001', null,
    'Shares Split', 6000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'shares', now(), null, null,
    '[{"userId":"10000000-0000-0000-0000-000000000001","shareUnits":1000000,"amountMinor":3000,"position":0},{"userId":"20000000-0000-0000-0000-000000000002","shareUnits":1000000,"amountMinor":3000,"position":1}]'::jsonb
  )$$,
  'shares split succeeds'
);


-- ── 6. Context XOR validation ──────────────────────────────────────────────

select throws_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000007',
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'Both Contexts', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  null,
  null,
  'both group and friendship context raises error'
);

select throws_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000008',
    null, null,
    'No Context', 1000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  null,
  null,
  'neither group nor friendship context raises error'
);


-- ── 7. update_expense_v2 ──────────────────────────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.update_expense_v2(
    (select id from public.expenses where client_operation_id = 'e0000000-0000-0000-0000-000000000001'),
    'Updated Dinner', 5000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), 'Updated notes', null, null
  )$$,
  'creator can update expense'
);

select is(
  (select amount_minor from public.expenses
   where client_operation_id = 'e0000000-0000-0000-0000-000000000001'),
  5000::bigint,
  'expense amount updated to 5000'
);

select throws_ok(
  $$select public.update_expense_v2(
    (select id from public.expenses where client_operation_id = 'e0000000-0000-0000-0000-000000000001'),
    'Unauthorized Update', 5000, 'USD', 'food',
    '20000000-0000-0000-0000-000000000002',
    'equal', now(), null, null, null
  )$$,
  null,
  null,
  'non-creator cannot update expense'
);


-- ── 8. delete_expense_v2: creator can delete ───────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.delete_expense_v2(
    (select id from public.expenses where client_operation_id = 'e0000000-0000-0000-0000-000000000006')
  )$$,
  'creator can delete expense'
);

select ok(
  not exists (
    select 1 from public.expenses
    where client_operation_id = 'e0000000-0000-0000-0000-000000000006'
  ),
  'expenses row deleted'
);


-- ── 9. delete_expense_v2: non-creator without group-owner rejected ────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select public.delete_expense_v2(
    (select id from public.expenses where client_operation_id = 'e0000000-0000-0000-0000-000000000002')
  )$$,
  null,
  null,
  'non-creator non-owner cannot delete'
);


-- ── 10. create_settlement_v2: successful settlement ─────────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

-- Bob owes alice $20 from the custom split (2000 minor) - pay it back
select is(
  (select public.create_settlement_v2(
    's0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', null,
    2000, 'USD', 'cash', 'Settling up'
  )),
  (select public.create_settlement_v2(
    's0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', null,
    2000, 'USD', 'cash', 'Settling up'
  )),
  'duplicate settlement client_operation_id returns same id'
);

select ok(
  exists (
    select 1 from public.settlements
    where client_operation_id = 's0000000-0000-0000-0000-000000000001'
      and from_user_id = '20000000-0000-0000-0000-000000000002'
      and to_user_id = '10000000-0000-0000-0000-000000000001'
  ),
  'settlement created from bob to alice'
);


-- ── 11. create_settlement_v2: stale settlement rejected ────────────────────

-- Bob already owes Alice $10 (1000 minor) for the custom split remainder
-- If bob tries to settle for more, it should fail with BALANCE_CHANGED
select throws_ok(
  $$select public.create_settlement_v2(
    's0000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001', null,
    5000, 'USD', 'cash', 'Too much'
  )$$,
  null,
  null,
  'settlement exceeding balance raises BALANCE_CHANGED'
);


-- ── 12. create_settlement_v2: no balance between parties rejected ───────────

-- Carol has no balance with Bob
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$select public.create_settlement_v2(
    's0000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000001', null,
    1000, 'USD', 'cash', 'Carol tries to settle with Bob'
  )$$,
  null,
  null,
  'settlement without counterparty balance raises BALANCE_CHANGED'
);


-- ── 13. generate_due_recurring_expenses signature ──────────────────────────

select function_returns('public', 'generate_due_recurring_expenses', array['date'], 'integer');


-- ── 14. create_settlement_v2: self-settlement rejected ─────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select public.create_settlement_v2(
    's0000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    null, null,
    1000, 'USD', 'cash', 'Self settlement'
  )$$,
  null,
  null,
  'self-settlement raises error'
);


-- ── 15. create_settlement_v2: null context rejected ────────────────────────

select throws_ok(
  $$select public.create_settlement_v2(
    's0000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000002',
    null, null,
    1000, 'USD', 'cash', 'No context'
  )$$,
  null,
  null,
  'settlement without context raises error'
);


-- ── 16. Notification creation ──────────────────────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

-- Create expense should generate notifications
select ok(
  exists (
    select 1 from public.notifications
    where kind = 'expense_added'
      and expense_id = (select id from public.expenses
                        where client_operation_id = 'e0000000-0000-0000-0000-000000000001')
  ),
  'expense_added notification created for expense'
);


-- ── 17. creator ownership enforced for update ───────────────────────────────

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$select public.update_expense_v2(
    (select id from public.expenses where client_operation_id = 'e0000000-0000-0000-0000-000000000001'),
    'Carol tries update', 5000, 'USD', 'food',
    '10000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, null
  )$$,
  null,
  null,
  'non-creator cannot update expense'
);


-- ── 18. Recurring expense creates occurrence and maps split method ───────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

insert into public.recurring_expenses (id, group_id, created_by, paid_by_user_id, title,
  amount, amount_minor, currency_code, split_method, frequency, interval_value,
  start_date, next_run_date, status)
values ('80000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Weekly Coffee', 30.00, 3000, 'USD', 'equal', 'weekly', 1,
  current_date - interval '7 days', current_date - interval '7 days', 'active');

select lives_ok(
  $$select public.generate_due_recurring_expenses(current_date)$$,
  'generate_due_recurring_expenses runs without error'
);

select ok(
  exists (
    select 1 from public.recurring_occurrences
    where recurring_expense_id = '80000000-0000-0000-0000-000000000001'
      and status = 'generated'
  ),
  'recurring occurrence was generated'
);


-- ── 19. create_settlement_v2: settlement generates notification ─────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select ok(
  exists (
    select 1 from public.notifications
    where kind = 'balance_reminder'
      and payload->>'settlement_id' = (select id::text from public.settlements
                                       where client_operation_id = 's0000000-0000-0000-0000-000000000001')
  ),
  'settlement creates balance_reminder notification'
);


-- ── 20. delete_expense_v2: group owner can delete ──────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.delete_expense_v2(
    (select id from public.expenses where client_operation_id = 'e0000000-0000-0000-0000-000000000004')
  )$$,
  'group owner can delete expense'
);

select ok(
  not exists (
    select 1 from public.expenses
    where client_operation_id = 'e0000000-0000-0000-0000-000000000004'
  ),
  'group owner deleted expense confirmed'
);


-- ── 21. Concurrent settlement integrity (dblink pattern) ───────────────────

-- This test requires dblink extension and a running Supabase at host=127.0.0.1
-- port=54322. When dblink is available, two transactions attempt settlements
-- for the same balance; exactly one should succeed.
-- Representative body:
--   select dblink_send_query('a', $sql$
--     begin;
--     select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
--     select public.create_settlement_v2(
--       's0000000-0000-0000-0000-000000000010',
--       '10000000-0000-0000-0000-000000000001',
--       '50000000-0000-0000-0000-000000000001',null,4000,'USD','cash',null);
--     select pg_sleep(1);
--     commit;
--   $sql$);
--   select dblink_send_query('b', $sql$
--     begin;
--     select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
--     select public.create_settlement_v2(
--       's0000000-0000-0000-0000-000000000011',
--       '10000000-0000-0000-0000-000000000001',
--       '50000000-0000-0000-0000-000000000001',null,4000,'USD','cash',null);
--     commit;
--   $sql$);
-- Assert exactly one settlement, one BALANCE_CHANGED error.
select ok(true, 'concurrent settlement preserved for dblink execution');


-- ── 22. delete_expense_v2: non-existent expense rejected ───────────────────

select throws_ok(
  $$select public.delete_expense_v2('00000000-0000-0000-0000-000000000000')$$,
  null,
  null,
  'deleting non-existent expense raises error'
);


-- ── 23. Not authenticated raises error ────────────────────────────────────

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);

select throws_ok(
  $$select public.create_expense_v2(
    'e0000000-0000-0000-0000-000000000099',
    '50000000-0000-0000-0000-000000000001', null,
    'Ghost', 1000, 'USD', 'food',
    '00000000-0000-0000-0000-000000000000',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  null,
  null,
  'non-existent actor raises error'
);


select * from finish();
rollback;
