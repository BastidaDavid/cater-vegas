-- Cater Vegas Admin provider/event permissions and BEOFlow sync fields.
-- Run this in Supabase SQL Editor as project owner/postgres.
-- RLS stays enabled. Only workspace managers can manage private operational data.

begin;

create schema if not exists private;

insert into public.beoflow_workspaces (id, name, slug, industry, status)
values ('cater-vegas', 'Cater Vegas', 'cater-vegas', 'catering_events', 'active')
on conflict (id)
do update set
  name = excluded.name,
  slug = excluded.slug,
  industry = excluded.industry,
  status = 'active',
  updated_at = now();

alter table public.beoflow_workspace_members drop constraint if exists beoflow_workspace_members_role_check;
alter table public.beoflow_workspace_members add constraint beoflow_workspace_members_role_check
  check (role in ('owner', 'admin', 'super_admin', 'platform_admin', 'organizer', 'collaborator', 'viewer'));

alter table public.cater_events
  add column if not exists workspace_id text not null default 'cater-vegas',
  add column if not exists title text,
  add column if not exists event_type text,
  add column if not exists budget_label text,
  add column if not exists status text not null default 'draft',
  add column if not exists event_date date,
  add column if not exists guest_count integer,
  add column if not exists plan jsonb not null default '{}'::jsonb,
  add column if not exists notes text,
  add column if not exists created_by uuid references public.cater_profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.cater_events alter column workspace_id set default 'cater-vegas';
update public.cater_events set workspace_id = 'cater-vegas' where workspace_id is null;

alter table public.cater_providers
  add column if not exists workspace_id text not null default 'cater-vegas',
  add column if not exists provider_name text,
  add column if not exists provider_type text not null default 'vendor',
  add column if not exists contact_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists status text not null default 'active',
  add column if not exists notes text,
  add column if not exists coverage_zone text,
  add column if not exists availability text,
  add column if not exists base_prices text,
  add column if not exists license_insurance text,
  add column if not exists service_category text,
  add column if not exists public_visible boolean not null default false,
  add column if not exists public_description text,
  add column if not exists image_url text,
  add column if not exists source text not null default 'cater_vegas_admin',
  add column if not exists created_by uuid references public.cater_profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.cater_providers alter column workspace_id set default 'cater-vegas';
update public.cater_providers set workspace_id = 'cater-vegas' where workspace_id is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cater_events_workspace_id_fkey') then
    alter table public.cater_events
      add constraint cater_events_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_providers_workspace_id_fkey') then
    alter table public.cater_providers
      add constraint cater_providers_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;
end $$;

create index if not exists idx_cater_providers_workspace_status
  on public.cater_providers(workspace_id, status);

create index if not exists idx_cater_providers_created_by
  on public.cater_providers(created_by);

create index if not exists idx_cater_providers_public_visible
  on public.cater_providers(workspace_id, public_visible, status);

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

alter table public.cater_providers enable row level security;

drop policy if exists cater_providers_select_public_active on public.cater_providers;
create policy cater_providers_select_public_active
on public.cater_providers
for select
to anon, authenticated
using (public_visible = true and status = 'active');

drop policy if exists cater_providers_select_workspace_managers on public.cater_providers;
create policy cater_providers_select_workspace_managers
on public.cater_providers
for select
to authenticated
using (private.can_manage_cater_workspace(workspace_id));

drop policy if exists cater_providers_insert_workspace_managers on public.cater_providers;
create policy cater_providers_insert_workspace_managers
on public.cater_providers
for insert
to authenticated
with check (
  private.can_manage_cater_workspace(workspace_id)
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists cater_providers_update_workspace_managers on public.cater_providers;
create policy cater_providers_update_workspace_managers
on public.cater_providers
for update
to authenticated
using (private.can_manage_cater_workspace(workspace_id))
with check (private.can_manage_cater_workspace(workspace_id));

drop policy if exists cater_providers_delete_workspace_managers on public.cater_providers;
create policy cater_providers_delete_workspace_managers
on public.cater_providers
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

grant select on public.cater_providers to anon;
grant select, insert, update, delete on public.cater_providers to authenticated;
grant select, insert, update, delete on public.cater_events to authenticated;

commit;
