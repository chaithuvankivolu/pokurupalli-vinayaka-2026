-- Run once in Supabase SQL Editor if you have not already.
create policy "Public can upload Ganesh photos" on storage.objects for insert to anon, authenticated with check (bucket_id='ganesh-photos');
create policy "Public can view Ganesh photos" on storage.objects for select to anon, authenticated using (bucket_id='ganesh-photos');
create policy "Authenticated can manage Ganesh photos" on storage.objects for update to authenticated using (bucket_id='ganesh-photos') with check (bucket_id='ganesh-photos');
create policy "Authenticated can delete Ganesh photos" on storage.objects for delete to authenticated using (bucket_id='ganesh-photos');