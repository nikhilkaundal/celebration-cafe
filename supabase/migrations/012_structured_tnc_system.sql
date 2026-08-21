-- ============================================
-- Migration 012: Structured Terms & Conditions System (T&C)
-- Master reusable templates library + per-offer/coupon terms
-- ============================================

-- 1. Ensure overloaded is_owner and is_staff functions exist
CREATE OR REPLACE FUNCTION public.is_owner(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
    AND role = 'owner'
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
    AND role IN ('owner', 'manager', 'worker')
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Master library of reusable T&C templates
CREATE TABLE IF NOT EXISTS public.tnc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,                  -- e.g. "Minimum order value of ₹[param] applies"
  param_type TEXT,                      -- 'currency', 'percent', 'date', 'text', or NULL
  param_label TEXT,                     -- e.g. "Minimum order amount"
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed starter library of 11 common restaurant T&C conditions
INSERT INTO public.tnc_templates (label, param_type, param_label, sort_order) VALUES
  ('Minimum order value of ₹[param] applies', 'currency', 'Minimum Order Amount', 1),
  ('Valid only on [param] orders', 'text', 'Order Type (delivery / dine-in / pickup)', 2),
  ('Cannot be combined with other offers or coupons', NULL, NULL, 3),
  ('Valid once per customer', NULL, NULL, 4),
  ('Valid for first-time customers only', NULL, NULL, 5),
  ('Offer valid until [param]', 'date', 'Expiry Date', 6),
  ('Maximum discount capped at ₹[param]', 'currency', 'Max Discount Cap', 7),
  ('Valid only within [param] delivery zone', 'text', 'City / Area', 8),
  ('Valid only during [param]', 'text', 'Time Range (e.g. 2 PM - 6 PM)', 9),
  ('Applicable on select menu items only', NULL, NULL, 10),
  ('Restaurant reserves the right to modify or withdraw this offer at any time', NULL, NULL, 11)
ON CONFLICT DO NOTHING;

-- 3. Offer & Coupon terms junction table
CREATE TABLE IF NOT EXISTS public.offer_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  tnc_template_id UUID REFERENCES public.tnc_templates(id) ON DELETE SET NULL,
  custom_text TEXT,
  param_value TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_template_or_custom CHECK (
    (tnc_template_id IS NOT NULL AND custom_text IS NULL) OR
    (tnc_template_id IS NULL AND custom_text IS NOT NULL)
  ),
  CONSTRAINT check_linked_entity CHECK (
    (coupon_id IS NOT NULL AND offer_id IS NULL) OR
    (coupon_id IS NULL AND offer_id IS NOT NULL)
  )
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_offer_terms_coupon_id ON public.offer_terms(coupon_id);
CREATE INDEX IF NOT EXISTS idx_offer_terms_offer_id ON public.offer_terms(offer_id);
CREATE INDEX IF NOT EXISTS idx_tnc_templates_active ON public.tnc_templates(is_active, sort_order);

-- Enable RLS
ALTER TABLE public.tnc_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_terms ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for tnc_templates
DROP POLICY IF EXISTS "Public read active tnc_templates" ON public.tnc_templates;
CREATE POLICY "Public read active tnc_templates"
  ON public.tnc_templates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff read all tnc_templates" ON public.tnc_templates;
CREATE POLICY "Staff read all tnc_templates"
  ON public.tnc_templates FOR SELECT
  USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Owner manage tnc_templates" ON public.tnc_templates;
CREATE POLICY "Owner manage tnc_templates"
  ON public.tnc_templates FOR ALL
  USING (public.is_owner(auth.uid()));

-- 5. RLS Policies for offer_terms
DROP POLICY IF EXISTS "Public read offer_terms" ON public.offer_terms;
CREATE POLICY "Public read offer_terms"
  ON public.offer_terms FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff manage offer_terms" ON public.offer_terms;
CREATE POLICY "Staff manage offer_terms"
  ON public.offer_terms FOR ALL
  USING (public.is_staff(auth.uid()));
