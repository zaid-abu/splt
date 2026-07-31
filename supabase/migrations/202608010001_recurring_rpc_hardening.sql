-- Recurring schedules are write-only through authenticated contracts.  This migration
-- deliberately leaves historical rows in place and validates new/changed rows fail closed.

alter table public.recurring_expenses add column if not exists amount_minor bigint;
alter table public.recurring_expenses drop constraint if exists recurring_amount_minor_storage_check;
alter table public.recurring_expenses add constraint recurring_amount_minor_storage_check
  check (amount_minor is null or amount_minor > 0) not valid;
alter table public.recurring_occurrences drop constraint if exists recurring_occurrence_expense_consistency;
alter table public.recurring_occurrences add constraint recurring_occurrence_expense_consistency
  check ((status = 'generated') = (expense_id is not null)) not valid;

revoke insert, update, delete on public.recurring_expenses from anon, authenticated;
revoke insert, update, delete on public.recurring_occurrences from anon, authenticated;

create or replace function public.recurring_validate_schedule(
  p_actor uuid, p_group_id uuid, p_created_by uuid, p_payer uuid, p_currency text,
  p_amount_minor bigint, p_split_method text, p_split_config jsonb, p_frequency text,
  p_interval integer, p_day_of_week integer, p_day_of_month integer, p_start_date date,
  p_next_run_date date, p_reminder integer, p_status text, p_auto_post boolean
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_group_currency text; v_scale smallint; v_value numeric;
begin
  if p_actor is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.group_members where group_id = p_group_id and user_id = p_actor)
    then raise exception 'group_membership_required' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.group_members where group_id = p_group_id and user_id = p_payer)
    then raise exception 'payer_not_in_group' using errcode = 'P0001'; end if;
  if p_created_by is distinct from p_actor and not public.is_group_owner(p_group_id, p_actor)
    then raise exception 'schedule_authority_required' using errcode = 'P0001'; end if;
  select upper(currency) into v_group_currency from public.groups where id = p_group_id;
  if v_group_currency is null then raise exception 'group_not_found' using errcode = 'P0001'; end if;
  if upper(p_currency) is distinct from v_group_currency then
    raise exception 'group_currency_mismatch' using errcode = 'P0001';
  end if;
  v_scale := public.currency_minor_scale(upper(p_currency));
  if p_auto_post and (p_amount_minor is null or p_amount_minor <= 0
      or p_amount_minor::numeric > public.ledger_amount_ceiling(upper(p_currency)))
    then raise exception 'amount_minor_invalid' using errcode = 'P0001'; end if;
  if nullif(btrim(p_currency), '') is null or nullif(btrim(p_frequency), '') is null
    or p_interval is null or p_interval < 1 or p_interval > 366
    or p_start_date is null or p_next_run_date is null or p_reminder is null or p_reminder < 0
    or p_reminder > 365 or p_status not in ('active','paused')
    then raise exception 'schedule_fields_invalid' using errcode = 'P0001'; end if;
  if p_frequency not in ('weekly','monthly','yearly') then raise exception 'frequency_invalid' using errcode = 'P0001'; end if;
  if p_day_of_week is not null and (p_day_of_week < 0 or p_day_of_week > 6)
    then raise exception 'day_of_week_invalid' using errcode = 'P0001'; end if;
  if p_day_of_month is not null and (p_day_of_month < 1 or p_day_of_month > 31)
    then raise exception 'day_of_month_invalid' using errcode = 'P0001'; end if;
  if p_split_method not in ('equal','amount','percentage','shares')
    then raise exception 'split_method_invalid' using errcode = 'P0001'; end if;
  if p_split_method = 'equal' and p_split_config is not null and p_split_config <> '{}'::jsonb
    then raise exception 'split_config_invalid' using errcode = 'P0001'; end if;
  if p_split_method <> 'equal' and (p_split_config is null or jsonb_typeof(p_split_config) <> 'object'
      or jsonb_object_length(p_split_config) = 0) then raise exception 'split_config_required' using errcode = 'P0001'; end if;
  if p_split_method <> 'equal' then
    for v_value in select value::text::numeric from jsonb_each_text(p_split_config) loop
      if p_split_method = 'amount' and (v_value < 0 or v_value * power(10::numeric,v_scale) > public.ledger_amount_ceiling(upper(p_currency)))
        then raise exception 'split_config_invalid' using errcode='P0001'; end if;
      if p_split_method in ('percentage','shares') and v_value <= 0 then raise exception 'split_config_invalid' using errcode='P0001'; end if;
    end loop;
  end if;
end; $$;
revoke all on function public.recurring_validate_schedule(uuid,uuid,uuid,uuid,text,bigint,text,jsonb,text,integer,integer,integer,date,date,integer,text,boolean) from public, anon, authenticated;

create or replace function public.create_recurring_expense_v2(p_input jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := auth.uid(); v_id uuid; v_minor bigint; v_currency text;
begin
  if v_actor is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  if nullif(btrim(p_input->>'title'),'') is null then raise exception 'title_required' using errcode='P0001'; end if;
  v_currency := upper(p_input->>'currencyCode');
  if p_input->>'amount' is not null then
    v_minor := round((p_input->>'amount')::numeric * power(10::numeric, public.currency_minor_scale(v_currency)))::bigint;
  end if;
  perform public.recurring_validate_schedule(v_actor, (p_input->>'groupId')::uuid, v_actor,
    (p_input->>'paidByUserId')::uuid, v_currency, v_minor, p_input->>'splitMethod',
    p_input->'splitConfig', p_input->>'frequency', (p_input->>'intervalValue')::integer,
    nullif(p_input->>'dayOfWeek','')::integer, nullif(p_input->>'dayOfMonth','')::integer,
    (p_input->>'startDate')::date, (p_input->>'startDate')::date,
    (p_input->>'reminderDaysBefore')::integer, coalesce(p_input->>'status','active'),
    coalesce((p_input->>'autoPost')::boolean, true));
  insert into public.recurring_expenses(group_id,created_by,paid_by_user_id,title,amount,amount_minor,currency_code,
    split_method,split_config,frequency,interval_value,day_of_week,day_of_month,start_date,next_run_date,
    reminder_days_before,auto_post,status)
  values ((p_input->>'groupId')::uuid,v_actor,(p_input->>'paidByUserId')::uuid,btrim(p_input->>'title'),
    (p_input->>'amount')::numeric,v_minor,v_currency,p_input->>'splitMethod',p_input->'splitConfig',
    p_input->>'frequency',(p_input->>'intervalValue')::integer,nullif(p_input->>'dayOfWeek','')::integer,
    nullif(p_input->>'dayOfMonth','')::integer,(p_input->>'startDate')::date,(p_input->>'startDate')::date,
    (p_input->>'reminderDaysBefore')::integer,coalesce((p_input->>'autoPost')::boolean,true),coalesce(p_input->>'status','active'))
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.create_recurring_expense_v2(jsonb) from public, anon;
grant execute on function public.create_recurring_expense_v2(jsonb) to authenticated;

create or replace function public.update_recurring_expense_v2(p_id uuid, p_input jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := auth.uid(); v public.recurring_expenses%rowtype; j jsonb; v_minor bigint;
begin
  if v_actor is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  select * into v from public.recurring_expenses where id = p_id for update;
  if not found then raise exception 'recurring_not_found' using errcode = 'P0001'; end if;
  if v.created_by is distinct from v_actor and not public.is_group_owner(v.group_id,v_actor)
    then raise exception 'schedule_authority_required' using errcode = 'P0001'; end if;
  j := jsonb_build_object('groupId',v.group_id,'paidByUserId',v.paid_by_user_id,'title',v.title,'amount',v.amount,
    'currencyCode',v.currency_code,'splitMethod',v.split_method,'splitConfig',v.split_config,'frequency',v.frequency,
    'intervalValue',v.interval_value,'dayOfWeek',v.day_of_week,'dayOfMonth',v.day_of_month,'startDate',v.start_date,
    'reminderDaysBefore',v.reminder_days_before,'autoPost',v.auto_post,'status',v.status) || coalesce(p_input,'{}'::jsonb);
  if nullif(btrim(j->>'title'),'') is null then raise exception 'title_required' using errcode='P0001'; end if;
  if j->>'amount' is not null then v_minor := round((j->>'amount')::numeric * power(10::numeric,public.currency_minor_scale(upper(j->>'currencyCode'))))::bigint; end if;
  perform public.recurring_validate_schedule(v_actor,(j->>'groupId')::uuid,v.created_by,(j->>'paidByUserId')::uuid,
    upper(j->>'currencyCode'),v_minor,j->>'splitMethod',j->'splitConfig',j->>'frequency',(j->>'intervalValue')::integer,
    nullif(j->>'dayOfWeek','')::integer,nullif(j->>'dayOfMonth','')::integer,(j->>'startDate')::date,v.next_run_date,
    (j->>'reminderDaysBefore')::integer,j->>'status',(j->>'autoPost')::boolean);
  update public.recurring_expenses set group_id=(j->>'groupId')::uuid,paid_by_user_id=(j->>'paidByUserId')::uuid,
    title=btrim(j->>'title'),amount=(j->>'amount')::numeric,amount_minor=v_minor,currency_code=upper(j->>'currencyCode'),
    split_method=j->>'splitMethod',split_config=j->'splitConfig',frequency=j->>'frequency',interval_value=(j->>'intervalValue')::integer,
    day_of_week=nullif(j->>'dayOfWeek','')::integer,day_of_month=nullif(j->>'dayOfMonth','')::integer,start_date=(j->>'startDate')::date,
    reminder_days_before=(j->>'reminderDaysBefore')::integer,auto_post=(j->>'autoPost')::boolean,status=j->>'status' where id=p_id;
  return p_id;
end; $$;
revoke all on function public.update_recurring_expense_v2(uuid,jsonb) from public, anon;
grant execute on function public.update_recurring_expense_v2(uuid,jsonb) to authenticated;

create or replace function public.set_recurring_expense_status_v2(p_id uuid,p_status text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.recurring_expenses%rowtype; a uuid:=auth.uid();
begin
  if a is null then raise exception 'not_authenticated' using errcode='P0001'; end if;
  if p_status not in ('active','paused') then raise exception 'status_invalid' using errcode='P0001'; end if;
  select * into v from public.recurring_expenses where id=p_id for update;
  if not found then raise exception 'recurring_not_found' using errcode='P0001'; end if;
  if v.created_by is distinct from a and not public.is_group_owner(v.group_id,a) then raise exception 'schedule_authority_required' using errcode='P0001'; end if;
  if v.status <> p_status and v.status not in ('active','paused') then raise exception 'status_transition_invalid' using errcode='P0001'; end if;
  update public.recurring_expenses set status=p_status where id=p_id;
end; $$;
revoke all on function public.set_recurring_expense_status_v2(uuid,text) from public, anon;
grant execute on function public.set_recurring_expense_status_v2(uuid,text) to authenticated;

create or replace function public.delete_recurring_expense_v2(p_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v public.recurring_expenses%rowtype; a uuid:=auth.uid();
begin
  if a is null then raise exception 'not_authenticated' using errcode='P0001'; end if;
  select * into v from public.recurring_expenses where id=p_id for update;
  if not found then raise exception 'recurring_not_found' using errcode='P0001'; end if;
  if v.created_by is distinct from a and not public.is_group_owner(v.group_id,a) then raise exception 'schedule_authority_required' using errcode='P0001'; end if;
  delete from public.recurring_expenses where id=p_id;
end; $$;
revoke all on function public.delete_recurring_expense_v2(uuid) from public, anon;
grant execute on function public.delete_recurring_expense_v2(uuid) to authenticated;

create or replace function public.recurring_generate_internal(p_occurrence_id uuid,p_actor uuid,p_action text)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.recurring_occurrences%rowtype; r public.recurring_expenses%rowtype; eid uuid; minor bigint; payload jsonb; x record; pos integer:=0; next_date date;
begin
  select * into o from public.recurring_occurrences where id=p_occurrence_id for update;
  if not found then raise exception 'occurrence_not_found' using errcode='P0001'; end if;
  select * into r from public.recurring_expenses where id=o.recurring_expense_id for update;
  if o.status <> 'pending' then
    if o.status='generated' and p_action='generate' then return o.expense_id;
    elsif o.status='skipped' and p_action='skip' then return null;
    else raise exception 'occurrence_action_conflict' using errcode='P0001'; end if;
  end if;
  perform public.recurring_validate_schedule(p_actor,r.group_id,r.created_by,r.paid_by_user_id,r.currency_code,r.amount_minor,r.split_method,r.split_config,r.frequency,r.interval_value,r.day_of_week,r.day_of_month,r.start_date,r.next_run_date,r.reminder_days_before,r.status,r.auto_post);
  if p_action='skip' then
    update public.recurring_occurrences set status='skipped',expense_id=null where id=o.id;
  elsif p_action='generate' then
    if r.amount_minor is null or r.amount_minor<=0 then raise exception 'amount_minor_invalid' using errcode='P0001'; end if;
    select coalesce(jsonb_agg(jsonb_build_object('userId',key,'position',row_number() over (order by key)-1,
      case r.split_method when 'amount' then 'amountMinor' when 'percentage' then 'percentageUnits' else 'shareUnits' end,
      case r.split_method when 'amount' then round((value::numeric)*power(10::numeric,public.currency_minor_scale(r.currency_code)))::bigint when 'percentage' then round((value::numeric)*10000)::bigint else (value::numeric)::bigint end) order by key),'[]'::jsonb)
      into payload from jsonb_each(r.split_config);
    if r.split_method='equal' then payload:='[]'::jsonb; end if;
    insert into public.expenses(group_id,title,amount,amount_minor,currency,category,paid_by,created_by,split_method,date,recurring_expense_id,client_operation_id)
      values(r.group_id,r.title,round(r.amount_minor/power(10::numeric,public.currency_minor_scale(r.currency_code)),2),r.amount_minor,upper(r.currency_code),'other',r.paid_by_user_id,p_actor,case when r.split_method='amount' then 'custom' else r.split_method end,o.scheduled_for::timestamptz,r.id,o.id) returning id into eid;
    perform public.apply_expense_splits_v3(eid,p_actor,r.group_id,null,r.paid_by_user_id,r.amount_minor,upper(r.currency_code),case when r.split_method='amount' then 'custom' else r.split_method end,payload);
    insert into public.activities(type,group_id,expense_id,user_id,description,amount,amount_minor,currency)
      values('expense',r.group_id,eid,p_actor,r.title,round(r.amount_minor/power(10::numeric,public.currency_minor_scale(r.currency_code)),2),r.amount_minor,upper(r.currency_code));
    update public.recurring_occurrences set status='generated',expense_id=eid where id=o.id;
  else raise exception 'occurrence_action_invalid' using errcode='P0001'; end if;
  next_date:=public.next_recurring_date(r.frequency,r.interval_value,o.scheduled_for,r.day_of_week,r.day_of_month);
  update public.recurring_expenses set next_run_date=greatest(next_run_date,next_date) where id=r.id;
  return eid;
end; $$;
revoke all on function public.recurring_generate_internal(uuid,uuid,text) from public, anon, authenticated;

create or replace function public.review_recurring_occurrence_v2(p_occurrence_id uuid,p_action text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare a uuid:=auth.uid(); r public.recurring_expenses%rowtype; o public.recurring_occurrences%rowtype;
begin
  if a is null then raise exception 'not_authenticated' using errcode='P0001'; end if;
  select * into o from public.recurring_occurrences where id=p_occurrence_id;
  select * into r from public.recurring_expenses where id=o.recurring_expense_id;
  if not exists(select 1 from public.group_members where group_id=r.group_id and user_id=a)
    then raise exception 'group_membership_required' using errcode='P0001'; end if;
  if r.created_by is distinct from a and not public.is_group_owner(r.group_id,a) then raise exception 'schedule_authority_required' using errcode='P0001'; end if;
  return public.recurring_generate_internal(p_occurrence_id,a,p_action);
end; $$;
revoke all on function public.review_recurring_occurrence_v2(uuid,text) from public, anon;
grant execute on function public.review_recurring_occurrence_v2(uuid,text) to authenticated;

create or replace function public.generate_due_recurring_expenses(p_run_date date default current_date) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.recurring_expenses%rowtype; oid uuid; n integer:=0; a uuid;
begin
  if current_setting('request.jwt.claim.role',true) not in ('service_role','supabase_admin') then raise exception 'trusted_scheduler_required' using errcode='P0001'; end if;
  for r in select * from public.recurring_expenses where status='active' and next_run_date<=p_run_date order by next_run_date,id for update skip locked loop
    insert into public.recurring_occurrences(recurring_expense_id,scheduled_for) values(r.id,r.next_run_date) on conflict(recurring_expense_id,scheduled_for) do nothing;
    select id into oid from public.recurring_occurrences where recurring_expense_id=r.id and scheduled_for=r.next_run_date;
    begin perform public.recurring_generate_internal(oid,r.created_by,'generate'); n:=n+1; exception when others then raise warning 'recurring generation failed for %: %',r.id,sqlerrm; end;
  end loop; return n;
end; $$;
revoke all on function public.generate_due_recurring_expenses(date) from public, anon, authenticated;
grant execute on function public.generate_due_recurring_expenses(date) to service_role;
