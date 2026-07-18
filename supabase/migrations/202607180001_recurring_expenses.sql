-- Add recurring_expense_id to expenses table
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recurring_expense_id uuid;

-- Recurring expense schedules
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  paid_by_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  title text NOT NULL,
  amount numeric(12, 2) CHECK (amount IS NULL OR amount >= 0),
  currency_code text NOT NULL,
  split_method text NOT NULL CHECK (split_method IN ('equal', 'amount', 'percentage', 'shares')),
  split_config jsonb,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  interval_value integer NOT NULL DEFAULT 1 CHECK (interval_value > 0),
  day_of_week integer CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  day_of_month integer CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  start_date date NOT NULL,
  next_run_date date NOT NULL,
  reminder_days_before integer NOT NULL DEFAULT 0 CHECK (reminder_days_before >= 0),
  auto_post boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.recurring_expenses IS 'Recurring expense schedules. Each row defines a template for automatically generated expenses on a cadence.';
COMMENT ON COLUMN public.recurring_expenses.split_config IS 'Split configuration based on split_method. For equal: null. For amount/percentage/shares: {user_id: value, ...}.';

-- Occurrence log so generation is idempotent
CREATE TABLE IF NOT EXISTS public.recurring_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_expense_id uuid NOT NULL REFERENCES public.recurring_expenses (id) ON DELETE CASCADE,
  scheduled_for date NOT NULL,
  expense_id uuid REFERENCES public.expenses (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'skipped', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recurring_expense_id, scheduled_for)
);

COMMENT ON TABLE public.recurring_occurrences IS 'Log of each scheduled recurring-generation date. One row per schedule per calendar date.';
COMMENT ON COLUMN public.recurring_occurrences.status IS 'pending = not yet handled; generated = expense created; skipped = manually skipped; failed = generation errored.';

-- Add FK from expenses back to the recurring schedule that created them
ALTER TABLE public.expenses
  ADD CONSTRAINT fk_expenses_recurring_expense
  FOREIGN KEY (recurring_expense_id)
  REFERENCES public.recurring_expenses (id)
  ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS recurring_expenses_group_id_idx ON public.recurring_expenses (group_id);
CREATE INDEX IF NOT EXISTS recurring_expenses_next_run_date_idx ON public.recurring_expenses (next_run_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS recurring_occurrences_recurring_expense_id_idx ON public.recurring_occurrences (recurring_expense_id);
CREATE INDEX IF NOT EXISTS recurring_occurrences_scheduled_for_idx ON public.recurring_occurrences (scheduled_for);
CREATE INDEX IF NOT EXISTS recurring_occurrences_expense_id_idx ON public.recurring_occurrences (expense_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_recurring_expenses_updated_at ON public.recurring_expenses;
CREATE TRIGGER set_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_occurrences ENABLE ROW LEVEL SECURITY;

-- ─── RLS: recurring_expenses ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Group members can read recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Group members can read recurring expenses"
  ON public.recurring_expenses FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Schedule creators can insert recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Schedule creators can insert recurring expenses"
  ON public.recurring_expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Schedule creators and group owners can update" ON public.recurring_expenses;
CREATE POLICY "Schedule creators and group owners can update"
  ON public.recurring_expenses FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_group_owner(group_id, auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_group_owner(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Schedule creators and group owners can delete" ON public.recurring_expenses;
CREATE POLICY "Schedule creators and group owners can delete"
  ON public.recurring_expenses FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_group_owner(group_id, auth.uid())
  );

-- ─── RLS: recurring_occurrences (inherits schedule access) ────────────────────

DROP POLICY IF EXISTS "Group members can read occurrences" ON public.recurring_occurrences;
CREATE POLICY "Group members can read occurrences"
  ON public.recurring_occurrences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_expenses
      WHERE recurring_expenses.id = recurring_occurrences.recurring_expense_id
        AND public.is_group_member(recurring_expenses.group_id, auth.uid())
    )
  );

-- Occurrences are managed entirely by the server-side generation function,
-- so no insert/update/delete policies for authenticated users.
-- Admin/function access bypasses RLS via SECURITY DEFINER.

-- ─── Helper: compute the next run date after a given date ─────────────────────

CREATE OR REPLACE FUNCTION public.next_recurring_date(
  p_frequency text,
  p_interval integer,
  p_current_date date,
  p_day_of_week integer DEFAULT NULL,
  p_day_of_month integer DEFAULT NULL
)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result date;
  target_dow integer;
  days_ahead integer;
  target_dom integer;
BEGIN
  CASE p_frequency
    WHEN 'weekly' THEN
      -- Advance by interval weeks, then adjust to the target day_of_week
      result := p_current_date + (7 * p_interval);
      IF p_day_of_week IS NOT NULL THEN
        target_dow := p_day_of_week;
        days_ahead := target_dow - extract(dow FROM result)::integer;
        IF days_ahead < 0 THEN
          days_ahead := days_ahead + 7;
        END IF;
        result := result + days_ahead;
        -- If the adjustment pushed us back, force at least one interval forward
        IF result <= p_current_date THEN
          result := result + 7;
        END IF;
      END IF;

    WHEN 'monthly' THEN
      -- Advance by interval months, clamping day_of_month to valid days
      result := p_current_date + make_interval(months => p_interval);
      IF p_day_of_month IS NOT NULL THEN
        -- Clamp to last valid day of the target month
        target_dom := LEAST(p_day_of_month, extract(day FROM (date_trunc('month', result) + interval '1 month' - interval '1 day')::date)::integer);
        result := date_trunc('month', result)::date + (target_dom - 1);
      END IF;

    WHEN 'yearly' THEN
      result := p_current_date + make_interval(years => p_interval);
      IF p_day_of_month IS NOT NULL THEN
        target_dom := LEAST(p_day_of_month, extract(day FROM (date_trunc('month', make_date(extract(year FROM result)::integer, extract(month FROM result)::integer, 1)::date) + interval '1 month' - interval '1 day')::date)::integer);
        result := date_trunc('month', result)::date + (target_dom - 1);
      ELSIF p_day_of_week IS NOT NULL THEN
        target_dow := p_day_of_week;
        days_ahead := target_dow - extract(dow FROM result)::integer;
        IF days_ahead < 0 THEN
          days_ahead := days_ahead + 7;
        END IF;
        result := result + days_ahead;
        IF result <= p_current_date THEN
          result := result + 7;
        END IF;
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown frequency: %', p_frequency;
  END CASE;

  RETURN result;
END;
$$;

-- ─── Core: generate outstanding recurring expenses up to a given date ─────────
-- Must be idempotent: ON CONFLICT DO NOTHING on the occurrence unique constraint.
-- Each invocation scans active schedules with next_run_date <= run_date.

CREATE OR REPLACE FUNCTION public.generate_due_recurring_expenses(
  run_date date DEFAULT current_date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  generated_count integer := 0;
  occ_id uuid;
  exp_id uuid;
  split_entry record;
  total_amount numeric(12, 2);
  split_amount numeric(12, 2);
  split_pct numeric(5, 2);
  split_shares integer;
  total_shares integer;
BEGIN
  FOR rec IN
    SELECT *
    FROM public.recurring_expenses
    WHERE status = 'active'
      AND next_run_date <= run_date
    ORDER BY next_run_date
  LOOP
    BEGIN
      -- 1. Insert occurrence (idempotent via UNIQUE constraint)
      INSERT INTO public.recurring_occurrences (recurring_expense_id, scheduled_for, status)
      VALUES (rec.id, rec.next_run_date, 'pending')
      ON CONFLICT (recurring_expense_id, scheduled_for) DO NOTHING
      RETURNING id INTO occ_id;

      -- If the occurrence already existed (occ_id IS NULL), skip to updating next_run_date
      IF occ_id IS NULL THEN
        -- Advance next_run_date anyway (it may have been skipped previously)
        RAISE DEBUG 'Occurrence already exists for schedule % on %', rec.id, rec.next_run_date;
      ELSE
        -- 2. Create the expense if auto_post is enabled and amount is set
        IF rec.auto_post AND rec.amount IS NOT NULL THEN
          INSERT INTO public.expenses (
            group_id, title, amount, currency, category,
            paid_by, split_method, date, recurring_expense_id
          )
          VALUES (
            rec.group_id,
            rec.title,
            rec.amount,
            rec.currency_code,
            'other',
            rec.paid_by_user_id,
            rec.split_method,
            rec.next_run_date,
            rec.id
          )
          RETURNING id INTO exp_id;

          -- 3. Create splits based on split_method
          CASE rec.split_method
            WHEN 'equal' THEN
              -- Equal split: divide amount among all group members
              FOR split_entry IN
                SELECT user_id FROM public.group_members WHERE group_id = rec.group_id
              LOOP
                INSERT INTO public.expense_splits (expense_id, user_id, amount)
                VALUES (exp_id, split_entry.user_id, rec.amount / (SELECT count(*) FROM public.group_members WHERE group_id = rec.group_id));
              END LOOP;

            WHEN 'amount' THEN
              -- split_config is {user_id: amount, ...}
              FOR split_entry IN
                SELECT key::uuid AS user_id, (value::text)::numeric AS amt
                FROM jsonb_each(rec.split_config)
              LOOP
                INSERT INTO public.expense_splits (expense_id, user_id, amount)
                VALUES (exp_id, split_entry.user_id, split_entry.amt);
              END LOOP;

            WHEN 'percentage' THEN
              -- split_config is {user_id: percentage, ...}
              total_amount := rec.amount;
              FOR split_entry IN
                SELECT key::uuid AS user_id, (value::text)::numeric AS pct
                FROM jsonb_each(rec.split_config)
              LOOP
                split_amount := (split_entry.pct / 100.0) * total_amount;
                INSERT INTO public.expense_splits (expense_id, user_id, amount, percentage)
                VALUES (exp_id, split_entry.user_id, split_amount, split_entry.pct);
              END LOOP;

            WHEN 'shares' THEN
              -- split_config is {user_id: shares, ...}
              SELECT sum((value::text)::integer) INTO total_shares
              FROM jsonb_each(rec.split_config);
              total_amount := rec.amount;
              FOR split_entry IN
                SELECT key::uuid AS user_id, (value::text)::integer AS shr
                FROM jsonb_each(rec.split_config)
              LOOP
                split_amount := (split_entry.shr::numeric / total_shares::numeric) * total_amount;
                INSERT INTO public.expense_splits (expense_id, user_id, amount)
                VALUES (exp_id, split_entry.user_id, split_amount);
              END LOOP;

            ELSE
              RAISE WARNING 'Unknown split_method % for schedule %', rec.split_method, rec.id;
          END CASE;

          -- Link the occurrence to the generated expense
          UPDATE public.recurring_occurrences
          SET status = 'generated', expense_id = exp_id
          WHERE id = occ_id;

        ELSE
          -- Mark as skipped if not auto-posted or no amount
          UPDATE public.recurring_occurrences
          SET status = 'skipped'
          WHERE id = occ_id;
        END IF;

        generated_count := generated_count + 1;
      END IF;

      -- 4. Advance next_run_date
      IF rec.auto_post THEN
        UPDATE public.recurring_expenses
        SET next_run_date = public.next_recurring_date(
          rec.frequency,
          rec.interval_value,
          rec.next_run_date,
          rec.day_of_week,
          rec.day_of_month
        )
        WHERE id = rec.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Mark occurrence as failed, log the error, and continue
      IF occ_id IS NOT NULL THEN
        UPDATE public.recurring_occurrences
        SET status = 'failed'
        WHERE id = occ_id;
      END IF;
      RAISE WARNING 'Failed to generate recurring expense % on %: %', rec.id, rec.next_run_date, SQLERRM;
    END;
  END LOOP;

  RETURN generated_count;
END;
$$;

-- ─── pg_cron daily schedule (guarded for environments without cron) ───────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'generate-due-recurring-expenses',
      '0 2 * * *',
      $$SELECT public.generate_due_recurring_expenses(current_date)$$
    );
  END IF;
END;
$$;
