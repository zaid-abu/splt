alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.activities enable row level security;

create or replace function public.is_group_member(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = target_user_id
  );
$$;

create or replace function public.is_group_owner(target_group_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.groups
    where id = target_group_id
      and created_by = target_user_id
  );
$$;

drop policy if exists "Users can read authenticated profiles" on public.users;
create policy "Users can read authenticated profiles"
on public.users for select
to authenticated
using (true);

drop policy if exists "Users can create their profile" on public.users;
create policy "Users can create their profile"
on public.users for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update their profile" on public.users;
create policy "Users can update their profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Group members can read groups" on public.groups;
create policy "Group members can read groups"
on public.groups for select
to authenticated
using (created_by = auth.uid() or public.is_group_member(id, auth.uid()));

drop policy if exists "Users can create groups" on public.groups;
create policy "Users can create groups"
on public.groups for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Group owners can update groups" on public.groups;
create policy "Group owners can update groups"
on public.groups for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Group owners can delete groups" on public.groups;
create policy "Group owners can delete groups"
on public.groups for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Group members can read memberships" on public.group_members;
create policy "Group members can read memberships"
on public.group_members for select
to authenticated
using (user_id = auth.uid() or public.is_group_member(group_id, auth.uid()));

drop policy if exists "Group owners can add members" on public.group_members;
create policy "Group owners can add members"
on public.group_members for insert
to authenticated
with check (public.is_group_owner(group_id, auth.uid()));

drop policy if exists "Group owners can update members" on public.group_members;
create policy "Group owners can update members"
on public.group_members for update
to authenticated
using (public.is_group_owner(group_id, auth.uid()))
with check (public.is_group_owner(group_id, auth.uid()));

drop policy if exists "Group owners can remove members" on public.group_members;
create policy "Group owners can remove members"
on public.group_members for delete
to authenticated
using (public.is_group_owner(group_id, auth.uid()) or user_id = auth.uid());

drop policy if exists "Users can read visible expenses" on public.expenses;
create policy "Users can read visible expenses"
on public.expenses for select
to authenticated
using (
  paid_by = auth.uid()
  or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  or exists (
    select 1
    from public.expense_splits
    where expense_id = expenses.id
      and user_id = auth.uid()
  )
);

drop policy if exists "Users can create expenses they paid" on public.expenses;
create policy "Users can create expenses they paid"
on public.expenses for insert
to authenticated
with check (
  paid_by = auth.uid()
  and (group_id is null or public.is_group_member(group_id, auth.uid()))
);

drop policy if exists "Expense payers can update expenses" on public.expenses;
create policy "Expense payers can update expenses"
on public.expenses for update
to authenticated
using (paid_by = auth.uid() or (group_id is not null and public.is_group_owner(group_id, auth.uid())))
with check (paid_by = auth.uid() or (group_id is not null and public.is_group_owner(group_id, auth.uid())));

drop policy if exists "Expense payers can delete expenses" on public.expenses;
create policy "Expense payers can delete expenses"
on public.expenses for delete
to authenticated
using (paid_by = auth.uid() or (group_id is not null and public.is_group_owner(group_id, auth.uid())));

drop policy if exists "Users can read visible splits" on public.expense_splits;
create policy "Users can read visible splits"
on public.expense_splits for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.expenses
    where expenses.id = expense_splits.expense_id
      and (
        expenses.paid_by = auth.uid()
        or (expenses.group_id is not null and public.is_group_member(expenses.group_id, auth.uid()))
      )
  )
);

drop policy if exists "Expense payers can create splits" on public.expense_splits;
create policy "Expense payers can create splits"
on public.expense_splits for insert
to authenticated
with check (
  exists (
    select 1
    from public.expenses
    where expenses.id = expense_splits.expense_id
      and expenses.paid_by = auth.uid()
  )
);

drop policy if exists "Expense payers can update splits" on public.expense_splits;
create policy "Expense payers can update splits"
on public.expense_splits for update
to authenticated
using (
  exists (
    select 1
    from public.expenses
    where expenses.id = expense_splits.expense_id
      and expenses.paid_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.expenses
    where expenses.id = expense_splits.expense_id
      and expenses.paid_by = auth.uid()
  )
);

drop policy if exists "Expense payers can delete splits" on public.expense_splits;
create policy "Expense payers can delete splits"
on public.expense_splits for delete
to authenticated
using (
  exists (
    select 1
    from public.expenses
    where expenses.id = expense_splits.expense_id
      and expenses.paid_by = auth.uid()
  )
);

drop policy if exists "Users can read visible settlements" on public.settlements;
create policy "Users can read visible settlements"
on public.settlements for select
to authenticated
using (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or (group_id is not null and public.is_group_member(group_id, auth.uid()))
);

drop policy if exists "Users can create settlements they send" on public.settlements;
create policy "Users can create settlements they send"
on public.settlements for insert
to authenticated
with check (
  from_user_id = auth.uid()
  and (group_id is null or public.is_group_member(group_id, auth.uid()))
);

drop policy if exists "Settlement senders can delete settlements" on public.settlements;
create policy "Settlement senders can delete settlements"
on public.settlements for delete
to authenticated
using (from_user_id = auth.uid() or (group_id is not null and public.is_group_owner(group_id, auth.uid())));

drop policy if exists "Users can read visible activities" on public.activities;
create policy "Users can read visible activities"
on public.activities for select
to authenticated
using (user_id = auth.uid() or (group_id is not null and public.is_group_member(group_id, auth.uid())));

drop policy if exists "Users can create their activities" on public.activities;
create policy "Users can create their activities"
on public.activities for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete their activities" on public.activities;
create policy "Users can delete their activities"
on public.activities for delete
to authenticated
using (user_id = auth.uid());
