-- =============================================================================
-- Phase 2: Shared Balance, Visibility, and Advisory-Lock Contracts
--   - balance_key: deterministic composite key for balance rows
--   - acquire_balance_locks: exclusive advisory locks over sorted balance keys
--   - get_open_balances: authoritative balance projection (never reads
--     group_members.balance or groups.total_expenses)
--   - context_has_nonzero_balances: existence check per context
--   - can_view_expense / can_view_group_history: visibility guards
-- =============================================================================

-- ── 1. balance_key ──────────────────────────────────────────────────────────
-- Build a deterministic composite key that orders the two user IDs low/high so
-- the key is the same regardless of argument order.

create or replace function public.balance_key(
  p_context_type text,
  p_context_id uuid,
  p_user_a uuid,
  p_user_b uuid,
  p_currency text
)
returns text
language sql
immutable
set search_path = public
as $$
  select p_context_type || ':' || p_context_id::text || ':' ||
         least(p_user_a::text, p_user_b::text) || ':' ||
         greatest(p_user_a::text, p_user_b::text) || ':' ||
         upper(p_currency)
$$;

-- ── 2. acquire_balance_locks ────────────────────────────────────────────────
-- Acquire exclusive advisory transaction-level locks in deterministic order
-- (sorted distinct keys).  Uses hashtextextended to produce a bigint hash from
-- each balance_key string.

create or replace function public.acquire_balance_locks(p_keys text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(key, 0))
  from (select distinct unnest(p_keys) as key order by key) t;
end;
$$;

-- ── 3. get_open_balances ────────────────────────────────────────────────────
-- Derive every open balance for the current authenticated user directly from
-- immutable expense payer/splits and settlements.  Positive signed_amount_minor
-- means the counterparty owes the auth user; negative means the auth user owes
-- the counterparty.
--
-- NEVER reads group_members.balance or groups.total_expenses.

create or replace function public.get_open_balances()
returns table (
  counterparty_id uuid,
  context_type text,
  context_id uuid,
  currency text,
  signed_amount_minor bigint,
  last_activity_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    ob.counterparty_id,
    ob.context_type,
    ob.context_id,
    ob.currency,
    sum(ob.signed_amount_minor)::bigint,
    max(ob.last_activity_at)
  from (
    -- Auth user is the payer: each other participant owes their full share.
    select
      s.user_id as counterparty_id,
      case when e.group_id is not null then 'group' else 'direct' end as context_type,
      coalesce(e.group_id, e.friendship_id) as context_id,
      e.currency,
      s.amount_minor as signed_amount_minor,
      greatest(e.created_at, e.updated_at) as last_activity_at
    from public.expenses e
    join public.expense_splits s on s.expense_id = e.id and s.user_id <> e.paid_by
    where e.paid_by = auth.uid()

    union all

    -- Auth user is a participant: auth user owes the payer their own share.
    select
      e.paid_by as counterparty_id,
      case when e.group_id is not null then 'group' else 'direct' end as context_type,
      coalesce(e.group_id, e.friendship_id) as context_id,
      e.currency,
      (-1 * s.amount_minor) as signed_amount_minor,
      greatest(e.created_at, e.updated_at) as last_activity_at
    from public.expenses e
    join public.expense_splits s on s.expense_id = e.id and s.user_id = auth.uid()
    where e.paid_by <> auth.uid()

    union all

    -- Auth user receives a settlement: the sender's obligation decreases.
    select
      s.from_user_id as counterparty_id,
      case when s.group_id is not null then 'group' else 'direct' end as context_type,
      coalesce(s.group_id, s.friendship_id) as context_id,
      s.currency,
      (-1 * s.amount_minor) as signed_amount_minor,
      s.created_at as last_activity_at
    from public.settlements s
    where s.to_user_id = auth.uid()

    union all

    -- Auth user sends a settlement: the auth user's obligation decreases.
    select
      s.to_user_id as counterparty_id,
      case when s.group_id is not null then 'group' else 'direct' end as context_type,
      coalesce(s.group_id, s.friendship_id) as context_id,
      s.currency,
      s.amount_minor as signed_amount_minor,
      s.created_at as last_activity_at
    from public.settlements s
    where s.from_user_id = auth.uid()
  ) ob
  group by ob.counterparty_id, ob.context_type, ob.context_id, ob.currency
  having sum(ob.signed_amount_minor) <> 0
$$;

-- ── 4. context_has_nonzero_balances ─────────────────────────────────────────
-- Returns true when a context (group or direct) has at least one nonzero
-- balance.  When p_user_id is provided, scoped to that specific counterparty.

create or replace function public.context_has_nonzero_balances(
  p_context_type text,
  p_context_id uuid,
  p_user_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.get_open_balances() ob
    where ob.context_type = p_context_type
      and ob.context_id = p_context_id
      and (p_user_id is null or ob.counterparty_id = p_user_id)
  )
$$;

-- ── 5. can_view_expense ─────────────────────────────────────────────────────
-- A user may view an expense if they created it, paid for it, are a split
-- participant, belong to the group (for group expenses), or are the friendship
-- counterparty (for direct expenses).

create or replace function public.can_view_expense(p_expense_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.expenses e
    where e.id = p_expense_id
      and (
        e.created_by = p_user_id
        or e.paid_by = p_user_id
        or exists (
          select 1
          from public.expense_splits s
          where s.expense_id = e.id and s.user_id = p_user_id
        )
        or (e.group_id is not null and public.is_group_member(e.group_id, p_user_id))
        or (e.friendship_id is not null and exists (
          select 1
          from public.friendships f
          where f.id = e.friendship_id
            and (f.user_id = p_user_id or f.friend_id = p_user_id)
        ))
      )
  )
$$;

-- ── 6. can_view_group_history ───────────────────────────────────────────────
-- Returns true when the user was ever a member of the group, either as a
-- recorded group_member or as a participant in any expense or settlement in
-- that group (regardless of current membership).

create or replace function public.can_view_group_history(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    where
      exists (select 1 from public.group_members where group_id = p_group_id and user_id = p_user_id)
      or exists (select 1 from public.expenses where group_id = p_group_id and paid_by = p_user_id)
      or exists (
        select 1
        from public.expense_splits s
        join public.expenses e on e.id = s.expense_id and e.group_id = p_group_id
        where s.user_id = p_user_id
      )
      or exists (
        select 1
        from public.settlements
        where group_id = p_group_id and (from_user_id = p_user_id or to_user_id = p_user_id)
      )
  )
$$;
