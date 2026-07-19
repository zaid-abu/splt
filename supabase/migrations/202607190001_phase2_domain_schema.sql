-- =============================================================================
-- Phase 2: Additive Domain Schema
--   - currency_minor_scale function
--   - Additive columns on existing tables
--   - Backfill (currency-aware integer conversion, ownership, relationships)
--   - New tables: group_invitations, friend_invites, notifications,
--     user_search_attempts, receipt_uploads
--   - Expanded check constraints & indexes
-- =============================================================================

-- ── 1. Currency minor scale function ──────────────────────────────────────────

create or replace function public.currency_minor_scale(p_currency text)
returns smallint
language plpgsql
immutable
set search_path = public
as $$
begin
  case p_currency
    when 'JPY' then return 0::smallint;
    when 'KRW' then return 0::smallint;
    when 'USD' then return 2::smallint;
    when 'EUR' then return 2::smallint;
    when 'GBP' then return 2::smallint;
    when 'CAD' then return 2::smallint;
    when 'AUD' then return 2::smallint;
    when 'CHF' then return 2::smallint;
    when 'CNY' then return 2::smallint;
    when 'INR' then return 2::smallint;
    when 'MXN' then return 2::smallint;
    when 'BRL' then return 2::smallint;
    when 'NGN' then return 2::smallint;
    when 'KES' then return 2::smallint;
    when 'SEK' then return 2::smallint;
    when 'NOK' then return 2::smallint;
    when 'DKK' then return 2::smallint;
    when 'NZD' then return 2::smallint;
    when 'SGD' then return 2::smallint;
    when 'HKD' then return 2::smallint;
    when 'TWD' then return 2::smallint;
    when 'THB' then return 2::smallint;
    when 'VND' then return 2::smallint;
    when 'PHP' then return 2::smallint;
    when 'IDR' then return 2::smallint;
    when 'MYR' then return 2::smallint;
    when 'RUB' then return 2::smallint;
    when 'ZAR' then return 2::smallint;
    when 'PLN' then return 2::smallint;
    when 'TRY' then return 2::smallint;
    when 'ILS' then return 2::smallint;
    when 'AED' then return 2::smallint;
    when 'SAR' then return 2::smallint;
    when 'EGP' then return 2::smallint;
    when 'COP' then return 2::smallint;
    when 'CLP' then return 2::smallint;
    when 'ARS' then return 2::smallint;
    when 'PEN' then return 2::smallint;
    else raise exception 'unsupported currency code: %', p_currency using errcode = '22023';
  end case;
end;
$$;

-- ── 2. Additive columns on existing tables ────────────────────────────────────

alter table public.expenses
  add column if not exists amount_minor bigint,
  add column if not exists friendship_id uuid references public.friendships(id),
  add column if not exists created_by uuid references public.users(id),
  add column if not exists client_operation_id uuid,
  add column if not exists receipt_key text;

alter table public.expense_splits
  add column if not exists amount_minor bigint,
  add column if not exists shares numeric(18,6),
  add column if not exists position integer;

alter table public.settlements
  add column if not exists amount_minor bigint,
  add column if not exists friendship_id uuid references public.friendships(id),
  add column if not exists method text,
  add column if not exists client_operation_id uuid;

alter table public.recurring_expenses
  add column if not exists amount_minor bigint;

alter table public.activities
  add column if not exists amount_minor bigint;

alter table public.groups
  add column if not exists kind text,
  add column if not exists archived_at timestamptz,
  add column if not exists client_operation_id uuid;

alter table public.group_members
  add column if not exists new_expense_alerts boolean not null default true;

alter table public.friendships
  add column if not exists requested_by uuid references public.users(id),
  add column if not exists blocked_by uuid references public.users(id),
  add column if not exists request_expires_at timestamptz,
  add column if not exists status_before_block text;

-- ── 3. Drop old constraints before expanded rebuild ───────────────────────────

alter table public.friendships drop constraint if exists friendships_status_check;
alter table public.expenses    drop constraint if exists expenses_split_method_check;

-- ── 4. Normalize persisted values ─────────────────────────────────────────────

update public.friendships set status = 'declined' where status = 'rejected';

-- ── 5. Backfill additive columns ──────────────────────────────────────────────

-- 5a. Expenses: amount_minor & created_by
update public.expenses
set amount_minor = round(amount * power(10::numeric, public.currency_minor_scale(currency)))::bigint,
    created_by   = paid_by
where amount_minor is null or created_by is null;

-- 5b. Expense splits: amount_minor & position
with ranked as (
  select s.id,
         (row_number() over (partition by s.expense_id order by s.created_at, s.user_id) - 1)::integer as position
  from public.expense_splits s
)
update public.expense_splits s
set amount_minor = round(s.amount * power(10::numeric, public.currency_minor_scale(e.currency)))::bigint,
    position     = ranked.position
from ranked, public.expenses e
where ranked.id = s.id and e.id = s.expense_id;

-- 5c. Settlements: amount_minor & method
update public.settlements
set amount_minor = round(amount * power(10::numeric, public.currency_minor_scale(currency)))::bigint,
    method       = 'other'
where amount_minor is null or method is null;

-- 5d. Recurring expenses: amount_minor
update public.recurring_expenses
set amount_minor = case when amount is null then null
  else round(amount * power(10::numeric, public.currency_minor_scale(currency_code)))::bigint end;

-- 5e. Activities: amount_minor
update public.activities
set amount_minor = case when amount is null or currency is null then null
  else round(amount * power(10::numeric, public.currency_minor_scale(currency)))::bigint end;

-- 5f. Friendships: ownership & lifecycle fields
update public.friendships
set requested_by       = coalesce(requested_by, user_id),
    blocked_by         = case when status = 'blocked' then coalesce(blocked_by, user_id) else blocked_by end,
    status_before_block = case when status = 'blocked' then coalesce(status_before_block, 'accepted') else status_before_block end,
    request_expires_at = case when status = 'pending' then coalesce(request_expires_at, created_at + interval '30 days') else request_expires_at end;

-- ── 6. Backfill friendship_id (direct — group-null — relationships) ─────────

-- 6a. Expenses: only group-null rows whose payer + splits = exactly 2 distinct users
with direct_expenses as (
  select e.id,
         array_agg(distinct u.u order by u.u) as users
  from public.expenses e
  cross join lateral (
    select e.paid_by as u
    union
    select s.user_id from public.expense_splits s where s.expense_id = e.id
  ) u
  where e.group_id is null and e.friendship_id is null
  group by e.id
  having count(*) = 2
)
update public.expenses e
set friendship_id = f.id
from direct_expenses de
join public.friendships f on
  (f.user_id = de.users[1] and f.friend_id = de.users[2])
  or (f.friend_id = de.users[1] and f.user_id = de.users[2])
where e.id = de.id;

-- 6b. Settlements: group-null rows, matched on from_user / to_user party pair
with direct_settlements as (
  select s.id, s.from_user_id, s.to_user_id
  from public.settlements s
  where s.group_id is null and s.friendship_id is null
)
update public.settlements s
set friendship_id = f.id
from direct_settlements ds
join public.friendships f on
  (f.user_id = ds.from_user_id and f.friend_id = ds.to_user_id)
  or (f.friend_id = ds.from_user_id and f.user_id = ds.to_user_id)
where s.id = ds.id;

-- ── 7. NOT NULL constraints (safe after backfill) ────────────────────────────

alter table public.expenses         alter column amount_minor set not null;
alter table public.expenses         alter column created_by   set not null;
alter table public.expense_splits   alter column amount_minor set not null;
alter table public.expense_splits   alter column position     set not null;
alter table public.settlements      alter column amount_minor set not null;
alter table public.settlements      alter column method       set not null;
alter table public.friendships      alter column requested_by set not null;

-- ── 8. Create new tables ──────────────────────────────────────────────────────

create table if not exists public.group_invitations (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id),
  inviter_id uuid not null references public.users(id),
  invitee_id uuid not null references public.users(id),
  status     text not null default 'pending',
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_invites (
  id                  uuid primary key default gen_random_uuid(),
  created_by          uuid not null references public.users(id),
  token_hash          bytea not null unique,
  client_operation_id uuid not null unique,
  expires_at          timestamptz not null default now() + interval '7 days',
  revoked_at          timestamptz,
  redeemed_by         uuid references public.users(id),
  redeemed_at         timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  recipient_id        uuid not null references public.users(id),
  kind                text not null,
  actor_id            uuid references public.users(id),
  group_id            uuid references public.groups(id),
  friendship_id       uuid references public.friendships(id),
  expense_id          uuid references public.expenses(id),
  payload             jsonb not null default '{}'::jsonb,
  client_operation_id uuid,
  created_at          timestamptz not null default now(),
  read_at             timestamptz
);

create table if not exists public.user_search_attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.users(id),
  attempted_at timestamptz not null default now()
);

create table if not exists public.receipt_uploads (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.users(id),
  client_operation_id uuid not null,
  object_key          text not null,
  status              text not null default 'staged',
  attached_expense_id uuid references public.expenses(id),
  mime_type           text not null,
  size_bytes          bigint not null,
  created_at          timestamptz not null default now(),
  cleaned_at          timestamptz,
  unique(owner_id, client_operation_id)
);

-- ── 9. Expanded check constraints & uniqueness ───────────────────────────────

-- 9a. Unique object_key on receipt_uploads
alter table public.receipt_uploads add constraint receipt_uploads_object_key_unique unique (object_key);

-- 9b. Status/method check constraints
alter table public.friendships
  add constraint friendships_status_check
  check (status in ('pending', 'accepted', 'declined', 'removed', 'blocked'));

alter table public.expenses
  add constraint expenses_split_method_check
  check (split_method in ('equal', 'custom', 'percentage', 'shares'));

alter table public.settlements
  add constraint settlements_method_check
  check (method in ('cash', 'bank_transfer', 'other'));

alter table public.group_invitations
  add constraint group_invitations_status_check
  check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired'));

alter table public.group_invitations
  add constraint group_invitations_inviter_invitee_check
  check (inviter_id <> invitee_id);

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('friend_request', 'group_invite', 'balance_reminder', 'expense_added'));

-- 9c. Positive minor-value checks
alter table public.expenses       add constraint expenses_amount_minor_check       check (amount_minor >= 0);
alter table public.expense_splits add constraint expense_splits_amount_minor_check check (amount_minor >= 0);
alter table public.settlements    add constraint settlements_amount_minor_check    check (amount_minor > 0);

-- 9d. Partial unique indexes for client_operation_id (non-null only)
create unique index if not exists expenses_client_operation_id_idx
  on public.expenses(client_operation_id) where client_operation_id is not null;

create unique index if not exists settlements_client_operation_id_idx
  on public.settlements(client_operation_id) where client_operation_id is not null;

create unique index if not exists notifications_client_operation_id_idx
  on public.notifications(client_operation_id) where client_operation_id is not null;

-- 9e. Unique split positions per expense
create unique index if not exists expense_splits_position_idx
  on public.expense_splits(expense_id, position) where position is not null;

-- 9f. Friend invites: expiry after creation, and paired redemption fields
alter table public.friend_invites
  add constraint friend_invites_expires_at_check
  check (expires_at > created_at);

alter table public.friend_invites
  add constraint friend_invites_redeemed_check
  check ((redeemed_by is null and redeemed_at is null) or
         (redeemed_by is not null and redeemed_at is not null));

-- 9g. Receipt uploads status check
alter table public.receipt_uploads
  add constraint receipt_uploads_status_check
  check (status in ('staged', 'attached', 'cleaned'));

-- ── 10. Indexes for new foreign keys ──────────────────────────────────────────

create index if not exists expenses_friendship_id_idx
  on public.expenses(friendship_id);

create index if not exists settlements_friendship_id_idx
  on public.settlements(friendship_id);

create index if not exists friendships_requested_by_idx
  on public.friendships(requested_by);

create index if not exists friendships_blocked_by_idx
  on public.friendships(blocked_by);

create index if not exists group_invitations_group_id_idx
  on public.group_invitations(group_id);

create index if not exists group_invitations_invitee_id_idx
  on public.group_invitations(invitee_id);

create index if not exists notifications_recipient_id_idx
  on public.notifications(recipient_id);

create index if not exists notifications_created_at_idx
  on public.notifications(created_at);

create index if not exists user_search_attempts_user_id_idx
  on public.user_search_attempts(user_id);

create index if not exists receipt_uploads_owner_id_idx
  on public.receipt_uploads(owner_id);

create index if not exists receipt_uploads_attached_expense_id_idx
  on public.receipt_uploads(attached_expense_id);
