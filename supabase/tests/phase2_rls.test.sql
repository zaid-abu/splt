begin;
select plan(37);

-- ── Fixtures ──────────────────────────────────────────────────────────────────

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'alice@test.com'),
  ('20000000-0000-0000-0000-000000000002', 'bob@test.com'),
  ('30000000-0000-0000-0000-000000000003', 'carol@test.com'),
  ('40000000-0000-0000-0000-000000000004', 'dave@test.com'),
  ('50000000-0000-0000-0000-000000000005', 'unauthorized@test.com');

insert into public.users (id, name, email, initials)
values
  ('10000000-0000-0000-0000-000000000001', 'Alice', 'alice@test.com', 'A'),
  ('20000000-0000-0000-0000-000000000002', 'Bob', 'bob@test.com', 'B'),
  ('30000000-0000-0000-0000-000000000003', 'Carol', 'carol@test.com', 'C'),
  ('40000000-0000-0000-0000-000000000004', 'Dave', 'dave@test.com', 'D'),
  ('50000000-0000-0000-0000-000000000005', 'Unauthorized', 'unauthorized@test.com', 'U');

-- Group: created by Alice, members: Alice, Bob, Carol
insert into public.groups (id, name, icon, currency, created_by)
values ('10000000-0000-0000-0000-000000000001', 'Trip Group', 'users', 'USD',
        '10000000-0000-0000-0000-000000000001');

insert into public.group_members (group_id, user_id)
values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003');

-- Expense ($30, split equally)
insert into public.expenses (id, group_id, title, amount, amount_minor, currency, category,
                             paid_by, created_by, split_method, date)
values ('40000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Pizza', 30.00, 3000, 'USD', 'food',
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001', 'equal', now());

insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position)
values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 10.00, 1000, 0),
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 10.00, 1000, 1),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 10.00, 1000, 2);

-- Comment from Bob on the expense
insert into public.expense_comments (id, expense_id, user_id, text)
values ('60000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002', 'Great pizza!');

-- Settlement from Bob to Alice ($10)
insert into public.settlements (id, group_id, from_user_id, to_user_id, amount, amount_minor,
                                currency, date, method)
values ('70000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        10.00, 1000, 'USD', now(), 'cash');


-- ── Tests: Alice (creator & group member) ───────────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  exists (select 1 from public.expenses where id = '40000000-0000-0000-0000-000000000001'),
  'alice can view expense as creator and payer'
);

select ok(
  exists (select 1 from public.expense_splits where expense_id = '40000000-0000-0000-0000-000000000001'),
  'alice can view splits for her expense'
);

select ok(
  exists (select 1 from public.settlements where id = '70000000-0000-0000-0000-000000000001'),
  'alice can view settlement as recipient'
);

select ok(
  exists (select 1 from public.groups where id = '10000000-0000-0000-0000-000000000001'),
  'alice can view group as creator'
);

select ok(
  exists (select 1 from public.expense_comments where id = '60000000-0000-0000-0000-000000000001'),
  'alice can view expense comments as expense participant'
);


-- ── Tests: Bob (active group member) ───────────────────────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select ok(
  exists (select 1 from public.expenses where id = '40000000-0000-0000-0000-000000000001'),
  'bob can view expense as group member and participant'
);

select ok(
  exists (select 1 from public.settlements where id = '70000000-0000-0000-0000-000000000001'),
  'bob can view settlement as sender'
);

select ok(
  exists (select 1 from public.groups where id = '10000000-0000-0000-0000-000000000001'),
  'bob can view group as member'
);

select ok(
  exists (select 1 from public.expense_comments where id = '60000000-0000-0000-0000-000000000001'),
  'bob can view his own comment'
);

-- Bob can insert a comment
select lives_ok(
  $$insert into public.expense_comments (expense_id, user_id, text)
    values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Thanks!')$$,
  'bob can insert comment on expense he can view'
);

-- Bob can delete his own comment
select lives_ok(
  $$delete from public.expense_comments
    where expense_id = '40000000-0000-0000-0000-000000000001'
    and user_id = '20000000-0000-0000-0000-000000000002'
    and text = 'Thanks!'$$,
  'bob can delete his own comment'
);


-- ── Tests: Carol (active group member) ─────────────────────────────────────

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);

select ok(
  exists (select 1 from public.expenses where id = '40000000-0000-0000-0000-000000000001'),
  'carol can view expense as group member'
);


-- ── Tests: Dave (removed member — was once a participant) ──────────────────

insert into public.group_members (group_id, user_id)
values ('10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004');

-- Dave was briefly a member
delete from public.group_members
where group_id = '10000000-0000-0000-0000-000000000001'
  and user_id = '40000000-0000-0000-0000-000000000004';

select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000004', true);

select ok(
  exists (select 1 from public.groups where id = '10000000-0000-0000-0000-000000000001'),
  'dave can view group history as former member'
);

select ok(
  not exists (
    select 1 from public.expense_splits
    where expense_id = '40000000-0000-0000-0000-000000000001' and user_id = '40000000-0000-0000-0000-000000000004'
  ),
  'dave has no split entries on the expense'
);


-- ── Tests: Unauthorized User (never associated) ─────────────────────────────

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000005', true);

select ok(
  not exists (
    select 1 from public.expenses where id = '40000000-0000-0000-0000-000000000001'
  ),
  'unauthorized user cannot see group expenses'
);

select ok(
  not exists (
    select 1 from public.groups where id = '10000000-0000-0000-0000-000000000001'
  ),
  'unauthorized user cannot see group'
);

select ok(
  not exists (
    select 1 from public.settlements where id = '70000000-0000-0000-0000-000000000001'
  ),
  'unauthorized user cannot see settlements'
);

select ok(
  not exists (
    select 1 from public.expense_splits where expense_id = '40000000-0000-0000-0000-000000000001'
  ),
  'unauthorized user cannot see splits'
);


-- ── Tests: Unauthorized User tries to access arbitrary ID ───────────────────

select ok(
  not exists (
    select 1 from public.expenses where id = '40000000-0000-0000-0000-000000000000'
  ),
  'unauthorized user gets empty result for non-existent expense'
);

select ok(
  not exists (
    select 1 from public.expenses where id = 'deadbeef-dead-beef-dead-beef00000000'
  ),
  'unauthorized user gets empty result for arbitrary expense id'
);


-- ── Tests: INSERT/UPDATE/DELETE revoked on mutations tables ────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$insert into public.expenses (group_id, title, amount, amount_minor, currency, category,
                                  paid_by, created_by, split_method, date)
    values ('10000000-0000-0000-0000-000000000001', 'Direct Insert', 10, 1000, 'USD', 'food',
            '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'equal', now())$$,
  42501,
  null,
  'direct insert into expenses is revoked from authenticated'
);

select throws_ok(
  $$update public.expenses set title = 'hacked' where id = '40000000-0000-0000-0000-000000000001'$$,
  42501,
  null,
  'direct update on expenses is revoked from authenticated'
);

select throws_ok(
  $$delete from public.expenses where id = '40000000-0000-0000-0000-000000000001'$$,
  42501,
  null,
  'direct delete on expenses is revoked from authenticated'
);

select throws_ok(
  $$insert into public.settlements (group_id, from_user_id, to_user_id, amount, amount_minor,
                                     currency, method)
    values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
            '20000000-0000-0000-0000-000000000002', 5, 500, 'USD', 'cash')$$,
  42501,
  null,
  'direct insert into settlements is revoked'
);

select throws_ok(
  $$insert into public.friendships (user_id, friend_id, status)
    values ('10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 'accepted')$$,
  42501,
  null,
  'direct insert into friendships is revoked'
);

select throws_ok(
  $$insert into public.group_invitations (group_id, inviter_id, invitee_id)
    values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
            '50000000-0000-0000-0000-000000000005')$$,
  42501,
  null,
  'direct insert into group_invitations is revoked'
);

select throws_ok(
  $$insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position)
    values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 5, 500, 0)$$,
  42501,
  null,
  'direct insert into expense_splits is revoked'
);


-- ── Tests: Indistinguishable zero-row for arbitrary inaccessible IDs ───────

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000005', true);

select is(
  (select count(*) from public.expenses where id = '40000000-0000-0000-0000-000000000001'),
  0::bigint,
  'unauthorized gets 0 rows for existing expense (indistinguishable)'
);

select is(
  (select count(*) from public.expenses where id = '00000000-0000-0000-0000-000000000000'),
  0::bigint,
  'unauthorized gets 0 rows for non-existent expense (indistinguishable)'
);

select is(
  (select count(*) from public.settlements where id = '70000000-0000-0000-0000-000000000001'),
  0::bigint,
  'unauthorized gets 0 rows for existing settlement (indistinguishable)'
);

select is(
  (select count(*) from public.groups where id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'unauthorized gets 0 rows for existing group (indistinguishable)'
);


-- ── Tests: Creator can update group identity (name, icon, currency) ─────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$update public.groups set name = 'Updated Trip' where id = '10000000-0000-0000-0000-000000000001'$$,
  'creator can update group name'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$update public.groups set name = 'Hacked Name' where id = '10000000-0000-0000-0000-000000000001'$$,
  42501,
  null,
  'non-creator cannot update group'
);


-- ── Tests: Notification reads are recipient-only ───────────────────────────

insert into public.notifications (id, recipient_id, kind, payload)
values ('90000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'balance_reminder', '{}'::jsonb);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  exists (select 1 from public.notifications where id = '90000000-0000-0000-0000-000000000001'),
  'recipient can read notification'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select ok(
  not exists (
    select 1 from public.notifications where id = '90000000-0000-0000-0000-000000000001'
  ),
  'non-recipient cannot read notification'
);


-- ── Tests: Activities visible to participants only ─────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  exists (
    select 1 from public.activities
    where expense_id = '40000000-0000-0000-0000-000000000001'
  ),
  'expense participant can see activity'
);

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000005', true);

select ok(
  not exists (
    select 1 from public.activities
    where expense_id = '40000000-0000-0000-0000-000000000001'
  ),
  'unauthorized user cannot see activity'
);

select * from finish();
rollback;
