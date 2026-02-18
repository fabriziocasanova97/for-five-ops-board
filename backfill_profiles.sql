-- Backfill profiles for existing users
-- This inserts a profile for any user in auth.users that doesn't have one in public.profiles

insert into public.profiles (id, email, full_name, role)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', 'System User'), -- Fallback name
  'manager' -- Default role
from auth.users
where id not in (select id from public.profiles);
