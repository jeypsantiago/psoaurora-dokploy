create extension if not exists pgcrypto;

create table if not exists public.staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null default '',
  roles jsonb not null default '[]'::jsonb,
  gender text not null default 'Prefer not to say',
  position text not null default '',
  prefs_bundle jsonb not null default '{}'::jsonb,
  last_access timestamptz,
  avatar_path text,
  avatar_url text,
  signature_path text,
  signature_url text,
  must_reset_password boolean not null default false,
  is_migrated boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_state (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null check (scope in ('global', 'user')),
  owner uuid references public.staff_users (id) on delete cascade,
  value jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_users
    where id = auth.uid()
      and coalesce(roles, '[]'::jsonb) @> '["Super Admin"]'::jsonb
  );
$$;

create unique index if not exists app_state_global_key_idx
  on public.app_state (key)
  where scope = 'global' and owner is null;

create unique index if not exists app_state_user_owner_key_idx
  on public.app_state (owner, key)
  where scope = 'user' and owner is not null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_staff_users_updated_at on public.staff_users;
create trigger trg_staff_users_updated_at
before update on public.staff_users
for each row execute function public.touch_updated_at();

drop trigger if exists trg_app_state_updated_at on public.app_state;
create trigger trg_app_state_updated_at
before update on public.app_state
for each row execute function public.touch_updated_at();

alter table public.staff_users enable row level security;
alter table public.app_state enable row level security;

drop policy if exists staff_users_select_self_or_admin on public.staff_users;
create policy staff_users_select_self_or_admin on public.staff_users
for select
using (auth.uid() = id or public.is_super_admin());

drop policy if exists staff_users_update_self_or_admin on public.staff_users;
create policy staff_users_update_self_or_admin on public.staff_users
for update
using (auth.uid() = id or public.is_super_admin())
with check (auth.uid() = id or public.is_super_admin());

drop policy if exists app_state_select_public_and_authenticated on public.app_state;
create policy app_state_select_public_and_authenticated on public.app_state
for select
using (
  auth.uid() is not null
  or (
    scope = 'global'
    and key in ('aurora_landing_config', 'aurora_census_survey_masters', 'aurora_census_survey_cycles')
  )
);

drop policy if exists app_state_insert_authenticated on public.app_state;
create policy app_state_insert_authenticated on public.app_state
for insert
with check (auth.uid() is not null);

drop policy if exists app_state_update_authenticated on public.app_state;
create policy app_state_update_authenticated on public.app_state
for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists app_state_delete_authenticated on public.app_state;
create policy app_state_delete_authenticated on public.app_state
for delete
using (auth.uid() is not null);

insert into storage.buckets (id, name, public)
values ('landing-assets', 'landing-assets', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('staff-media', 'staff-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists landing_assets_public_read on storage.objects;
create policy landing_assets_public_read on storage.objects
for select
using (bucket_id = 'landing-assets');

drop policy if exists landing_assets_authenticated_write on storage.objects;
create policy landing_assets_authenticated_write on storage.objects
for all
using (bucket_id = 'landing-assets' and auth.uid() is not null)
with check (bucket_id = 'landing-assets' and auth.uid() is not null);

drop policy if exists staff_media_public_read on storage.objects;
create policy staff_media_public_read on storage.objects
for select
using (bucket_id = 'staff-media');

drop policy if exists staff_media_authenticated_write on storage.objects;
create policy staff_media_authenticated_write on storage.objects
for all
using (bucket_id = 'staff-media' and auth.uid() is not null)
with check (bucket_id = 'staff-media' and auth.uid() is not null);
