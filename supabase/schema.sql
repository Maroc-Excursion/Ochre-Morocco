-- Ochre Morocco / Supabase schema
-- Run this file in Supabase SQL Editor once.

create extension if not exists pgcrypto;

create table if not exists public.excursions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  duration text not null default '',
  category text not null check (category in ('excursion', 'circuit', 'transfert')),
  image_url text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  excursion_id uuid not null references public.excursions(id) on delete restrict,
  client_name text not null,
  client_email text not null,
  client_phone text not null default '',
  booking_date date not null,
  people_count integer not null default 1 check (people_count > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists excursions_set_updated_at on public.excursions;
create trigger excursions_set_updated_at
before update on public.excursions
for each row execute function public.set_updated_at();

alter table public.excursions enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Public can read active excursions" on public.excursions;
create policy "Public can read active excursions"
on public.excursions for select
to anon, authenticated
using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated can manage excursions" on public.excursions;
create policy "Authenticated can manage excursions"
on public.excursions for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings"
on public.bookings for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated can manage bookings" on public.bookings;
create policy "Authenticated can manage bookings"
on public.bookings for select
to authenticated
using (true);

drop policy if exists "Authenticated can update bookings" on public.bookings;
create policy "Authenticated can update bookings"
on public.bookings for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete bookings" on public.bookings;
create policy "Authenticated can delete bookings"
on public.bookings for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('excursion-images', 'excursion-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view excursion images" on storage.objects;
create policy "Public can view excursion images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'excursion-images');

drop policy if exists "Authenticated can upload excursion images" on storage.objects;
create policy "Authenticated can upload excursion images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'excursion-images');

drop policy if exists "Authenticated can update excursion images" on storage.objects;
create policy "Authenticated can update excursion images"
on storage.objects for update
to authenticated
using (bucket_id = 'excursion-images')
with check (bucket_id = 'excursion-images');

drop policy if exists "Authenticated can delete excursion images" on storage.objects;
create policy "Authenticated can delete excursion images"
on storage.objects for delete
to authenticated
using (bucket_id = 'excursion-images');