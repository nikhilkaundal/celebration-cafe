-- ============================================
-- Migration 009: Pre-Built Coupon Templates & Unique Code Index
-- ============================================

-- 1. Add is_template column to coupons table if not exists
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- 2. Create unique index on UPPER(code) to guarantee uniqueness at DB level
CREATE UNIQUE INDEX IF NOT EXISTS coupons_unique_upper_code_idx 
ON public.coupons (UPPER(code));
