-- =============================================================================
-- Fix: Support both settlement directions in create_settlement_v2
--
-- Previously the RPC always set from_user_id = v_actor (the current user),
-- meaning settlements only worked when the current user was paying the
-- counterparty. When the counterparty owed the current user (v_current_minor > 0),
-- the BALANCE_CHANGED check always rejected the settlement because:
--   (-v_current_minor) < p_amount_minor  →  -5000 < 5000  → true → error
--
-- Fix: Swap from_user_id / to_user_id based on the balance sign, and
-- correct the validation check to use absolute values.
-- =============================================================================

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
  v_from_user_id uuid;
  v_to_user_id uuid;
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

  if v_current_minor = 0 then
    raise exception 'BALANCE_CHANGED:0' using errcode = 'P0001';
  end if;

  -- Validate amount and determine direction
  if v_current_minor > 0 then
    -- Counterparty owes actor → counterparty pays actor
    if p_amount_minor > v_current_minor then
      raise exception 'BALANCE_CHANGED:%', v_current_minor using errcode = 'P0001';
    end if;
    v_from_user_id := p_counterparty_id;
    v_to_user_id := v_actor;
  else
    -- Actor owes counterparty → actor pays counterparty
    if p_amount_minor > (-v_current_minor) then
      raise exception 'BALANCE_CHANGED:%', v_current_minor using errcode = 'P0001';
    end if;
    v_from_user_id := v_actor;
    v_to_user_id := p_counterparty_id;
  end if;

  insert into public.settlements (
    group_id, friendship_id, from_user_id, to_user_id,
    amount, amount_minor, currency, method, note, client_operation_id
  ) values (
    p_group_id, p_friendship_id, v_from_user_id, v_to_user_id,
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
