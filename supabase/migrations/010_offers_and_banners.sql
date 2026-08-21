-- ============================================
-- Migration 010: Offers & Banners Management, Storage & Scheduling
-- ============================================

-- 1. Enhance offers table & drop legacy NOT NULL constraints for visual banners
ALTER TABLE public.offers
  ALTER COLUMN coupon_code DROP NOT NULL,
  ALTER COLUMN discount_type DROP NOT NULL,
  ALTER COLUMN discount_value DROP NOT NULL;

ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS badge_text TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS linked_coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS display_location TEXT DEFAULT 'home_top' CHECK (display_location IN ('home_top', 'menu_top', 'category_banner')),
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS schedule_rules JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_key TEXT,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on display_location and is_active
CREATE INDEX IF NOT EXISTS offers_location_active_idx ON public.offers (display_location, is_active);

-- 2. Create banner-images storage bucket in Supabase Storage if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-images',
  'banner-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Ensure is_staff function overloaded variant exists for single-argument call compatibility
CREATE OR REPLACE FUNCTION public.is_staff(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
    AND role IN ('owner', 'manager', 'worker')
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Storage Policies for banner-images
DROP POLICY IF EXISTS "Public Banner Images View" ON storage.objects;
CREATE POLICY "Public Banner Images View" ON storage.objects
FOR SELECT USING (bucket_id = 'banner-images');

DROP POLICY IF EXISTS "Staff Banner Images Upload" ON storage.objects;
CREATE POLICY "Staff Banner Images Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'banner-images'
  AND public.is_staff(auth.uid())
);

DROP POLICY IF EXISTS "Staff Banner Images Modify" ON storage.objects;
CREATE POLICY "Staff Banner Images Modify" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'banner-images'
  AND public.is_staff(auth.uid())
);

DROP POLICY IF EXISTS "Staff Banner Images Delete" ON storage.objects;
CREATE POLICY "Staff Banner Images Delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'banner-images'
  AND public.is_staff(auth.uid())
);

-- 4. Server-Side Function to evaluate active scheduled public offers
CREATE OR REPLACE FUNCTION public.get_active_public_offers(p_location TEXT DEFAULT 'home_top')
RETURNS TABLE (
  id UUID,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  banner_image_url TEXT,
  badge_text TEXT,
  coupon_code TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  display_location TEXT,
  sort_order INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_dow TEXT := LOWER(TO_CHAR(v_now, 'Dy')); -- 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'
  v_time TIME := v_now::TIME;
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.subtitle,
    o.description,
    o.banner_image_url,
    o.badge_text,
    c.code AS coupon_code,
    c.discount_type,
    c.value AS discount_value,
    o.display_location,
    o.sort_order
  FROM public.offers o
  LEFT JOIN public.coupons c ON o.linked_coupon_id = c.id
  WHERE o.is_active = true
    AND o.display_location = p_location
    AND (o.starts_at IS NULL OR o.starts_at <= v_now)
    AND (o.ends_at IS NULL OR o.ends_at >= v_now)
    -- Check day-of-week schedule rule if specified in JSONB (e.g. {"days": ["sat", "sun"]})
    AND (
      o.schedule_rules->'days' IS NULL 
      OR jsonb_array_length(o.schedule_rules->'days') = 0
      OR (o.schedule_rules->'days') ? v_dow
    )
    -- Check time-of-day schedule rule if specified in JSONB (e.g. {"daily_start": "16:00", "daily_end": "19:00"})
    AND (
      o.schedule_rules->>'daily_start' IS NULL 
      OR (o.schedule_rules->>'daily_start')::TIME <= v_time
    )
    AND (
      o.schedule_rules->>'daily_end' IS NULL 
      OR (o.schedule_rules->>'daily_end')::TIME >= v_time
    )
  ORDER BY o.sort_order ASC, o.created_at DESC;
END;
$$;
