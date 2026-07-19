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

-- Row Level Security: this app has a single owner and its own login screen
-- (not Supabase Auth), so requests come in using the public "anon" key.
-- These policies allow that key to read/write freely. This is appropriate
-- for a single-owner tool where the Supabase URL/key aren't shared publicly
-- — do not commit your real .env to a public GitHub repo.
alter table customers enable row level security;
alter table products enable row level security;

drop policy if exists "customers_all_access" on customers;
create policy "customers_all_access" on customers
  for all using (true) with check (true);

drop policy if exists "products_all_access" on products;
create policy "products_all_access" on products
  for all using (true) with check (true);
