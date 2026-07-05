-- Drop the old restrictive delete policy
DROP POLICY IF EXISTS "Group owners can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can remove members" ON public.group_members;

-- Create a new, permissive policy that allows ANY group member to remove someone
-- (This ensures you can remove someone even if you aren't the group creator)
CREATE POLICY "Group members can remove members"
ON public.group_members FOR DELETE
TO authenticated
USING (
  public.is_group_owner(group_id, auth.uid()) OR
  public.is_group_member(group_id, auth.uid()) OR
  user_id = auth.uid()
);
