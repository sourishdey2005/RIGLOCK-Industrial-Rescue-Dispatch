-- Supabase Migration: 2026_11_18_create_orders_table.up.sql
-- Buyer purchase orders

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique not null,
  buyer_id uuid references accounts(id) on delete cascade,
  buyer_company text not null,
  gstin text,
  delivery_address text not null,
  delivery_tier text not null check (delivery_tier in ('FREIGHT', 'ER_DROP', 'PICKUP')),
  delivery_fee numeric not null default 0,
  subtotal numeric not null default 0,
  gst_amount numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'PENDING_APPROVAL' check (status in ('PENDING_APPROVAL', 'APPROVED_FOR_RELEASE', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED_BY_BUYER', 'CANCELLED_BY_SELLER')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  cancelled_at timestamp with time zone,
  cancelled_by text check (cancelled_by in ('BUYER', 'SELLER')),
  cancellation_reason text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table orders enable row level security;

-- Allow buyers to view their own orders
create policy "Buyers view own orders" on orders
  for select using (buyer_id = (select id from accounts where email = current_setting('app.current_user_email')));

-- Sellers can view orders containing their equipment
create policy "Sellers view own order items" on orders
  for select using (exists (
    select 1 from order_items oi where oi.order_id = orders.id and oi.seller_id = (select id from accounts where email = current_setting('app.current_user_email'))
  ));

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger on_updated_at
  before update on orders
  for each row
  execute function handle_updated_at();