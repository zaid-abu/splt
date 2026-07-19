-- =============================================================================
-- Phase 2: Private Receipt Storage Infrastructure
--   - Create expense-receipts bucket (private)
--   - Storage RLS policies for staging and attached reads
--   - No direct storage.objects DELETE statements (cleanup via Edge Function)
-- =============================================================================

-- ── 1. Create expense-receipts bucket ───────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-receipts',
  'expense-receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


-- ── 2. Storage RLS policies ─────────────────────────────────────────────────

-- 2a. Authenticated users can upload objects under staging/{auth.uid()}/
drop policy if exists "Users stage their own receipts" on storage.objects;
create policy "Users stage their own receipts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = 'staging'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 2b. Authenticated users can read their own staging objects
drop policy if exists "Users read own staging receipts" on storage.objects;
create policy "Users read own staging receipts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = 'staging'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 2c. Authenticated users can read attached receipts via expense visibility
drop policy if exists "Users read attached receipts via expense access" on storage.objects;
create policy "Users read attached receipts via expense access"
on storage.objects for select
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = 'attached'
  and exists (
    select 1
    from public.receipt_uploads ru
    where ru.object_key = name
      and ru.status = 'attached'
      and public.can_view_expense(ru.attached_expense_id, auth.uid())
  )
);

-- 2d. Authenticated users can update their own staging objects
drop policy if exists "Users update own staging receipts" on storage.objects;
create policy "Users update own staging receipts"
on storage.objects for update
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = 'staging'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = 'staging'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- 2e. Authenticated users can delete their own staging objects
drop policy if exists "Users delete own staging receipts" on storage.objects;
create policy "Users delete own staging receipts"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] = 'staging'
  and (storage.foldername(name))[2] = auth.uid()::text
);
