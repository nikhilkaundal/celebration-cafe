-- ============================================
-- Migration 001: Unified Profiles Table
-- Replaces separate `staff` and `customers` tables with a single `profiles` table.
-- Run this in Supabase SQL Editor FIRST, before any other migration.
-- ============================================

-- 1. Create the unified profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('owner', 'manager', 'worker', 'customer')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'deactivated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast role-based lookups (used heavily in RLS policies)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS immediately (policies added in 004_rls_policies.sql)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add to realtime for live profile updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 3. Auto-update `updated_at` on row modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- DATA MIGRATION: Copy existing staff rows
-- Maps old 'employee' role → 'worker' in the new system
-- ============================================
INSERT INTO public.profiles (id, role, full_name, email, phone, status, created_at)
SELECT
  s.id,
  CASE
    WHEN s.role::text = 'owner' THEN 'owner'
    ELSE 'worker'  -- All existing employees become workers; Owner can promote to manager later
  END,
  s.name,
  s.email,
  NULL,  -- staff table didn't have phone
  'active',
  s.created_at
FROM public.staff s
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = s.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DATA MIGRATION: Copy existing customer rows
-- ============================================
INSERT INTO public.profiles (id, role, full_name, email, phone, status, created_at)
SELECT
  c.id,
  'customer',
  c.name,
  c.email,
  c.phone,
  'active',
  c.created_at
FROM public.customers c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = c.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Update staff_invites to use new role values
-- ============================================
ALTER TABLE public.staff_invites
  ALTER COLUMN role SET DEFAULT 'worker';

-- Update any existing invites with old 'employee' role
UPDATE public.staff_invites
SET role = 'worker'
WHERE role = 'employee';

-- ============================================
-- Update orders table: add reference to profiles + confirmed status
-- ============================================

-- Add customer_id FK if it doesn't already point to profiles
-- (It currently references customers table — we'll update after dropping)

-- Add coupon_id column for future coupon tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Add 'confirmed' to the order_status enum
-- (Postgres requires a workaround to add values to enums)
DO $$
BEGIN
  -- Check if 'confirmed' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'confirmed'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
  ) THEN
    ALTER TYPE order_status ADD VALUE 'confirmed' AFTER 'pending';
  END IF;
END$$;

-- Create index on orders for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================
-- NOTE: We keep the old `staff` and `customers` tables for now
-- as a safety net. They can be dropped after verifying the migration:
--
--   DROP TABLE IF EXISTS public.customers CASCADE;
--   DROP TABLE IF EXISTS public.staff CASCADE;
--
-- Run those manually AFTER confirming everything works.
-- ============================================
