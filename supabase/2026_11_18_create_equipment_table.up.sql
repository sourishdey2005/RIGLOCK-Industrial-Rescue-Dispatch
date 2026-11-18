-- Supabase Migration: 2026_11_18_create_equipment_table.up.sql
-- Equipment/products catalog for seller inventory

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text not null check (category in ('POWER', 'DEWATERING', 'HYDRAULIC', 'LIGHTING', 'CUTTING', 'AIR')),
  image_url text not null,
  condition_rating text not null check (condition_rating in ('GRADE-A1', 'GRADE-A2')),
  availability_flag text not null check (availability_flag in ('IN VEHICLE', 'DEPOT READY')),
  emergency_hourly_rate numeric not null default 0,
  emergency_dispatch_fee numeric not null default 0,
  rental_daily_rate numeric not null default 0,
  rental_weekly_rate numeric not null default 0,
  purchase_price numeric not null default 0,
  stock_qty integer not null default 0,
  seller_id uuid references accounts(id) on delete cascade,
  seller_name text not null,
  deposit_amount numeric not null default 0,
  deposit_tier text not null default 'TIER-2 BOND' check (deposit_tier in ('TIER-1 BOND', 'TIER-2 BOND')),
  rating numeric default 4.97,
  last_ping_seconds integer default 6,
  distance_miles numeric default 1.0,
  eta_minutes integer default 22,
  node_id text,
  node_callsign text,
  courier_name text,
  courier_plate text,
  weight_lbs numeric default 340,
  primary_output text not null,
  voltage_or_pressure text not null default 'INDUSTRIAL GRADE',
  inspection_date text not null default '2026-11-17',
  summary text not null,
  specs jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table equipment enable row level security;

-- Allow public read access to equipment (catalog viewing)
create policy "Allow public read equipment" on equipment
  for select using (true);

-- Sellers can manage their own equipment
create policy "Sellers manage own equipment" on equipment
  using (seller_id = (select id from accounts where email = current_setting('app.current_user_email')));

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger on_updated_at
  before update on equipment
  for each row
  execute function handle_updated_at();