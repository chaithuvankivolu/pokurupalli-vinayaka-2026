-- Admin access for photo moderation and dashboard data.
-- Run once in Supabase SQL Editor.

create policy "Admins can view all photos"
on public.photos
for select
to authenticated
using (public.is_admin());

create policy "Admins can update photos"
on public.photos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete photos"
on public.photos
for delete
to authenticated
using (public.is_admin());

create policy "Admins manage donors"
on public.donors
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage events"
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage announcements"
on public.announcements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage: admins can remove or update submitted files.
create policy "Admins manage Ganesh photo files"
on storage.objects
for all
to authenticated
using (bucket_id = 'ganesh-photos' and public.is_admin())
with check (bucket_id = 'ganesh-photos' and public.is_admin());
