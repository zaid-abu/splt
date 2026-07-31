-- Receipt lifecycle hardening: authorized reads, explicit discard, and leased cleanup.

alter table public.receipt_uploads
  add column if not exists cleanup_attempts integer not null default 0,
  add column if not exists cleanup_leased_until timestamptz,
  add column if not exists cleanup_last_error text;

create index if not exists receipt_uploads_cleanup_claim_idx
  on public.receipt_uploads(status, cleanup_leased_until, created_at);

drop policy if exists "Users read attached receipts via expense access" on storage.objects;
create policy "Users read attached receipts via expense access"
on storage.objects for select
to authenticated
using (
  bucket_id = 'expense-receipts'
  and exists (
    select 1
    from public.receipt_uploads ru
    where ru.object_key = name
      and ru.status = 'attached'
      and public.can_view_expense(ru.attached_expense_id, auth.uid())
  )
);

-- Registration is replay-safe only for the exact same staged metadata. It never
-- replaces an existing object or resets an attached/cleanup row to staged.
create or replace function public.register_receipt_upload(
  p_client_operation_id uuid,
  p_object_key text,
  p_mime_type text,
  p_size_bytes bigint
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_upload public.receipt_uploads%rowtype;
  v_upload_id uuid;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  insert into public.receipt_uploads (
    owner_id, client_operation_id, object_key, mime_type, size_bytes
  ) values (
    v_actor, p_client_operation_id, p_object_key, p_mime_type, p_size_bytes
  ) returning id into v_upload_id;

  return v_upload_id;
exception when unique_violation then
  select * into v_upload
  from public.receipt_uploads
  where owner_id = v_actor
    and client_operation_id = p_client_operation_id
  for update;

  if found
    and v_upload.status = 'staged'
    and v_upload.object_key = p_object_key
    and v_upload.mime_type = p_mime_type
    and v_upload.size_bytes = p_size_bytes
  then
    return v_upload.id;
  end if;

  raise exception 'operation_conflict' using errcode = 'P0001';
end;
$$;

revoke all on function public.register_receipt_upload(uuid, text, text, bigint)
  from public, anon;
grant execute on function public.register_receipt_upload(uuid, text, text, bigint)
  to authenticated;

create or replace function public.discard_staged_receipt_v2(p_object_key text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_upload public.receipt_uploads%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_upload
  from public.receipt_uploads
  where object_key = p_object_key
    and owner_id = v_actor
    and status in ('staged', 'cleanup_pending')
    and attached_expense_id is null
  for update;

  if not found then
    return null;
  end if;

  if v_upload.status = 'staged' then
    update public.receipt_uploads
    set status = 'cleanup_pending', cleanup_last_error = null
    where id = v_upload.id;
  end if;

  return v_upload.id;
end;
$$;

revoke all on function public.discard_staged_receipt_v2(text) from public, anon;
grant execute on function public.discard_staged_receipt_v2(text) to authenticated;

create or replace function public.claim_receipt_cleanup(p_limit integer default 50)
returns table (id uuid, object_key text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with candidates as (
    select ru.id
    from public.receipt_uploads ru
    where (
      ru.status = 'staged'
      and ru.created_at < now() - interval '24 hours'
      or ru.status = 'cleanup_pending'
    )
      and (ru.cleanup_leased_until is null or ru.cleanup_leased_until < now())
    order by ru.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 50), 500))
  )
  update public.receipt_uploads ru
  set cleanup_leased_until = now() + interval '5 minutes',
      cleanup_attempts = ru.cleanup_attempts + 1
  from candidates
  where ru.id = candidates.id
  returning ru.id, ru.object_key;
end;
$$;

create or replace function public.complete_receipt_cleanup(
  p_id uuid,
  p_success boolean,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.receipt_uploads
  set status = case when p_success then 'cleaned' else status end,
      cleaned_at = case when p_success then now() else cleaned_at end,
      cleanup_last_error = case when p_success then null else left(p_error, 1000) end,
      cleanup_leased_until = null
  where id = p_id;
end;
$$;

revoke all on function public.claim_receipt_cleanup(integer) from public, anon, authenticated;
revoke all on function public.complete_receipt_cleanup(uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.claim_receipt_cleanup(integer) to service_role;
grant execute on function public.complete_receipt_cleanup(uuid, boolean, text) to service_role;
