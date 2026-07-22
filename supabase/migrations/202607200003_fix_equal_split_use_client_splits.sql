-- =============================================================================
-- Fix: Equal split calculation — use client-provided p_splits
--
-- Previously the RPC ignored p_splits for equal splits and recalculated from
-- group_members table using a different sort order (user_id ASC) and remainder
-- strategy (all to last member). This caused the DB to store different split
-- amounts than what the client preview showed.
--
-- Fix: When p_splits is non-empty for equal method, use those values instead
-- of recalculating. The client's calculateSplits() distributes remainders one
-- unit at a time starting from the first sorted participant, which is the
-- authoritative split distribution.
-- =============================================================================

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
  v_splits_length integer;
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
  v_splits_length := jsonb_array_length(p_splits);

  if p_split_method = 'equal' and v_splits_length > 0 then
    -- Use client-provided splits (authoritative)
    for v_split in select * from jsonb_array_elements(p_splits)
    loop
      v_user_id := (v_split->>'userId')::uuid;
      v_position := coalesce((v_split->>'position')::integer, 0);
      v_split_amount_minor := coalesce((v_split->>'amountMinor')::bigint, 0);
      v_split_amount_numeric := round(v_split_amount_minor / power(10::numeric, v_scale), 2);

      insert into public.expense_splits (
        expense_id, user_id, amount, amount_minor, position
      ) values (
        v_expense_id, v_user_id, v_split_amount_numeric, v_split_amount_minor, v_position
      );
    end loop;

  elsif p_split_method = 'equal' then
    -- Fallback: no splits provided, calculate from group members
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

    if p_split_method = 'percentage' and v_total_pct <> 1000000 then
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
