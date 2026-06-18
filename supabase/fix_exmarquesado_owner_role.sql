-- Repair Cater Vegas owner role for the current admin account.
-- Run in Supabase SQL Editor as project owner/postgres.

begin;

update public.cater_profiles
set role = 'admin',
    workspace_id = 'catering_events'
where lower(email) = 'exmarquesado@gmail.com';

insert into public.beoflow_workspace_members (workspace_id, user_id, role, status)
select 'catering_events', id, 'owner', 'active'
from public.cater_profiles
where lower(email) = 'exmarquesado@gmail.com'
on conflict (workspace_id, user_id)
do update set role = 'owner',
              status = 'active',
              updated_at = now();

commit;
