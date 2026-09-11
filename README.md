# Pokurupalli Vinayaka Chaviti 2026 — V10

V10 fixes the admin login verification flow. The admin page now uses the secure `public.is_admin()` RPC instead of directly selecting from `admin_users`, so RLS on `admin_users` cannot incorrectly log out a valid admin.

Run `fix_admin_login.sql` once in Supabase SQL Editor, then deploy these files to Vercel.
