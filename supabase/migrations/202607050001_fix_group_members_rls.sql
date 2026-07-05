drop policy if exists "Group owners can add members" on public.group_members;
create policy "Group members and owners can add members"
on public.group_members for insert
to authenticated
with check (
  public.is_group_owner(group_id, auth.uid()) OR
  public.is_group_member(group_id, auth.uid()) OR
  user_id = auth.uid()
);
