-- ============================================
-- Migration 003: Coupons, Addresses, Coupon Usage, Audit Logs
-- Run AFTER 001 and 002.
-- ============================================

-- ============================================
-- COUPONS (separate from offers — offers are display banners, coupons are discount codes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'flat'
    CHECK (discount_type IN ('flat', 'percent')),
  value NUMERIC(10,2) NOT NULL,       -- ₹ amount for flat, % for percent
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),         -- Cap for percent coupons (e.g. max ₹100 off)
  usage_limit INT,                    -- Total uses across all customers (NULL = unlimited)
  per_user_limit INT NOT NULL DEFAULT 1, -- Max uses per customer
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_to TIMESTAMPTZ,               -- NULL = no expiry
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COUPON USAGE (tracks which customer used which coupon on which order)
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer ON public.coupon_usage(customer_id);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADDRESSES (customers can save multiple delivery addresses)
-- ============================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',  -- e.g. "Home", "Office", "Other"
  line1 TEXT NOT NULL,                 -- House no, street
  line2 TEXT,                          -- Landmark, area
  city TEXT NOT NULL DEFAULT 'Hamirpur',
  pincode TEXT NOT NULL DEFAULT '177001',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON public.addresses(customer_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDIT LOGS (tracks all staff mutations — menu edits, coupon creation, staff actions, order status changes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                -- e.g. 'menu_item.create', 'order.status_update', 'staff.create'
  entity TEXT NOT NULL,                -- e.g. 'menu_items', 'orders', 'coupons', 'profiles'
  entity_id UUID,                      -- ID of the affected row
  details JSONB DEFAULT '{}'::jsonb,   -- Additional context (old status, new status, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Add FK from orders.coupon_id to coupons table
-- (Column was added in 001, FK added here after coupons table exists)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_coupon_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_coupon_id_fkey
      FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Add FK from orders.updated_by to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_updated_by_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Ensure is_active column exists on categories (for soft-delete)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add created_by to menu_items for audit trail
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Auto-update trigger for menu_items
CREATE TRIGGER set_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
