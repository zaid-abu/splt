-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "Group owners can update groups" ON public.groups;

-- Create a new, permissive policy that allows ANY group member to update the group details
CREATE POLICY "Group members can update groups"
ON public.groups FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.is_group_member(id, auth.uid()))
WITH CHECK (created_by = auth.uid() OR public.is_group_member(id, auth.uid()));
