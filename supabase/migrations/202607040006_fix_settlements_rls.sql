-- Allow users to create settlements where they are either the sender or receiver
drop policy if exists "Users can create settlements they send" on public.settlements;
drop policy if exists "Users can create settlements they participate in" on public.settlements;

create policy "Users can create settlements they participate in"
on public.settlements for insert
to authenticated
with check (
  auth.uid() in (from_user_id, to_user_id)
  and (group_id is null or public.is_group_member(group_id, auth.uid()))
);
