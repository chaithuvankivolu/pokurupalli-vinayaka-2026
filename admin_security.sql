-- IMPORTANT: Run this once in Supabase SQL Editor.
-- Replace YOUR_ADMIN_EMAIL with the email used for your Supabase admin user.
-- Do not paste your password here.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

-- Add your current authenticated user's UUID automatically by email.
insert into public.admin_users (user_id)
select id from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Replace broad authenticated management policies with admin-only policies.
drop policy if exists "Admins manage donors" on public.donors;
drop policy if exists "Admins manage events" on public.events;
drop policy if exists "Admins manage photos" on public.photos;
drop policy if exists "Admins delete photos" on public.photos;
drop policy if exists "Admins manage announcements" on public.announcements;

create policy "Admins manage donors"
on public.donors for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage events"
on public.events for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage photos"
on public.photos for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage announcements"
on public.announcements for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Storage: only admins can modify/delete files.
drop policy if exists "Authenticated can manage Ganesh photos" on storage.objects;
drop policy if exists "Authenticated can delete Ganesh photos" on storage.objects;

create policy "Admins can update Ganesh photos"
on storage.objects for update to authenticated
using (bucket_id='ganesh-photos' and public.is_admin())
with check (bucket_id='ganesh-photos' and public.is_admin());

create policy "Admins can delete Ganesh photos"
on storage.objects for delete to authenticated
using (bucket_id='ganesh-photos' and public.is_admin());
