-- Run once in Supabase SQL Editor.
-- Adds a separate program-donor list (NO AMOUNTS) and an event schedule.

create table if not exists public.program_donors (
  id uuid primary key default gen_random_uuid(),
  program_name text not null,
  donor_name text not null,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

alter table public.program_donors enable row level security;

create policy "Anyone can view program donors"
on public.program_donors for select
using (true);

create policy "Admins manage program donors"
on public.program_donors for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- The existing events table already supports fixed date/time schedules.
-- Each event is a fixed entry with event_date, start_time, end_time, location.
-- No changes are required to the events table.
