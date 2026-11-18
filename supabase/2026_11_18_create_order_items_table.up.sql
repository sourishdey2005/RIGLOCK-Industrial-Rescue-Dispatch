-- Supabase Migration: 2026_11_18_create_order_items_table.up.sql
-- Order line items linking orders to equipment

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  equipment_id uuid references equipment(id) on delete cascade,
  sku text not null,
  name text not null,
  seller_id uuid references accounts(id) on delete cascade,
  seller_name text not null,
  qty integer not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table order_items enable row level security;

-- Allow sellers to view their order items
create policy "Sellers view own order items" on order_items
  for select using (seller_id = (select id from accounts where email = current_setting('app.current_user_email')));

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger on_updated_at
  before update on order_items
  for each row
  execute function handle_updated_at();