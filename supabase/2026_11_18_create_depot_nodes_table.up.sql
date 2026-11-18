-- Supabase Migration: 2026_11_18_create_depot_nodes_table.up.sql
-- Depot nodes / van nodes for fleet staging

create table if not exists depot_nodes (
  id uuid primary key default gen_random_uuid(),
  callsign text not null unique,
  region text not null,
  status text not null check (status in ('LIVE NODE', 'IN VEHICLE')),
  coordinates text,
  map_x integer default 0,
  map_y integer default 0,
  distance_miles numeric default 1.0,
  rating numeric default 4.97,
  last_ping_seconds integer default 6,
  active_units integer default 0,
  sla_minutes integer default 22,
  vehicle_type text not null default '24/7 STAGING WAREHOUSE',
  deposit_tier text not null default 'TIER-1 BOND' check (deposit_tier in ('TIER-1 BOND', 'TIER-2 BOND')),
  seller_id uuid references accounts(id) on delete cascade,
  lead_tech text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table depot_nodes enable row level security;

-- Allow public read access to nodes
create policy "Allow public read nodes" on depot_nodes
  for select using (true);

-- Sellers can manage their own nodes
create policy "Sellers manage own nodes" on depot_nodes
  using (seller_id = (select id from accounts where email = current_setting('app.current_user_email')));

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger on_updated_at
  before update on depot_nodes
  for each row
  execute function handle_updated_at();