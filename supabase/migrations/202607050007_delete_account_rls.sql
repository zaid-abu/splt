-- Allow users to delete their own profile (needed for account deletion)
CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (id = auth.uid());
