-- ============================================
-- Celebration Food Cafe — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

create extension if not exists "uuid-ossp";

-- Categories (e.g. Beverages, Snacks, Meals, Desserts)
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Menu items
create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_veg boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Orders
create type order_type as enum ('dine-in', 'pickup', 'delivery');
create type order_status as enum ('pending', 'preparing', 'ready', 'out-for-delivery', 'completed', 'cancelled');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_type order_type not null,
  customer_name text not null,
  phone text not null,
  address text,
  status order_status not null default 'pending',
  total_amount numeric(10,2) not null default 0,
  payment_status text not null default 'unpaid', -- 'unpaid' | 'paid' (manual UPI/COD for now)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order line items
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,       -- snapshot, in case menu item is edited later
  quantity int not null default 1,
  price_at_order numeric(10,2) not null,
  item_notes text
);

-- ============================================
-- Row Level Security
-- ============================================
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Public (customers) can READ categories/menu, but not write
create policy "Public can view categories" on categories for select using (true);
create policy "Public can view available menu items" on menu_items for select using (true);

-- Public can INSERT orders + order_items (place an order), but not read others' orders
create policy "Public can create orders" on orders for insert with check (true);
create policy "Public can create order items" on order_items for insert with check (true);

-- Admin (authenticated) can do everything — tighten with a role check once you add staff accounts
create policy "Admin full access categories" on categories for all using (auth.role() = 'authenticated');
create policy "Admin full access menu_items" on menu_items for all using (auth.role() = 'authenticated');
create policy "Admin full access orders" on orders for all using (auth.role() = 'authenticated');
create policy "Admin full access order_items" on order_items for all using (auth.role() = 'authenticated');

-- ============================================
-- Realtime (for live order updates in admin dashboard)
-- ============================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ============================================
-- Seed data — Celebration Food Cafe, Hamirpur (dummy starter menu)
-- Replace with real menu once cafe data is collected
-- ============================================
insert into categories (name, display_order) values
  ('Beverages', 1),
  ('Snacks', 2),
  ('Meals', 3),
  ('Desserts', 4);

insert into menu_items (category_id, name, description, price, is_veg) values
  ((select id from categories where name = 'Beverages'), 'Masala Chai', 'Classic spiced tea', 20, true),
  ((select id from categories where name = 'Beverages'), 'Cold Coffee', 'Chilled coffee with ice cream', 80, true),
  ((select id from categories where name = 'Snacks'), 'Veg Sandwich', 'Grilled sandwich with mint chutney', 60, true),
  ((select id from categories where name = 'Snacks'), 'Maggi', 'Classic masala Maggi', 50, true),
  ((select id from categories where name = 'Meals'), 'Veg Thali', 'Dal, sabzi, roti, rice, salad', 150, true),
  ((select id from categories where name = 'Meals'), 'Chicken Thali', 'Chicken curry, rice, roti, salad', 220, false),
  ((select id from categories where name = 'Desserts'), 'Gulab Jamun (2 pc)', 'Warm, syrup-soaked', 40, true);
