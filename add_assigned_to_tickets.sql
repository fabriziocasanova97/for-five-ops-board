-- Add assigned_to column to tickets table
alter table public.tickets 
add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
