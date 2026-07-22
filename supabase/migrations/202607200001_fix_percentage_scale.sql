-- =============================================================================
-- Fix: Align percentageUnits scale between client and DB RPCs
--
-- The client stores percentageUnits as actualPercent × 10,000 (e.g., 50% = 500000)
-- and validates that the sum equals 1,000,000. The RPCs were checking for a sum
-- of 100,000,000, which would only pass if the client double-multiplied by 10000.
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


-- ── Fix update_expense_v2 percentage check ────────────────────────────────────

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
    if p_split_method = 'percentage' and v_total_pct <> 1000000 then
      raise exception 'percentage_total_mismatch' using errcode = 'P0001';
    end if;
  end if;

  return p_expense_id;
end;
$$;
