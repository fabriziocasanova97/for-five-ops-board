-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Tables

-- PROFILES (Users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (lower(role) in ('manager', 'ops')) default 'manager',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STORES
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TICKETS (Issues)
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text check (status in ('pending', 'in-progress', 'resolved')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  store_id uuid references public.stores(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMMENTS
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.tickets enable row level security;
alter table public.comments enable row level security;

-- 3. Policies

-- Profiles: Authenticated users can read all profiles (to see names)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

-- Profiles: Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );
  
-- Stores: key 'ops' related policies
-- Ops can do everything, Managers can read
create policy "Stores are viewable by everyone"
  on public.stores for select
  using ( true );

create policy "Ops can insert stores"
  on public.stores for insert
  with check ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

create policy "Ops can update stores"
  on public.stores for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

create policy "Ops can delete stores"
  on public.stores for delete
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

-- Tickets
-- Read: Everyone
create policy "Tickets are viewable by everyone"
  on public.tickets for select
  using ( true );

-- Create: Authenticated users (Managers & Ops)
create policy "Authenticated users can create tickets"
  on public.tickets for insert
  with check ( auth.role() = 'authenticated' );

-- Update: 
-- Managers can update own tickets (maybe just description? For now, allowing update on own)
-- Ops can update any ticket (specifically status)
create policy "Users can update own tickets"
  on public.tickets for update
  using ( auth.uid() = created_by );

create policy "Ops can update any ticket"
  on public.tickets for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

-- Delete: Ops only
create policy "Ops can delete tickets"
  on public.tickets for delete
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

-- Comments
-- Read: Everyone
create policy "Comments are viewable by everyone"
  on public.comments for select
  using ( true );

-- Create: Authenticated users
create policy "Authenticated users can create comments"
  on public.comments for insert
  with check ( auth.role() = 'authenticated' );

-- 4. Seed Data (Stores)
insert into public.stores (name) values
('Alexandria'),
('Arlington'),
('Rosslyn'),
('L Street'),
('Penn'),
('1900 M'),
('901 K Street'),
('Navy Yard'),
('Skybar');

-- 5. Trigger for New User -> Profile
-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'manager');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
