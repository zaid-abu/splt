-- Drop the old overly restrictive policy
DROP POLICY IF EXISTS "Group owners can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group members and owners can add members" ON public.group_members;

-- Create a new, more permissive policy that allows:
-- 1. Group owners to add members
-- 2. Existing group members to add members
-- 3. Users to add themselves (needed when creating a group and adding yourself simultaneously)
CREATE POLICY "Group members and owners can add members"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  public.is_group_owner(group_id, auth.uid()) OR
  public.is_group_member(group_id, auth.uid()) OR
  user_id = auth.uid()
);

-- Ensure that the 'is_group_owner' function works correctly without caching issues
-- by removing 'stable' (if it had it) to ensure it performs a fresh query on every call.
CREATE OR REPLACE FUNCTION public.is_group_owner(target_group_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = target_group_id
      AND created_by = target_user_id
  );
$$;
