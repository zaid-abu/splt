-- =============================================================================
-- Ledger hardening
--
-- Makes expense and settlement writes fail closed.  This migration intentionally
-- does not repair historical rows; run a separate, approved data-remediation
-- migration after auditing existing ledger data.
-- =============================================================================

-- Legacy amount columns are numeric(12,2). Keep integer writes inside that
-- storage envelope. Existing rows remain NOT VALID because old display values
-- cannot always reconstruct their original client units without guessing.
create or replace function public.ledger_amount_ceiling(p_currency text)
returns numeric
language sql
immutable
set search_path = public, pg_temp
as $$
  select 10000000000::numeric * power(10::numeric,
    public.currency_minor_scale(upper(p_currency))) - 1
$$;

revoke all on function public.ledger_amount_ceiling(text) from public, anon, authenticated;

alter table public.expenses drop constraint if exists expenses_amount_minor_storage_check;
alter table public.expenses add constraint expenses_amount_minor_storage_check
  check (amount_minor is null or amount_minor::numeric <= public.ledger_amount_ceiling(currency)) not valid;
alter table public.settlements drop constraint if exists settlements_amount_minor_storage_check;
alter table public.settlements add constraint settlements_amount_minor_storage_check
  check (amount_minor is null or amount_minor::numeric <= public.ledger_amount_ceiling(currency)) not valid;
alter table public.activities drop constraint if exists activities_amount_minor_storage_check;
alter table public.activities add constraint activities_amount_minor_storage_check
  check (amount_minor is null or currency is null or amount_minor::numeric <= public.ledger_amount_ceiling(currency)) not valid;

create or replace function public.enforce_ledger_amount_ceiling()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_currency text;
begin
  if tg_table_name = 'expense_splits' then
    select currency into v_currency from public.expenses where id = new.expense_id;
  else
    v_currency := new.currency;
  end if;
  if new.amount_minor is not null and v_currency is not null
    and new.amount_minor::numeric > public.ledger_amount_ceiling(v_currency) then
    raise exception 'amount_out_of_range' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_ledger_amount_ceiling() from public, anon, authenticated;

alter table public.settlements
  add column if not exists created_by uuid references public.users(id);
drop trigger if exists expenses_amount_ceiling_trigger on public.expenses;
create trigger expenses_amount_ceiling_trigger before insert or update on public.expenses
for each row execute function public.enforce_ledger_amount_ceiling();
drop trigger if exists expense_splits_amount_ceiling_trigger on public.expense_splits;
create trigger expense_splits_amount_ceiling_trigger before insert or update on public.expense_splits
for each row execute function public.enforce_ledger_amount_ceiling();
drop trigger if exists settlements_amount_ceiling_trigger on public.settlements;
create trigger settlements_amount_ceiling_trigger before insert or update on public.settlements
for each row execute function public.enforce_ledger_amount_ceiling();
drop trigger if exists activities_amount_ceiling_trigger on public.activities;
create trigger activities_amount_ceiling_trigger before insert or update on public.activities
for each row execute function public.enforce_ledger_amount_ceiling();

-- New expenses must be positive. NOT VALID preserves existing historical rows
-- while applying the rule to every row written after this migration.
alter table public.expenses
  drop constraint if exists expenses_amount_minor_check;

alter table public.expenses
  add constraint expenses_amount_minor_check
  check (amount_minor > 0) not valid;

-- Preserve exact source units for future edits and idempotency checks. Existing
-- rows remain nullable because their lower-precision display columns cannot
-- reconstruct the original client units without guessing.
alter table public.expense_splits
  add column if not exists percentage_units bigint,
  add column if not exists share_units bigint;

alter table public.expense_splits
  drop constraint if exists expense_splits_percentage_units_check;
alter table public.expense_splits
  add constraint expense_splits_percentage_units_check
  check (percentage_units is null or percentage_units > 0);

alter table public.expense_splits
  drop constraint if exists expense_splits_share_units_check;
alter table public.expense_splits
  add constraint expense_splits_share_units_check
  check (share_units is null or share_units > 0);

-- ── Private split writer ─────────────────────────────────────────────────────
-- This is the sole place that validates membership and calculates split minor
-- units.  Client-provided amountMinor values are accepted only for custom splits.

create or replace function public.apply_expense_splits_v3(
  p_expense_id uuid,
  p_actor_id uuid,
  p_group_id uuid,
  p_friendship_id uuid,
  p_paid_by uuid,
  p_amount_minor bigint,
  p_currency text,
  p_split_method text,
  p_splits jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group_currency text;
  v_friendship record;
  v_payload jsonb;
  v_split jsonb;
  v_user_id uuid;
  v_position integer;
  v_amount_minor bigint;
  v_units bigint;
  v_user_ids uuid[] := '{}'::uuid[];
  v_positions integer[] := '{}'::integer[];
  v_amounts bigint[] := '{}'::bigint[];
  v_units_by_index bigint[] := '{}'::bigint[];
  v_allocations bigint[] := '{}'::bigint[];
  v_count integer;
  v_total_units bigint := 0;
  v_total_units_numeric numeric := 0;
  v_total_allocated numeric := 0;
  v_remainder bigint;
  v_index integer;
  v_scale smallint;
  v_lock_keys text[];
begin
  if p_actor_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'expense_amount_must_be_positive' using errcode = 'P0001';
  end if;

  if p_amount_minor::numeric > public.ledger_amount_ceiling(upper(p_currency)) then
    raise exception 'amount_out_of_range' using errcode = 'P0001';
  end if;

  if p_paid_by is null then
    raise exception 'payer_required' using errcode = 'P0001';
  end if;

  if p_split_method is null or p_split_method not in ('equal', 'custom', 'percentage', 'shares') then
    raise exception 'invalid_split_method' using errcode = 'P0001';
  end if;

  -- Validate the currency before any amount conversion.
  v_scale := public.currency_minor_scale(upper(p_currency));

  if p_amount_minor::numeric > public.ledger_amount_ceiling(upper(p_currency)) then
    raise exception 'amount_out_of_range' using errcode = 'P0001';
  end if;

  if (p_group_id is null) = (p_friendship_id is null) then
    raise exception 'exactly_one_context_required' using errcode = 'P0001';
  end if;

  if p_group_id is not null then
    select currency into v_group_currency from public.groups where id = p_group_id;
    if not found then
      raise exception 'group_not_found' using errcode = 'P0001';
    end if;

    if upper(v_group_currency) <> upper(p_currency) then
      raise exception 'group_currency_mismatch' using errcode = 'P0001';
    end if;

    if not exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id = p_actor_id
    ) then
      raise exception 'context_not_authorized' using errcode = 'P0001';
    end if;

    if not exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id = p_paid_by
    ) then
      raise exception 'payer_not_in_context' using errcode = 'P0001';
    end if;
  else
    select user_id, friend_id, status into v_friendship
    from public.friendships
    where id = p_friendship_id;

    if not found then
      raise exception 'friendship_not_found' using errcode = 'P0001';
    end if;

    if v_friendship.status <> 'accepted' then
      raise exception 'friendship_not_accepted' using errcode = 'P0001';
    end if;

    if p_actor_id not in (v_friendship.user_id, v_friendship.friend_id) then
      raise exception 'context_not_authorized' using errcode = 'P0001';
    end if;

    if p_paid_by not in (v_friendship.user_id, v_friendship.friend_id) then
      raise exception 'payer_not_in_context' using errcode = 'P0001';
    end if;
  end if;

  -- Equal splits with no participant payload intentionally include every current
  -- context member. Advanced methods always require an explicit participant set.
  if jsonb_typeof(coalesce(p_splits, '[]'::jsonb)) <> 'array' then
    raise exception 'splits_must_be_an_array' using errcode = 'P0001';
  end if;

  if jsonb_array_length(coalesce(p_splits, '[]'::jsonb)) = 0 then
    if p_split_method <> 'equal' then
      raise exception 'participants_required' using errcode = 'P0001';
    end if;

    if p_group_id is not null then
      select coalesce(
        jsonb_agg(
          jsonb_build_object('userId', user_id, 'position', position)
          order by position
        ),
        '[]'::jsonb
      ) into v_payload
      from (
        select user_id, row_number() over (order by user_id)::integer - 1 as position
        from public.group_members
        where group_id = p_group_id
      ) members;
    else
      select jsonb_agg(
        jsonb_build_object('userId', user_id, 'position', position)
        order by position
      ) into v_payload
      from (
        select user_id, row_number() over (order by user_id)::integer - 1 as position
        from unnest(array[v_friendship.user_id, v_friendship.friend_id]) as parties(user_id)
      ) parties;
    end if;
  else
    v_payload := p_splits;
  end if;

  for v_split in select value from jsonb_array_elements(v_payload)
  loop
    if jsonb_typeof(v_split) <> 'object' then
      raise exception 'invalid_split' using errcode = 'P0001';
    end if;

    begin
      v_user_id := nullif(v_split->>'userId', '')::uuid;
      v_position := (v_split->>'position')::integer;
    exception when others then
      raise exception 'invalid_split' using errcode = 'P0001';
    end;

    if v_user_id is null or v_position is null or v_position < 0 then
      raise exception 'invalid_split' using errcode = 'P0001';
    end if;

    if array_position(v_user_ids, v_user_id) is not null then
      raise exception 'duplicate_participant' using errcode = 'P0001';
    end if;

    if array_position(v_positions, v_position) is not null then
      raise exception 'duplicate_position' using errcode = 'P0001';
    end if;

    if p_group_id is not null then
      if not exists (
        select 1 from public.group_members
        where group_id = p_group_id and user_id = v_user_id
      ) then
        raise exception 'participant_not_in_context' using errcode = 'P0001';
      end if;
    elsif v_user_id not in (v_friendship.user_id, v_friendship.friend_id) then
      raise exception 'participant_not_in_context' using errcode = 'P0001';
    end if;

    v_user_ids := array_append(v_user_ids, v_user_id);
    v_positions := array_append(v_positions, v_position);

    if p_split_method = 'custom' then
      begin
        v_amount_minor := (v_split->>'amountMinor')::bigint;
      exception when others then
        raise exception 'invalid_custom_amount' using errcode = 'P0001';
      end;
      if v_amount_minor is null or v_amount_minor < 0 then
        raise exception 'invalid_custom_amount' using errcode = 'P0001';
      end if;
      if v_amount_minor::numeric > public.ledger_amount_ceiling(upper(p_currency)) then
        raise exception 'amount_out_of_range' using errcode = 'P0001';
      end if;
      v_amounts := array_append(v_amounts, v_amount_minor);
    elsif p_split_method = 'percentage' then
      begin
        v_units := (v_split->>'percentageUnits')::bigint;
      exception when others then
        raise exception 'invalid_percentage' using errcode = 'P0001';
      end;
      if v_units is null or v_units <= 0 or v_units > 1000000 then
        raise exception 'invalid_percentage' using errcode = 'P0001';
      end if;
      v_units_by_index := array_append(v_units_by_index, v_units);
      v_total_units_numeric := v_total_units_numeric + v_units::numeric;
    elsif p_split_method = 'shares' then
      begin
        v_units := (v_split->>'shareUnits')::bigint;
      exception when others then
        raise exception 'invalid_shares' using errcode = 'P0001';
      end;
      if v_units is null or v_units <= 0 or v_units::numeric > 999999999999999999::numeric then
        raise exception 'invalid_shares' using errcode = 'P0001';
      end if;
      v_units_by_index := array_append(v_units_by_index, v_units);
      v_total_units_numeric := v_total_units_numeric + v_units::numeric;
    end if;
  end loop;

  v_count := coalesce(array_length(v_user_ids, 1), 0);
  if v_count = 0 then
    raise exception 'participants_required' using errcode = 'P0001';
  end if;

  -- Positions are a stable remainder-allocation order, not merely display data.
  if exists (
    select 1
    from generate_series(0, v_count - 1) expected(position)
    where array_position(v_positions, expected.position) is null
  ) then
    raise exception 'positions_must_be_contiguous' using errcode = 'P0001';
  end if;

  if p_friendship_id is not null and (
    v_count <> 2
    or array_position(v_user_ids, v_friendship.user_id) is null
    or array_position(v_user_ids, v_friendship.friend_id) is null
  ) then
    raise exception 'direct_expense_requires_friendship_parties' using errcode = 'P0001';
  end if;

  if p_split_method = 'custom' then
    v_total_allocated := coalesce((select sum(value) from unnest(v_amounts) as amounts(value)), 0);
    if v_total_allocated <> p_amount_minor then
      raise exception 'split_total_mismatch' using errcode = 'P0001';
    end if;
    v_allocations := v_amounts;
  else
    if p_split_method = 'percentage' and v_total_units_numeric <> 1000000 then
      raise exception 'percentage_total_mismatch' using errcode = 'P0001';
    end if;

    if p_split_method = 'equal' then
      v_total_units := v_count;
      v_total_units_numeric := v_count;
      v_units_by_index := array_fill(1::bigint, array[v_count]);
    end if;

    if v_total_units_numeric <= 0 then
      raise exception 'shares_total_invalid' using errcode = 'P0001';
    end if;

    for v_index in 1..v_count
    loop
      v_amount_minor := floor(
        (p_amount_minor::numeric * v_units_by_index[v_index]::numeric)
        / v_total_units_numeric
      )::bigint;
      v_allocations := array_append(v_allocations, v_amount_minor);
      v_total_allocated := v_total_allocated + v_amount_minor;
    end loop;

    v_remainder := (p_amount_minor::numeric - v_total_allocated)::bigint;
    for v_index in
      select index
      from generate_subscripts(v_user_ids, 1) as indices(index)
      order by v_positions[index], v_user_ids[index]
    loop
      exit when v_remainder = 0;
      v_allocations[v_index] := v_allocations[v_index] + 1;
      v_remainder := v_remainder - 1;
    end loop;
  end if;

  if coalesce((select sum(value) from unnest(v_allocations) as allocations(value)), 0) <> p_amount_minor then
    raise exception 'split_total_mismatch' using errcode = 'P0001';
  end if;

  select array_agg(distinct public.balance_key(
    case when p_group_id is not null then 'group' else 'direct' end,
    coalesce(p_group_id, p_friendship_id),
    p_paid_by,
    participant_id,
    upper(p_currency)
  )) into v_lock_keys
  from unnest(v_user_ids) as participants(participant_id);

  perform public.acquire_balance_locks(v_lock_keys);

  if p_expense_id is not null then
    for v_index in 1..v_count
    loop
      insert into public.expense_splits (
      expense_id, user_id, amount, amount_minor, percentage, shares,
      percentage_units, share_units, position
    ) values (
      p_expense_id,
      v_user_ids[v_index],
      round(v_allocations[v_index] / power(10::numeric, v_scale), 2),
      v_allocations[v_index],
      case when p_split_method = 'percentage'
        then round(v_units_by_index[v_index] / 10000::numeric, 2) else null end,
      case when p_split_method = 'shares'
        then v_units_by_index[v_index] / 1000000::numeric else null end,
      case when p_split_method = 'percentage'
        then v_units_by_index[v_index] else null end,
      case when p_split_method = 'shares'
        then v_units_by_index[v_index] else null end,
      v_positions[v_index]
      );
    end loop;
  end if;
end;
$$;

revoke all on function public.apply_expense_splits_v3(
  uuid, uuid, uuid, uuid, uuid, bigint, text, text, jsonb
) from public, anon, authenticated;

-- One canonical replay gate is shared by the normal lookup and the unique-key
-- race path. Empty equal splits are normalized to the stored server expansion.
create or replace function public.validate_expense_replay(
  p_expense_id uuid, p_actor_id uuid, p_group_id uuid, p_friendship_id uuid,
  p_title text, p_amount_minor bigint, p_currency text, p_category text,
  p_paid_by uuid, p_split_method text, p_date timestamptz, p_notes text,
  p_receipt_key text, p_splits jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_expense public.expenses%rowtype;
  v_stored jsonb;
  v_input jsonb;
  v_receipt public.receipt_uploads%rowtype;
begin
  select * into v_expense from public.expenses where id = p_expense_id;
  if not found
    or v_expense.created_by is distinct from p_actor_id
    or v_expense.group_id is distinct from p_group_id
    or v_expense.friendship_id is distinct from p_friendship_id
    or v_expense.title is distinct from btrim(p_title)
    or v_expense.amount_minor is distinct from p_amount_minor
    or v_expense.currency is distinct from upper(p_currency)
    or v_expense.category is distinct from p_category
    or v_expense.paid_by is distinct from p_paid_by
    or v_expense.split_method is distinct from p_split_method
    or v_expense.date is distinct from p_date
    or v_expense.notes is distinct from nullif(p_notes, '')
    or v_expense.receipt_key is distinct from p_receipt_key
  then
    raise exception 'operation_conflict' using errcode = 'P0001';
  end if;

  if p_receipt_key is not null then
    select * into v_receipt
    from public.receipt_uploads
    where object_key = p_receipt_key
    for update;
    if not found
      or v_receipt.status <> 'attached'
      or v_receipt.attached_expense_id is distinct from p_expense_id
    then
      raise exception 'operation_conflict' using errcode = 'P0001';
    end if;
  end if;

  select jsonb_agg(jsonb_strip_nulls(
    jsonb_build_object('userId', s.user_id::text, 'position', s.position) ||
    case v_expense.split_method
      when 'custom' then jsonb_build_object('amountMinor', s.amount_minor)
      when 'percentage' then jsonb_build_object('percentageUnits', s.percentage_units)
      when 'shares' then jsonb_build_object('shareUnits', s.share_units)
      else '{}'::jsonb
    end) order by s.position)
    into v_stored
  from public.expense_splits s where s.expense_id = v_expense.id;

  if jsonb_typeof(coalesce(p_splits, '[]'::jsonb)) <> 'array' then
    raise exception 'operation_conflict' using errcode = 'P0001';
  end if;
  if jsonb_array_length(coalesce(p_splits, '[]'::jsonb)) = 0 then
    if v_expense.split_method <> 'equal' then
      raise exception 'operation_conflict' using errcode = 'P0001';
    end if;
    v_input := v_stored;
  else
    begin
      select jsonb_agg(jsonb_strip_nulls(
        jsonb_build_object('userId', x.value->>'userId',
          'position', (x.value->>'position')::integer) ||
        case v_expense.split_method
          when 'custom' then jsonb_build_object('amountMinor', (x.value->>'amountMinor')::bigint)
          when 'percentage' then jsonb_build_object('percentageUnits', (x.value->>'percentageUnits')::bigint)
          when 'shares' then jsonb_build_object('shareUnits', (x.value->>'shareUnits')::bigint)
          else '{}'::jsonb
        end) order by (x.value->>'position')::integer)
        into v_input
      from jsonb_array_elements(p_splits) x(value);
    exception when others then
      raise exception 'operation_conflict' using errcode = 'P0001';
    end;
  end if;
  if v_stored is distinct from v_input then
    raise exception 'operation_conflict' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.validate_expense_replay(
  uuid, uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb
) from public, anon, authenticated;

-- ── Create expense ──────────────────────────────────────────────────────────

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
  v_actor uuid := auth.uid();
  v_expense_id uuid;
  v_existing_expense public.expenses%rowtype;
  v_upload_id uuid;
  v_scale smallint;
  v_receipt public.receipt_uploads%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_client_operation_id is not null then
    select * into v_existing_expense
    from public.expenses
    where client_operation_id = p_client_operation_id;

    if found then
      if p_receipt_key is not null then
        select * into v_receipt
        from public.receipt_uploads
        where object_key = p_receipt_key
        for update;
        if not found
          or v_receipt.status <> 'attached'
          or v_receipt.attached_expense_id is distinct from v_existing_expense.id
        then
          raise exception 'operation_conflict' using errcode = 'P0001';
        end if;
      end if;
      perform public.validate_expense_replay(
        v_existing_expense.id, v_actor, p_group_id, p_friendship_id,
        p_title, p_amount_minor, upper(p_currency), p_category, p_paid_by,
        p_split_method, p_date, p_notes, p_receipt_key, p_splits
      );

      return v_existing_expense.id;
    end if;
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception 'expense_title_required' using errcode = 'P0001';
  end if;

  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'expense_amount_must_be_positive' using errcode = 'P0001';
  end if;

  if p_receipt_key is not null then
    select id into v_upload_id
    from public.receipt_uploads
    where object_key = p_receipt_key
      and owner_id = v_actor
      and status = 'staged'
      and attached_expense_id is null
    for update;

    if not found then
      raise exception 'receipt_key_invalid_or_not_owned' using errcode = 'P0001';
    end if;
  end if;

  v_scale := public.currency_minor_scale(upper(p_currency));

  -- Validate and lock the complete split payload before creating the expense
  -- row. The private writer skips DML for a null expense id in this pass.
  perform public.apply_expense_splits_v3(
    null, v_actor, p_group_id, p_friendship_id, p_paid_by,
    p_amount_minor, upper(p_currency), p_split_method, p_splits
  );

  if p_date is null then
    raise exception 'expense_date_required' using errcode = 'P0001';
  end if;

  begin
    insert into public.expenses (
      group_id, friendship_id, title, amount, amount_minor, currency, category,
      paid_by, created_by, split_method, date, notes, receipt_key, client_operation_id
    ) values (
      p_group_id, p_friendship_id, btrim(p_title),
      round(p_amount_minor / power(10::numeric, v_scale), 2), p_amount_minor,
      upper(p_currency), p_category, p_paid_by, v_actor, p_split_method,
      p_date, nullif(p_notes, ''), p_receipt_key, p_client_operation_id
    ) returning id into v_expense_id;
  exception when unique_violation then
    -- A concurrent operation claim may win between the initial lookup and
    -- this insert. Re-read the committed row and apply the same payload gate.
    select * into v_existing_expense from public.expenses
    where client_operation_id = p_client_operation_id;
    if not found then
      raise exception 'operation_conflict' using errcode = 'P0001';
    end if;
    perform public.validate_expense_replay(
      v_existing_expense.id, v_actor, p_group_id, p_friendship_id,
      p_title, p_amount_minor, upper(p_currency), p_category, p_paid_by,
      p_split_method, p_date, p_notes, p_receipt_key, p_splits
    );
    return v_existing_expense.id;
  end;

  perform public.apply_expense_splits_v3(
    v_expense_id, v_actor, p_group_id, p_friendship_id, p_paid_by,
    p_amount_minor, upper(p_currency), p_split_method, p_splits
  );

  if p_receipt_key is not null then
    update public.receipt_uploads
    set status = 'attached', attached_expense_id = v_expense_id
    where id = v_upload_id;
  end if;

  insert into public.activities (
    type, group_id, expense_id, user_id, description, amount, amount_minor, currency
  ) values (
    'expense', p_group_id, v_expense_id, v_actor, btrim(p_title),
    round(p_amount_minor / power(10::numeric, v_scale), 2), p_amount_minor, upper(p_currency)
  );

  if p_group_id is not null then
    insert into public.notifications (recipient_id, kind, actor_id, group_id, expense_id, payload)
    select gm.user_id, 'expense_added', v_actor, p_group_id, v_expense_id,
      jsonb_build_object('title', btrim(p_title), 'amount_minor', p_amount_minor, 'currency', upper(p_currency))
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id <> v_actor
      and gm.new_expense_alerts = true;
  else
    insert into public.notifications (recipient_id, kind, actor_id, friendship_id, expense_id, payload)
    select case when f.user_id = v_actor then f.friend_id else f.user_id end,
      'expense_added', v_actor, p_friendship_id, v_expense_id,
      jsonb_build_object('title', btrim(p_title), 'amount_minor', p_amount_minor, 'currency', upper(p_currency))
    from public.friendships f
    where f.id = p_friendship_id;
  end if;

  return v_expense_id;
end;
$$;

-- ── Update expense ──────────────────────────────────────────────────────────

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
  v_actor uuid := auth.uid();
  v_expense public.expenses%rowtype;
  v_upload_id uuid;
  v_splits jsonb;
  v_scale smallint;
  v_old_lock_keys text[];
  v_new_lock_keys text[];
  v_title text;
  v_amount_minor bigint;
  v_currency text;
  v_category text;
  v_paid_by uuid;
  v_split_method text;
  v_date timestamptz;
  v_notes text;
  v_receipt_key text;
  v_receipt public.receipt_uploads%rowtype;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_expense from public.expenses where id = p_expense_id for update;
  if not found then
    raise exception 'expense_not_found' using errcode = 'P0001';
  end if;

  if v_expense.created_by <> v_actor then
    raise exception 'not_expense_creator' using errcode = 'P0001';
  end if;

  -- Null remains the legacy omit sentinel. Empty receipt is the explicit
  -- removal sentinel, preserving compatibility with older partial-update calls.
  v_title := coalesce(p_title, v_expense.title);
  v_amount_minor := coalesce(p_amount_minor, v_expense.amount_minor);
  v_currency := coalesce(nullif(upper(p_currency), ''), v_expense.currency);
  v_category := coalesce(p_category, v_expense.category);
  v_paid_by := coalesce(p_paid_by, v_expense.paid_by);
  v_split_method := coalesce(p_split_method, v_expense.split_method);
  v_date := coalesce(p_date, v_expense.date);
  v_notes := case when p_notes is null then v_expense.notes else nullif(p_notes, '') end;
  v_receipt_key := case when p_receipt_key is null then v_expense.receipt_key
                        when p_receipt_key = '' then null else p_receipt_key end;

  if v_amount_minor is null or v_amount_minor <= 0 then
    raise exception 'expense_amount_must_be_positive' using errcode = 'P0001';
  end if;

  if nullif(btrim(coalesce(v_title, '')), '') is null then
    raise exception 'expense_title_required' using errcode = 'P0001';
  end if;

  -- Preserve the current split configuration when an older client omits it.
  if p_splits is null then
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'userId', user_id,
        'position', position,
        'amountMinor', amount_minor,
        'percentageUnits', case
          when percentage_units is not null then percentage_units
          when percentage is not null then round(percentage * 10000)::bigint
          else null
        end,
        'shareUnits', case
          when share_units is not null then share_units
          when shares is not null then round(shares * 1000000)::bigint
          else null
        end
      ) order by position
    ), '[]'::jsonb) into v_splits
    from public.expense_splits
    where expense_id = p_expense_id;
  else
    v_splits := p_splits;
  end if;

  if jsonb_array_length(coalesce(v_splits, '[]'::jsonb)) = 0 and v_split_method = 'equal' then
    if v_expense.group_id is not null then
      select array_agg(distinct public.balance_key(
        'group', v_expense.group_id, v_paid_by, gm.user_id, v_currency
      )) into v_new_lock_keys
      from public.group_members gm where gm.group_id = v_expense.group_id;
    else
      select array_agg(distinct public.balance_key(
        'direct', v_expense.friendship_id, v_paid_by, party.user_id, v_currency
      )) into v_new_lock_keys
      from unnest(array[v_actor, v_expense.paid_by]) as party(user_id);
    end if;
  else
    select array_agg(distinct public.balance_key(
      case when v_expense.group_id is not null then 'group' else 'direct' end,
      coalesce(v_expense.group_id, v_expense.friendship_id),
      v_paid_by, (split.value->>'userId')::uuid, v_currency
    )) into v_new_lock_keys
    from jsonb_array_elements(coalesce(v_splits, '[]'::jsonb)) as split(value);
  end if;

  -- Lock all relationships affected by the old split before replacing it.
  select array_agg(distinct public.balance_key(
    case when v_expense.group_id is not null then 'group' else 'direct' end,
    coalesce(v_expense.group_id, v_expense.friendship_id),
    v_expense.paid_by,
    s.user_id,
    v_expense.currency
  )) into v_old_lock_keys
  from public.expense_splits s
  where s.expense_id = p_expense_id;
  perform public.acquire_balance_locks(coalesce(v_old_lock_keys, '{}'::text[]) ||
    coalesce(v_new_lock_keys, '{}'::text[]));

  if v_receipt_key is not null and v_receipt_key <> v_expense.receipt_key then
    select id into v_upload_id
    from public.receipt_uploads
    where object_key = v_receipt_key
      and owner_id = v_actor
      and status = 'staged'
      and attached_expense_id is null
    for update;
    if not found then
      raise exception 'receipt_key_invalid_or_not_owned' using errcode = 'P0001';
    end if;
  end if;

  if v_amount_minor::numeric > public.ledger_amount_ceiling(v_currency) then
    raise exception 'amount_out_of_range' using errcode = 'P0001';
  end if;
  v_scale := public.currency_minor_scale(v_currency);

  update public.expenses
   set title = btrim(v_title),
       amount = round(v_amount_minor / power(10::numeric, v_scale), 2),
       amount_minor = v_amount_minor,
       currency = v_currency,
       category = v_category,
       paid_by = v_paid_by,
       split_method = v_split_method,
       date = v_date,
       notes = v_notes,
       receipt_key = v_receipt_key
  where id = p_expense_id;

  delete from public.expense_splits where expense_id = p_expense_id;

  perform public.apply_expense_splits_v3(
    p_expense_id, v_actor, v_expense.group_id, v_expense.friendship_id,
     v_paid_by, v_amount_minor, v_currency, v_split_method, v_splits
  );

  if v_expense.receipt_key is not null and v_expense.receipt_key <> v_receipt_key then
    select * into v_receipt
    from public.receipt_uploads
    where object_key = v_expense.receipt_key
    for update;
    update public.receipt_uploads
    set status = 'cleanup_pending',
        attached_expense_id = null
    where object_key = v_expense.receipt_key and status = 'attached';
  end if;

  if v_upload_id is not null then
    update public.receipt_uploads
    set status = 'attached', attached_expense_id = p_expense_id
    where id = v_upload_id;
  end if;

  return p_expense_id;
end;
$$;

-- ── Delete expense ──────────────────────────────────────────────────────────

create or replace function public.delete_expense_v2(p_expense_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_expense public.expenses%rowtype;
  v_lock_keys text[];
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_expense from public.expenses where id = p_expense_id for update;
  if not found then
    raise exception 'expense_not_found' using errcode = 'P0001';
  end if;

  if v_expense.created_by <> v_actor then
    raise exception 'not_expense_creator' using errcode = 'P0001';
  end if;

  select array_agg(distinct public.balance_key(
    case when v_expense.group_id is not null then 'group' else 'direct' end,
    coalesce(v_expense.group_id, v_expense.friendship_id),
    v_expense.paid_by,
    s.user_id,
    v_expense.currency
  )) into v_lock_keys
  from public.expense_splits s
  where s.expense_id = p_expense_id;
  perform public.acquire_balance_locks(v_lock_keys);

  if v_expense.receipt_key is not null then
    select * into v_receipt
    from public.receipt_uploads
    where object_key = v_expense.receipt_key
    for update;
    update public.receipt_uploads
    set status = 'cleanup_pending',
        attached_expense_id = null
    where object_key = v_expense.receipt_key and status = 'attached';
  end if;

  delete from public.notifications where expense_id = p_expense_id;

  delete from public.expenses where id = p_expense_id;
end;
$$;

-- ── Settlement hardening ────────────────────────────────────────────────────

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
  v_actor uuid := auth.uid();
  v_settlement_id uuid;
  v_existing_settlement public.settlements%rowtype;
  v_friendship record;
  v_current_minor bigint;
  v_scale smallint;
  v_from_user_id uuid;
  v_to_user_id uuid;
  v_group_currency text;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  if p_counterparty_id is null or p_counterparty_id = v_actor then
    raise exception 'cannot_settle_with_self' using errcode = 'P0001';
  end if;

  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'settlement_amount_must_be_positive' using errcode = 'P0001';
  end if;

  if (p_group_id is null) = (p_friendship_id is null) then
    raise exception 'exactly_one_context_required' using errcode = 'P0001';
  end if;

  if p_method is null or p_method not in ('cash', 'bank_transfer', 'other') then
    raise exception 'invalid_settlement_method' using errcode = 'P0001';
  end if;

  v_scale := public.currency_minor_scale(upper(p_currency));

  if p_amount_minor::numeric > public.ledger_amount_ceiling(upper(p_currency)) then
    raise exception 'amount_out_of_range' using errcode = 'P0001';
  end if;

  if p_client_operation_id is not null then
    select * into v_existing_settlement
    from public.settlements
    where client_operation_id = p_client_operation_id;

    if found then
      perform public.validate_settlement_replay(
        v_existing_settlement.id, v_actor, p_counterparty_id,
        p_group_id, p_friendship_id, p_amount_minor, upper(p_currency), p_method, p_note
      );
      perform public.acquire_balance_locks(array[public.balance_key(
        case when p_group_id is not null then 'group' else 'direct' end,
        coalesce(p_group_id, p_friendship_id), v_actor, p_counterparty_id, upper(p_currency)
      )]);
      perform public.validate_settlement_replay(
        v_existing_settlement.id, v_actor, p_counterparty_id,
        p_group_id, p_friendship_id, p_amount_minor, upper(p_currency), p_method, p_note
      );
      return v_existing_settlement.id;
    end if;
  end if;

  if p_group_id is not null then
    select currency into v_group_currency from public.groups where id = p_group_id;
    if not found then
      raise exception 'group_not_found' using errcode = 'P0001';
    end if;
    if upper(v_group_currency) <> upper(p_currency) then
      raise exception 'group_currency_mismatch' using errcode = 'P0001';
    end if;
    if not exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id in (v_actor, p_counterparty_id)
      group by group_id having count(*) = 2
    ) then
      raise exception 'context_not_authorized' using errcode = 'P0001';
    end if;
  else
    select user_id, friend_id, status into v_friendship
    from public.friendships where id = p_friendship_id;
    if not found then
      raise exception 'friendship_not_found' using errcode = 'P0001';
    end if;
    if v_friendship.status <> 'accepted' then
      raise exception 'friendship_not_accepted' using errcode = 'P0001';
    end if;
    if not (
      v_actor in (v_friendship.user_id, v_friendship.friend_id)
      and p_counterparty_id in (v_friendship.user_id, v_friendship.friend_id)
    ) then
      raise exception 'context_not_authorized' using errcode = 'P0001';
    end if;
  end if;

  perform public.acquire_balance_locks(array[public.balance_key(
    case when p_group_id is not null then 'group' else 'direct' end,
    coalesce(p_group_id, p_friendship_id), v_actor, p_counterparty_id, upper(p_currency)
  )]);

  -- A concurrent claimant can commit while the first lookup is in flight.
  -- Re-read after the lock so an identical replay cannot fall through to a
  -- stale balance check or raw unique violation.
  if p_client_operation_id is not null then
    select * into v_existing_settlement from public.settlements
    where client_operation_id = p_client_operation_id;
    if found then
      perform public.validate_settlement_replay(
        v_existing_settlement.id, v_actor, p_counterparty_id,
        p_group_id, p_friendship_id, p_amount_minor, upper(p_currency), p_method, p_note
      );
      return v_existing_settlement.id;
    end if;
  end if;

  select coalesce(sum(signed_amount_minor), 0) into v_current_minor
  from public.get_open_balances() ob
  where ob.context_type = case when p_group_id is not null then 'group' else 'direct' end
    and ob.context_id = coalesce(p_group_id, p_friendship_id)
    and ob.counterparty_id = p_counterparty_id
    and ob.currency = upper(p_currency);

  if v_current_minor = 0 then
    raise exception 'BALANCE_CHANGED:0' using errcode = 'P0001';
  end if;

  if p_amount_minor > abs(v_current_minor) then
    raise exception 'BALANCE_CHANGED:%', v_current_minor using errcode = 'P0001';
  end if;

  if v_current_minor > 0 then
    v_from_user_id := p_counterparty_id;
    v_to_user_id := v_actor;
  else
    v_from_user_id := v_actor;
    v_to_user_id := p_counterparty_id;
  end if;

  begin
    insert into public.settlements (
    group_id, friendship_id, from_user_id, to_user_id, created_by, amount, amount_minor,
      currency, method, note, client_operation_id
    ) values (
      p_group_id, p_friendship_id, v_from_user_id, v_to_user_id, v_actor,
      round(p_amount_minor / power(10::numeric, v_scale), 2), p_amount_minor,
      upper(p_currency), p_method, nullif(p_note, ''), p_client_operation_id
    ) returning id into v_settlement_id;
  exception when unique_violation then
    select * into v_existing_settlement from public.settlements
    where client_operation_id = p_client_operation_id;
    if not found then
      raise exception 'operation_conflict' using errcode = 'P0001';
    end if;
    perform public.validate_settlement_replay(
      v_existing_settlement.id, v_actor, p_counterparty_id,
      p_group_id, p_friendship_id, p_amount_minor, upper(p_currency), p_method, p_note
    );
    return v_existing_settlement.id;
  end;

  insert into public.activities (
    type, group_id, settlement_id, user_id, description, amount, amount_minor, currency
  ) values (
    'settlement', p_group_id, v_settlement_id, v_actor, 'Settlement',
    round(p_amount_minor / power(10::numeric, v_scale), 2), p_amount_minor, upper(p_currency)
  );

  insert into public.notifications (
    recipient_id, kind, actor_id, group_id, friendship_id, payload, client_operation_id
  ) values (
    p_counterparty_id, 'balance_reminder', v_actor, p_group_id, p_friendship_id,
    jsonb_build_object('settlement_id', v_settlement_id, 'amount_minor', p_amount_minor, 'currency', upper(p_currency)),
    p_client_operation_id
  );

  return v_settlement_id;
end;
$$;

create or replace function public.validate_settlement_replay(
  p_settlement_id uuid, p_actor_id uuid, p_counterparty_id uuid,
  p_group_id uuid, p_friendship_id uuid, p_amount_minor bigint,
  p_currency text, p_method text, p_note text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_settlement public.settlements%rowtype;
begin
  select * into v_settlement from public.settlements where id = p_settlement_id;
  if not found
    or v_settlement.created_by is distinct from p_actor_id
    or p_counterparty_id is distinct from case
      when v_settlement.from_user_id = p_actor_id then v_settlement.to_user_id
      else v_settlement.from_user_id end
    or v_settlement.group_id is distinct from p_group_id
    or v_settlement.friendship_id is distinct from p_friendship_id
    or v_settlement.amount_minor is distinct from p_amount_minor
    or v_settlement.currency is distinct from upper(p_currency)
    or v_settlement.method is distinct from p_method
    or v_settlement.note is distinct from nullif(p_note, '')
  then
    raise exception 'operation_conflict' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.validate_settlement_replay(
  uuid, uuid, uuid, uuid, uuid, bigint, text, text, text
) from public, anon, authenticated;

-- Settlement deletion is the compensating operation: removing the immutable
-- settlement row restores the signed balance projection deterministically.
create or replace function public.delete_settlement_v2(p_settlement_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_settlement public.settlements%rowtype;
  v_context_type text;
  v_context_id uuid;
begin
  if v_actor is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select * into v_settlement
  from public.settlements
  where id = p_settlement_id
  for update;
  if not found then
    raise exception 'settlement_not_found' using errcode = 'P0001';
  end if;

  v_context_type := case when v_settlement.group_id is not null then 'group' else 'direct' end;
  v_context_id := coalesce(v_settlement.group_id, v_settlement.friendship_id);

  if v_actor not in (v_settlement.from_user_id, v_settlement.to_user_id) then
    raise exception 'not_settlement_party' using errcode = 'P0001';
  end if;

  if v_settlement.group_id is not null then
    if not exists (
      select 1 from public.group_members
      where group_id = v_settlement.group_id and user_id = v_actor
    ) then
      raise exception 'context_not_authorized' using errcode = 'P0001';
    end if;
  elsif not exists (
    select 1 from public.friendships f
    where f.id = v_settlement.friendship_id
      and f.status = 'accepted'
      and v_actor in (f.user_id, f.friend_id)
      and v_settlement.from_user_id in (f.user_id, f.friend_id)
      and v_settlement.to_user_id in (f.user_id, f.friend_id)
  ) then
    raise exception 'context_not_authorized' using errcode = 'P0001';
  end if;

  perform public.acquire_balance_locks(array[public.balance_key(
    v_context_type, v_context_id, v_settlement.from_user_id,
    v_settlement.to_user_id, upper(v_settlement.currency)
  )]);

  delete from public.notifications
  where kind = 'balance_reminder'
    and payload->>'settlement_id' = p_settlement_id::text;
  delete from public.settlements where id = p_settlement_id;
  return p_settlement_id;
end;
$$;

-- Preserve the existing public API and keep private helpers private.
revoke all on function public.create_expense_v2(
  uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb
) from public, anon;
grant execute on function public.create_expense_v2(
  uuid, uuid, uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb
) to authenticated;

revoke all on function public.update_expense_v2(
  uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb
) from public, anon;
grant execute on function public.update_expense_v2(
  uuid, text, bigint, text, text, uuid, text, timestamptz, text, text, jsonb
) to authenticated;

revoke all on function public.delete_expense_v2(uuid) from public, anon;
grant execute on function public.delete_expense_v2(uuid) to authenticated;

revoke all on function public.create_settlement_v2(
  uuid, uuid, uuid, uuid, bigint, text, text, text
) from public, anon;
grant execute on function public.create_settlement_v2(
  uuid, uuid, uuid, uuid, bigint, text, text, text
) to authenticated;

revoke all on function public.delete_settlement_v2(uuid) from public, anon;
grant execute on function public.delete_settlement_v2(uuid) to authenticated;

-- Ledger tables are readable through RLS/query APIs, but all mutations must
-- use the hardened RPCs. This also prevents a client from bypassing locks or
-- balance authorization with direct DML.
revoke insert, update, delete on table public.expenses, public.expense_splits,
  public.settlements, public.activities from anon, authenticated;
