-- Lakshmi Engineering Billing — Supabase schema
-- Run this in your Supabase project's SQL Editor (Database > SQL Editor > New query).
-- Creates the Customers and Products tables the app reads/writes.

create table if not exists customers (
  id text primary key,
  customer_id text,
  name text not null,
  contact_person text,
  phone text,
  email text,
  gst text,
  address text,
  state text,
  country text default 'India',
  created_date date,
  updated_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  hsn text,
  gst numeric default 18,
  unit text default 'Nos',
  rate numeric default 0,
  brand text,
  stock numeric default 0,
  updated_at timestamptz default now()
);

-- Company Settings (company details, logo/stamp, ISO number, bank info,
-- document prefixes, default terms & conditions, etc). Stored as one JSON
-- blob in a single row (id = 'default') rather than a column per field —
-- simplest way to keep this in sync across devices without a migration
-- every time a new settings field gets added.
create table if not exists company_settings (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Keep updated_at current on every change.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

drop trigger if exists company_settings_set_updated_at on company_settings;
create trigger company_settings_set_updated_at
  before update on company_settings
  for each row execute function set_updated_at();

-- Row Level Security: this app has a single owner and its own login screen
-- (not Supabase Auth), so requests come in using the public "anon" key.
-- These policies allow that key to read/write freely. This is appropriate
-- for a single-owner tool where the Supabase URL/key aren't shared publicly
-- — do not commit your real .env to a public GitHub repo.
alter table customers enable row level security;
alter table products enable row level security;
alter table company_settings enable row level security;

drop policy if exists "customers_all_access" on customers;
create policy "customers_all_access" on customers
  for all using (true) with check (true);

drop policy if exists "products_all_access" on products;
create policy "products_all_access" on products
  for all using (true) with check (true);

drop policy if exists "company_settings_all_access" on company_settings;
create policy "company_settings_all_access" on company_settings
  for all using (true) with check (true);

-- Storage bucket for exported PDFs (quotations/proformas/invoices), used by
-- the "Save to Cloud" button next to Download PDF. Public bucket — same
-- single-owner security model as the rest of this app (nobody can browse
-- your files without the exact link, and the app's URL/key aren't public).
-- If you'd rather keep these private, make the bucket public=false here and
-- ask to switch the app over to signed URLs instead.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "documents_all_access" on storage.objects;
create policy "documents_all_access" on storage.objects
  for all using (bucket_id = 'documents') with check (bucket_id = 'documents');
