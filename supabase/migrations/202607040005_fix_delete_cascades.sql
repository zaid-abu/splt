-- Fix expense_splits delete policy to allow group owners to delete splits when deleting a group
drop policy if exists "Expense payers can delete splits" on public.expense_splits;
create policy "Expense payers can delete splits"
on public.expense_splits for delete
to authenticated
using (
  exists (
    select 1
    from public.expenses
    where expenses.id = expense_splits.expense_id
      and (
        expenses.paid_by = auth.uid()
        or (expenses.group_id is not null and public.is_group_owner(expenses.group_id, auth.uid()))
      )
  )
);

-- Fix activities delete policy to allow group owners to delete activities when deleting a group
drop policy if exists "Users can delete their activities" on public.activities;
create policy "Users can delete their activities"
on public.activities for delete
to authenticated
using (
  user_id = auth.uid()
  or (group_id is not null and public.is_group_owner(group_id, auth.uid()))
);
