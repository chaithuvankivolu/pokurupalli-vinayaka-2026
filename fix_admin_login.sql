-- Admin login/verification fix
-- The website now checks admin status through public.is_admin()
-- instead of selecting from admin_users directly (which may be protected by RLS).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
