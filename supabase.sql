-- Run this once in Supabase > SQL Editor. First replace YOU@EXAMPLE.COM (4 places) with your login email.
create table items (
  id uuid primary key default gen_random_uuid(),
  title text default '', description text default '',
  media jsonb default '[]', position float8 not null default 0,
  created_at timestamptz default now());
create table profile (id int primary key default 1 check (id = 1), name text default 'Your Name', avatar_url text);
insert into profile (id) values (1);

alter table items enable row level security;
alter table profile enable row level security;
create policy "anyone reads items" on items for select using (true);
create policy "anyone reads profile" on profile for select using (true);
create policy "owner writes items" on items for all to authenticated
  using (auth.jwt() ->> 'email' = 'quahweixiang08@gmail.com') with check (auth.jwt() ->> 'email' = 'quahweixiang08@gmail.com');
create policy "owner writes profile" on profile for all to authenticated
  using (auth.jwt() ->> 'email' = 'quahweixiang08@gmail.com') with check (auth.jwt() ->> 'email' = 'quahweixiang08@gmail.com');

alter publication supabase_realtime add table items, profile;

insert into storage.buckets (id, name, public) values ('media', 'media', true);
create policy "anyone reads media" on storage.objects for select using (bucket_id = 'media');
create policy "owner writes media" on storage.objects for all to authenticated
  using (bucket_id = 'media' and auth.jwt() ->> 'email' = 'quahweixiang08@gmail.com')
  with check (bucket_id = 'media' and auth.jwt() ->> 'email' = 'quahweixiang08@gmail.com');
