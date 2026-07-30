-- TravelMind static-site cloud storage setup.
-- Run this once in the Supabase SQL editor for the project configured in index.html.
-- The app uses anonymous 4-digit team rooms, so anyone who knows a code can read or update that room.

begin;

create table if not exists public.travelmind_data (
    code text primary key,
    data text not null default '{}',
    updated_at timestamptz not null default now()
);

alter table public.travelmind_data
    add column if not exists code text,
    add column if not exists data text,
    add column if not exists updated_at timestamptz not null default now();

create unique index if not exists travelmind_data_code_unique
    on public.travelmind_data (code);

alter table public.travelmind_data enable row level security;

drop policy if exists travelmind_select_room on public.travelmind_data;
drop policy if exists travelmind_insert_room on public.travelmind_data;
drop policy if exists travelmind_update_room on public.travelmind_data;

create policy travelmind_select_room
    on public.travelmind_data
    for select
    to anon, authenticated
    using (code ~ '^[0-9]{4}$');

create policy travelmind_insert_room
    on public.travelmind_data
    for insert
    to anon, authenticated
    with check (code ~ '^[0-9]{4}$');

create policy travelmind_update_room
    on public.travelmind_data
    for update
    to anon, authenticated
    using (code ~ '^[0-9]{4}$')
    with check (code ~ '^[0-9]{4}$');

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.travelmind_data to anon, authenticated;

commit;
