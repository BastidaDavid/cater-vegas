-- BEOFlow Platform + Cater Vegas workspace baseline for a shared Supabase project.
-- This file only creates/touches the new BEOFlow workspace tables and Cater Vegas cater_* tables.
-- It intentionally does not modify existing FiltraCore tables or legacy beoflow_* data tables.

create extension if not exists pgcrypto;

create table if not exists public.beoflow_workspaces (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  industry text,
  status text not null default 'pending' check (status in ('active', 'pending', 'disabled')),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.beoflow_workspaces (id, name, slug, industry, status)
values ('cater-vegas', 'Cater Vegas', 'cater-vegas', 'catering_events', 'active')
on conflict (id) do update
  set name = excluded.name,
      slug = excluded.slug,
      industry = excluded.industry,
      status = excluded.status,
      updated_at = now();

create table if not exists public.beoflow_workspace_members (
  id bigint generated always as identity primary key,
  workspace_id text not null references public.beoflow_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'organizer', 'collaborator', 'viewer')),
  status text not null default 'pending' check (status in ('active', 'pending', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.cater_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  email text,
  full_name text,
  phone text,
  company text,
  role text not null default 'client_pending' check (
    role in (
      'admin',
      'staff',
      'organizer',
      'client',
      'collaborator',
      'workspace_pending',
      'collaborator_pending',
      'organizer_pending',
      'client_pending'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cater_customers (
  id bigint generated always as identity primary key,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cater_events (
  id bigint generated always as identity primary key,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  customer_id bigint references public.cater_customers(id) on delete set null,
  title text not null,
  event_type text,
  status text not null default 'draft' check (status in ('draft', 'planning', 'confirmed', 'completed', 'cancelled')),
  budget text,
  budget_label text,
  menu_style text,
  services text[] not null default '{}',
  plan jsonb not null default '{}'::jsonb,
  event_date date,
  guest_count integer check (guest_count is null or guest_count > 0),
  venue_name text,
  notes text,
  client_id uuid references public.cater_profiles(id) on delete set null,
  assigned_to uuid references public.cater_profiles(id) on delete set null,
  created_by uuid references public.cater_profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cater_beoflow_messages (
  id bigint generated always as identity primary key,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  event_id bigint references public.cater_events(id) on delete cascade,
  user_id uuid references public.cater_profiles(id) on delete set null,
  sender text not null check (sender in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cater_plan_versions (
  id bigint generated always as identity primary key,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  event_id bigint not null references public.cater_events(id) on delete cascade,
  version_number integer not null,
  plan jsonb not null,
  source text not null default 'beoflow' check (source in ('manual', 'beoflow', 'import')),
  created_by uuid references public.cater_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, version_number)
);

create table if not exists public.cater_collaborators (
  id bigint generated always as identity primary key,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  full_name text not null,
  email text,
  phone text,
  role text not null default 'staff' check (
    role in ('owner', 'admin', 'organizer', 'chef', 'driver', 'server', 'staff', 'viewer')
  ),
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cater_event_assignments (
  id bigint generated always as identity primary key,
  workspace_id text not null default 'cater-vegas' references public.beoflow_workspaces(id),
  event_id bigint not null references public.cater_events(id) on delete cascade,
  collaborator_id bigint not null references public.cater_collaborators(id) on delete cascade,
  assignment_role text not null default 'staff' check (
    assignment_role in ('owner', 'admin', 'organizer', 'chef', 'driver', 'server', 'staff', 'viewer')
  ),
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  notes text,
  created_at timestamptz not null default now(),
  unique (event_id, collaborator_id)
);

alter table public.cater_profiles add column if not exists workspace_id text not null default 'cater-vegas';
alter table public.cater_profiles alter column workspace_id set default 'cater-vegas';
update public.cater_profiles set workspace_id = 'cater-vegas' where workspace_id is null;
alter table public.cater_profiles alter column workspace_id set not null;
alter table public.cater_profiles alter column role set default 'client_pending';
alter table public.cater_profiles drop constraint if exists cater_profiles_role_check;
alter table public.cater_profiles add constraint cater_profiles_role_check
  check (
    role in (
      'admin',
      'staff',
      'organizer',
      'client',
      'collaborator',
      'workspace_pending',
      'collaborator_pending',
      'organizer_pending',
      'client_pending'
    )
  );

alter table public.cater_events add column if not exists workspace_id text not null default 'cater-vegas';
alter table public.cater_events alter column workspace_id set default 'cater-vegas';
update public.cater_events set workspace_id = 'cater-vegas' where workspace_id is null;
alter table public.cater_events alter column workspace_id set not null;
alter table public.cater_events add column if not exists customer_id bigint;

alter table public.cater_beoflow_messages add column if not exists workspace_id text not null default 'cater-vegas';
alter table public.cater_beoflow_messages alter column workspace_id set default 'cater-vegas';
update public.cater_beoflow_messages set workspace_id = 'cater-vegas' where workspace_id is null;
alter table public.cater_beoflow_messages alter column workspace_id set not null;

alter table public.cater_plan_versions add column if not exists workspace_id text not null default 'cater-vegas';
alter table public.cater_plan_versions alter column workspace_id set default 'cater-vegas';
update public.cater_plan_versions set workspace_id = 'cater-vegas' where workspace_id is null;
alter table public.cater_plan_versions alter column workspace_id set not null;

alter table public.cater_collaborators add column if not exists workspace_id text not null default 'cater-vegas';
alter table public.cater_collaborators alter column workspace_id set default 'cater-vegas';
update public.cater_collaborators set workspace_id = 'cater-vegas' where workspace_id is null;
alter table public.cater_collaborators alter column workspace_id set not null;

alter table public.cater_event_assignments add column if not exists workspace_id text not null default 'cater-vegas';
alter table public.cater_event_assignments alter column workspace_id set default 'cater-vegas';
update public.cater_event_assignments set workspace_id = 'cater-vegas' where workspace_id is null;
alter table public.cater_event_assignments alter column workspace_id set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cater_profiles_workspace_id_fkey') then
    alter table public.cater_profiles
      add constraint cater_profiles_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_events_workspace_id_fkey') then
    alter table public.cater_events
      add constraint cater_events_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_events_customer_id_fkey') then
    alter table public.cater_events
      add constraint cater_events_customer_id_fkey
      foreign key (customer_id) references public.cater_customers(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_beoflow_messages_workspace_id_fkey') then
    alter table public.cater_beoflow_messages
      add constraint cater_beoflow_messages_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_plan_versions_workspace_id_fkey') then
    alter table public.cater_plan_versions
      add constraint cater_plan_versions_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_collaborators_workspace_id_fkey') then
    alter table public.cater_collaborators
      add constraint cater_collaborators_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cater_event_assignments_workspace_id_fkey') then
    alter table public.cater_event_assignments
      add constraint cater_event_assignments_workspace_id_fkey
      foreign key (workspace_id) references public.beoflow_workspaces(id);
  end if;
end;
$$;

create index if not exists beoflow_workspaces_slug_idx on public.beoflow_workspaces (slug);
create index if not exists beoflow_workspaces_owner_id_idx on public.beoflow_workspaces (owner_id);
create index if not exists beoflow_workspace_members_workspace_id_idx on public.beoflow_workspace_members (workspace_id);
create index if not exists beoflow_workspace_members_user_id_idx on public.beoflow_workspace_members (user_id);
create index if not exists beoflow_workspace_members_status_role_idx on public.beoflow_workspace_members (status, role);

create index if not exists cater_profiles_workspace_id_idx on public.cater_profiles (workspace_id);
create index if not exists cater_profiles_role_idx on public.cater_profiles (role);
create index if not exists cater_profiles_workspace_role_idx on public.cater_profiles (workspace_id, role);
create index if not exists cater_profiles_email_idx on public.cater_profiles (email);

create index if not exists cater_customers_workspace_id_idx on public.cater_customers (workspace_id);
create index if not exists cater_customers_email_idx on public.cater_customers (email);
create unique index if not exists cater_customers_workspace_email_uidx
  on public.cater_customers (workspace_id, lower(email))
  where email is not null;

create index if not exists cater_events_workspace_id_idx on public.cater_events (workspace_id);
create index if not exists cater_events_customer_id_idx on public.cater_events (customer_id);
create index if not exists cater_events_client_id_idx on public.cater_events (client_id);
create index if not exists cater_events_assigned_to_idx on public.cater_events (assigned_to);
create index if not exists cater_events_created_by_idx on public.cater_events (created_by);
create index if not exists cater_events_workspace_status_updated_at_idx
  on public.cater_events (workspace_id, status, updated_at desc);
create index if not exists cater_events_status_updated_at_idx on public.cater_events (status, updated_at desc);

create index if not exists cater_beoflow_messages_workspace_id_idx on public.cater_beoflow_messages (workspace_id);
create index if not exists cater_beoflow_messages_event_id_idx on public.cater_beoflow_messages (event_id);
create index if not exists cater_beoflow_messages_user_id_idx on public.cater_beoflow_messages (user_id);
create index if not exists cater_plan_versions_workspace_id_idx on public.cater_plan_versions (workspace_id);
create index if not exists cater_plan_versions_event_id_idx on public.cater_plan_versions (event_id);
create index if not exists cater_plan_versions_created_by_idx on public.cater_plan_versions (created_by);
create index if not exists cater_collaborators_workspace_id_idx on public.cater_collaborators (workspace_id);
create index if not exists cater_collaborators_email_idx on public.cater_collaborators (email);
create index if not exists cater_collaborators_role_status_idx on public.cater_collaborators (role, status);
create unique index if not exists cater_collaborators_workspace_email_uidx
  on public.cater_collaborators (workspace_id, lower(email))
  where email is not null;
create index if not exists cater_event_assignments_workspace_id_idx on public.cater_event_assignments (workspace_id);
create index if not exists cater_event_assignments_event_id_idx on public.cater_event_assignments (event_id);
create index if not exists cater_event_assignments_collaborator_id_idx on public.cater_event_assignments (collaborator_id);
create index if not exists cater_event_assignments_role_status_idx
  on public.cater_event_assignments (assignment_role, status);

create or replace function public.cater_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists beoflow_workspaces_set_updated_at on public.beoflow_workspaces;
create trigger beoflow_workspaces_set_updated_at
before update on public.beoflow_workspaces
for each row execute function public.cater_set_updated_at();

drop trigger if exists beoflow_workspace_members_set_updated_at on public.beoflow_workspace_members;
create trigger beoflow_workspace_members_set_updated_at
before update on public.beoflow_workspace_members
for each row execute function public.cater_set_updated_at();

drop trigger if exists cater_profiles_set_updated_at on public.cater_profiles;
create trigger cater_profiles_set_updated_at
before update on public.cater_profiles
for each row execute function public.cater_set_updated_at();

drop trigger if exists cater_customers_set_updated_at on public.cater_customers;
create trigger cater_customers_set_updated_at
before update on public.cater_customers
for each row execute function public.cater_set_updated_at();

drop trigger if exists cater_events_set_updated_at on public.cater_events;
create trigger cater_events_set_updated_at
before update on public.cater_events
for each row execute function public.cater_set_updated_at();

drop trigger if exists cater_collaborators_set_updated_at on public.cater_collaborators;
create trigger cater_collaborators_set_updated_at
before update on public.cater_collaborators
for each row execute function public.cater_set_updated_at();

create or replace function public.cater_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'cater_role', '');
  safe_role text := 'client_pending';
  target_workspace_id text := coalesce(new.raw_user_meta_data ->> 'workspace_id', 'cater-vegas');
begin
  if requested_role in ('client', 'client_pending', 'collaborator_pending', 'organizer_pending', 'workspace_pending') then
    safe_role := requested_role;
  end if;

  insert into public.cater_profiles (id, workspace_id, email, full_name, phone, company, role)
  values (
    new.id,
    target_workspace_id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'company', ''),
    safe_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.cater_profiles.full_name),
        phone = coalesce(excluded.phone, public.cater_profiles.phone),
        company = coalesce(excluded.company, public.cater_profiles.company),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists cater_auth_users_create_profile on auth.users;
create trigger cater_auth_users_create_profile
after insert on auth.users
for each row execute function public.cater_handle_new_user();

create or replace function public.cater_current_auth_email()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '');
$$;

create or replace function public.cater_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.cater_profiles
  where id = (select auth.uid())
  limit 1;
$$;

create or replace function public.beoflow_current_workspace_role(target_workspace_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select m.role
      from public.beoflow_workspace_members m
      where m.workspace_id = target_workspace_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
      limit 1
    ),
    (
      select case
        when p.role = 'admin' then 'admin'
        when p.role in ('staff', 'organizer') then 'organizer'
        when p.role = 'collaborator' then 'collaborator'
        when p.role = 'client' then 'viewer'
        else null
      end
      from public.cater_profiles p
      where p.id = (select auth.uid())
        and p.workspace_id = target_workspace_id
      limit 1
    )
  );
$$;

create or replace function public.beoflow_is_workspace_admin(target_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.beoflow_current_workspace_role(target_workspace_id), '') in ('owner', 'admin');
$$;

create or replace function public.beoflow_is_workspace_staff(target_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.beoflow_current_workspace_role(target_workspace_id), '') in ('owner', 'admin', 'organizer');
$$;

create or replace function public.beoflow_can_access_workspace(target_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.beoflow_workspace_members m
    where m.workspace_id = target_workspace_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
  or exists (
    select 1
    from public.cater_profiles p
    where p.id = (select auth.uid())
      and p.workspace_id = target_workspace_id
      and p.role in ('admin', 'staff', 'organizer', 'collaborator', 'client')
  );
$$;

create or replace function public.cater_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.beoflow_is_workspace_admin('cater-vegas');
$$;

create or replace function public.cater_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.beoflow_is_workspace_staff('cater-vegas');
$$;

create or replace function public.cater_customer_email_matches(target_customer_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cater_customers c
    where c.id = target_customer_id
      and c.email is not null
      and lower(c.email) = lower(public.cater_current_auth_email())
  );
$$;

create or replace function public.cater_is_current_collaborator(target_collaborator_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cater_collaborators c
    where c.id = target_collaborator_id
      and c.email is not null
      and lower(c.email) = lower(public.cater_current_auth_email())
      and c.status <> 'inactive'
  );
$$;

create or replace function public.cater_can_access_event(target_event_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cater_events e
    where e.id = target_event_id
      and (
        public.beoflow_is_workspace_staff(e.workspace_id)
        or (
          public.beoflow_can_access_workspace(e.workspace_id)
          and (
            e.client_id = (select auth.uid())
            or e.created_by = (select auth.uid())
          )
        )
        or (e.customer_id is not null and public.cater_customer_email_matches(e.customer_id))
      )
  );
$$;

create or replace function public.cater_can_access_collaborator(target_collaborator_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cater_event_assignments a
    where a.collaborator_id = target_collaborator_id
      and public.cater_can_access_event(a.event_id)
  );
$$;

alter table public.beoflow_workspaces enable row level security;
alter table public.beoflow_workspace_members enable row level security;
alter table public.cater_profiles enable row level security;
alter table public.cater_customers enable row level security;
alter table public.cater_events enable row level security;
alter table public.cater_beoflow_messages enable row level security;
alter table public.cater_plan_versions enable row level security;
alter table public.cater_collaborators enable row level security;
alter table public.cater_event_assignments enable row level security;

drop policy if exists "cater_profiles_select_own_or_staff" on public.cater_profiles;
drop policy if exists "cater_profiles_insert_own_client" on public.cater_profiles;
drop policy if exists "cater_profiles_insert_admin" on public.cater_profiles;
drop policy if exists "cater_profiles_update_admin" on public.cater_profiles;
drop policy if exists "cater_events_select_by_role" on public.cater_events;
drop policy if exists "cater_events_insert_by_role" on public.cater_events;
drop policy if exists "cater_events_update_by_role" on public.cater_events;
drop policy if exists "cater_events_delete_admin" on public.cater_events;
drop policy if exists "cater_beoflow_messages_delete_admin" on public.cater_beoflow_messages;
drop policy if exists "cater_plan_versions_update_admin" on public.cater_plan_versions;
drop policy if exists "cater_plan_versions_delete_admin" on public.cater_plan_versions;
drop policy if exists "cater_collaborators_select_by_role_or_event" on public.cater_collaborators;
drop policy if exists "cater_collaborators_insert_admin" on public.cater_collaborators;
drop policy if exists "cater_collaborators_update_admin" on public.cater_collaborators;
drop policy if exists "cater_collaborators_delete_admin" on public.cater_collaborators;
drop policy if exists "cater_event_assignments_insert_staff" on public.cater_event_assignments;
drop policy if exists "cater_event_assignments_update_staff" on public.cater_event_assignments;
drop policy if exists "cater_event_assignments_delete_admin" on public.cater_event_assignments;

drop policy if exists "beoflow_workspaces_select_member_or_owner" on public.beoflow_workspaces;
create policy "beoflow_workspaces_select_member_or_owner"
on public.beoflow_workspaces
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or public.beoflow_can_access_workspace(id)
  or exists (
    select 1
    from public.beoflow_workspace_members m
    where m.workspace_id = id
      and m.user_id = (select auth.uid())
      and m.status in ('pending', 'invited')
  )
);

drop policy if exists "beoflow_workspaces_insert_pending_owner" on public.beoflow_workspaces;
create policy "beoflow_workspaces_insert_pending_owner"
on public.beoflow_workspaces
for insert
to authenticated
with check (owner_id = (select auth.uid()) and status = 'pending');

drop policy if exists "beoflow_workspaces_update_admin" on public.beoflow_workspaces;
create policy "beoflow_workspaces_update_admin"
on public.beoflow_workspaces
for update
to authenticated
using (public.beoflow_is_workspace_admin(id))
with check (public.beoflow_is_workspace_admin(id));

drop policy if exists "beoflow_workspace_members_select_own_or_admin" on public.beoflow_workspace_members;
create policy "beoflow_workspace_members_select_own_or_admin"
on public.beoflow_workspace_members
for select
to authenticated
using (user_id = (select auth.uid()) or public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "beoflow_workspace_members_insert_pending_self_or_admin" on public.beoflow_workspace_members;
create policy "beoflow_workspace_members_insert_pending_self_or_admin"
on public.beoflow_workspace_members
for insert
to authenticated
with check (
  public.beoflow_is_workspace_admin(workspace_id)
  or (
    user_id = (select auth.uid())
    and status = 'pending'
    and (
      role in ('collaborator', 'viewer')
      or (
        role = 'owner'
        and exists (
          select 1
          from public.beoflow_workspaces w
          where w.id = workspace_id
            and w.owner_id = (select auth.uid())
            and w.status = 'pending'
        )
      )
    )
  )
);

drop policy if exists "beoflow_workspace_members_update_admin" on public.beoflow_workspace_members;
create policy "beoflow_workspace_members_update_admin"
on public.beoflow_workspace_members
for update
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id))
with check (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "beoflow_workspace_members_delete_admin" on public.beoflow_workspace_members;
create policy "beoflow_workspace_members_delete_admin"
on public.beoflow_workspace_members
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_profiles_select_own_or_workspace_admin" on public.cater_profiles;
create policy "cater_profiles_select_own_or_workspace_admin"
on public.cater_profiles
for select
to authenticated
using ((select auth.uid()) = id or public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_profiles_insert_safe_self_or_admin" on public.cater_profiles;
create policy "cater_profiles_insert_safe_self_or_admin"
on public.cater_profiles
for insert
to authenticated
with check (
  public.beoflow_is_workspace_admin(workspace_id)
  or (
    (select auth.uid()) = id
    and role in ('client', 'client_pending', 'collaborator_pending', 'organizer_pending', 'workspace_pending')
  )
);

drop policy if exists "cater_profiles_update_own_no_role_change" on public.cater_profiles;
create policy "cater_profiles_update_own_no_role_change"
on public.cater_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = public.cater_current_user_role());

drop policy if exists "cater_profiles_update_workspace_admin" on public.cater_profiles;
create policy "cater_profiles_update_workspace_admin"
on public.cater_profiles
for update
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id))
with check (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_customers_select_workspace_or_self" on public.cater_customers;
create policy "cater_customers_select_workspace_or_self"
on public.cater_customers
for select
to authenticated
using (
  public.beoflow_is_workspace_staff(workspace_id)
  or lower(coalesce(email, '')) = lower(public.cater_current_auth_email())
);

drop policy if exists "cater_customers_insert_workspace_or_self" on public.cater_customers;
create policy "cater_customers_insert_workspace_or_self"
on public.cater_customers
for insert
to authenticated
with check (
  public.beoflow_is_workspace_staff(workspace_id)
  or lower(coalesce(email, '')) = lower(public.cater_current_auth_email())
);

drop policy if exists "cater_customers_update_workspace_staff" on public.cater_customers;
create policy "cater_customers_update_workspace_staff"
on public.cater_customers
for update
to authenticated
using (public.beoflow_is_workspace_staff(workspace_id))
with check (public.beoflow_is_workspace_staff(workspace_id));

drop policy if exists "cater_customers_delete_workspace_admin" on public.cater_customers;
create policy "cater_customers_delete_workspace_admin"
on public.cater_customers
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_events_select_by_workspace_role" on public.cater_events;
create policy "cater_events_select_by_workspace_role"
on public.cater_events
for select
to authenticated
using (public.cater_can_access_event(id));

drop policy if exists "cater_events_insert_by_workspace_role" on public.cater_events;
create policy "cater_events_insert_by_workspace_role"
on public.cater_events
for insert
to authenticated
with check (
  public.beoflow_is_workspace_staff(workspace_id)
  or (
    public.beoflow_can_access_workspace(workspace_id)
    and (
      client_id = (select auth.uid())
      or created_by = (select auth.uid())
    )
  )
);

drop policy if exists "cater_events_update_by_workspace_role" on public.cater_events;
create policy "cater_events_update_by_workspace_role"
on public.cater_events
for update
to authenticated
using (public.cater_can_access_event(id))
with check (
  public.beoflow_is_workspace_staff(workspace_id)
  or (
    public.beoflow_can_access_workspace(workspace_id)
    and (
      client_id = (select auth.uid())
      or created_by = (select auth.uid())
    )
  )
);

drop policy if exists "cater_events_delete_workspace_admin" on public.cater_events;
create policy "cater_events_delete_workspace_admin"
on public.cater_events
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_beoflow_messages_select_event_access" on public.cater_beoflow_messages;
create policy "cater_beoflow_messages_select_event_access"
on public.cater_beoflow_messages
for select
to authenticated
using (public.cater_can_access_event(event_id));

drop policy if exists "cater_beoflow_messages_insert_event_access" on public.cater_beoflow_messages;
create policy "cater_beoflow_messages_insert_event_access"
on public.cater_beoflow_messages
for insert
to authenticated
with check (
  public.cater_can_access_event(event_id)
  and (user_id is null or user_id = (select auth.uid()) or public.beoflow_is_workspace_staff(workspace_id))
);

drop policy if exists "cater_beoflow_messages_delete_workspace_admin" on public.cater_beoflow_messages;
create policy "cater_beoflow_messages_delete_workspace_admin"
on public.cater_beoflow_messages
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_plan_versions_select_event_access" on public.cater_plan_versions;
create policy "cater_plan_versions_select_event_access"
on public.cater_plan_versions
for select
to authenticated
using (public.cater_can_access_event(event_id));

drop policy if exists "cater_plan_versions_insert_event_access" on public.cater_plan_versions;
create policy "cater_plan_versions_insert_event_access"
on public.cater_plan_versions
for insert
to authenticated
with check (
  public.cater_can_access_event(event_id)
  and (created_by is null or created_by = (select auth.uid()) or public.beoflow_is_workspace_staff(workspace_id))
);

drop policy if exists "cater_plan_versions_update_workspace_admin" on public.cater_plan_versions;
create policy "cater_plan_versions_update_workspace_admin"
on public.cater_plan_versions
for update
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id))
with check (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_plan_versions_delete_workspace_admin" on public.cater_plan_versions;
create policy "cater_plan_versions_delete_workspace_admin"
on public.cater_plan_versions
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_collaborators_select_by_workspace_or_event" on public.cater_collaborators;
create policy "cater_collaborators_select_by_workspace_or_event"
on public.cater_collaborators
for select
to authenticated
using (
  public.beoflow_is_workspace_staff(workspace_id)
  or public.cater_is_current_collaborator(id)
  or public.cater_can_access_collaborator(id)
);

drop policy if exists "cater_collaborators_insert_workspace_admin" on public.cater_collaborators;
create policy "cater_collaborators_insert_workspace_admin"
on public.cater_collaborators
for insert
to authenticated
with check (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_collaborators_update_workspace_admin" on public.cater_collaborators;
create policy "cater_collaborators_update_workspace_admin"
on public.cater_collaborators
for update
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id))
with check (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_collaborators_delete_workspace_admin" on public.cater_collaborators;
create policy "cater_collaborators_delete_workspace_admin"
on public.cater_collaborators
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

drop policy if exists "cater_event_assignments_select_event_access" on public.cater_event_assignments;
create policy "cater_event_assignments_select_event_access"
on public.cater_event_assignments
for select
to authenticated
using (
  public.beoflow_is_workspace_staff(workspace_id)
  or public.cater_is_current_collaborator(collaborator_id)
  or public.cater_can_access_event(event_id)
);

drop policy if exists "cater_event_assignments_insert_workspace_staff" on public.cater_event_assignments;
create policy "cater_event_assignments_insert_workspace_staff"
on public.cater_event_assignments
for insert
to authenticated
with check (public.beoflow_is_workspace_staff(workspace_id) and public.cater_can_access_event(event_id));

drop policy if exists "cater_event_assignments_update_workspace_staff" on public.cater_event_assignments;
create policy "cater_event_assignments_update_workspace_staff"
on public.cater_event_assignments
for update
to authenticated
using (public.beoflow_is_workspace_staff(workspace_id) and public.cater_can_access_event(event_id))
with check (public.beoflow_is_workspace_staff(workspace_id) and public.cater_can_access_event(event_id));

drop policy if exists "cater_event_assignments_delete_workspace_admin" on public.cater_event_assignments;
create policy "cater_event_assignments_delete_workspace_admin"
on public.cater_event_assignments
for delete
to authenticated
using (public.beoflow_is_workspace_admin(workspace_id));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.beoflow_workspaces to authenticated;
grant select, insert, update, delete on public.beoflow_workspace_members to authenticated;
grant select, insert, update on public.cater_profiles to authenticated;
grant select, insert, update, delete on public.cater_customers to authenticated;
grant select, insert, update, delete on public.cater_events to authenticated;
grant select, insert, delete on public.cater_beoflow_messages to authenticated;
grant select, insert, update, delete on public.cater_plan_versions to authenticated;
grant select, insert, update, delete on public.cater_collaborators to authenticated;
grant select, insert, update, delete on public.cater_event_assignments to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.cater_events replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cater_events'
  ) then
    alter publication supabase_realtime add table public.cater_events;
  end if;
end;
$$;
