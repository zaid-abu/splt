begin;
select plan(20);

select ok(not has_table_privilege('authenticated','public.recurring_expenses','INSERT'), 'authenticated cannot insert schedules');
select ok(not has_table_privilege('authenticated','public.recurring_expenses','UPDATE'), 'authenticated cannot update schedules');
select ok(not has_table_privilege('authenticated','public.recurring_expenses','DELETE'), 'authenticated cannot delete schedules');
select ok(not has_table_privilege('authenticated','public.recurring_occurrences','INSERT'), 'authenticated cannot insert occurrences');
select ok(not has_table_privilege('authenticated','public.recurring_occurrences','UPDATE'), 'authenticated cannot update occurrences');
select ok(not has_table_privilege('authenticated','public.recurring_occurrences','DELETE'), 'authenticated cannot delete occurrences');
select ok(has_function_privilege('authenticated','public.create_recurring_expense_v2(jsonb)','EXECUTE'), 'authenticated can create through RPC');
select ok(has_function_privilege('authenticated','public.update_recurring_expense_v2(uuid,jsonb)','EXECUTE'), 'authenticated can update through RPC');
select ok(has_function_privilege('authenticated','public.set_recurring_expense_status_v2(uuid,text)','EXECUTE'), 'authenticated can pause through RPC');
select ok(has_function_privilege('authenticated','public.delete_recurring_expense_v2(uuid)','EXECUTE'), 'authenticated can delete through RPC');
select ok(has_function_privilege('authenticated','public.review_recurring_occurrence_v2(uuid,text)','EXECUTE'), 'authenticated can review through RPC');
select ok(not has_function_privilege('authenticated','public.generate_due_recurring_expenses(date)','EXECUTE'), 'authenticated cannot run global generation');
select ok(not has_function_privilege('anon','public.generate_due_recurring_expenses(date)','EXECUTE'), 'anon cannot run global generation');
select ok(not has_function_privilege('authenticated','public.recurring_generate_internal(uuid,uuid,text)','EXECUTE'), 'internal generator is private');
select ok(not has_function_privilege('authenticated','public.recurring_validate_schedule(uuid,uuid,uuid,uuid,text,bigint,text,jsonb,text,integer,integer,integer,date,date,integer,text,boolean)','EXECUTE'), 'validator is private');

select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select public.create_recurring_expense_v2('{}'::jsonb)$$, 'P0001', 'not_authenticated', 'unauthenticated create is rejected');
select throws_ok($$select public.review_recurring_occurrence_v2('00000000-0000-0000-0000-000000000000','generate')$$, 'P0001', 'not_authenticated', 'unauthenticated review is rejected');

select set_config('request.jwt.claim.role','authenticated',true);
select throws_ok($$select public.generate_due_recurring_expenses(current_date)$$, '42501', NULL, 'authenticated global generation is rejected');

select ok((select count(*) from pg_constraint where conname='recurring_occurrence_expense_consistency') = 1, 'occurrence consistency constraint exists');
select ok((select count(*) from pg_indexes where indexname='recurring_occurrences_recurring_expense_id_idx') = 1, 'occurrence lookup index remains');

select * from finish();
rollback;
