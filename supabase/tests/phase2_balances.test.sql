begin;
select plan(22);

-- ── Fixtures ──────────────────────────────────────────────────────────────────

insert into auth.users (id, email)
values
  ('20000000-0000-0000-0000-000000000001', 'a@test.com'),
  ('30000000-0000-0000-0000-000000000001', 'b@test.com');

insert into public.users (id, name, email, initials)
values
  ('20000000-0000-0000-0000-000000000001', 'User A', 'a@test.com', 'A'),
  ('30000000-0000-0000-0000-000000000001', 'User B', 'b@test.com', 'B');

insert into public.groups (id, name, icon, currency, created_by)
values ('10000000-0000-0000-0000-000000000001', 'Test Group', 'users', 'USD',
        '20000000-0000-0000-0000-000000000001');

insert into public.group_members (group_id, user_id)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001');

-- USD $30.00 expense paid by A (A share $10, B share $20)
insert into public.expenses (id, group_id, title, amount, currency, category,
                             paid_by, split_method, date, amount_minor, created_by)
values ('40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Dinner', 30.00, 'USD', 'food',
        '20000000-0000-0000-0000-000000000001', 'custom', now(), 3000,
        '20000000-0000-0000-0000-000000000001');

insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 10.00, 1000, 0),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 20.00, 2000, 1);

-- EUR €10.00 expense paid by B (each share €5)
insert into public.expenses (id, group_id, title, amount, currency, category,
                             paid_by, split_method, date, amount_minor, created_by)
values ('40000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Coffee', 10.00, 'EUR', 'food',
        '30000000-0000-0000-0000-000000000001', 'equal', now(), 1000,
        '30000000-0000-0000-0000-000000000001');

insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position)
values
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 5.00, 500, 0),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 5.00, 500, 1);

-- USD $5.00 settlement from B to A
insert into public.settlements (id, group_id, from_user_id, to_user_id, amount,
                                currency, date, amount_minor, method)
values ('50000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        5.00, 'USD', now(), 500, 'other');

-- ── 1. Function signatures ─────────────────────────────────────────────────

select function_returns('public', 'balance_key', array['text','uuid','uuid','uuid','text'], 'text');
select function_returns('public', 'acquire_balance_locks', array['text[]'], 'void');
select function_returns('public', 'get_open_balances', array[]::text[], 'record');
select function_returns('public', 'context_has_nonzero_balances', array['text','uuid','uuid'], 'boolean');
select function_returns('public', 'can_view_expense', array['uuid','uuid'], 'boolean');
select function_returns('public', 'can_view_group_history', array['uuid','uuid'], 'boolean');

-- ── 2. balance_key symmetry ────────────────────────────────────────────────

select is(
  public.balance_key('group', '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'USD'),
  public.balance_key('group', '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'USD')
);

-- ── 3. get_open_balances as user A ─────────────────────────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

select is((select signed_amount_minor from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001' and currency = 'USD'), 1500::bigint);

select is((select signed_amount_minor from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001' and currency = 'EUR'), -500::bigint);

select is((select count(*) from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001'), 2::bigint);

-- ── 4. get_open_balances as user B (mirror) ────────────────────────────────

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);

select is((select signed_amount_minor from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001' and currency = 'USD'), -1000::bigint);

select is((select signed_amount_minor from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001' and currency = 'EUR'), 500::bigint);

select is((select count(*) from public.get_open_balances()
  where context_id = '10000000-0000-0000-0000-000000000001'), 2::bigint);

-- ── 5. acquire_balance_locks smoke test ────────────────────────────────────

select lives_ok($$select public.acquire_balance_locks(array[
  public.balance_key('group', '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'USD')
])$$);

-- ── 6. context_has_nonzero_balances ────────────────────────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select ok(public.context_has_nonzero_balances('group', '10000000-0000-0000-0000-000000000001'),
          'group has nonzero balances');
select ok(not public.context_has_nonzero_balances('direct', '10000000-0000-0000-0000-000000000001'),
          'no direct context with that id');

-- ── 7. can_view_expense ────────────────────────────────────────────────────

select ok(public.can_view_expense('40000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001'), 'payer can view expense');
select ok(public.can_view_expense('40000000-0000-0000-0000-000000000001',
          '30000000-0000-0000-0000-000000000001'), 'participant can view expense');
select ok(not public.can_view_expense('40000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000000'), 'unrelated user cannot view expense');

-- ── 8. can_view_group_history ──────────────────────────────────────────────

select ok(public.can_view_group_history('10000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001'), 'group member can view history');
select ok(public.can_view_group_history('10000000-0000-0000-0000-000000000001',
          '30000000-0000-0000-0000-000000000001'), 'expense participant can view history');
select ok(not public.can_view_group_history('10000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000000'), 'unrelated user cannot view history');

select * from finish();
rollback;
