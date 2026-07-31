begin;
select plan(77);

insert into auth.users (id, email)
values
  ('11000000-0000-0000-0000-000000000001', 'ledger-alice@test.com'),
  ('22000000-0000-0000-0000-000000000002', 'ledger-bob@test.com'),
  ('33000000-0000-0000-0000-000000000003', 'ledger-carol@test.com');

insert into public.users (id, name, email, initials)
values
  ('11000000-0000-0000-0000-000000000001', 'Alice', 'ledger-alice@test.com', 'A'),
  ('22000000-0000-0000-0000-000000000002', 'Bob', 'ledger-bob@test.com', 'B'),
  ('33000000-0000-0000-0000-000000000003', 'Carol', 'ledger-carol@test.com', 'C');

insert into public.groups (id, name, icon, currency, created_by)
values (
  '44000000-0000-0000-0000-000000000004',
  'Ledger Group',
  'users',
  'USD',
  '11000000-0000-0000-0000-000000000001'
);

insert into public.group_members (group_id, user_id)
values
  ('44000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000001'),
  ('44000000-0000-0000-0000-000000000004', '22000000-0000-0000-0000-000000000002');

insert into public.groups (id, name, icon, currency, created_by)
values ('66000000-0000-0000-0000-000000000006', 'Yen Group', 'users', 'JPY',
  '11000000-0000-0000-0000-000000000001');
insert into public.group_members (group_id, user_id)
values
  ('66000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000001'),
  ('66000000-0000-0000-0000-000000000006', '22000000-0000-0000-0000-000000000002');
insert into public.groups (id, name, icon, currency, created_by)
values ('77000000-0000-0000-0000-000000000007', 'Ceiling Group', 'users', 'USD',
  '11000000-0000-0000-0000-000000000001');
insert into public.group_members (group_id, user_id)
values
  ('77000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000001'),
  ('77000000-0000-0000-0000-000000000007', '22000000-0000-0000-0000-000000000002');

insert into public.friendships (id, user_id, friend_id, status, requested_by)
values (
  '55000000-0000-0000-0000-000000000005',
  '11000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000002',
  'accepted',
  '11000000-0000-0000-0000-000000000001'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.apply_expense_splits_v3(uuid,uuid,uuid,uuid,uuid,bigint,text,text,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients cannot execute the private split writer'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_expense_v2(uuid,uuid,uuid,text,bigint,text,text,uuid,text,timestamptz,text,text,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute expense mutations'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_expense_v2(uuid,uuid,uuid,text,bigint,text,text,uuid,text,timestamptz,text,text,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients can execute the public expense mutation'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_settlement_v2(uuid,uuid,uuid,uuid,bigint,text,text,text)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute settlement mutations'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.create_settlement_v2(uuid,uuid,uuid,uuid,bigint,text,text,text)',
    'EXECUTE'
  ),
  'authenticated clients can execute the public settlement mutation'
);

select ok(not has_function_privilege('anon', 'public.delete_settlement_v2(uuid)', 'EXECUTE'),
  'anonymous clients cannot delete settlements');
select ok(has_function_privilege('authenticated', 'public.delete_settlement_v2(uuid)', 'EXECUTE'),
  'authenticated clients can delete settlements');

select ok(not has_table_privilege('authenticated', 'public.expenses', 'INSERT'), 'expenses INSERT is revoked');
select ok(not has_table_privilege('authenticated', 'public.expenses', 'UPDATE'), 'expenses UPDATE is revoked');
select ok(not has_table_privilege('authenticated', 'public.expenses', 'DELETE'), 'expenses DELETE is revoked');
select ok(not has_table_privilege('authenticated', 'public.expense_splits', 'INSERT'), 'splits INSERT is revoked');
select ok(not has_table_privilege('authenticated', 'public.expense_splits', 'UPDATE'), 'splits UPDATE is revoked');
select ok(not has_table_privilege('authenticated', 'public.expense_splits', 'DELETE'), 'splits DELETE is revoked');
select ok(not has_table_privilege('authenticated', 'public.settlements', 'INSERT'), 'settlements INSERT is revoked');
select ok(not has_table_privilege('authenticated', 'public.settlements', 'UPDATE'), 'settlements UPDATE is revoked');
select ok(not has_table_privilege('authenticated', 'public.settlements', 'DELETE'), 'settlements DELETE is revoked');
select ok(not has_table_privilege('authenticated', 'public.activities', 'INSERT'), 'activities INSERT is revoked');
select ok(not has_table_privilege('authenticated', 'public.activities', 'UPDATE'), 'activities UPDATE is revoked');
select ok(not has_table_privilege('authenticated', 'public.activities', 'DELETE'), 'activities DELETE is revoked');

select ok(not has_function_privilege('authenticated', 'public.apply_expense_splits_v3(uuid,uuid,uuid,uuid,uuid,bigint,text,text,jsonb)', 'EXECUTE'), 'authenticated cannot execute split writer');
select ok(not has_function_privilege('anon', 'public.apply_expense_splits_v3(uuid,uuid,uuid,uuid,uuid,bigint,text,text,jsonb)', 'EXECUTE'), 'anon cannot execute split writer');
select ok(not has_function_privilege('authenticated', 'public.validate_expense_replay(uuid,uuid,uuid,uuid,text,bigint,text,text,uuid,text,timestamptz,text,text,jsonb)', 'EXECUTE'), 'authenticated cannot execute expense replay validator');
select ok(not has_function_privilege('anon', 'public.validate_expense_replay(uuid,uuid,uuid,uuid,text,bigint,text,text,uuid,text,timestamptz,text,text,jsonb)', 'EXECUTE'), 'anon cannot execute expense replay validator');
select ok(not has_function_privilege('authenticated', 'public.validate_settlement_replay(uuid,uuid,uuid,uuid,uuid,bigint,text,text,text)', 'EXECUTE'), 'authenticated cannot execute settlement replay validator');
select ok(not has_function_privilege('anon', 'public.validate_settlement_replay(uuid,uuid,uuid,uuid,uuid,bigint,text,text,text)', 'EXECUTE'), 'anon cannot execute settlement replay validator');
select ok(not has_function_privilege('authenticated', 'public.ledger_amount_ceiling(text)', 'EXECUTE'), 'authenticated cannot execute amount ceiling helper');
select ok(not has_function_privilege('anon', 'public.ledger_amount_ceiling(text)', 'EXECUTE'), 'anon cannot execute amount ceiling helper');
select ok(not has_function_privilege('authenticated', 'public.enforce_ledger_amount_ceiling()', 'EXECUTE'), 'authenticated cannot execute trigger helper');
select ok(not has_function_privilege('anon', 'public.enforce_ledger_amount_ceiling()', 'EXECUTE'), 'anon cannot execute trigger helper');

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    'Zero', 0, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'expense_amount_must_be_positive',
  'zero-value expenses are rejected'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000002',
    '44000000-0000-0000-0000-000000000004', null,
    'Negative', -1, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'expense_amount_must_be_positive',
  'negative expenses are rejected'
);

select lives_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000018',
  '77000000-0000-0000-0000-000000000007', null, 'USD ceiling', 999999999999,
  'USD', 'other', '11000000-0000-0000-0000-000000000001', 'equal', '2026-07-31 12:00:00+00', null, null, '[]'::jsonb
)$$, 'USD storage ceiling is accepted');
select throws_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000019',
  '77000000-0000-0000-0000-000000000007', null, 'USD ceiling plus one', 1000000000000,
  'USD', 'other', '11000000-0000-0000-0000-000000000001', 'equal', '2026-07-31 12:00:00+00', null, null, '[]'::jsonb
)$$, 'P0001', 'amount_out_of_range', 'USD ceiling plus one is rejected');
select lives_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000020',
  '66000000-0000-0000-0000-000000000006', null, 'JPY ceiling', 9999999999,
  'JPY', 'other', '11000000-0000-0000-0000-000000000001', 'equal', '2026-07-31 12:00:00+00', null, null, '[]'::jsonb
)$$, 'JPY storage ceiling is accepted');
select throws_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000021',
  '66000000-0000-0000-0000-000000000006', null, 'JPY ceiling plus one', 10000000000,
  'JPY', 'other', '11000000-0000-0000-0000-000000000001', 'equal', '2026-07-31 12:00:00+00', null, null, '[]'::jsonb
)$$, 'P0001', 'amount_out_of_range', 'JPY ceiling plus one is rejected');

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000003',
    '44000000-0000-0000-0000-000000000004', null,
    'Wrong currency', 1000, 'EUR', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'group_currency_mismatch',
  'group expenses must use the group currency'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000004',
    '44000000-0000-0000-0000-000000000004', null,
    'Foreign payer', 1000, 'USD', 'other',
    '33000000-0000-0000-0000-000000000003',
    'equal', now(), null, null, '[]'::jsonb
  )$$,
  'P0001', 'payer_not_in_context',
  'payer must belong to the group context'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000005',
    '44000000-0000-0000-0000-000000000004', null,
    'Injected participant', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"33000000-0000-0000-0000-000000000003","amountMinor":1000,"position":0}]'::jsonb
  )$$,
  'P0001', 'participant_not_in_context',
  'split participants must belong to the context'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000006',
    '44000000-0000-0000-0000-000000000004', null,
    'Invalid payload', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, null, '{}'::jsonb
  )$$,
  'P0001', 'splits_must_be_an_array',
  'split payload must be an array'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000007',
    '44000000-0000-0000-0000-000000000004', null,
    'Duplicate participant', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","amountMinor":500,"position":0},{"userId":"11000000-0000-0000-0000-000000000001","amountMinor":500,"position":1}]'::jsonb
  )$$,
  'P0001', 'duplicate_participant',
  'split participants must be unique'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000008',
    '44000000-0000-0000-0000-000000000004', null,
    'Duplicate position', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","amountMinor":500,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","amountMinor":500,"position":0}]'::jsonb
  )$$,
  'P0001', 'duplicate_position',
  'split positions must be unique'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000009',
    '44000000-0000-0000-0000-000000000004', null,
    'Position gap', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","amountMinor":500,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","amountMinor":500,"position":2}]'::jsonb
  )$$,
  'P0001', 'positions_must_be_contiguous',
  'split positions must be contiguous'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000010',
    null, '55000000-0000-0000-0000-000000000005',
    'One-sided direct expense', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","amountMinor":1000,"position":0}]'::jsonb
  )$$,
  'P0001', 'direct_expense_requires_friendship_parties',
  'direct expenses require both friendship parties'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000011',
    '44000000-0000-0000-0000-000000000004', null,
    'Bad percentage', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'percentage', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","percentageUnits":400000,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","percentageUnits":400000,"position":1}]'::jsonb
  )$$,
  'P0001', 'percentage_total_mismatch',
  'percentage units must total exactly one million'
);

select throws_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000022', '44000000-0000-0000-0000-000000000004', null,
  'Percentage unit overflow', 1000, 'USD', 'other',
  '11000000-0000-0000-0000-000000000001', 'percentage', null, null, null,
  '[{"userId":"11000000-0000-0000-0000-000000000001","percentageUnits":1000001,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","percentageUnits":0,"position":1}]'::jsonb
)$$, 'P0001', 'invalid_percentage', 'percentage units have a per-participant ceiling');
select throws_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000023', '44000000-0000-0000-0000-000000000004', null,
  'Share unit overflow', 1000, 'USD', 'other',
  '11000000-0000-0000-0000-000000000001', 'shares', null, null, null,
  '[{"userId":"11000000-0000-0000-0000-000000000001","shareUnits":1000000000000000000,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","shareUnits":1,"position":1}]'::jsonb
)$$, 'P0001', 'invalid_shares', 'share units fit numeric(18,6) before allocation');

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000012',
    '44000000-0000-0000-0000-000000000004', null,
    'Bad shares', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'shares', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","shareUnits":0,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","shareUnits":1000000,"position":1}]'::jsonb
  )$$,
  'P0001', 'invalid_shares',
  'share units must be positive'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000013',
    '44000000-0000-0000-0000-000000000004', null,
    'Bad custom total', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'custom', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","amountMinor":400,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","amountMinor":400,"position":1}]'::jsonb
  )$$,
  'P0001', 'split_total_mismatch',
  'custom split amounts must equal the expense total'
);

select lives_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000014',
    '44000000-0000-0000-0000-000000000004', null,
    'Odd cent', 1001, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', '2026-07-31 12:00:00+00', null, null, '[]'::jsonb
  )$$,
  'valid odd-cent equal expense succeeds'
);

select throws_ok($$select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000024', '44000000-0000-0000-0000-000000000004', null,
  'Missing date', 1000, 'USD', 'other',
  '11000000-0000-0000-0000-000000000001', 'equal', null, null, null, '[]'::jsonb
)$$, 'P0001', 'expense_date_required', 'expense creation requires an explicit date');

select results_eq(
  $$select amount_minor
    from public.expense_splits
    where expense_id = (
      select id from public.expenses
      where client_operation_id = 'a1000000-0000-0000-0000-000000000014'
    )
    order by position$$,
  $$values (501::bigint), (500::bigint)$$,
  'odd-cent remainder allocation is deterministic'
);

insert into public.receipt_uploads (
  owner_id, client_operation_id, object_key, mime_type, size_bytes
) values
  (
    '11000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'staging/ledger-alice/receipt.jpg',
    'image/jpeg',
    1024
  ),
  (
    '22000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'staging/ledger-bob/receipt.jpg',
    'image/jpeg',
    1024
  ),
  (
    '11000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'staging/ledger-alice/replacement.jpg',
    'image/jpeg',
    2048
  );

select lives_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000015',
    '44000000-0000-0000-0000-000000000004', null,
    'Receipt expense', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, 'staging/ledger-alice/receipt.jpg', '[]'::jsonb
  )$$,
  'expense can attach an owned staged receipt'
);

select ok(
  exists (
    select 1 from public.receipt_uploads
    where object_key = 'staging/ledger-alice/receipt.jpg'
      and status = 'attached'
      and attached_expense_id = (
        select id from public.expenses
        where client_operation_id = 'a1000000-0000-0000-0000-000000000015'
      )
  ),
  'owned receipt transitions from staged to attached'
);

select set_config(
  'test.receipt_expense_id',
  (
    select id::text from public.expenses
    where client_operation_id = 'a1000000-0000-0000-0000-000000000015'
  ),
  true
);

select lives_ok(
  $$select public.update_expense_v2(
    current_setting('test.receipt_expense_id')::uuid,
    'Receipt expense', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, 'staging/ledger-alice/replacement.jpg', null
  )$$,
  'expense can replace an owned staged receipt'
);

select ok(
  exists (
    select 1 from public.receipt_uploads
    where object_key = 'staging/ledger-alice/receipt.jpg'
      and status = 'cleanup_pending'
      and attached_expense_id is null
  )
  and exists (
    select 1 from public.receipt_uploads
    where object_key = 'staging/ledger-alice/replacement.jpg'
      and status = 'attached'
      and attached_expense_id = current_setting('test.receipt_expense_id')::uuid
  ),
  'receipt replacement detaches the old upload and attaches the new upload'
);

select throws_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000016',
    '44000000-0000-0000-0000-000000000004', null,
    'Foreign receipt', 1000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'equal', now(), null, 'staging/ledger-bob/receipt.jpg', '[]'::jsonb
  )$$,
  'P0001', 'receipt_key_invalid_or_not_owned',
  'expense cannot attach another user receipt'
);

select lives_ok(
  $$select public.delete_expense_v2(
    current_setting('test.receipt_expense_id')::uuid
  )$$,
  'expense with receipt and notification can be deleted'
);

select ok(
  exists (
    select 1 from public.receipt_uploads
    where object_key = 'staging/ledger-alice/replacement.jpg'
      and status = 'cleanup_pending'
      and attached_expense_id is null
  )
  and not exists (
    select 1 from public.notifications
    where expense_id = current_setting('test.receipt_expense_id')::uuid
  ),
  'delete detaches receipt for cleanup and removes dependent notifications'
);

select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    100, 'USD', 'card', null
  )$$,
  'P0001', 'invalid_settlement_method',
  'settlement method must be an explicitly supported external method'
);

select throws_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    100, 'EUR', 'cash', null
  )$$,
  'P0001', 'group_currency_mismatch',
  'settlement currency must match the group'
);

select set_config('request.jwt.claim.sub', '33000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000003',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    100, 'USD', 'cash', null
  )$$,
  'P0001', 'context_not_authorized',
  'settlement actor and counterparty must belong to the group'
);

select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000004',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    501, 'USD', 'cash', null
  )$$,
  'P0001', 'BALANCE_CHANGED:-500',
  'settlement cannot exceed the latest open balance'
);

select lives_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000005',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    200, 'USD', 'bank_transfer', 'Partial payment'
  )$$,
  'valid partial settlement succeeds'
);

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
select throws_ok($$select public.create_settlement_v2(
  'b1000000-0000-0000-0000-000000000005',
  '22000000-0000-0000-0000-000000000002',
  '44000000-0000-0000-0000-000000000004', null,
  200, 'USD', 'bank_transfer', 'Partial payment'
)$$, 'P0001', 'operation_conflict',
  'settlement counterparty cannot replay the creating actor operation');
select is((select public.create_expense_v2(
  'a1000000-0000-0000-0000-000000000014', '44000000-0000-0000-0000-000000000004', null,
  'Odd cent', 1001, 'USD', 'other', '11000000-0000-0000-0000-000000000001',
  'equal', '2026-07-31 12:00:00+00', null, null, '[]'::jsonb
)), (select id from public.expenses where client_operation_id =
  'a1000000-0000-0000-0000-000000000014'), 'empty equal replay returns the original expense');

select lives_ok($$select public.update_expense_v2(
  (select id from public.expenses where client_operation_id = 'a1000000-0000-0000-0000-000000000014'),
  null, null, null, null, null, null, null, null, null, null
)$$, 'legacy partial update with omitted fields remains valid');
select is((select title from public.expenses where client_operation_id =
  'a1000000-0000-0000-0000-000000000014'), 'Odd cent',
  'legacy partial update preserves omitted fields');

select ok(
  exists (
    select 1 from public.settlements
    where client_operation_id = 'b1000000-0000-0000-0000-000000000005'
      and from_user_id = '22000000-0000-0000-0000-000000000002'
      and to_user_id = '11000000-0000-0000-0000-000000000001'
      and amount_minor = 200
  ),
  'settlement direction follows the current signed balance'
);

select is(
  (
    select public.create_settlement_v2(
      'b1000000-0000-0000-0000-000000000005',
      '11000000-0000-0000-0000-000000000001',
      '44000000-0000-0000-0000-000000000004', null,
      200, 'USD', 'bank_transfer', 'Partial payment'
    )
  ),
  (
    select id from public.settlements
    where client_operation_id = 'b1000000-0000-0000-0000-000000000005'
  ),
  'identical settlement replay returns the existing settlement'
);

select throws_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000005',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    100, 'USD', 'bank_transfer', 'Partial payment'
  )$$,
  'P0001', 'operation_conflict',
  'settlement replay with different financial input is rejected'
);

select set_config('request.jwt.claim.sub', '33000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$select public.create_settlement_v2(
    'b1000000-0000-0000-0000-000000000005',
    '11000000-0000-0000-0000-000000000001',
    '44000000-0000-0000-0000-000000000004', null,
    200, 'USD', 'bank_transfer', 'Partial payment'
  )$$,
  'P0001', 'operation_conflict',
  'settlement replay by a different actor is rejected'
);

create temp table test_settlement_ids (id uuid) on commit drop;
insert into test_settlement_ids(id)
  select id from public.settlements
  where client_operation_id = 'b1000000-0000-0000-0000-000000000005';
select throws_ok($$select public.delete_settlement_v2(
  (select id from test_settlement_ids)
)$$, 'P0001', 'not_settlement_party', 'unrelated actor cannot delete settlement');
select set_config('request.jwt.claim.sub', '22000000-0000-0000-0000-000000000002', true);
select lives_ok($$select public.delete_settlement_v2(
  (select id from test_settlement_ids)
)$$, 'settlement party can delete settlement');
select ok(not exists (select 1 from public.settlements where client_operation_id =
  'b1000000-0000-0000-0000-000000000005'), 'settlement deletion reverses its ledger row');
select ok(not exists (select 1 from public.notifications
  where kind = 'balance_reminder'
    and payload->>'settlement_id' = (select id::text from test_settlement_ids)),
  'settlement deletion removes related balance reminder notification');

-- Advisory-lock ordering and two-session replay races require external
-- multi-session verification; no single-session assertion is counted here.

select set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.create_expense_v2(
    'a1000000-0000-0000-0000-000000000017',
    '44000000-0000-0000-0000-000000000004', null,
    'Large share weights', 1000000000, 'USD', 'other',
    '11000000-0000-0000-0000-000000000001',
    'shares', now(), null, null,
    '[{"userId":"11000000-0000-0000-0000-000000000001","shareUnits":1000000000000,"position":0},{"userId":"22000000-0000-0000-0000-000000000002","shareUnits":1000000000000,"position":1}]'::jsonb
  )$$,
  'large valid share weights do not overflow intermediate allocation math'
);

select is(
  (
    select sum(amount_minor)
    from public.expense_splits
    where expense_id = (
      select id from public.expenses
      where client_operation_id = 'a1000000-0000-0000-0000-000000000017'
    )
  ),
  1000000000::bigint,
  'large-weight share allocations still equal the expense total'
);

select * from finish();
rollback;
