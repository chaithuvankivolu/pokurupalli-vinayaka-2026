# పోకురుపల్లి వినాయక చవితి 2026

Free static website using Supabase + Vercel.

## Files
- index.html — public website
- admin.html — admin login/dashboard
- app.js — public data/photo upload
- admin.js — admin management
- style.css — responsive Telugu UI

## Supabase storage policy
Before public photo uploads will work, run the SQL in `supabase_storage_policies.sql`.

## Deploy
Upload this folder to a GitHub repository and import the repository into Vercel. No build command is needed; this is a static site.

IMPORTANT: The Supabase publishable key is intentionally used in browser code. Never put a service_role/secret key in these files.
