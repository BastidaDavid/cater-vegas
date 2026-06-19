-- Repair Cater Vegas owner role for the current admin account.
-- Run after supabase/schema.sql in the Cater Vegas Supabase project.

begin;

insert into public.cater_profiles (
  id,
  workspace_id,
  email,
  full_name,
  role
)
select
  u.id,
  'cater-vegas',
  u.email,
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), 'Rodrigo Marquesado'),
  'owner'
from auth.users u
where lower(u.email) = lower('exmarquesado@gmail.com')
on conflict (id) do update
set workspace_id = 'cater-vegas',
    email = excluded.email,
    full_name = coalesce(nullif(public.cater_profiles.full_name, ''), excluded.full_name),
    role = 'owner',
    updated_at = now();

insert into public.beoflow_workspace_members (workspace_id, user_id, role, status)
select 'cater-vegas', id, 'owner', 'active'
from public.cater_profiles
where lower(email) = 'exmarquesado@gmail.com'
on conflict (workspace_id, user_id)
do update set role = 'owner',
              status = 'active',
              updated_at = now();

commit;
