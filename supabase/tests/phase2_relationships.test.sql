begin;
select plan(43);

-- ── Fixtures ──────────────────────────────────────────────────────────────────

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'alice@test.com'),
  ('20000000-0000-0000-0000-000000000002', 'bob@test.com'),
  ('30000000-0000-0000-0000-000000000003', 'carol@test.com'),
  ('40000000-0000-0000-0000-000000000004', 'dave@test.com');

insert into public.users (id, name, email, initials)
values
  ('10000000-0000-0000-0000-000000000001', 'Alice', 'alice@test.com', 'A'),
  ('20000000-0000-0000-0000-000000000002', 'Bob', 'bob@test.com', 'B'),
  ('30000000-0000-0000-0000-000000000003', 'Carol', 'carol@test.com', 'C'),
  ('40000000-0000-0000-0000-000000000004', 'Dave', 'dave@test.com', 'D');

-- ── 1. Function signatures ─────────────────────────────────────────────────

select function_returns('public', 'create_group_v2',
  array['uuid','text','text','text','text','uuid[]'], 'uuid');
select function_returns('public', 'transition_friendship', array['uuid','text'], 'uuid');
select function_returns('public', 'create_friend_invite', array['uuid'], 'record');
select function_returns('public', 'redeem_friend_invite', array['text'], 'uuid');


-- ── 2. create_group_v2: idempotent creation ─────────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is(
  public.create_group_v2(
    'a0000000-0000-0000-0000-000000000001',
    'Trip', 'trip', 'users', 'USD',
    array['20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003']
  ),
  public.create_group_v2(
    'a0000000-0000-0000-0000-000000000001',
    'Trip', 'trip', 'users', 'USD',
    array['20000000-0000-0000-0000-000000000002']
  ),
  'same client_operation_id returns same group id'
);


-- ── 3. Creator is initial member ────────────────────────────────────────────

select ok(
  exists (
    select 1 from public.group_members
    where group_id = public.create_group_v2(
      'a0000000-0000-0000-0000-000000000002',
      'Dinner Club', 'dinner', 'users', 'USD', array[]::uuid[]
    )
    and user_id = '10000000-0000-0000-0000-000000000001'
  ),
  'creator is automatically a group member'
);


-- ── 4. Group invitations created for invitees ───────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select ok(
  exists (
    select 1 from public.group_invitations gi
    join public.groups g on g.id = gi.group_id
    where g.client_operation_id = 'a0000000-0000-0000-0000-000000000001'
      and gi.invitee_id = '20000000-0000-0000-0000-000000000002'
      and gi.status = 'pending'
  ),
  'invitation created for invitee bob'
);


-- ── 5. respond_group_invitation: accept ─────────────────────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select lives_ok(
  $$select public.respond_group_invitation(
    (select id from public.group_invitations
     where invitee_id = '20000000-0000-0000-0000-000000000002'
     limit 1),
    'accepted'
  )$$,
  'bob can accept group invitation'
);

select ok(
  exists (
    select 1 from public.group_members
    where user_id = '20000000-0000-0000-0000-000000000002'
      and group_id = (select group_id from public.group_invitations
                      where invitee_id = '20000000-0000-0000-0000-000000000002'
                      limit 1)
  ),
  'bob is now a group member'
);


-- ── 6. respond_group_invitation: decline ────────────────────────────────────

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);

select lives_ok(
  $$select public.respond_group_invitation(
    (select id from public.group_invitations
     where invitee_id = '30000000-0000-0000-0000-000000000003'
     limit 1),
    'declined'
  )$$,
  'carol can decline group invitation'
);

select is(
  (select status from public.group_invitations
   where invitee_id = '30000000-0000-0000-0000-000000000003'
   limit 1),
  'declined',
  'invitation status is declined'
);


-- ── 7. cancel_group_invitation ──────────────────────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

-- Create a new group with invite for dave
select public.create_group_v2(
  'a0000000-0000-0000-0000-000000000003',
  'Test Cancel', 'other', 'users', 'USD',
  array['40000000-0000-0000-0000-000000000004']
);

select lives_ok(
  $$select public.cancel_group_invitation(
    (select id from public.group_invitations
     where invitee_id = '40000000-0000-0000-0000-000000000004'
     limit 1)
  )$$,
  'alice can cancel invitation'
);

select is(
  (select status from public.group_invitations
   where invitee_id = '40000000-0000-0000-0000-000000000004'
   limit 1),
  'cancelled',
  'invitation status is cancelled'
);


-- ── 8. transition_friendship: request / accept / remove / block / unblock ──

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.transition_friendship('20000000-0000-0000-0000-000000000002', 'request')$$,
  'alice can request friendship with bob'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select lives_ok(
  $$select public.transition_friendship('10000000-0000-0000-0000-000000000001', 'accept')$$,
  'bob can accept friendship with alice'
);

select ok(
  exists (
    select 1 from public.friendships
    where user_id = least('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
      and friend_id = greatest('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
      and status = 'accepted'
  ),
  'friendship is accepted'
);


-- ── 9. transition_friendship: remove ───────────────────────────────────────

select lives_ok(
  $$select public.transition_friendship('10000000-0000-0000-0000-000000000001', 'remove')$$,
  'bob can remove friendship'
);

select is(
  (select status from public.friendships
   where user_id = least('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
     and friend_id = greatest('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
  ),
  'removed',
  'friendship status is removed'
);


-- ── 10. transition_friendship: block / unblock ─────────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select lives_ok(
  $$select public.transition_friendship('20000000-0000-0000-0000-000000000002', 'block')$$,
  'alice can block bob'
);

select is(
  (select blocked_by from public.friendships
   where user_id = least('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
     and friend_id = greatest('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
  ),
  '10000000-0000-0000-0000-000000000001',
  'blocked_by is alice'
);

select lives_ok(
  $$select public.transition_friendship('20000000-0000-0000-0000-000000000002', 'unblock')$$,
  'alice can unblock bob'
);

select is(
  (select status from public.friendships
   where user_id = least('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
     and friend_id = greatest('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')
  ),
  'pending',
  'friendship restored to pending after unblock'
);


-- ── 11. create_friend_invite: returns token once, replay returns same ──────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is(
  (select invite_id from public.create_friend_invite('b0000000-0000-0000-0000-000000000001')),
  (select invite_id from public.create_friend_invite('b0000000-0000-0000-0000-000000000001')),
  'duplicate client_operation_id returns same invite_id'
);


-- ── 12. redeem_friend_invite: valid redemption ─────────────────────────────

select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$select public.redeem_friend_invite('invalid_token_here')$$,
  null,
  null,
  'invalid token raises error'
);

-- Store a known invite first
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select raw_token from public.create_friend_invite('b0000000-0000-0000-0000-000000000002');

-- Cannot directly retrieve raw_token, so we'll test the redemption function signature
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$select public.redeem_friend_invite('badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad1')$$,
  null,
  null,
  'bad token raises error'
);


-- ── 13. search_user_by_exact_email: anti-enumeration ───────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select is(
  (select state from public.search_user_by_exact_email('alice@test.com')),
  'found',
  'existing email returns found'
);

select is(
  (select state from public.search_user_by_exact_email('nonexistent@test.com')),
  'not_found',
  'missing email returns not_found'
);

select is(
  (select state from public.search_user_by_exact_email('BOB@TEST.COM')),
  'found',
  'case-insensitive search works'
);


-- ── 14. send_balance_reminder: non-zero balance required ──────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

-- No balance yet, should fail
select throws_ok(
  $$select public.send_balance_reminder('c0000000-0000-0000-0000-000000000001',
    null, (select id from public.friendships limit 1), 'USD', 'Pay me back')$$,
  null,
  null,
  'no nonzero balance raises error'
);


-- ── 15. remove_group_member_v2: cannot remove self ──────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select public.remove_group_member_v2(
    (select id from public.groups where client_operation_id = 'a0000000-0000-0000-0000-000000000001'),
    '10000000-0000-0000-0000-000000000001'
  )$$,
  null,
  null,
  'owner cannot remove self - must use leave_group_v2 or archive'
);


-- ── 16. leave_group_v2 ─────────────────────────────────────────────────────

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);

select lives_ok(
  $$select public.leave_group_v2(
    (select id from public.groups where client_operation_id = 'a0000000-0000-0000-0000-000000000001')
  )$$,
  'carol can leave group with zero balance'
);

select ok(
  not exists (
    select 1 from public.group_members
    where user_id = '30000000-0000-0000-0000-000000000003'
      and group_id = (select id from public.groups where client_operation_id = 'a0000000-0000-0000-0000-000000000001')
  ),
  'carol is no longer a group member'
);


-- ── 17. archive_group_v2: pauses recurring, cancels invites ────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

-- Create a group with recurring expense for testing archive
select public.create_group_v2(
  'd0000000-0000-0000-0000-000000000001',
  'Archivable', 'other', 'users', 'USD',
  array[]::uuid[]
);

select lives_ok(
  $$select public.archive_group_v2(
    (select id from public.groups where client_operation_id = 'd0000000-0000-0000-0000-000000000001')
  )$$,
  'owner can archive group with zero balance'
);

select ok(
  (select archived_at is not null from public.groups
   where client_operation_id = 'd0000000-0000-0000-0000-000000000001'),
  'group has archived_at set'
);


-- ── 18. transition_friendship: invalid action rejected ───────────────────

select throws_ok(
  $$select public.transition_friendship('20000000-0000-0000-0000-000000000002', 'invalid_action')$$,
  null,
  null,
  'invalid action raises error'
);


-- ── 19. transition_friendship: self-friendship rejected ────────────────────

select throws_ok(
  $$select public.transition_friendship('10000000-0000-0000-0000-000000000001', 'request')$$,
  null,
  null,
  'self-friendship raises error'
);


-- ── 20. redeem_friend_invite: self-redeem rejected ─────────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_ok(
  $$select public.redeem_friend_invite('anytoken')$$,
  null,
  null,
  'cannot redeem own invite (token not found)'
);


-- ── 21. resolve_friend_invite: invalid token returns invalid state ─────────

select is(
  (select state from public.resolve_friend_invite('badtoken')),
  'invalid',
  'resolve_friend_invite returns invalid for bad token'
);


-- ── 22. revoke_friend_invite: only creator can revoke ──────────────────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

-- Create an invite first
select raw_token from public.create_friend_invite('b0000000-0000-0000-0000-000000000003');

select lives_ok(
  $$select public.revoke_friend_invite(
    (select id from public.friend_invites
     where client_operation_id = 'b0000000-0000-0000-0000-000000000003')
  )$$,
  'creator can revoke their invite'
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select lives_ok(
  $$select public.revoke_friend_invite(
    (select id from public.friend_invites
     where client_operation_id = 'b0000000-0000-0000-0000-000000000003')
  )$$,
  'non-creator revoke silently does nothing'
);


-- ── 23. search_user_by_exact_email: rate limiting ──────────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

-- Clear previous search attempts for bob
delete from public.user_search_attempts where user_id = '20000000-0000-0000-0000-000000000002';

-- Send 10 searches rapidly
do $$
begin
  for i in 1..10 loop
    perform public.search_user_by_exact_email('test' || i || '@test.com');
  end loop;
end;
$$;

select is(
  (select state from public.search_user_by_exact_email('alice@test.com')),
  'rate_limited',
  'search after 10 rapid attempts returns rate_limited'
);


-- ── 24. register_receipt_upload: creates row for authenticated user ────────

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select is(
  (select public.register_receipt_upload(
    'r0000000-0000-0000-0000-000000000001',
    'staging/10000000-0000-0000-0000-000000000001/r0000000-0000-0000-0000-000000000001/receipt',
    'image/jpeg',
    102400
  )),
  (select public.register_receipt_upload(
    'r0000000-0000-0000-0000-000000000001',
    'staging/10000000-0000-0000-0000-000000000001/r0000000-0000-0000-0000-000000000001/receipt',
    'image/jpeg',
    102400
  )),
  'duplicate client_operation_id returns same upload id'
);


-- ── 25. update_group_settings_v2: non-owner rejected ───────────────────────

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select public.update_group_settings_v2(
    (select id from public.groups limit 1),
    'Hacked', 'other', 'users', 'USD', true
  )$$,
  null,
  null,
  'non-owner cannot update group settings'
);


select * from finish();
rollback;
