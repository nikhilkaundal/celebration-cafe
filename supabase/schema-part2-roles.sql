-- ============================================
-- Phase 3 — Staff roles, offers, role-based security
-- Run this AFTER supabase/schema.sql, in SQL Editor
-- ============================================

-- ---- Staff table (owner + employees) ----
create type staff_role as enum ('owner', 'employee');

create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role staff_role not null default 'employee',
  created_at timestamptz not null default now()
);

alter table staff enable row level security;

-- Anyone logged in can see their own staff row (to check their own role)
create policy "Staff can view own row" on staff
  for select using (auth.uid() = id);

-- Only the owner can see/manage all staff rows (add, remove, change roles)
create policy "Owner can manage all staff" on staff
  for all using (
    exists (select 1 from staff s where s.id = auth.uid() and s.role = 'owner')
  );

-- ---- Offers / coupon codes ----
create table offers (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  coupon_code text not null unique,
  discount_type text not null default 'flat', -- 'flat' or 'percent'
  discount_value numeric(10,2) not null,
  is_active boolean not null default true,
  valid_until date,
  created_at timestamptz not null default now()
);

alter table offers enable row level security;

create policy "Public can view active offers" on offers
  for select using (is_active = true);

create policy "Owner can manage offers" on offers
  for all using (
    exists (select 1 from staff s where s.id = auth.uid() and s.role = 'owner')
  );

-- ============================================
-- Tighten existing policies from schema.sql
-- (previously: any authenticated user had full access — now role-based)
-- ============================================

-- Menu + categories: only OWNER can add/edit/delete (employees can just view, same as public)
drop policy if exists "Admin full access menu_items" on menu_items;
create policy "Owner can manage menu_items" on menu_items
  for all using (
    exists (select 1 from staff s where s.id = auth.uid() and s.role = 'owner')
  );

drop policy if exists "Admin full access categories" on categories;
create policy "Owner can manage categories" on categories
  for all using (
    exists (select 1 from staff s where s.id = auth.uid() and s.role = 'owner')
  );

-- Orders: BOTH owner and employees can view + update status (day-to-day work)
drop policy if exists "Admin full access orders" on orders;
create policy "Staff can view and update orders" on orders
  for all using (
    exists (select 1 from staff s where s.id = auth.uid())
  );

drop policy if exists "Admin full access order_items" on order_items;
create policy "Staff can view order_items" on order_items
  for all using (
    exists (select 1 from staff s where s.id = auth.uid())
  );

-- ============================================
-- IMPORTANT — one-time manual step (do this in Supabase dashboard, not SQL):
-- 1. Go to Authentication → Users → "Add user" → create yourself as the owner
--    (email + password) → copy the generated user UUID
-- 2. Run this, replacing the UUID and details with your own:
--
-- insert into staff (id, name, email, role)
-- values ('paste-your-auth-user-uuid-here', 'Nikhil', 'you@example.com', 'owner');
-- ============================================
