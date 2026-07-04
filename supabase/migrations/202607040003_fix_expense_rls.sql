-- Fix infinite recursion on table expenses and expense_splits

-- 1. Create a security definer function to check if a user is a participant of an expense
create or replace function public.is_expense_participant(target_expense_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.expense_splits
    where expense_id = target_expense_id
      and user_id = target_user_id
  );
$$;

-- 2. Drop the old policies
drop policy if exists "Users can read visible expenses" on public.expenses;
drop policy if exists "Users can read visible splits" on public.expense_splits;

-- 3. Recreate expenses SELECT policy using the security definer function
create policy "Users can read visible expenses"
on public.expenses for select
to authenticated
using (
  paid_by = auth.uid()
  or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  or public.is_expense_participant(id, auth.uid())
);

-- 4. Recreate expense_splits SELECT policy
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
