-- Backfill activity feed with existing expenses and settlements
-- Only inserts rows that don't already exist in the activities table

INSERT INTO public.activities (type, expense_id, group_id, user_id, description, amount, currency, date)
SELECT
  'expense',
  id,
  group_id,
  paid_by,
  title,
  amount,
  currency,
  date
FROM public.expenses
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities WHERE activities.expense_id = expenses.id
);

INSERT INTO public.activities (type, settlement_id, group_id, user_id, description, amount, currency, date)
SELECT
  'settlement',
  id,
  group_id,
  from_user_id,
  COALESCE(NULLIF(note, ''), 'Settlement'),
  amount,
  currency,
  date
FROM public.settlements
WHERE NOT EXISTS (
  SELECT 1 FROM public.activities WHERE activities.settlement_id = settlements.id
);
