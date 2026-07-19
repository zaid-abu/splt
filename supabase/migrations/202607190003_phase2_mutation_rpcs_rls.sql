-- =============================================================================
-- Phase 2: Transactional Mutation RPCs & Authoritative RLS
--   All RPCs are SECURITY DEFINER with fixed search_path.
--   All derive actor identity from auth.uid() and validate non-null.
--   Execute as last step: revoke public, grant authenticated.
-- =============================================================================

-- ── 0. Update receipt_uploads status to include cleanup_pending ──────────────

alter table public.receipt_uploads
  drop constraint if exists receipt_uploads_status_check;

alter table public.receipt_uploads
  add constraint receipt_uploads_status_check
  check (status in ('staged', 'attached', 'cleanup_pending', 'cleaned'));


-- ── 1. Lifecycle RPCs ──────────────────────────────────────────────────────


-- ── 1a. create_group_v2 ─────────────────────────────────────────────────────

create or replace function public.create_group_v2(
  p_client_operation_id uuid,
  p_name text,
  p_kind text,
  p_icon text,
  p_currency text,
  p_invitee_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_group_id uuid;
  v_invitee_id uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_client_operation_id is not null then
    select id into v_group_id from public.groups
      where client_operation_id = p_client_operation_id;
    if found then
      return v_group_id;
    end if;
  end if;

  insert into public.groups (name, kind, icon, currency, created_by, client_operation_id)
  values (p_name, coalesce(p_kind, 'other'), p_icon, p_currency, v_actor, p_client_operation_id)
  returning id into v_group_id;

  insert into public.group_members (group_id, user_id) values (v_group_id, v_actor)
  on conflict (group_id, user_id) do nothing;

  if p_invitee_ids is not null then
    foreach v_invitee_id in array p_invitee_ids
    loop
      if v_invitee_id <> v_actor then
        insert into public.group_invitations (group_id, inviter_id, invitee_id)
        values (v_group_id, v_actor, v_invitee_id)
        on conflict do nothing;
      end if;
    end loop;
  end if;

  insert into public.activities (type, group_id, user_id, description)
  values ('group_created', v_group_id, v_actor, 'Created group');

  return v_group_id;
end;
$$;


-- ── 1b. invite_group_members_v2 ──────────────────────────────────────────────

create or replace function public.invite_group_members_v2(
  p_group_id uuid,
  p_invitee_ids uuid[]
) returns uuid[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_result uuid[];
  v_invitee_id uuid;
  v_invite_id uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.group_members where group_id = p_group_id and user_id = v_actor) then
    raise exception 'not_group_member' using errcode = 'P0001';
  end if;

  foreach v_invitee_id in array p_invitee_ids
  loop
    if v_invitee_id <> v_actor
       and not exists (select 1 from public.group_members where group_id = p_group_id and user_id = v_invitee_id)
    then
      insert into public.group_invitations (group_id, inviter_id, invitee_id)
      values (p_group_id, v_actor, v_invitee_id)
      on conflict do nothing
      returning id into v_invite_id;

      if v_invite_id is not null then
        v_result := array_append(v_result, v_invite_id);
      end if;
    end if;
  end loop;

  return v_result;
end;
$$;


-- ── 1c. respond_group_invitation ─────────────────────────────────────────────

create or replace function public.respond_group_invitation(
  p_invitation_id uuid,
  p_decision text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_invite record;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_invite
  from public.group_invitations
  where id = p_invitation_id and status = 'pending'
    and expires_at > now();

  if not found then
    raise exception 'invitation_not_found_or_expired' using errcode = 'P0001';
  end if;

  if v_invite.invitee_id <> v_actor then
    raise exception 'not_invitee' using errcode = 'P0001';
  end if;

  if p_decision = 'accepted' then
    insert into public.group_members (group_id, user_id)
    values (v_invite.group_id, v_actor)
    on conflict (group_id, user_id) do nothing;

    update public.group_invitations
    set status = 'accepted', updated_at = now()
    where id = p_invitation_id;

    insert into public.activities (type, group_id, user_id, description)
    values ('member_joined', v_invite.group_id, v_actor, 'Joined group via invitation');

  elsif p_decision = 'declined' then
    update public.group_invitations
    set status = 'declined', updated_at = now()
    where id = p_invitation_id;

  else
    raise exception 'invalid_decision' using errcode = 'P0001';
  end if;

  return v_invite.group_id;
end;
$$;


-- ── 1d. cancel_group_invitation ──────────────────────────────────────────────

create or replace function public.cancel_group_invitation(
  p_invitation_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  update public.group_invitations
  set status = 'cancelled', updated_at = now()
  where id = p_invitation_id
    and inviter_id = v_actor
    and status = 'pending';
end;
$$;


-- ── 1e. update_group_settings_v2 ─────────────────────────────────────────────

create or replace function public.update_group_settings_v2(
  p_group_id uuid,
  p_name text,
  p_kind text,
  p_icon text,
  p_currency text,
  p_new_expense_alerts boolean
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.groups where id = p_group_id and created_by = v_actor) then
    raise exception 'not_group_owner' using errcode = 'P0001';
  end if;

  update public.groups
  set name        = coalesce(p_name, name),
      kind        = coalesce(p_kind, kind),
      icon        = coalesce(p_icon, icon),
      currency    = coalesce(p_currency, currency)
  where id = p_group_id;

  if p_new_expense_alerts is not null then
    update public.group_members
    set new_expense_alerts = p_new_expense_alerts
    where group_id = p_group_id and user_id = v_actor;
  end if;
end;
$$;


-- ── 1f. remove_group_member_v2 ───────────────────────────────────────────────

create or replace function public.remove_group_member_v2(
  p_group_id uuid,
  p_user_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_keys text[];
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.groups where id = p_group_id and created_by = v_actor) then
    raise exception 'not_group_owner' using errcode = 'P0001';
  end if;

  if v_actor = p_user_id then
    raise exception 'cannot_remove_self' using errcode = 'P0001';
  end if;

  select array_agg(distinct public.balance_key('group', p_group_id, p_user_id, gm.user_id, g.currency))
  into v_keys
  from public.group_members gm
  cross join public.groups g
  where g.id = p_group_id and gm.group_id = p_group_id and gm.user_id <> p_user_id;

  if v_keys is not null then
    perform public.acquire_balance_locks(v_keys);
  end if;

  if public.context_has_nonzero_balances('group', p_group_id, p_user_id) then
    raise exception 'nonzero_balances' using errcode = 'P0001';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;

  update public.group_invitations
  set status = 'cancelled', updated_at = now()
  where group_id = p_group_id and invitee_id = p_user_id and status = 'pending';
end;
$$;


-- ── 1g. leave_group_v2 ───────────────────────────────────────────────────────

create or replace function public.leave_group_v2(
  p_group_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_is_owner boolean;
  v_keys text[];
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select exists (select 1 from public.groups where id = p_group_id and created_by = v_actor)
  into v_is_owner;

  if v_is_owner then
    raise exception 'owner_cannot_leave' using errcode = 'P0001';
  end if;

  select array_agg(distinct public.balance_key('group', p_group_id, v_actor, gm.user_id, g.currency))
  into v_keys
  from public.group_members gm
  cross join public.groups g
  where g.id = p_group_id and gm.group_id = p_group_id and gm.user_id <> v_actor;

  if v_keys is not null then
    perform public.acquire_balance_locks(v_keys);
  end if;

  if public.context_has_nonzero_balances('group', p_group_id, v_actor) then
    raise exception 'nonzero_balances' using errcode = 'P0001';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = v_actor;

  update public.group_invitations
  set status = 'cancelled', updated_at = now()
  where group_id = p_group_id and invitee_id = v_actor and status = 'pending';
end;
$$;


-- ── 1h. archive_group_v2 ─────────────────────────────────────────────────────

create or replace function public.archive_group_v2(
  p_group_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_keys text[];
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.groups where id = p_group_id and created_by = v_actor) then
    raise exception 'not_group_owner' using errcode = 'P0001';
  end if;

  select array_agg(distinct public.balance_key('group', p_group_id, gm1.user_id, gm2.user_id, g.currency))
  into v_keys
  from public.group_members gm1
  cross join public.group_members gm2
  cross join public.groups g
  where g.id = p_group_id and gm1.group_id = p_group_id and gm2.group_id = p_group_id
    and gm1.user_id < gm2.user_id;

  if v_keys is not null then
    perform public.acquire_balance_locks(v_keys);
  end if;

  if public.context_has_nonzero_balances('group', p_group_id) then
    raise exception 'nonzero_balances' using errcode = 'P0001';
  end if;

  update public.groups set archived_at = now() where id = p_group_id;

  update public.group_invitations
  set status = 'cancelled', updated_at = now()
  where group_id = p_group_id and status = 'pending';

  update public.recurring_expenses
  set status = 'paused'
  where group_id = p_group_id and status = 'active';
end;
$$;


-- ── 1i. transition_friendship ────────────────────────────────────────────────

create or replace function public.transition_friendship(
  p_counterparty_id uuid,
  p_action text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_friendship_id uuid;
  v_user_a uuid;
  v_user_b uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_counterparty_id = v_actor then
    raise exception 'cannot_self_friendship' using errcode = 'P0001';
  end if;

  v_user_a := least(v_actor, p_counterparty_id);
  v_user_b := greatest(v_actor, p_counterparty_id);

  select id into v_friendship_id
  from public.friendships
  where user_id = v_user_a and friend_id = v_user_b;

  case p_action
    when 'request' then
      if v_friendship_id is not null then
        select id into v_friendship_id
        from public.friendships
        where id = v_friendship_id and status in ('declined', 'removed', 'pending');

        if not found then
          raise exception 'friendship_already_exists' using errcode = 'P0001';
        end if;

        update public.friendships
        set status = 'pending', requested_by = v_actor,
            request_expires_at = now() + interval '30 days',
            updated_at = now()
        where id = v_friendship_id;
      else
        insert into public.friendships (user_id, friend_id, status, requested_by, request_expires_at)
        values (v_user_a, v_user_b, 'pending', v_actor, now() + interval '30 days')
        returning id into v_friendship_id;
      end if;

    when 'accept' then
      if v_friendship_id is null then
        raise exception 'friendship_not_found' using errcode = 'P0001';
      end if;

      update public.friendships
      set status = 'accepted', updated_at = now()
      where id = v_friendship_id
        and status = 'pending'
        and requested_by = p_counterparty_id
        and v_actor in (user_id, friend_id);

      if not found then
        raise exception 'cannot_accept' using errcode = 'P0001';
      end if;

    when 'decline' then
      if v_friendship_id is null then
        raise exception 'friendship_not_found' using errcode = 'P0001';
      end if;

      update public.friendships
      set status = 'declined', updated_at = now()
      where id = v_friendship_id
        and status = 'pending'
        and v_actor in (user_id, friend_id);

      if not found then
        raise exception 'cannot_decline' using errcode = 'P0001';
      end if;

    when 'remove' then
      if v_friendship_id is null then
        raise exception 'friendship_not_found' using errcode = 'P0001';
      end if;

      if not exists (
        select 1 from public.friendships
        where id = v_friendship_id and status = 'accepted'
          and v_actor in (user_id, friend_id)
      ) then
        raise exception 'cannot_remove' using errcode = 'P0001';
      end if;

      update public.friendships
      set status = 'removed', updated_at = now()
      where id = v_friendship_id;

    when 'block' then
      if v_friendship_id is not null then
        update public.friendships
        set status_before_block = status,
            blocked_by = v_actor,
            status = 'blocked',
            updated_at = now()
        where id = v_friendship_id
          and v_actor in (user_id, friend_id);
      else
        insert into public.friendships (user_id, friend_id, status, status_before_block, blocked_by)
        values (v_user_a, v_user_b, 'blocked', 'pending', v_actor)
        returning id into v_friendship_id;
      end if;

    when 'unblock' then
      if v_friendship_id is null then
        raise exception 'friendship_not_found' using errcode = 'P0001';
      end if;

      update public.friendships
      set status = coalesce(status_before_block, 'pending'),
          status_before_block = null,
          blocked_by = null,
          updated_at = now()
      where id = v_friendship_id
        and status = 'blocked'
        and blocked_by = v_actor;

      if not found then
        raise exception 'cannot_unblock' using errcode = 'P0001';
      end if;

    else
      raise exception 'invalid_action' using errcode = 'P0001';
  end case;

  return v_friendship_id;
end;
$$;


-- ── 1j. create_friend_invite ─────────────────────────────────────────────────

create or replace function public.create_friend_invite(
  p_client_operation_id uuid
) returns table(invite_id uuid, raw_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_raw_token text;
  v_token_hash bytea;
  v_invite_id uuid;
  v_expires_at timestamptz;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select fi.id, fi.expires_at into v_invite_id, v_expires_at
  from public.friend_invites fi
  where fi.client_operation_id = p_client_operation_id;

  if found then
    return query select v_invite_id, null::text, v_expires_at;
    return;
  end if;

  v_raw_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := digest(v_raw_token, 'sha256');
  v_expires_at := now() + interval '7 days';

  insert into public.friend_invites (created_by, token_hash, client_operation_id, expires_at)
  values (v_actor, v_token_hash, p_client_operation_id, v_expires_at)
  returning id into v_invite_id;

  return query select v_invite_id, v_raw_token, v_expires_at;
end;
$$;


-- ── 1k. revoke_friend_invite ──────────────────────────────────────────────────

create or replace function public.revoke_friend_invite(
  p_invite_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  update public.friend_invites
  set revoked_at = now()
  where id = p_invite_id
    and created_by = auth.uid()
    and revoked_at is null
    and redeemed_at is null;
end;
$$;


-- ── 1l. resolve_friend_invite ─────────────────────────────────────────────────

create or replace function public.resolve_friend_invite(
  p_token text
) returns table(state text, inviter_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token_hash bytea;
  v_invite record;
begin
  v_token_hash := digest(p_token, 'sha256');

  select fi.* into v_invite
  from public.friend_invites fi
  where fi.token_hash = v_token_hash;

  if not found then
    return query select 'invalid'::text, null::uuid, null::timestamptz;
    return;
  end if;

  if v_invite.revoked_at is not null then
    return query select 'revoked'::text, v_invite.created_by, v_invite.expires_at;
    return;
  end if;

  if v_invite.redeemed_at is not null then
    return query select 'redeemed'::text, v_invite.created_by, v_invite.expires_at;
    return;
  end if;

  if v_invite.expires_at <= now() then
    return query select 'expired'::text, v_invite.created_by, v_invite.expires_at;
    return;
  end if;

  return query select 'valid'::text, v_invite.created_by, v_invite.expires_at;
end;
$$;


-- ── 1m. redeem_friend_invite ──────────────────────────────────────────────────

create or replace function public.redeem_friend_invite(
  p_token text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_token_hash bytea;
  v_invite record;
  v_friendship_id uuid;
  v_user_a uuid;
  v_user_b uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  v_token_hash := digest(p_token, 'sha256');

  select fi.* into v_invite
  from public.friend_invites fi
  where fi.token_hash = v_token_hash;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0001';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'invite_revoked' using errcode = 'P0001';
  end if;

  if v_invite.redeemed_at is not null then
    raise exception 'invite_already_redeemed' using errcode = 'P0001';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;

  if v_invite.created_by = v_actor then
    raise exception 'cannot_redeem_own_invite' using errcode = 'P0001';
  end if;

  v_user_a := least(v_actor, v_invite.created_by);
  v_user_b := greatest(v_actor, v_invite.created_by);

  select id into v_friendship_id
  from public.friendships
  where user_id = v_user_a and friend_id = v_user_b;

  if v_friendship_id is not null then
    update public.friendships
    set status = 'accepted', updated_at = now()
    where id = v_friendship_id and status in ('pending', 'declined', 'removed');
  else
    insert into public.friendships (user_id, friend_id, status, requested_by)
    values (v_user_a, v_user_b, 'accepted', v_invite.created_by)
    returning id into v_friendship_id;
  end if;

  update public.friend_invites
  set redeemed_by = v_actor, redeemed_at = now()
  where id = v_invite.id;

  return v_invite.created_by;
end;
$$;


-- ── 1n. search_user_by_exact_email ────────────────────────────────────────────

create or replace function public.search_user_by_exact_email(
  p_email text
) returns table(state text, user_id uuid, name text, initials text, avatar text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_recent_count bigint;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select count(*) into v_recent_count
  from public.user_search_attempts
  where user_id = v_actor
    and attempted_at > now() - interval '1 minute';

  if v_recent_count >= 10 then
    return query select 'rate_limited'::text, null::uuid, null::text, null::text, null::text;
    return;
  end if;

  insert into public.user_search_attempts (user_id) values (v_actor);

  return query
  select
    'found'::text,
    u.id,
    u.name,
    u.initials,
    u.avatar
  from public.users u
  where lower(u.email) = lower(p_email)
    and u.id <> v_actor;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text, null::text, null::text;
  end if;
end;
$$;


-- ── 1o. send_balance_reminder ─────────────────────────────────────────────────

create or replace function public.send_balance_reminder(
  p_client_operation_id uuid,
  p_group_id uuid,
  p_friendship_id uuid,
  p_currency text,
  p_message text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_notification_id uuid;
  v_recipient_ids uuid[];
  v_recipient_id uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_group_id is null and p_friendship_id is null then
    raise exception 'context_required' using errcode = 'P0001';
  end if;

  if not public.context_has_nonzero_balances(
    case when p_group_id is not null then 'group' else 'direct' end,
    coalesce(p_group_id, p_friendship_id),
    v_actor
  ) then
    raise exception 'no_nonzero_balance' using errcode = 'P0001';
  end if;

  if p_client_operation_id is not null then
    select id into v_notification_id
    from public.notifications
    where client_operation_id = p_client_operation_id;
    if found then
      return v_notification_id;
    end if;
  end if;

  select array_agg(distinct ob.counterparty_id) into v_recipient_ids
  from public.get_open_balances() ob
  where ob.context_type = case when p_group_id is not null then 'group' else 'direct' end
    and ob.context_id = coalesce(p_group_id, p_friendship_id)
    and ob.signed_amount_minor > 0;

  if v_recipient_ids is null then
    raise exception 'no_recipients' using errcode = 'P0001';
  end if;

  foreach v_recipient_id in array v_recipient_ids
  loop
    insert into public.notifications (
      recipient_id, kind, actor_id, group_id, friendship_id, payload, client_operation_id
    )
    values (
      v_recipient_id, 'balance_reminder', v_actor, p_group_id, p_friendship_id,
      jsonb_build_object('currency', p_currency, 'message', p_message),
      p_client_operation_id
    )
    returning id into v_notification_id;
  end loop;

  return v_notification_id;
end;
$$;


-- ── 1p. register_receipt_upload ──────────────────────────────────────────────

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
  v_actor uuid;
  v_upload_id uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  insert into public.receipt_uploads (owner_id, client_operation_id, object_key, mime_type, size_bytes)
  values (v_actor, p_client_operation_id, p_object_key, p_mime_type, p_size_bytes)
  on conflict (owner_id, client_operation_id) do update set
    object_key = excluded.object_key,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    status = 'staged'
  returning id into v_upload_id;

  return v_upload_id;
end;
$$;


-- ── 2. Financial RPCs ──────────────────────────────────────────────────────


-- ── 2a. create_expense_internal_v2 (revoked from public/anon/authenticated) ─

create or replace function public.create_expense_internal_v2(
  p_actor_id uuid,
  p_client_operation_id uuid,
  p_group_id uuid,
  p_friendship_id uuid,
  p_title text,
  p_amount_minor bigint,
  p_currency text,
  p_category text,
  p_paid_by uuid,
  p_split_method text,
  p_date timestamptz,
  p_notes text,
  p_receipt_key text,
  p_splits jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expense_id uuid;
  v_scale smallint;
  v_amount_numeric numeric(12,2);
  v_split jsonb;
  v_user_id uuid;
  v_split_amount_minor bigint;
  v_pct_numeric numeric(5,2);
  v_share_numeric numeric(18,6);
  v_position integer;
  v_split_amount_numeric numeric(12,2);
  v_total_minor bigint := 0;
  v_total_pct bigint := 0;
  v_total_share numeric(18,6) := 0;
  v_member_ids uuid[];
  v_member_count integer;
  v_equal_minor bigint;
  v_remainder bigint;
  v_member_id uuid;
  v_key text;
  v_keys text[];
  v_has_receipt boolean := false;
begin
  if p_actor_id is null then
    raise exception 'actor_required' using errcode = 'P0001';
  end if;

  if (p_group_id is null) = (p_friendship_id is null) then
    raise exception 'exactly_one_context_required' using errcode = 'P0001';
  end if;

  v_scale := public.currency_minor_scale(p_currency);
  v_amount_numeric := round(p_amount_minor / power(10::numeric, v_scale), 2);

  -- Build balance lock keys
  if p_group_id is not null then
    select array_agg(distinct public.balance_key('group', p_group_id,
      least(p_paid_by, gm.user_id), greatest(p_paid_by, gm.user_id), p_currency))
    into v_keys
    from public.group_members gm
    where gm.group_id = p_group_id;
  else
    select array_agg(distinct public.balance_key('direct', p_friendship_id,
      least(p_paid_by, f.user_id), greatest(p_paid_by, f.friend_id), p_currency))
    into v_keys
    from public.friendships f
    where f.id = p_friendship_id;
  end if;

  if v_keys is not null then
    perform public.acquire_balance_locks(v_keys);
  end if;

  -- Client operation idempotency
  if p_client_operation_id is not null then
    select id into v_expense_id
    from public.expenses
    where client_operation_id = p_client_operation_id;
    if found then
      return v_expense_id;
    end if;
  end if;

  -- Insert expense
  insert into public.expenses (
    group_id, friendship_id, title, amount, amount_minor, currency, category,
    paid_by, created_by, split_method, date, notes, receipt_key, client_operation_id
  ) values (
    p_group_id, p_friendship_id, p_title, v_amount_numeric, p_amount_minor, p_currency, p_category,
    p_paid_by, p_actor_id, p_split_method,
    coalesce(p_date, now()), p_notes, p_receipt_key, p_client_operation_id
  ) returning id into v_expense_id;

  -- Process splits
  if p_split_method = 'equal' then
    if p_group_id is not null then
      select array_agg(user_id order by user_id) into v_member_ids
      from public.group_members where group_id = p_group_id;
    else
      select array[least(p_paid_by, least(
        (select user_id from public.friendships where id = p_friendship_id),
        (select friend_id from public.friendships where id = p_friendship_id)
      )), greatest(p_paid_by, greatest(
        (select user_id from public.friendships where id = p_friendship_id),
        (select friend_id from public.friendships where id = p_friendship_id)
      ))] into v_member_ids;
    end if;

    v_member_count := array_length(v_member_ids, 1);
    v_equal_minor := p_amount_minor / v_member_count;
    v_remainder := p_amount_minor - (v_equal_minor * v_member_count);

    for i in 1 .. v_member_count
    loop
      v_member_id := v_member_ids[i];
      v_split_amount_minor := v_equal_minor;
      if i = v_member_count then
        v_split_amount_minor := v_split_amount_minor + v_remainder;
      end if;

      v_split_amount_numeric := round(v_split_amount_minor / power(10::numeric, v_scale), 2);

      insert into public.expense_splits (
        expense_id, user_id, amount, amount_minor, position
      ) values (
        v_expense_id, v_member_id, v_split_amount_numeric, v_split_amount_minor, i - 1
      );
    end loop;

  else
    for v_split in select * from jsonb_array_elements(p_splits)
    loop
      v_user_id := (v_split->>'userId')::uuid;
      v_position := coalesce((v_split->>'position')::integer, 0);
      v_split_amount_minor := coalesce((v_split->>'amountMinor')::bigint, 0);
      v_pct_numeric := coalesce(round((v_split->>'percentageUnits')::numeric / 10000, 2), 0);
      v_share_numeric := coalesce((v_split->>'shareUnits')::numeric(18,6), 0);

      v_total_minor := v_total_minor + v_split_amount_minor;
      v_total_pct := v_total_pct + coalesce((v_split->>'percentageUnits')::bigint, 0);
      v_total_share := v_total_share + v_share_numeric;

      v_split_amount_numeric := round(v_split_amount_minor / power(10::numeric, v_scale), 2);

      insert into public.expense_splits (
        expense_id, user_id, amount, amount_minor,
        percentage, shares, position
      ) values (
        v_expense_id, v_user_id, v_split_amount_numeric, v_split_amount_minor,
        nullif(v_pct_numeric, 0), nullif(v_share_numeric, 0), v_position
      );
    end loop;

    if p_split_method = 'custom' and v_total_minor <> p_amount_minor then
      raise exception 'split_total_mismatch: actual=% expected=%', v_total_minor, p_amount_minor using errcode = 'P0001';
    end if;

    if p_split_method = 'percentage' and v_total_pct <> 100000000 then
      raise exception 'percentage_total_mismatch: actual=%', v_total_pct using errcode = 'P0001';
    end if;

    if p_split_method = 'shares' and v_total_share <= 0 then
      raise exception 'shares_total_invalid' using errcode = 'P0001';
    end if;
  end if;

  -- Activity
  insert into public.activities (
    type, group_id, expense_id, user_id, description, amount, amount_minor, currency
  ) values (
    'expense', p_group_id, v_expense_id, p_actor_id,
    p_title, v_amount_numeric, p_amount_minor, p_currency
  );

  -- Notifications for group members
  if p_group_id is not null then
    insert into public.notifications (recipient_id, kind, actor_id, group_id, expense_id, payload)
    select gm.user_id, 'expense_added', p_actor_id, p_group_id, v_expense_id,
           jsonb_build_object('title', p_title, 'amount_minor', p_amount_minor, 'currency', p_currency)
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id <> p_actor_id
      and gm.new_expense_alerts = true;
  elsif p_friendship_id is not null then
    insert into public.notifications (recipient_id, kind, actor_id, friendship_id, expense_id, payload)
    select
      case when f.user_id = p_actor_id then f.friend_id else f.user_id end,
      'expense_added', p_actor_id, p_friendship_id, v_expense_id,
      jsonb_build_object('title', p_title, 'amount_minor', p_amount_minor, 'currency', p_currency)
    from public.friendships f
    where f.id = p_friendship_id
      and (f.user_id = p_actor_id or f.friend_id = p_actor_id);
  end if;

  return v_expense_id;
end;
$$;

revoke all on function public.create_expense_internal_v2(uuid, uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb) from public, anon, authenticated;


-- ── 2b. create_expense_v2 ────────────────────────────────────────────────────

create or replace function public.create_expense_v2(
  p_client_operation_id uuid,
  p_group_id uuid,
  p_friendship_id uuid,
  p_title text,
  p_amount_minor bigint,
  p_currency text,
  p_category text,
  p_paid_by uuid,
  p_split_method text,
  p_date timestamptz,
  p_notes text,
  p_receipt_key text,
  p_splits jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_expense_id uuid;
  v_upload_id uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_receipt_key is not null then
    select id into v_upload_id
    from public.receipt_uploads
    where object_key = p_receipt_key
      and owner_id = v_actor
      and status = 'staged'
      and attached_expense_id is null;

    if not found then
      raise exception 'receipt_key_invalid_or_not_owned' using errcode = 'P0001';
    end if;
  end if;

  v_expense_id := public.create_expense_internal_v2(
    v_actor, p_client_operation_id, p_group_id, p_friendship_id,
    p_title, p_amount_minor, p_currency, p_category, p_paid_by,
    p_split_method, p_date, p_notes, p_receipt_key, p_splits
  );

  if p_receipt_key is not null then
    update public.receipt_uploads
    set status = 'attached', attached_expense_id = v_expense_id
    where id = v_upload_id;
  end if;

  return v_expense_id;
end;
$$;


-- ── 2c. update_expense_v2 ────────────────────────────────────────────────────

create or replace function public.update_expense_v2(
  p_expense_id uuid,
  p_title text,
  p_amount_minor bigint,
  p_currency text,
  p_category text,
  p_paid_by uuid,
  p_split_method text,
  p_date timestamptz,
  p_notes text,
  p_receipt_key text,
  p_splits jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_old_record record;
  v_scale smallint;
  v_amount_numeric numeric(12,2);
  v_new_amount_minor bigint;
  v_new_currency text;
  v_split jsonb;
  v_user_id uuid;
  v_split_amount_minor bigint;
  v_pct_numeric numeric(5,2);
  v_share_numeric numeric(18,6);
  v_position integer;
  v_split_amount_numeric numeric(12,2);
  v_total_minor bigint := 0;
  v_total_pct bigint := 0;
  v_total_share numeric(18,6) := 0;
  v_old_receipt_key text;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_old_record
  from public.expenses
  where id = p_expense_id;

  if not found then
    raise exception 'expense_not_found' using errcode = 'P0001';
  end if;

  if v_old_record.created_by <> v_actor then
    raise exception 'not_expense_creator' using errcode = 'P0001';
  end if;

  v_old_receipt_key := v_old_record.receipt_key;
  v_new_amount_minor := coalesce(p_amount_minor, v_old_record.amount_minor);
  v_new_currency := coalesce(p_currency, v_old_record.currency);
  v_scale := public.currency_minor_scale(v_new_currency);
  v_amount_numeric := round(v_new_amount_minor / power(10::numeric, v_scale), 2);

  -- Handle old receipt cleanup
  if v_old_receipt_key is not null and (p_receipt_key is null or p_receipt_key <> v_old_receipt_key) then
    update public.receipt_uploads
    set status = 'cleanup_pending'
    where object_key = v_old_receipt_key and status = 'attached';
  end if;

  -- Handle new receipt
  if p_receipt_key is not null and (v_old_receipt_key is null or p_receipt_key <> v_old_receipt_key) then
    if not exists (
      select 1 from public.receipt_uploads
      where object_key = p_receipt_key
        and owner_id = v_actor
        and status = 'staged'
    ) then
      raise exception 'receipt_key_invalid_or_not_owned' using errcode = 'P0001';
    end if;

    update public.receipt_uploads
    set status = 'attached', attached_expense_id = p_expense_id
    where object_key = p_receipt_key;
  end if;

  -- Acquire balance locks
  perform public.acquire_balance_locks(
    array[public.balance_key(
      case when v_old_record.group_id is not null then 'group' else 'direct' end,
      coalesce(v_old_record.group_id, v_old_record.friendship_id),
      v_old_record.paid_by, v_actor, v_new_currency
    )]
  );

  -- Update expense
  update public.expenses
  set title = coalesce(p_title, title),
      amount = v_amount_numeric,
      amount_minor = v_new_amount_minor,
      currency = v_new_currency,
      category = coalesce(p_category, category),
      paid_by = coalesce(p_paid_by, paid_by),
      split_method = coalesce(p_split_method, split_method),
      date = coalesce(p_date, date),
      notes = coalesce(p_notes, notes),
      receipt_key = coalesce(p_receipt_key, receipt_key)
  where id = p_expense_id;

  -- Remove old splits and re-insert
  delete from public.expense_splits where expense_id = p_expense_id;

  if p_split_method = 'equal' or p_splits is null then
    -- For equal splits, recalculate from existing pattern
    -- Re-insert splits based on old splits if no new ones provided
    if p_splits is null then
      for v_split in select * from jsonb_array_elements(
        (select jsonb_agg(
          jsonb_build_object('userId', user_id, 'amountMinor', amount_minor, 'position', position)
        ) from public.expense_splits where expense_id = p_expense_id)
      )
      loop
        insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position)
        values (
          p_expense_id,
          (v_split->>'userId')::uuid,
          round(((v_split->>'amountMinor')::bigint) / power(10::numeric, v_scale), 2),
          (v_split->>'amountMinor')::bigint,
          (v_split->>'position')::integer
        );
      end loop;
    else
      for v_split in select * from jsonb_array_elements(p_splits)
      loop
        v_user_id := (v_split->>'userId')::uuid;
        v_position := coalesce((v_split->>'position')::integer, 0);
        v_split_amount_minor := coalesce((v_split->>'amountMinor')::bigint, 0);
        v_split_amount_numeric := round(v_split_amount_minor / power(10::numeric, v_scale), 2);

        insert into public.expense_splits (expense_id, user_id, amount, amount_minor, position)
        values (p_expense_id, v_user_id, v_split_amount_numeric, v_split_amount_minor, v_position);
      end loop;
    end if;
  else
    for v_split in select * from jsonb_array_elements(p_splits)
    loop
      v_user_id := (v_split->>'userId')::uuid;
      v_position := coalesce((v_split->>'position')::integer, 0);
      v_split_amount_minor := coalesce((v_split->>'amountMinor')::bigint, 0);
      v_pct_numeric := coalesce(round((v_split->>'percentageUnits')::numeric / 10000, 2), 0);
      v_share_numeric := coalesce((v_split->>'shareUnits')::numeric(18,6), 0);

      v_total_minor := v_total_minor + v_split_amount_minor;
      v_total_pct := v_total_pct + coalesce((v_split->>'percentageUnits')::bigint, 0);
      v_total_share := v_total_share + v_share_numeric;

      v_split_amount_numeric := round(v_split_amount_minor / power(10::numeric, v_scale), 2);

      insert into public.expense_splits (
        expense_id, user_id, amount, amount_minor, percentage, shares, position
      ) values (
        p_expense_id, v_user_id, v_split_amount_numeric, v_split_amount_minor,
        nullif(v_pct_numeric, 0), nullif(v_share_numeric, 0), v_position
      );
    end loop;

    if p_split_method = 'custom' and v_total_minor <> v_new_amount_minor then
      raise exception 'split_total_mismatch' using errcode = 'P0001';
    end if;
    if p_split_method = 'percentage' and v_total_pct <> 100000000 then
      raise exception 'percentage_total_mismatch' using errcode = 'P0001';
    end if;
  end if;

  return p_expense_id;
end;
$$;


-- ── 2d. delete_expense_v2 ────────────────────────────────────────────────────

create or replace function public.delete_expense_v2(
  p_expense_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_expense record;
  v_keys text[];
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_expense
  from public.expenses
  where id = p_expense_id;

  if not found then
    raise exception 'expense_not_found' using errcode = 'P0001';
  end if;

  if v_expense.created_by <> v_actor then
    if v_expense.group_id is null or not exists (
      select 1 from public.groups where id = v_expense.group_id and created_by = v_actor
    ) then
      raise exception 'not_authorized' using errcode = 'P0001';
    end if;
  end if;

  -- Acquire balance locks
  select array_agg(distinct public.balance_key(
    case when v_expense.group_id is not null then 'group' else 'direct' end,
    coalesce(v_expense.group_id, v_expense.friendship_id),
    least(v_expense.paid_by, es.user_id),
    greatest(v_expense.paid_by, es.user_id),
    v_expense.currency
  ))
  into v_keys
  from public.expense_splits es
  where es.expense_id = p_expense_id;

  if v_keys is not null then
    perform public.acquire_balance_locks(v_keys);
  end if;

  -- Handle receipt cleanup
  if v_expense.receipt_key is not null then
    update public.receipt_uploads
    set status = 'cleanup_pending'
    where object_key = v_expense.receipt_key and status = 'attached';
  end if;

  delete from public.activities
  where expense_id = p_expense_id;

  delete from public.notifications
  where expense_id = p_expense_id;

  delete from public.expenses where id = p_expense_id;
end;
$$;


-- ── 2e. create_settlement_v2 ─────────────────────────────────────────────────

create or replace function public.create_settlement_v2(
  p_client_operation_id uuid,
  p_counterparty_id uuid,
  p_group_id uuid,
  p_friendship_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_method text,
  p_note text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid;
  v_settlement_id uuid;
  v_balance_key text;
  v_current_minor bigint;
  v_amount_numeric numeric(12,2);
  v_scale smallint;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_counterparty_id = v_actor then
    raise exception 'cannot_settle_with_self' using errcode = 'P0001';
  end if;

  if (p_group_id is null) = (p_friendship_id is null) then
    raise exception 'exactly_one_context_required' using errcode = 'P0001';
  end if;

  v_scale := public.currency_minor_scale(p_currency);
  v_amount_numeric := round(p_amount_minor / power(10::numeric, v_scale), 2);

  v_balance_key := public.balance_key(
    case when p_group_id is not null then 'group' else 'direct' end,
    coalesce(p_group_id, p_friendship_id),
    v_actor, p_counterparty_id, p_currency
  );

  perform public.acquire_balance_locks(array[v_balance_key]);

  -- Client operation idempotency
  if p_client_operation_id is not null then
    select id into v_settlement_id
    from public.settlements
    where client_operation_id = p_client_operation_id;
    if found then
      return v_settlement_id;
    end if;
  end if;

  -- Check current balance
  select coalesce(sum(signed_amount_minor), 0) into v_current_minor
  from public.get_open_balances() ob
  where ob.context_type = case when p_group_id is not null then 'group' else 'direct' end
    and ob.context_id = coalesce(p_group_id, p_friendship_id)
    and ob.counterparty_id = p_counterparty_id
    and ob.currency = p_currency;

  -- v_current_minor > 0 means counterparty owes actor; actor cannot pay when owed
  -- v_current_minor < 0 means actor owes counterparty; check payment doesn't exceed debt
  if (-v_current_minor) < p_amount_minor then
    raise exception 'BALANCE_CHANGED:%', v_current_minor using errcode = 'P0001';
  end if;

  insert into public.settlements (
    group_id, friendship_id, from_user_id, to_user_id,
    amount, amount_minor, currency, method, note, client_operation_id
  ) values (
    p_group_id, p_friendship_id, v_actor, p_counterparty_id,
    v_amount_numeric, p_amount_minor, p_currency, coalesce(p_method, 'cash'),
    p_note, p_client_operation_id
  ) returning id into v_settlement_id;

  -- Activity
  insert into public.activities (
    type, group_id, settlement_id, user_id, description, amount, amount_minor, currency
  ) values (
    'settlement', p_group_id, v_settlement_id, v_actor,
    'Settlement', v_amount_numeric, p_amount_minor, p_currency
  );

  -- Notification
  insert into public.notifications (
    recipient_id, kind, actor_id, group_id, payload, client_operation_id
  ) values (
    p_counterparty_id, 'balance_reminder', v_actor, p_group_id,
    jsonb_build_object(
      'settlement_id', v_settlement_id,
      'amount_minor', p_amount_minor,
      'currency', p_currency
    ),
    p_client_operation_id
  );

  return v_settlement_id;
end;
$$;


-- ── 3. Replace generate_due_recurring_expenses ───────────────────────────────

create or replace function public.generate_due_recurring_expenses(
  run_date date default current_date
) returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  rec record;
  generated_count integer := 0;
  occ_id uuid;
  exp_id uuid;
  v_amount_minor bigint;
  v_scale smallint;
  v_splits jsonb;
  v_split_entry record;
  v_share_total numeric;
begin
  for rec in
    select *
    from public.recurring_expenses
    where status = 'active'
      and next_run_date <= run_date
    order by next_run_date
  loop
    begin
      insert into public.recurring_occurrences (recurring_expense_id, scheduled_for, status)
      values (rec.id, rec.next_run_date, 'pending')
      on conflict (recurring_expense_id, scheduled_for) do nothing
      returning id into occ_id;

      if occ_id is null then
        -- Advance next_run_date anyway
        update public.recurring_expenses
        set next_run_date = public.next_recurring_date(
          rec.frequency, rec.interval_value,
          rec.next_run_date, rec.day_of_week, rec.day_of_month
        )
        where id = rec.id;
        continue;
      end if;

      if rec.auto_post and rec.amount is not null then
        v_scale := public.currency_minor_scale(rec.currency_code);
        v_amount_minor := round(rec.amount * power(10::numeric, v_scale))::bigint;

        v_splits := '[]'::jsonb;

        case rec.split_method
          when 'equal' then
            -- Generate empty splits array; internal function handles equal distribution
            v_splits := '[]'::jsonb;

          when 'amount' then
            for v_split_entry in
              select key::uuid as user_id, (value::text)::numeric as amt
              from jsonb_each(rec.split_config)
            loop
              v_splits := v_splits || jsonb_build_object(
                'userId', v_split_entry.user_id,
                'amountMinor', round(v_split_entry.amt * power(10::numeric, v_scale))::bigint,
                'position', (select count(*) from jsonb_array_elements(v_splits))
              );
            end loop;

          when 'percentage' then
            for v_split_entry in
              select key::uuid as user_id, (value::text)::numeric as pct
              from jsonb_each(rec.split_config)
            loop
              v_splits := v_splits || jsonb_build_object(
                'userId', v_split_entry.user_id,
                'amountMinor', round((v_split_entry.pct / 100.0) * rec.amount * power(10::numeric, v_scale))::bigint,
                'percentageUnits', round(v_split_entry.pct * 10000)::bigint,
                'position', (select count(*) from jsonb_array_elements(v_splits))
              );
            end loop;

          when 'shares' then
            select sum((value::text)::numeric) into v_share_total
            from jsonb_each(rec.split_config);

            for v_split_entry in
              select key::uuid as user_id, (value::text)::numeric as shr
              from jsonb_each(rec.split_config)
            loop
              v_splits := v_splits || jsonb_build_object(
                'userId', v_split_entry.user_id,
                'amountMinor', round((v_split_entry.shr / v_share_total) * rec.amount * power(10::numeric, v_scale))::bigint,
                'shareUnits', v_split_entry.shr,
                'position', (select count(*) from jsonb_array_elements(v_splits))
              );
            end loop;

          else
            raise warning 'Unknown split_method % for schedule %', rec.split_method, rec.id;
        end case;

        exp_id := public.create_expense_internal_v2(
          rec.created_by,
          gen_random_uuid(),
          rec.group_id, null,
          rec.title,
          v_amount_minor,
          rec.currency_code,
          'other',
          rec.paid_by_user_id,
          case rec.split_method when 'amount' then 'custom' else rec.split_method end,
          rec.next_run_date,
          null,
          null,
          v_splits
        );

        update public.expenses
        set recurring_expense_id = rec.id
        where id = exp_id;

        update public.recurring_occurrences
        set status = 'generated', expense_id = exp_id
        where id = occ_id;
      else
        update public.recurring_occurrences
        set status = 'skipped'
        where id = occ_id;
      end if;

      generated_count := generated_count + 1;

      if rec.auto_post then
        update public.recurring_expenses
        set next_run_date = public.next_recurring_date(
          rec.frequency, rec.interval_value,
          rec.next_run_date, rec.day_of_week, rec.day_of_month
        )
        where id = rec.id;
      end if;

    exception when others then
      if occ_id is not null then
        update public.recurring_occurrences
        set status = 'failed'
        where id = occ_id;
      end if;
      raise warning 'Failed to generate recurring expense % on %: %', rec.id, rec.next_run_date, SQLERRM;
    end;
  end loop;

  return generated_count;
end;
$$;

-- Fix: recurring_expenses table needs recurring_expense_id column for backlink
-- (recurring_expense_id already exists on expenses; we need a back-reference)
-- Skip — expenses.recurring_expense_id already exists from migration 202607180001


-- ── 4. RLS: Revoke direct INSERT/UPDATE/DELETE, keep SELECT ─────────────────

revoke insert, update, delete on public.expenses from authenticated;
revoke insert, update, delete on public.expense_splits from authenticated;
revoke insert, update, delete on public.settlements from authenticated;
revoke insert, update, delete on public.friendships from authenticated;
revoke insert, update, delete on public.group_invitations from authenticated;


-- ── 5. RLS: Add historical/view policies ─────────────────────────────────────

-- 5a. expenses: historical SELECT via can_view_expense
drop policy if exists "Users can read visible expenses" on public.expenses;
create policy "Users can read visible expenses"
on public.expenses for select
to authenticated
using (public.can_view_expense(id, auth.uid()));

-- 5b. expense_splits: historical SELECT via parent expense visibility
drop policy if exists "Users can read visible splits" on public.expense_splits;
create policy "Users can read visible splits"
on public.expense_splits for select
to authenticated
using (public.can_view_expense(expense_id, auth.uid()));

-- 5c. settlements: immutable parties can always read
drop policy if exists "Users can read visible settlements" on public.settlements;
create policy "Users can read visible settlements"
on public.settlements for select
to authenticated
using (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or (group_id is not null and public.can_view_group_history(group_id, auth.uid()))
);

-- 5d. friendships: self-only reads (user is always one of the two parties)
drop policy if exists "Users can view their friendships" on public.friendships;
create policy "Users can view their friendships"
on public.friendships for select
to authenticated
using (user_id = auth.uid() or friend_id = auth.uid());

-- 5e. group_invitations: invitee or inviter can read
drop policy if exists "Group invitations readable by involved parties" on public.group_invitations;
create policy "Group invitations readable by involved parties"
on public.group_invitations for select
to authenticated
using (inviter_id = auth.uid() or invitee_id = auth.uid());

-- 5f. groups: historical reads for past participants
drop policy if exists "Group members can read groups" on public.groups;
create policy "Group members can read groups"
on public.groups for select
to authenticated
using (
  created_by = auth.uid()
  or public.is_group_member(id, auth.uid())
  or public.can_view_group_history(id, auth.uid())
);

-- 5g. group_members: historical reads via can_view_group_history
drop policy if exists "Group members can read memberships" on public.group_members;
create policy "Group members can read memberships"
on public.group_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_member(group_id, auth.uid())
  or public.can_view_group_history(group_id, auth.uid())
);

-- 5h. group_members: self-only update for alert preferences
drop policy if exists "Members can update own alert preference" on public.group_members;
create policy "Members can update own alert preference"
on public.group_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 5i. groups: creator-only identity mutations (name, icon, currency)
drop policy if exists "Group owners can update groups" on public.groups;
create policy "Group owners can update groups"
on public.groups for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- 5j. notifications: recipient-only reads
drop policy if exists "Notifications readable by recipient" on public.notifications;
create policy "Notifications readable by recipient"
on public.notifications for select
to authenticated
using (recipient_id = auth.uid());

-- 5k. friend_invites: creator can read own invites
drop policy if exists "Friend invites readable by creator" on public.friend_invites;
create policy "Friend invites readable by creator"
on public.friend_invites for select
to authenticated
using (created_by = auth.uid());

-- 5l. receipt_uploads: owner reads
drop policy if exists "Receipt uploads readable by owner" on public.receipt_uploads;
create policy "Receipt uploads readable by owner"
on public.receipt_uploads for select
to authenticated
using (owner_id = auth.uid());

-- 5m. activities: participants can read historical activities
drop policy if exists "Users can read visible activities" on public.activities;
create policy "Users can read visible activities"
on public.activities for select
to authenticated
using (
  user_id = auth.uid()
  or (group_id is not null and public.can_view_group_history(group_id, auth.uid()))
  or (expense_id is not null and public.can_view_expense(expense_id, auth.uid()))
);


-- ── 6. Grants ────────────────────────────────────────────────────────────────

-- Revoke execute from public for all new functions
revoke all on function public.create_group_v2(uuid, text, text, text, text, uuid[]) from public;
revoke all on function public.invite_group_members_v2(uuid, uuid[]) from public;
revoke all on function public.respond_group_invitation(uuid, text) from public;
revoke all on function public.cancel_group_invitation(uuid) from public;
revoke all on function public.update_group_settings_v2(uuid, text, text, text, text, boolean) from public;
revoke all on function public.remove_group_member_v2(uuid, uuid) from public;
revoke all on function public.leave_group_v2(uuid) from public;
revoke all on function public.archive_group_v2(uuid) from public;
revoke all on function public.transition_friendship(uuid, text) from public;
revoke all on function public.create_friend_invite(uuid) from public;
revoke all on function public.revoke_friend_invite(uuid) from public;
revoke all on function public.resolve_friend_invite(text) from public;
revoke all on function public.redeem_friend_invite(text) from public;
revoke all on function public.search_user_by_exact_email(text) from public;
revoke all on function public.send_balance_reminder(uuid, uuid, uuid, text, text) from public;
revoke all on function public.register_receipt_upload(uuid, text, text, bigint) from public;
revoke all on function public.create_expense_v2(uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb) from public;
revoke all on function public.update_expense_v2(uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb) from public;
revoke all on function public.delete_expense_v2(uuid) from public;
revoke all on function public.create_settlement_v2(uuid, uuid, uuid, uuid, bigint, text, text, text) from public;
revoke all on function public.generate_due_recurring_expenses(date) from public;

-- Grant execute to authenticated
grant execute on function public.create_group_v2(uuid, text, text, text, text, uuid[]) to authenticated;
grant execute on function public.invite_group_members_v2(uuid, uuid[]) to authenticated;
grant execute on function public.respond_group_invitation(uuid, text) to authenticated;
grant execute on function public.cancel_group_invitation(uuid) to authenticated;
grant execute on function public.update_group_settings_v2(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.remove_group_member_v2(uuid, uuid) to authenticated;
grant execute on function public.leave_group_v2(uuid) to authenticated;
grant execute on function public.archive_group_v2(uuid) to authenticated;
grant execute on function public.transition_friendship(uuid, text) to authenticated;
grant execute on function public.create_friend_invite(uuid) to authenticated;
grant execute on function public.revoke_friend_invite(uuid) to authenticated;
grant execute on function public.resolve_friend_invite(text) to authenticated;
grant execute on function public.redeem_friend_invite(text) to authenticated;
grant execute on function public.search_user_by_exact_email(text) to authenticated;
grant execute on function public.send_balance_reminder(uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.register_receipt_upload(uuid, text, text, bigint) to authenticated;
grant execute on function public.create_expense_v2(uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb) to authenticated;
grant execute on function public.update_expense_v2(uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb) to authenticated;
grant execute on function public.delete_expense_v2(uuid) to authenticated;
grant execute on function public.create_settlement_v2(uuid, uuid, uuid, uuid, bigint, text, text, text) to authenticated;
grant execute on function public.generate_due_recurring_expenses(date) to authenticated;

-- Keep service_role access for generate_due_recurring_expenses (used by pg_cron)
grant execute on function public.generate_due_recurring_expenses(date) to service_role;
