-- ============================================
-- Migration 002: Item Customizations
-- Enables per-item customization groups (Size, Spice Level, Add-ons)
-- with options that can have extra pricing.
-- Run AFTER 001_unified_profiles.sql
-- ============================================

-- Customization groups per menu item
-- e.g. "Size" for a pizza, "Spice Level" for a curry
CREATE TABLE IF NOT EXISTS public.item_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,        -- e.g. "Size", "Spice Level", "Add-ons"
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_select INT NOT NULL DEFAULT 1, -- 1 = single select (radio), >1 = multi-select (checkbox)
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual options within a customization group
-- e.g. "Small" (+₹0), "Medium" (+₹30), "Large" (+₹60) under "Size"
CREATE TABLE IF NOT EXISTS public.customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_id UUID NOT NULL REFERENCES public.item_customizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,              -- e.g. "Large", "Extra Cheese", "Spicy"
  extra_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_item_customizations_menu_item
  ON public.item_customizations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_customization_options_customization
  ON public.customization_options(customization_id);

-- Enable RLS (policies in 004_rls_policies.sql)
ALTER TABLE public.item_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_options ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Update order_items to store structured customizations
-- Instead of baking them into item_name, store as JSONB
-- ============================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS selected_customizations JSONB DEFAULT '[]'::jsonb;

-- selected_customizations format:
-- [
--   { "group": "Size", "option": "Large", "extra_price": 60 },
--   { "group": "Add-ons", "option": "Extra Cheese", "extra_price": 20 }
-- ]
