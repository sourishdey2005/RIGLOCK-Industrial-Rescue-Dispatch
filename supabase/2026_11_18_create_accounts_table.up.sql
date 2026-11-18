-- Supabase Migration: 2026_11_18_create_accounts_table.up.sql
-- Accounts table for user authentication and profiles

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('buyer', 'seller')),
  full_name text not null,
  company_name text not null,
  email text unique not null,
  password text not null, -- In production, use hashed passwords with auth.users
  phone text,
  gstin text,
  site_or_depot_address text,
  depot_region text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security)
alter table accounts enable row level security;

create policy "Allow public read during signup" on accounts
  for select using (true);

create policy "Allow authenticated users to insert own account" on accounts
  for check (auth.role() = 'authenticated');

-- Update trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger on_updated_at
  before update on accounts
  for each row
  execute function handle_updated_at();