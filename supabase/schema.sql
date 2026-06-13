-- Cater Vegas Supabase baseline for a shared Supabase project.
-- This file only creates/touches Cater Vegas objects prefixed with cater_.
-- It intentionally does not modify existing FiltraCore/BEOFlow tables.

create extension if not exists pgcrypto;

create table if not exists public.cater_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  company text,
  role text not null default 'client' check (role in ('admin', 'staff', 'client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cater_events (
  id bigint generated always as identity primary key,
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
  event_id bigint references public.cater_events(id) on delete cascade,
  user_id uuid references public.cater_profiles(id) on delete set null,
  sender text not null check (sender in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cater_plan_versions (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.cater_events(id) on delete cascade,
  version_number integer not null,
  plan jsonb not null,
  source text not null default 'beoflow' check (source in ('manual', 'beoflow', 'import')),
  created_by uuid references public.cater_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, version_number)
);

create index if not exists cater_profiles_role_idx on public.cater_profiles (role);
create index if not exists cater_events_client_id_idx on public.cater_events (client_id);
create index if not exists cater_events_assigned_to_idx on public.cater_events (assigned_to);
create index if not exists cater_events_created_by_idx on public.cater_events (created_by);
create index if not exists cater_events_status_updated_at_idx on public.cater_events (status, updated_at desc);
create index if not exists cater_beoflow_messages_event_id_idx on public.cater_beoflow_messages (event_id);
create index if not exists cater_beoflow_messages_user_id_idx on public.cater_beoflow_messages (user_id);
create index if not exists cater_plan_versions_event_id_idx on public.cater_plan_versions (event_id);
create index if not exists cater_plan_versions_created_by_idx on public.cater_plan_versions (created_by);

create or replace function public.cater_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cater_profiles_set_updated_at on public.cater_profiles;
create trigger cater_profiles_set_updated_at
before update on public.cater_profiles
for each row execute function public.cater_set_updated_at();

drop trigger if exists cater_events_set_updated_at on public.cater_events;
create trigger cater_events_set_updated_at
before update on public.cater_events
for each row execute function public.cater_set_updated_at();

create or replace function public.cater_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cater_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'client'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists cater_auth_users_create_profile on auth.users;
create trigger cater_auth_users_create_profile
after insert on auth.users
for each row execute function public.cater_handle_new_user();

create or replace function public.cater_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.cater_profiles
  where id = (select auth.uid());
$$;

create or replace function public.cater_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.cater_current_user_role(), '') = 'admin';
$$;

create or replace function public.cater_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.cater_current_user_role(), '') in ('admin', 'staff');
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
        public.cater_is_staff()
        or e.client_id = (select auth.uid())
        or e.created_by = (select auth.uid())
      )
  );
$$;

alter table public.cater_profiles enable row level security;
alter table public.cater_events enable row level security;
alter table public.cater_beoflow_messages enable row level security;
alter table public.cater_plan_versions enable row level security;

drop policy if exists "cater_profiles_select_own_or_staff" on public.cater_profiles;
create policy "cater_profiles_select_own_or_staff"
on public.cater_profiles
for select
to authenticated
using ((select auth.uid()) = id or public.cater_is_staff());

drop policy if exists "cater_profiles_insert_own_client" on public.cater_profiles;
create policy "cater_profiles_insert_own_client"
on public.cater_profiles
for insert
to authenticated
with check ((select auth.uid()) = id and role = 'client');

drop policy if exists "cater_profiles_insert_admin" on public.cater_profiles;
create policy "cater_profiles_insert_admin"
on public.cater_profiles
for insert
to authenticated
with check (public.cater_is_admin());

drop policy if exists "cater_profiles_update_own_no_role_change" on public.cater_profiles;
create policy "cater_profiles_update_own_no_role_change"
on public.cater_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id and role = public.cater_current_user_role());

drop policy if exists "cater_profiles_update_admin" on public.cater_profiles;
create policy "cater_profiles_update_admin"
on public.cater_profiles
for update
to authenticated
using (public.cater_is_admin())
with check (public.cater_is_admin());

drop policy if exists "cater_events_select_by_role" on public.cater_events;
create policy "cater_events_select_by_role"
on public.cater_events
for select
to authenticated
using (
  public.cater_is_staff()
  or client_id = (select auth.uid())
  or created_by = (select auth.uid())
);

drop policy if exists "cater_events_insert_by_role" on public.cater_events;
create policy "cater_events_insert_by_role"
on public.cater_events
for insert
to authenticated
with check (
  public.cater_is_staff()
  or client_id = (select auth.uid())
  or created_by = (select auth.uid())
);

drop policy if exists "cater_events_update_by_role" on public.cater_events;
create policy "cater_events_update_by_role"
on public.cater_events
for update
to authenticated
using (
  public.cater_is_staff()
  or client_id = (select auth.uid())
  or created_by = (select auth.uid())
)
with check (
  public.cater_is_staff()
  or client_id = (select auth.uid())
  or created_by = (select auth.uid())
);

drop policy if exists "cater_events_delete_admin" on public.cater_events;
create policy "cater_events_delete_admin"
on public.cater_events
for delete
to authenticated
using (public.cater_is_admin());

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
  and (user_id is null or user_id = (select auth.uid()) or public.cater_is_staff())
);

drop policy if exists "cater_beoflow_messages_delete_admin" on public.cater_beoflow_messages;
create policy "cater_beoflow_messages_delete_admin"
on public.cater_beoflow_messages
for delete
to authenticated
using (public.cater_is_admin());

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
  and (created_by is null or created_by = (select auth.uid()) or public.cater_is_staff())
);

drop policy if exists "cater_plan_versions_update_admin" on public.cater_plan_versions;
create policy "cater_plan_versions_update_admin"
on public.cater_plan_versions
for update
to authenticated
using (public.cater_is_admin())
with check (public.cater_is_admin());

drop policy if exists "cater_plan_versions_delete_admin" on public.cater_plan_versions;
create policy "cater_plan_versions_delete_admin"
on public.cater_plan_versions
for delete
to authenticated
using (public.cater_is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.cater_profiles to authenticated;
grant select, insert, update, delete on public.cater_events to authenticated;
grant select, insert, delete on public.cater_beoflow_messages to authenticated;
grant select, insert, update, delete on public.cater_plan_versions to authenticated;
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