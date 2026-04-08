create table if not exists public.app_files (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete set null,
  storage_kind text not null check (storage_kind in ('landing-asset', 'staff-avatar', 'staff-signature')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  bucket text not null default 'default',
  object_key text not null unique,
  original_name text not null,
  content_type text,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_files_owner_created_idx
  on public.app_files (owner_user_id, created_at desc);

create index if not exists app_files_storage_kind_idx
  on public.app_files (storage_kind, created_at desc);

alter table if exists public.app_files enable row level security;

drop policy if exists app_files_select_owner_or_super_admin on public.app_files;
create policy app_files_select_owner_or_super_admin on public.app_files
for select
using (
  owner_user_id = auth.uid()
  or public.is_super_admin()
);

drop policy if exists app_files_insert_owner_or_super_admin on public.app_files;
create policy app_files_insert_owner_or_super_admin on public.app_files
for insert
with check (
  owner_user_id = auth.uid()
  or public.is_super_admin()
  or (owner_user_id is null and public.is_super_admin())
);

drop policy if exists app_files_delete_owner_or_super_admin on public.app_files;
create policy app_files_delete_owner_or_super_admin on public.app_files
for delete
using (
  owner_user_id = auth.uid()
  or public.is_super_admin()
);

drop trigger if exists trg_app_files_updated_at on public.app_files;
create trigger trg_app_files_updated_at
before update on public.app_files
for each row execute function public.touch_updated_at();

alter table if exists public.staff_users
add column if not exists avatar_file_id uuid references public.app_files (id) on delete set null;

alter table if exists public.staff_users
add column if not exists signature_file_id uuid references public.app_files (id) on delete set null;
