-- Enable Realtime for the comments table
alter publication supabase_realtime add table public.comments;

-- Ensure the table has the correct replica identity (usually 'default' is fine, but 'full' ensures all columns are sent)
alter table public.comments replica identity full;
