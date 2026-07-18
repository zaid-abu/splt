alter table public.users
add column if not exists setup_state text;

-- Existing accounts already passed the shipped device-global onboarding gate.
update public.users
set setup_state = 'complete'
where setup_state is null;

alter table public.users
alter column setup_state set default 'profile_pending';

alter table public.users
alter column setup_state set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_setup_state_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_setup_state_check
    check (setup_state in ('profile_pending', 'activation_pending', 'complete'));
  end if;
end;
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_initials text;
begin
  profile_name = coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );
  profile_initials = upper(left(profile_name, 1));

  insert into public.users (
    id,
    name,
    email,
    avatar,
    initials,
    default_currency,
    setup_state
  )
  values (
    new.id,
    profile_name,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'avatar',
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    profile_initials,
    coalesce(
      new.raw_user_meta_data ->> 'default_currency',
      new.raw_user_meta_data ->> 'defaultCurrency',
      'USD'
    ),
    'profile_pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update their own avatar" on storage.objects;
create policy "Users update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete their own avatar" on storage.objects;
create policy "Users delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
