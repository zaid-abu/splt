ALTER TABLE public.groups
ADD COLUMN default_split_method TEXT NOT NULL DEFAULT 'equal'
CHECK (default_split_method IN ('equal', 'custom', 'percentage'));
