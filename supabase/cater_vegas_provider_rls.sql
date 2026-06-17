-- Cater Vegas provider and event permissions.
-- Run this in the Supabase SQL Editor as the project owner/postgres role.
-- It keeps RLS enabled and only allows workspace managers to manage providers and events.

begin;

create schema if not exists private;

alter table public.cater_collaborators
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists coverage_area text,
  add column if not exists availability text,
  add column if not exists base_pricing text,
  add column if not exists license_insurance text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_cater_collaborators_workspace_status
  on public.cater_collaborators(workspace_id, status);

create index if not exists idx_cater_collaborators_created_by
  on public.cater_collaborators(created_by);

create index if not exists idx_cater_events_workspace_status
  on public.cater_events(workspace_id, status);

create index if not exists idx_cater_events_created_by
  on public.cater_events(created_by);

create index if not exists idx_beoflow_workspace_members_user_workspace
  on public.beoflow_workspace_members(user_id, workspace_id, status);

create or replace function private.can_manage_cater_workspace(p_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.beoflow_workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and coalesce(wm.status::text, 'active') = 'active'
      and lower(wm.role::text) in ('owner', 'admin', 'super_admin', 'platform_admin')
  )
  or exists (
    select 1
    from public.cater_profiles cp
    where cp.id = (select auth.uid())
      and (
        cp.workspace_id = p_workspace_id
        or lower(cp.role::text) in ('super_admin', 'platform_admin')
      )
      and lower(cp.role::text) in ('owner', 'admin', 'super_admin', 'platform_admin')
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.can_manage_cater_workspace(text) to authenticated;

alter table public.cater_collaborators enable row level security;

drop policy if exists cater_collaborators_select_workspace_managers on public.cater_collaborators;
create policy cater_collaborators_select_workspace_managers
on public.cater_collaborators
for select
to authenticated
using (private.can_manage_cater_workspace(workspace_id));

drop policy if exists cater_collaborators_insert_workspace_managers on public.cater_collaborators;
create policy cater_collaborators_insert_workspace_managers
on public.cater_collaborators
for insert
to authenticated
with check (
  private.can_manage_cater_workspace(workspace_id)
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists cater_collaborators_update_workspace_managers on public.cater_collaborators;
create policy cater_collaborators_update_workspace_managers
on public.cater_collaborators
for update
to authenticated
using (private.can_manage_cater_workspace(workspace_id))
with check (private.can_manage_cater_workspace(workspace_id));

drop policy if exists cater_collaborators_delete_workspace_managers on public.cater_collaborators;
create policy cater_collaborators_delete_workspace_managers
on public.cater_collaborators
for delete
to authenticated
using (private.can_manage_cater_workspace(workspace_id));

alter table public.cater_events enable row level security;

drop policy if exists cater_events_select_workspace_managers on public.cater_events;
create policy cater_events_select_workspace_managers
on public.cater_events
for select
to authenticated
using (private.can_manage_cater_workspace(workspace_id));

drop policy if exists cater_events_insert_workspace_managers on public.cater_events;
create policy cater_events_insert_workspace_managers
on public.cater_events
for insert
to authenticated
with check (
  private.can_manage_cater_workspace(workspace_id)
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists cater_events_update_workspace_managers on public.cater_events;
create policy cater_events_update_workspace_managers
on public.cater_events
for update
to authenticated
using (private.can_manage_cater_workspace(workspace_id))
with check (private.can_manage_cater_workspace(workspace_id));

drop policy if exists cater_events_delete_workspace_managers on public.cater_events;
create policy cater_events_delete_workspace_managers
on public.cater_events
for delete
to authenticated
using (private.can_manage_cater_workspace(workspace_id));

commit;
