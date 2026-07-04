create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar text,
  initials text not null,
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  description text,
  currency text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.users (id) on delete cascade,
  total_expenses numeric(12, 2) not null default 0,
  simplify_debts boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  title text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null,
  category text not null check (
    category in (
      'food',
      'transport',
      'accommodation',
      'entertainment',
      'shopping',
      'utilities',
      'health',
      'travel',
      'other'
    )
  ),
  paid_by uuid not null references public.users (id) on delete restrict,
  split_method text not null check (split_method in ('equal', 'custom', 'percentage')),
  date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  percentage numeric(5, 2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (expense_id, user_id)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete restrict,
  to_user_id uuid not null references public.users (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null,
  date timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('expense', 'settlement', 'member_joined', 'group_created')),
  group_id uuid references public.groups (id) on delete cascade,
  expense_id uuid references public.expenses (id) on delete cascade,
  settlement_id uuid references public.settlements (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  description text not null,
  amount numeric(12, 2),
  currency text,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists expenses_group_id_date_idx on public.expenses (group_id, date desc);
create index if not exists expenses_paid_by_idx on public.expenses (paid_by);
create index if not exists expense_splits_user_id_idx on public.expense_splits (user_id);
create index if not exists settlements_group_id_date_idx on public.settlements (group_id, date desc);
create index if not exists settlements_from_user_id_idx on public.settlements (from_user_id);
create index if not exists settlements_to_user_id_idx on public.settlements (to_user_id);
create index if not exists activities_user_id_date_idx on public.activities (user_id, date desc);
create index if not exists activities_group_id_date_idx on public.activities (group_id, date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_initials text;
begin
  profile_name = coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));
  profile_initials = upper(left(profile_name, 1));

  insert into public.users (id, name, email, avatar, initials, default_currency)
  values (
    new.id,
    profile_name,
    new.email,
    new.raw_user_meta_data ->> 'avatar',
    profile_initials,
    coalesce(new.raw_user_meta_data ->> 'defaultCurrency', 'USD')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_for_auth_user on auth.users;
create trigger create_profile_for_auth_user
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();
