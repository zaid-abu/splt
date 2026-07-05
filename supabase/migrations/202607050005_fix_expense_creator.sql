-- 1. Add a created_by column so we can track who created the expense. 
-- The default value auth.uid() automatically fills it in with the user making the request.
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) DEFAULT auth.uid();

-- 2. Drop all old restrictive policies
DROP POLICY IF EXISTS "Users can create expenses they paid" ON public.expenses;
DROP POLICY IF EXISTS "Expense payers can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense payers can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense payers can create splits" ON public.expense_splits;

-- 3. Allow users to insert an expense if they are the creator OR the payer
CREATE POLICY "Users can create expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() OR
  paid_by = auth.uid() OR
  (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);

-- 4. Allow involved users to update the expense
CREATE POLICY "Users involved can update expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR
  paid_by = auth.uid() OR
  (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
)
WITH CHECK (
  created_by = auth.uid() OR
  paid_by = auth.uid() OR
  (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);

-- 5. Allow involved users to delete the expense
CREATE POLICY "Users involved can delete expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  paid_by = auth.uid() OR
  (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);

-- 6. Update the expense_splits insert policy to use the new created_by field
CREATE POLICY "Expense creators can create splits"
ON public.expense_splits FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE id = expense_id
      AND (
        created_by = auth.uid() OR
        paid_by = auth.uid() OR
        (expenses.group_id IS NOT NULL AND public.is_group_member(expenses.group_id, auth.uid()))
      )
  )
);
