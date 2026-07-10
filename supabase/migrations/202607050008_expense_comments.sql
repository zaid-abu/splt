create table public.expense_comments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.expense_comments enable row level security;

-- Anyone who can see the expense can see its comments
create policy "Expense comments are viewable by expense participants"
  on public.expense_comments for select
  using (
    exists (
      select 1 from public.expenses
      where expenses.id = expense_comments.expense_id
      and (
        expenses.paid_by = auth.uid()
        or exists (
          select 1 from public.expense_splits
          where expense_splits.expense_id = expenses.id
          and expense_splits.user_id = auth.uid()
        )
        or exists (
          select 1 from public.group_members
          join public.expenses on expenses.group_id = group_members.group_id
          where group_members.user_id = auth.uid()
          and expenses.id = expense_comments.expense_id
        )
      )
    )
  );

-- Users can insert their own comments on expenses they can see
create policy "Users can comment on expenses they can view"
  on public.expense_comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.expenses
      where expenses.id = expense_comments.expense_id
      and (
        expenses.paid_by = auth.uid()
        or exists (
          select 1 from public.expense_splits
          where expense_splits.expense_id = expenses.id
          and expense_splits.user_id = auth.uid()
        )
        or exists (
          select 1 from public.group_members
          join public.expenses on expenses.group_id = group_members.group_id
          where group_members.user_id = auth.uid()
          and expenses.id = expense_comments.expense_id
        )
      )
    )
  );

-- Users can delete their own comments
create policy "Users can delete own comments"
  on public.expense_comments for delete
  using (user_id = auth.uid());
