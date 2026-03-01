-- Fix for "mutable search_path" warning in Supabase
-- This function trigger handles new user creation.
-- We add 'set search_path = public' to secure it.

create or replace function public.handle_new_user()
returns trigger 
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'manager');
  return new;
end;
$$ language plpgsql;
