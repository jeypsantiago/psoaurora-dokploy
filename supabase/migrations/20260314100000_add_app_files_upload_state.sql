alter table if exists public.app_files
add column if not exists upload_state text not null default 'ready'
check (upload_state in ('pending', 'ready'));

update public.app_files
set upload_state = 'ready'
where upload_state is distinct from 'ready';

create index if not exists app_files_upload_state_idx
  on public.app_files (upload_state, created_at desc);
