begin;
select plan(15);

insert into auth.users (id, email) values
  ('91000000-0000-0000-0000-000000000001', 'receipt-owner@test.com'),
  ('91000000-0000-0000-0000-000000000002', 'receipt-member@test.com'),
  ('91000000-0000-0000-0000-000000000003', 'receipt-outsider@test.com');
insert into public.users (id, name, email, initials) values
  ('91000000-0000-0000-0000-000000000001', 'Owner', 'receipt-owner@test.com', 'O'),
  ('91000000-0000-0000-0000-000000000002', 'Member', 'receipt-member@test.com', 'M'),
  ('91000000-0000-0000-0000-000000000003', 'Outsider', 'receipt-outsider@test.com', 'X');
insert into public.groups (id, name, icon, currency, created_by)
values ('91000000-0000-0000-0000-000000000010', 'Receipt Group', 'users', 'USD',
  '91000000-0000-0000-0000-000000000001');
insert into public.group_members (group_id, user_id) values
  ('91000000-0000-0000-0000-000000000010', '91000000-0000-0000-0000-000000000001'),
  ('91000000-0000-0000-0000-000000000010', '91000000-0000-0000-0000-000000000002');
insert into public.expenses (id, group_id, title, amount, amount_minor, currency, category,
  paid_by, created_by, split_method, date)
values ('91000000-0000-0000-0000-000000000020', '91000000-0000-0000-0000-000000000010',
  'Receipt expense', 10, 1000, 'USD', 'other', '91000000-0000-0000-0000-000000000001',
  '91000000-0000-0000-0000-000000000001', 'equal', now());
insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position) values
  ('91000000-0000-0000-0000-000000000020', '91000000-0000-0000-0000-000000000001', 5, 500, 0),
  ('91000000-0000-0000-0000-000000000020', '91000000-0000-0000-0000-000000000002', 5, 500, 1);

insert into public.receipt_uploads (owner_id, client_operation_id, object_key, mime_type, size_bytes)
values ('91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000030',
  'staging/91000000-0000-0000-0000-000000000001/receipt-a/receipt', 'image/jpeg', 100);

select ok(
  exists (select 1 from pg_policies where schemaname = 'storage'
    and tablename = 'objects' and policyname = 'Users read attached receipts via expense access'
    and qual like '%can_view_expense%'),
  'attached storage reads use expense visibility regardless of object prefix');
select ok(
  exists (select 1 from pg_policies where schemaname = 'storage'
    and tablename = 'objects' and policyname = 'Users read own staging receipts'
    and qual like '%auth.uid()%'),
  'staging reads remain owner-only');
select ok(
  has_function_privilege('authenticated', 'public.discard_staged_receipt_v2(text)', 'EXECUTE'),
  'authenticated users can discard staged receipts');
select ok(
  not has_function_privilege('anon', 'public.discard_staged_receipt_v2(text)', 'EXECUTE'),
  'anonymous users cannot discard receipts');

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.discard_staged_receipt_v2(
    'staging/91000000-0000-0000-0000-000000000001/receipt-a/receipt')$$,
  'owner can discard staged receipt');
select is(
  (select status from public.receipt_uploads where object_key like '%receipt-a/receipt'),
  'cleanup_pending', 'discard marks staged row cleanup_pending');
select lives_ok(
  $$select public.discard_staged_receipt_v2(
    'staging/91000000-0000-0000-0000-000000000001/receipt-a/receipt')$$,
  'discard is idempotent');

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000002', true);
select is(
  public.discard_staged_receipt_v2(
    'staging/91000000-0000-0000-0000-000000000001/receipt-a/receipt'),
  null::uuid, 'non-owner cannot claim a receipt for discard');

update public.receipt_uploads
set status = 'attached', attached_expense_id = '91000000-0000-0000-0000-000000000020'
where object_key like '%receipt-a/receipt';
select ok(
  (select status = 'attached' and attached_expense_id is not null from public.receipt_uploads
    where object_key like '%receipt-a/receipt'),
  'attachment is represented by one locked receipt row state');
select is(
  (select count(*) from public.receipt_uploads where object_key like '%receipt-a/receipt'),
  1::bigint, 'one object key cannot attach to two expense rows');

insert into public.receipt_uploads (owner_id, client_operation_id, object_key, mime_type, size_bytes)
values ('91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000031',
  'staging/91000000-0000-0000-0000-000000000001/receipt-b/receipt', 'image/png', 100);
select public.discard_staged_receipt_v2(
  'staging/91000000-0000-0000-0000-000000000001/receipt-b/receipt');
select is(
  (select status from public.receipt_uploads where object_key like '%receipt-b/receipt'),
  'cleanup_pending', 'replacement/removal rows enter cleanup_pending');
select is((select count(*) from public.claim_receipt_cleanup(10)), 1::bigint,
  'cleanup claim returns leased cleanup rows');
select ok(
  (select cleanup_leased_until is not null and cleanup_attempts = 1
    from public.receipt_uploads where object_key like '%receipt-b/receipt'),
  'cleanup claim records lease and attempt metadata');
select lives_ok(
  $$select public.complete_receipt_cleanup(
    (select id from public.receipt_uploads where object_key like '%receipt-b/receipt'), true, null)$$,
  'cleanup completion marks row cleaned after deletion success');
select is(
  (select status from public.receipt_uploads where object_key like '%receipt-b/receipt'),
  'cleaned', 'cleanup success is persisted');

select * from finish();
rollback;
