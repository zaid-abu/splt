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
