-- 1. Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create ticket_resources junction table
CREATE TABLE IF NOT EXISTS public.ticket_resources (
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, resource_id)
);

-- 3. Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_resources ENABLE ROW LEVEL SECURITY;

-- 4. Policies for resources
-- Everyone can read resources
CREATE POLICY "Resources are viewable by everyone"
  ON public.resources FOR SELECT
  USING ( true );

-- Only ops can insert, update, or delete resources
CREATE POLICY "Ops can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

CREATE POLICY "Ops can update resources"
  ON public.resources FOR UPDATE
  USING ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

CREATE POLICY "Ops can delete resources"
  ON public.resources FOR DELETE
  USING ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );


-- 5. Policies for ticket_resources
-- Everyone can read ticket resources
CREATE POLICY "Ticket resources viewable by everyone"
  ON public.ticket_resources FOR SELECT
  USING ( true );

-- Only ops can manage ticket resources
CREATE POLICY "Ops can insert ticket resources"
  ON public.ticket_resources FOR INSERT
  WITH CHECK ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );

CREATE POLICY "Ops can delete ticket resources"
  ON public.ticket_resources FOR DELETE
  USING ( exists (select 1 from public.profiles where id = auth.uid() and role = 'ops') );
