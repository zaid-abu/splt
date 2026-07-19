begin;
select plan(19);

select has_column('public', 'expenses', 'amount_minor');
select has_column('public', 'expenses', 'friendship_id');
select has_column('public', 'expenses', 'created_by');
select has_column('public', 'expense_splits', 'shares');
select has_column('public', 'expense_splits', 'position');
select has_column('public', 'settlements', 'method');
select has_table('public', 'group_invitations');
select has_table('public', 'friend_invites');
select has_table('public', 'notifications');
select has_table('public', 'receipt_uploads');
select col_is_pk('public', 'group_invitations', 'id');
select col_not_null('public', 'group_members', 'new_expense_alerts');
select col_default_is('public', 'group_members', 'new_expense_alerts', 'true');
select function_returns('public', 'currency_minor_scale', array['text'], 'smallint');
select is(public.currency_minor_scale('JPY'), 0::smallint);
select is(public.currency_minor_scale('USD'), 2::smallint);
select throws_ok($$select public.currency_minor_scale('ZZZ')$$, '22023');
select ok(to_regclass('public.friendships') is not null, 'legacy friendships retained');
select has_column('public', 'friendships', 'metadata', 'legacy metadata retained but superseded');

select * from finish();
rollback;
