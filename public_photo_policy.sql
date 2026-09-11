-- V19: Allow the public website to read only approved photos.
-- Run this once in Supabase SQL Editor.

drop policy if exists "Public can view approved photos" on public.photos;
create policy "Public can view approved photos"
on public.photos
for select
to anon, authenticated
using (status = 'approved');

-- Optional verification query:
-- select id, title, status, image_url from public.photos where status = 'approved' order by created_at desc;
