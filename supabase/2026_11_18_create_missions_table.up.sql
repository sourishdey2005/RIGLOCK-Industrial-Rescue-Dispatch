-- Supabase Migration: 2026_11_18_create_missions_table.up.sql
-- Dispatch missions / rental missions

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  mission_code text unique not null,
  buyer_id uuid references accounts(id) on delete cascade,
  buyer_name text not null,
  equipment_id uuid references equipment(id) on delete cascade,
  mode text not null check (mode in ('emergency', 'rental')),
  drop_zone_address text not null,
  site_coordinates text,
  priority_override boolean default false,
  eta_total_seconds integer default 2700,
  remaining_seconds integer default 1800,
  status text not null default 'VERIFIED' check (status in ('VERIFIED', 'LOADED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'ABORTED')),
  handoff_pin text,
  courier_name text,
  courier_plate text,
  started_at timestamp with time zone,
  total_cost numeric not null default 0,
  rental_days integer default 0,
  cancellation_reason text,
  logs jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table missions enable row level security;

-- Allow buyers to view their missions, sellers to view missions involving their equipment
create policy "Buyers view own missions" on missions
  for select using (buyer_id = (select id from accounts where email = current_setting('app.current_user_email')));

create policy "Sellers view own missions" on missions
  for select using (exists (
    select 1 from equipment eq where eq.id = missions.equipment_id and eq.seller_id = (select id from accounts where email = current_setting('app.current_user_email'))
  ));

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger on_updated_at
  before update on missions
  for each row
  execute function handle_updated_at();