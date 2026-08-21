-- ============================================
-- Migration 004: Complete RLS Policy Overhaul
-- Drops ALL existing policies and creates strict, role-based policies.
-- Run AFTER 001, 002, 003.
-- ============================================

-- ============================================
-- Helper function: get current user's role from profiles
-- Used by all RLS policies for role checks
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user is staff (owner, manager, or worker)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'manager', 'worker')
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user is owner or manager
CREATE OR REPLACE FUNCTION public.is_owner_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'manager')
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================
-- PROFILES
-- ============================================
-- Drop any existing policies
DROP POLICY IF EXISTS "Staff can view own row" ON public.staff;
DROP POLICY IF EXISTS "Owner can manage all staff" ON public.staff;
DROP POLICY IF EXISTS "Customers can select own row" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own row" ON public.customers;
DROP POLICY IF EXISTS "Customers can insert own row" ON public.customers;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Owner can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "Manager can read staff profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() = 'manager'
    AND role IN ('owner', 'manager', 'worker')
  );

CREATE POLICY "Owner can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner());

-- Allow service role / triggers to insert customer profiles on signup
CREATE POLICY "Service can insert customer profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role = 'customer'
  );

CREATE POLICY "Owner can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "Users can update own profile (limited)"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Owner can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_owner());


-- ============================================
-- CATEGORIES
-- ============================================
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Owner can manage categories" ON public.categories;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Authenticated staff can view all (including inactive) for admin
CREATE POLICY "Staff can view all categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Owner or Manager can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_owner_or_manager())
  WITH CHECK (public.is_owner_or_manager());


-- ============================================
-- MENU ITEMS
-- ============================================
DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Owner can manage menu_items" ON public.menu_items;

CREATE POLICY "Anyone can view available menu items"
  ON public.menu_items FOR SELECT
  USING (is_available = true);

CREATE POLICY "Staff can view all menu items"
  ON public.menu_items FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "Owner or Manager can manage menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (public.is_owner_or_manager())
  WITH CHECK (public.is_owner_or_manager());


-- ============================================
-- ITEM CUSTOMIZATIONS
-- ============================================
CREATE POLICY "Anyone can view customizations"
  ON public.item_customizations FOR SELECT
  USING (true);

CREATE POLICY "Owner or Manager can manage customizations"
  ON public.item_customizations FOR ALL
  TO authenticated
  USING (public.is_owner_or_manager())
  WITH CHECK (public.is_owner_or_manager());


-- ============================================
-- CUSTOMIZATION OPTIONS
-- ============================================
CREATE POLICY "Anyone can view customization options"
  ON public.customization_options FOR SELECT
  USING (true);

CREATE POLICY "Owner or Manager can manage customization options"
  ON public.customization_options FOR ALL
  TO authenticated
  USING (public.is_owner_or_manager())
  WITH CHECK (public.is_owner_or_manager());


-- ============================================
-- COUPONS
-- ============================================
CREATE POLICY "Anyone can view active valid coupons"
  ON public.coupons FOR SELECT
  USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_to IS NULL OR valid_to >= now())
  );

CREATE POLICY "Owner can view all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "Owner can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());


-- ============================================
-- OFFERS (display banners)
-- ============================================
DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Owner can manage offers" ON public.offers;

CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owner can view all offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (public.is_owner());

CREATE POLICY "Owner can manage offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());


-- ============================================
-- ORDERS
-- ============================================
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view and update orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;

-- Authenticated customers can insert their own orders
CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
  );

-- Anonymous can also create orders (guest checkout) - but with limited data
CREATE POLICY "Anonymous can create orders"
  ON public.orders FOR INSERT
  TO anon
  WITH CHECK (customer_id IS NULL);

-- Customers can view only their own orders
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Staff can view all orders
CREATE POLICY "Staff can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Staff can update orders (status, updated_by, payment_status)
CREATE POLICY "Staff can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Owner can delete orders (for cleanup)
CREATE POLICY "Owner can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_owner());


-- ============================================
-- ORDER ITEMS
-- ============================================
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view order_items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;

-- Anyone can insert order items (when placing an order)
CREATE POLICY "Authenticated can create order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous can create order items"
  ON public.order_items FOR INSERT
  TO anon
  WITH CHECK (true);

-- Customers can view own order items
CREATE POLICY "Customers can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Staff can view all order items
CREATE POLICY "Staff can view all order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (public.is_staff());


-- ============================================
-- ADDRESSES
-- ============================================
CREATE POLICY "Customers can CRUD own addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Owner can view all addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (public.is_owner());


-- ============================================
-- COUPON USAGE
-- ============================================
CREATE POLICY "Customers can view own coupon usage"
  ON public.coupon_usage FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Owner can view all coupon usage"
  ON public.coupon_usage FOR SELECT
  TO authenticated
  USING (public.is_owner());

-- Insert is handled by server-side functions only (via service role)
-- No direct insert policy for clients


-- ============================================
-- AUDIT LOGS
-- ============================================
-- Insert-only via server-side functions (service role or security definer)
-- No client-side insert policy

CREATE POLICY "Owner can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_owner());


-- ============================================
-- STAFF INVITES (existing table — update policies)
-- ============================================
DROP POLICY IF EXISTS "Owner can manage staff invites" ON public.staff_invites;

CREATE POLICY "Owner can manage staff invites"
  ON public.staff_invites FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());
